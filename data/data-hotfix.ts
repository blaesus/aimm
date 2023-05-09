import { Prisma, PrismaClient } from "@prisma/client";
import { makeRequester } from "./spiders/utils";

async function main() {
    const prisma = new PrismaClient();
    const brokenFileRecords = await prisma.fileRecord.findMany({
        where: {
            hashA: "https://git-lfs.github.com/spec/v1"
        }
    });
    const requester = makeRequester();
    for (const r of brokenFileRecords) {
        const hash = await requester.hashRemoteFile(r.filename);
        if (hash) {
            await prisma.fileRecord.update({
                where: {
                    id: r.id
                },
                data: {
                    hashA: hash
                }
            })
        }
    }
}

main().catch(console.error);
