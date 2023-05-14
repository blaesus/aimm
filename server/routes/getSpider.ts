import * as Koa from "koa";
import { getSpiderType, jsonReplacerWithBigint } from "./utils";
import { prisma } from "../../data/prismaClient";

export async function getSpider(ctx: Koa.Context) {
    const authorizationHeader = ctx.request.headers.authorization || "";
    const token = authorizationHeader.replace("Bearer ", "");
    const adminToken = process.env["ADMIN_TOKEN"] || "12321c8sd3";
    if (token !== adminToken) {
        ctx.status = 401;
        ctx.body = {
            ok: false,
            reason: "unauthorized",
        };
        return;
    }
    const type = getSpiderType(ctx.params.type);
    if (type) {
        ctx.status = 200;
        const jobs = await prisma.job.findMany({
            where: {
                type,
            },
            orderBy: {
                created: "desc",
            }
        });
        ctx.body = JSON.stringify(jobs, jsonReplacerWithBigint, 4);
        return;
    }
    else {
        ctx.status = 400;
        ctx.body = {
            ok: false,
            reason: "No spider of this type",
        };
        return;
    }
}
