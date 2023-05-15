import Koa from "koa";
import { jsonReplacerWithBigint } from "./utils";
import { prisma } from "../../data/prismaClient";

export async function search(ctx: Koa.Context) {
    const keyword = ctx.params.keyword;

    const repos = await prisma.repository.findMany({
        where: {
            name: {
                contains: keyword,
                mode: "insensitive",
            }
        },
        orderBy: {
            favour: "desc"
        }
    });

    ctx.set("Content-Type", "application/json");
    ctx.body = JSON.stringify({
        ok: true,
        keyword,
        repos,
    }, jsonReplacerWithBigint, 4);
}
