import * as dotenv from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";

async function fix() {
    dotenv.config();
    const prisma = new PrismaClient({});
    const benchResults = await prisma.benchmarkResult.findMany({
        where: {
            targetFile: {
                revision: {
                    repo: {
                        subtype: "LORA",
                    },
                },
            },
        },
    });
    console.info(`Found ${benchResults.length} results to delete`)
    const fileIds = benchResults.map(b => b.resultFileId);
    await prisma.benchmarkResult.deleteMany({
        where: {
            id: {
                in: benchResults.map(b => b.id),
            },
        },
    });
    const links = await prisma.fileStorageRecordOnFileRecord.findMany({
        where: {
            fileRecordId: {
                in: fileIds,
            },
        },
    });
    for (const link of links) {
        await prisma.fileStorageRecordOnFileRecord.delete({
            where: {
                fileStorageRecordId_fileRecordId: {
                    fileStorageRecordId: link.fileStorageRecordId,
                    fileRecordId: link.fileRecordId,
                }
            }
        });
        await prisma.fileRecord.delete({
            where: {
                id: link.fileRecordId,
            },
        });
        await prisma.fileStorageRecord.delete({
            where: {
                id: link.fileStorageRecordId,
            },
        });
    }
}

fix();
