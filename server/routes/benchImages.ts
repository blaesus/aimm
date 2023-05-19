import { getWebuiApiRequester } from "../ai/sd-webui-api";
import { prisma } from "../../data/prismaClient";

interface BenchJobProps {
    benchId: string,
}

async function bench(props: BenchJobProps) {

    const bench = await prisma.benchmark.findUnique({
        where: {
            id: props.benchId,
        }
    });

    if (!bench) {
        return;
    }

    if (bench.type === "txt2img") {
        const base = "https://tuegtqwoeab9ud-3000.proxy.runpod.net";
        const requester = getWebuiApiRequester(base);
        await requester.setCheckpointWithTitle("anime/ghostmix_v12.safetensors [f20c91bd27]");
        const data = await requester.txt2img({
            prompt: "1girl",
            negative_prompt: "",
            seed: 12345678,
            steps: 20,
            sampler_name: "DPM++ 2M Karras",
        }, "teapot.png")

    }
    else {
        console.error("unknown benchmark type", bench.type)
    }


}
