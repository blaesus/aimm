import { Prisma, PrismaClient } from "@prisma/client";
import { makeRequester } from "./spiders/utils";
import * as dotenv from "dotenv";

async function main() {
    dotenv.config();
    const prisma = new PrismaClient({});
    const brokenFileRecords = await prisma.fileRecord.findMany({
        where: {
            hashA: "https://git-lfs.github.com/spec/v1",
        },
    });
    const requester = makeRequester();
    for (const r of brokenFileRecords) {
        console.info(`Fixing ${r.filename}...`);
        const hash = await requester.hashRemoteFile(r.downloadUrl);
        console.info(`Calculated hash ${hash}...`);
        if (hash) {
            await prisma.fileRecord.update({
                where: {
                    revisionId_hashA: {
                        revisionId: r.revisionId,
                        hashA: r.hashA,
                    }
                },
                data: {
                    hashA: hash,
                },
            });
        }
    }
}

main().catch(console.error);
