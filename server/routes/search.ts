import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { SearchSuccess } from "../../data/aimmApi";
import { serialize } from "../../data/serialize";

export async function search(ctx: Koa.Context) {
    const keyword = ctx.params.keyword;

    const repos = await prisma.repository.findMany({
        where: {
            name: {
                contains: keyword,
                mode: "insensitive",
            },
        },
        orderBy: {
            favour: "desc",
        },
    });

    const revisions = await prisma.revision.findMany({
        where: {
            repoId: {
                in: repos.map(repo => repo.id),
            },
        },
    });

    const fileRecords = await prisma.fileRecord.findMany({
        where: {
            revisionId: {
                in: revisions.map(revision => revision.id),
            },
        },
    });

    const result: SearchSuccess = {
        ok: true,
        keyword,
        repos,
        revisions,
        fileRecords,
    };

    ctx.set("Content-Type", "application/json");
    ctx.body = serialize(result);
}
