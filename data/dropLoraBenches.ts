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
    const fileIds = benchResults.map(b => b.resultFileId);
    await prisma.fileRecord.deleteMany({
        where: {
            id: {
                in: fileIds,
            },
        },
    });
    await prisma.benchmarkResult.findMany({
        where: {
            id: {
                in: benchResults.map(b => b.id),
            }
        }
    })
}

fix();
