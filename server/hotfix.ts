import { Prisma, PrismaClient } from "@prisma/client";
import { makeRequester } from "./spiders/utils";
import * as dotenv from "dotenv";

const CONTENT_CATEGORY = "URL-TO-RAW-CONTENT";
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
            const cachedContent = await prisma.keyValueCache.findFirst({
                where: {
                    category: CONTENT_CATEGORY,
                    key: file.downloadUrl,
                },
            });
            if (cachedContent) {
                await prisma.fileRecord.update({
                    where: {
                        id: file.id,
                    },
                    data: {
                        size: cachedContent.value.length
                    },
                });
                console.info(`Found ${file.hashA} in content cahce, whose size is ${cachedContent.value.length}`);
            }
            else {
                const similarFileWithSize = await prisma.fileRecord.findFirst({
                    where: {
                        hashA: file.hashA,
                        size: {
                            not: null,
                        }
                    },
                });
                if (similarFileWithSize) {
                    console.info(`Found ${similarFileWithSize.hashA} in db whose size is ${similarFileWithSize.size}`);
                    await prisma.fileRecord.update({
                        where: {
                            id: file.id,
                        },
                        data: {
                            size: similarFileWithSize.size,
                        },
                    });
                }

            }
        }

    }
    console.info("hotfix finished")
}

main().catch(console.error);
