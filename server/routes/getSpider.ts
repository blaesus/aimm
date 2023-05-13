import Koa from "koa";
import { getSpiderType } from "./utils";
import { prisma } from "../../data/prismaClient";

export async function getSpider(ctx: Koa.Context) {
    const authorizationHeader = ctx.request.headers.authorization || "";
    const token = authorizationHeader.replace("Bearer ", "");
    const adminToken = process.env["ADMIN_SECRET"] || "12321c8sd3";
    if (token !== adminToken) {
        ctx.status = 401;
        ctx.body = {
            ok: false,
            reason: "unauthorized",
        };
        return;
    }
    const type = getSpiderType(ctx.params.label.toLowerCase());
    if (type) {
        ctx.status = 200;
        ctx.body = await prisma.job.findMany({
            where: {
                type,
            },
            orderBy: {
                created: "desc",
            }
        });
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
