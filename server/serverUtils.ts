import { Registry } from ".prisma/client";
import { promises as fs } from "fs";

export function getRegistry(intendedRegistry?: string): Registry | undefined {
    if (intendedRegistry === "Civitai"
        || intendedRegistry === "Huggingface"
        || intendedRegistry === "AimmHub"
        || intendedRegistry === "GitHub") {
        return intendedRegistry;
    }
}

export async function sizeLocalFile(path: string): Promise<number | null> {
    try {
        const stats = await fs.stat(path);
        return stats.size;
    } catch (error) {
        console.error(`cannot get remote path for hashing ${path}: ${error}`);
        return null;
    }
}

export const aiModelExtensions = [
    "safetensors", "ckpt"
]
