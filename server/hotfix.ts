import { Prisma, PrismaClient } from "@prisma/client";
import { makeRequester } from "./spiders/utils";
import * as dotenv from "dotenv";

async function main() {
    dotenv.config();
    const prisma = new PrismaClient({});
    for (let page = 1; page < 1000; page += 1) {
        console.info(`page ${page}`)
        const unsizedFileRecords = await prisma.fileRecord.findMany({
            where: {
                size: null,
            },
            take: 1000 * page,
            skip: 1000 * (page - 1),
        });
        if (!unsizedFileRecords.length) {
            break;
        }
        for (const file of unsizedFileRecords) {
            console.info(`Checking size of file ${file.id}(${file.hashA}) from ${file.downloadUrl}`);
            const similarFileWithSize = await prisma.fileRecord.findFirst({
                where: {
                    hashA: file.hashA,
                    size: {
                        not: null,
                    }
                },
            });
            if (similarFileWithSize) {
                console.info(`Found ${similarFileWithSize.hashA} whose size is ${similarFileWithSize.size}`);
                await prisma.fileRecord.update({
                    where: {
                        id: file.id,
                    },
                    data: {
                        size: similarFileWithSize.size,
                    },
                });
            }
            else {
                console.info(`Not size found in database for ${file.hashA}`)
            }
        }

    }
    console.info("hotfix finished")
}

main().catch(console.error);
