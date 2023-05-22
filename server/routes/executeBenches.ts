import { getWebuiApiRequester } from "../ai/sd-webui-api";
import { prisma } from "../../data/prismaClient";
import { buildProxyConfigFromEnv, hashLocalFile, makeRequester, sleep } from "../jobs/utils";
import * as Koa from "koa";
import { BenchExecuteParams, BenchTxt2ImgFileTarget } from "../../data/aimmApi";
import { aiModelExtensions, sizeLocalFile } from "../serverUtils";

interface BenchJobProps {
    benchIds: string[],
    targets: BenchTxt2ImgFileTarget[],
    jobId: string
}

const BENCH_DIR_NAME = "for_bench";
const webuiApiBase = "https://tuegtqwoeab9ud-3000.proxy.runpod.net";
const remoteControlBase = "https://tuegtqwoeab9ud-1234.proxy.runpod.net";

const requester = makeRequester({
    proxy: buildProxyConfigFromEnv(),
});

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

    const {benchIds, targets, jobId} = props;

    const benches = await prisma.benchmark.findMany({
        where: {
            id: {
                in: benchIds,
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

    let finishedTargets = 0;
    targetLoop:
    // The server has limit disk and bandwidth. We process targets one by one.
    for (const target of targets) {
        {
            let allBenchesDone = true;
            for (const bench of benches) {
                const existingResults = await prisma.benchmarkResult.count({
                    where: {
                        benchmarkId: bench.id,
                        targetFileId: target.file,
                    },
                });
                if (existingResults === 0) {
                    allBenchesDone = false;
                    break;
                }
            }
            if (allBenchesDone) {
                console.info(`Found existing benchmark result for ${target.filename} on all benches, skipped`);
                continue;
            }
        }
        {
            if (aiModelExtensions.every(ext => !target.filename.endsWith(ext))) {
                console.info(`${target.filename} is not a model file, skipped`);
                continue;
            }
        }

        {
            const start = Date.now();
            await downloadModels([target]);
            console.info(`started to download target ${target}`);
            while (true) {
                if (await allModelsReady([target])) {
                    break;
                }
                if (Date.now() - start > 1000_000) {
                    console.error(`timeout when getting ${target.filename}`);
                    break targetLoop;
                }
                await sleep(10_000);
            }
            console.info(`${target} ready`);
        }
        const model = models.find(model => model.filename.includes(target.filename));
        if (!model) {
            console.error("no model found:", target.filename);
            continue;
        }

        await requester.setCheckpointWithTitle(model.title);
        for (const bench of benches) {
            // Find existing result, skip if found
            const params = JSON.parse(JSON.stringify((bench.parameters)));
            const time = Date.now();
            const filename = `${bench.id}_${target.file}_${time}.png`;
            const pathName = `benches/${filename}`;
            const benchResultPath = `/var/public/${pathName}`;
            await requester.txt2img(params, benchResultPath);
            await clearModels();
            const hash = await hashLocalFile(benchResultPath);
            const size = await sizeLocalFile(benchResultPath);
            if (hash === null || size === null) {
                console.info(`Failed to hash or size local file ${benchResultPath}`);
                continue;
            }

            const file = await prisma.fileRecord.create({
                data: {
                    revisionId: undefined,
                    filename,
                    downloadUrl: pathName,
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
        finishedTargets += 1;
        await prisma.job.update({
            where: {
                id: jobId,
            },
            data: {
                processed: finishedTargets,
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
                    filename: true,
                    hashA: true,
                },
            },
        },
        take: params.revisionIds.length,
    });
    const targets: BenchTxt2ImgFileTarget[] = records.map(record =>
        record.fileRecords.map((file): BenchTxt2ImgFileTarget => ({
            type: "txt2img" as "txt2img",
            subtype: "stable-diffusion",
            downloadUrl: file.downloadUrl,
            repository: record.repo.id,
            revision: record.id,
            file: file.id,
            filename: `${file.hashA}_${file.filename}`,
        })),
    ).flat();
    setTimeout(async () => {
        await checkApi();
        const label = `txt2img-bench-${Date.now()}`;
        const masterJob = await prisma.job.create({
            data: {
                status: "Running",
                type: "txt2img-bench",
                label,
                created: Date.now(),
                data: {
                    benchIds: params.benchIds,
                    revisionIds: params.revisionIds,
                },
            },
        });
        try {
            await bench({
                targets,
                benchIds: params.benchIds,
                jobId: masterJob.id,
            });
            await prisma.job.update({
                where: {
                    id: masterJob.id,
                },
                data: {
                    status: "Success",
                    stopped: Date.now(),
                    total: params.benchIds.length,
                },
            });
        } catch (error) {
            console.error(error)
            await prisma.job.update({
                where: {
                    id: masterJob.id,
                },
                data: {
                    status: "Failure",
                    stopped: Date.now(),
                },
            });
        }
    });
    ctx.status = 200;
    ctx.body = {
        ok: true,
        started: true,
        targets,
    };
}

