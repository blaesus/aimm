import { getWebuiApiRequester } from "../ai/sd-webui-api";
import { prisma } from "../../data/prismaClient";
import { serialize } from "../../data/serialize";

interface BenchJobProps {
    benchIds: string[],
}

async function bench(props: BenchJobProps) {

    const benches = await prisma.benchmark.findMany({
        where: {
            id: {
                in: props.benchIds,
            },
        },
    });

    if (!benches) {
        return;
    }

    if (benches.some(bench => bench.type !== "txt2img")) {
        console.error("unknown benchmark type");
        return;
    }

    const base = "https://tuegtqwoeab9ud-3000.proxy.runpod.net";
    const requester = getWebuiApiRequester(base);
    const models = await requester.getCheckpoints();
    for (const model of models) {
        await requester.setCheckpointWithTitle(model.title);
        for (const bench of benches) {
            const params = JSON.parse(JSON.stringify((bench.parameters)))
            await requester.txt2img(params, `/tmp/${bench.name}-${model.model_name}.png`);
        }
    }
}

async function test() {
    await bench({
        benchIds: [
            "2edb3f3d-e6cb-443c-95ea-0a1b4a4c62ae"
        ]
    })
}

test().catch(console.error)
