import { Prisma, PrismaClient } from "@prisma/client";
import { makeRequester } from "./spiders/utils";
import * as dotenv from "dotenv";

async function main() {
    dotenv.config();
    const prisma = new PrismaClient({});
    for (let page = 1; page < 1000; page += 1) {
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
            console.info(`Checking size of file ${file.id} from ${file.downloadUrl}`);
            const similarFiles = await prisma.fileRecord.findMany({
                where: {
                    hashA: file.hashA,
                    size: {
                        not: null,
                    }
                },
            });
            for (const alt of similarFiles) {
                if (alt.size !== null) {
                    console.info(`Found ${alt.hashA} whose size is ${alt.size}`);
                    await prisma.fileRecord.update({
                        where: {
                            id: file.id,
                        },
                        data: {
                            size: alt.size,
                        },
                    });
                    break;
                }
            }
        }

    }
    console.info("hotfix finished")
}

main().catch(console.error);
