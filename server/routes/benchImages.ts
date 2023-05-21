import { getWebuiApiRequester } from "../ai/sd-webui-api";
import { prisma } from "../../data/prismaClient";
import { buildProxyConfigFromEnv, makeRequester, sleep } from "../jobs/utils";
import axios from "axios";

interface BenchJobProps {
    benchIds: string[],
}

const BENCH_DIR_NAME = "for_bench";
const webuiApiBase = "https://tuegtqwoeab9ud-3000.proxy.runpod.net";
const remoteControlBase = "https://tuegtqwoeab9ud-1234.proxy.runpod.net";

const SEPARATOR = "_";

interface BenchTarget {
    downloadUrl: string,
    repo: string,
    rev: string,
    file: string,
    filename: string,
}

async function getTargets() {
    const targets: BenchTarget[] = (await prisma.repository.findMany({
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
            return rev.fileRecords.map(file => {
                return {
                    downloadUrl: file.downloadUrl,
                    repo: repo.id,
                    rev: rev.id,
                    file: file.id,
                    filename: `${file.hashA}.safetensors`,
                };
            });
        }).flat();
    }).flat();
    return targets;
}

async function downloadModels(targets: BenchTarget[]): Promise<BenchTarget[]> {
    const url = `${remoteControlBase}/api/download`;
    const {data} = await axios.post(url, targets)
    console.info(data);
    return targets;
}

async function allModelsReady(targets: BenchTarget[]): Promise<boolean> {
    const url = `${remoteControlBase}/api/ready`;
    const filenames = targets.map(target => target.filename);
    console.info("filenames", JSON.stringify(filenames));
    const {data} = await axios.post(url, {
        filenames,
    })
    console.info("readiness", data);
    const readiness: boolean[] = data.map((file: { filename: string, ready: boolean }) => file.ready);
    return readiness.every(ready => ready);
}

async function clearModels() {
    const url = `${remoteControlBase}/api/clear`;
    const {data} = await axios.post(url)
    console.info(data);
}

async function bench(props: BenchJobProps) {

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
    console.info("models", models);
    const benchModels = models.filter(model => model.filename.includes(BENCH_DIR_NAME));
    console.info("bench models", benchModels);
    for (const model of benchModels) {
        await requester.setCheckpointWithTitle(model.title);
        for (const bench of benches) {
            const params = JSON.parse(JSON.stringify((bench.parameters)));
            await requester.txt2img(params, `/tmp/${bench.name}-${model.model_name}.png`);
            await sleep(5000);
        }
    }
}

async function checkApi() {
    const url = `${remoteControlBase}/api/hello`;
    const response = await fetch(url);
    const data = await response.text();
    console.info(data);
}

async function test() {
    await checkApi();
    const targets = await getTargets();
    await downloadModels(targets);
    await sleep(1000);
    console.info("downloaded");
    while (true) {
        if (await allModelsReady(targets)) {
            break;
        }
        await sleep(10_000);
    }
    console.info("All ready");
    await sleep(1000);
    const benches = await prisma.benchmark.findMany({
        take: 1,
    })
    await bench({
        benchIds: benches.map(bench => bench.id),
    });
    // await clearModels();
}

test().catch(console.error);
