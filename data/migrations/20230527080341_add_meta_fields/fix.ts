import * as dotenv from "dotenv";
import { Prisma, PrismaClient } from "@prisma/client";
import { getLatestUpdateDate } from "../../dataUtils";

async function fix() {
    dotenv.config();
    const prisma = new PrismaClient({});
    for (let page = 0; page < 1000; page+=1) {
        const repos = await prisma.repository.findMany({
            skip: page * 100,
            take: 100,
        })
        if (repos.length === 0) {
            break;
        }
        for (const repo of repos) {
            const revisions = await prisma.revision.findMany({
                where: {
                    repoId: repo.id,
                }
            });
            for (const revision of revisions) {
                if (repo.registry === "Civitai") {
                    const raw = JSON.parse(revision.raw as string);
                    const newData = {
                        name: raw.name,
                        createdInRegistry: +new Date(raw.createdAt),
                        updatedInRegistry: +new Date(raw.updatedAt),
                    }
                    await prisma.revision.update({
                        where: {
                            id: revision.id,
                        },
                        data: newData
                    });
                }
                else if (repo.registry === "Huggingface") {
                    const data = JSON.parse(revision.raw as string);
                    const newData = {
                        updatedInRegistry: +new Date(data.lastModified),
                    }
                    await prisma.revision.update({
                        where: {
                            id: revision.id,
                        },
                        data: newData
                    });

                }
            }
            if (repo.registry === "Civitai") {
                const raw = JSON.parse(repo.raw as string);
                const latestUpdate = getLatestUpdateDate(revisions.map(r => JSON.parse(r.raw as string)));
                const newData = {
                    updatedInRegistry: latestUpdate.updated,
                    description: raw.description,
                    tags: raw.tags,
                }
                await prisma.repository.update({
                    where: {
                        id: repo.id,
                    },
                    data: newData
                });
            }
            else if (repo.registry === "Huggingface") {
                const data = JSON.parse(repo.raw as string);
                const newData = {
                    description: data.description,
                    tags: data.tags,
                    updatedInRegistry: +new Date(data.lastModified),
                }
                await prisma.repository.update({
                    where: {
                        id: repo.id,
                    },
                    data: newData
                });
            }
        }
    }
}

fix();
