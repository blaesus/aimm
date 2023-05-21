import { getWebuiApiRequester } from "../ai/sd-webui-api";
import { prisma } from "../../data/prismaClient";
import { buildProxyConfigFromEnv, hashLocalFile, makeRequester, sleep } from "../jobs/utils";
import * as Koa from "koa";
import { BenchExecuteParams, BenchTxt2ImgFileTarget } from "../../data/aimmApi";
import { sizeLocalFile } from "../serverUtils";

interface BenchJobProps {
    benchIds: string[],
    targets: BenchTxt2ImgFileTarget[],
}

const BENCH_DIR_NAME = "for_bench";
const webuiApiBase = "https://tuegtqwoeab9ud-3000.proxy.runpod.net";
const remoteControlBase = "https://tuegtqwoeab9ud-1234.proxy.runpod.net";

const requester = makeRequester({
    proxy: buildProxyConfigFromEnv(),
});


async function getTargets() {
    const targets: BenchTxt2ImgFileTarget[] = (await prisma.repository.findMany({
        where: {
            registry: "Civitai",
            subtype: "Checkpoint",
        },
        orderBy: {
            favour: "desc",
        },
        select: {
            id: true,
            revisions: {
                select: {
                    id: true,
                    fileRecords: {
                        select: {
                            id: true,
                            downloadUrl: true,
                            hashA: true,
                        },
                    },
                },
            },
        },
        take: 1,
    })).map(repo => {
        return repo.revisions.map(rev => {
            return rev.fileRecords.map((file): BenchTxt2ImgFileTarget => {
                return {
                    type: "txt2img" as "txt2img",
                    subtype: "stable-diffusion",
                    downloadUrl: file.downloadUrl,
                    repository: repo.id,
                    revision: rev.id,
                    file: file.id,
                    filename: `${file.hashA}.safetensors`,
                };
            });
        }).flat();
    }).flat();
    return targets;
}

async function downloadModels(targets: BenchTxt2ImgFileTarget[]): Promise<BenchTxt2ImgFileTarget[]> {
    const url = `${remoteControlBase}/api/download`;
    const {data} = await requester.post(url, targets);
    console.info(data);
    return targets;
}

async function allModelsReady(targets: BenchTxt2ImgFileTarget[]): Promise<boolean> {
    const url = `${remoteControlBase}/api/ready`;
    const filenames = targets.map(target => target.filename);
    console.info("filenames", JSON.stringify(filenames));
    const {data} = await requester.post<string[], { filename: string, ready: boolean }[]>(url, filenames);
    console.info("readiness", data);
    const readiness: boolean[] = data.map((file) => file.ready);
    return readiness.every(ready => ready);
}

async function clearModels() {
    const url = `${remoteControlBase}/api/clear`;
    const {data} = await requester.post(url, {});
    console.info(data);
}

async function bench(props: BenchJobProps) {

    const batch = `bench-${Date.now()}`;

    const benches = await prisma.benchmark.findMany({
        where: {
            id: {
                in: props.benchIds,
            },
        },
    });

    if (benches.some(bench => bench.type !== "txt2img")) {
        console.error("unknown benchmark type");
        return;
    }

    const requester = getWebuiApiRequester(webuiApiBase);
    await requester.refreshCheckpoints();
    const models = await requester.getCheckpoints();
    const benchModels = models.filter(model => model.filename.includes(BENCH_DIR_NAME));
    for (const target of props.targets) {
        const model = benchModels.find(model => model.filename.includes(target.filename));
        if (!model) {
            console.error("no model found:", target.filename);
            continue;
        }
        const job = await prisma.job.create({
            data: {
                status: "Running",
                type: "txt2img-bench",
                label: batch,
                created: Date.now(),
                data: {
                    benches: props.benchIds,
                    target: target.file,
                },
            },
        });
        await requester.setCheckpointWithTitle(model.title);
        for (const bench of benches) {
            const params = JSON.parse(JSON.stringify((bench.parameters)));
            const time = Date.now();
            const filename = `${bench.id}_${model.model_name}_${time}.png`;
            const benchResultPath = `/var/benches/${filename}`;
            await requester.txt2img(params, benchResultPath);
            const hash = await hashLocalFile(benchResultPath);
            const size = await sizeLocalFile(benchResultPath);
            if (hash === null || size === null) {
                continue;
            }

            const file = await prisma.fileRecord.create({
                data: {
                    revisionId: undefined,
                    filename,
                    downloadUrl: benchResultPath,
                    hashA: hash,
                    updated: time,
                    size,
                },
            });

            const storage = await prisma.fileStorageRecord.create({
                data: {
                    hashA: hash,
                    service: "Local",
                    idInService: benchResultPath,
                    created: time,
                    size,
                },
            });

            await prisma.fileStorageRecordOnFileRecord.create({
                data: {
                    fileRecordId: file.id,
                    fileStorageRecordId: storage.id,
                    assignmentTime: time,
                },
            });

            await prisma.benchmarkResult.create({
                data: {
                    benchmarkId: bench.id,
                    targetFileId: target.file,
                    resultFileId: file.id,
                    time,
                },
            });
            await sleep(1000);
        }
        await prisma.job.update({
            where: {
                id: job.id,
            },
            data: {
                status: "Success",
                stopped: Date.now(),
            },
        });
    }
}

async function checkApi() {
    const url = `${remoteControlBase}/api/hello`;
    const {data} = await requester.getData(url);
    console.info(data);
}

export async function executeBenches(ctx: Koa.Context) {
    const params = ctx.request.body as BenchExecuteParams;
    const records = await prisma.revision.findMany({
        where: {
            id: {
                in: params.revisionIds,
            },
        },
        select: {
            id: true,
            repo: {
                select: {
                    id: true,
                },
            },
            fileRecords: {
                select: {
                    id: true,
                    downloadUrl: true,
                    hashA: true,
                },
            },
        },
    });
    const targets: BenchTxt2ImgFileTarget[] = records.map(record =>
        record.fileRecords.map((file): BenchTxt2ImgFileTarget => ({
            type: "txt2img" as "txt2img",
            subtype: "stable-diffusion",
            downloadUrl: file.downloadUrl,
            repository: record.repo.id,
            revision: record.id,
            file: file.id,
            filename: `${file.hashA}.safetensors`,
        }))
    ).flat();
    setTimeout(async () => {
        await checkApi();
        for (const target of targets) {
            await downloadModels([target]);
            console.info("downloaded");
            while (true) {
                if (await allModelsReady([target])) {
                    break;
                }
                await sleep(10_000);
            }
            console.info("All ready");
            const props: BenchJobProps = {
                benchIds: params.benchIds,
                targets: [target],
            };
            await bench(props);
        }
        await clearModels();
    });
    ctx.status = 200;
    ctx.body = {
        ok: true,
        started: true,
        targets,
    };
}

