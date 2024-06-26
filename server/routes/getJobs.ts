import * as Koa from "koa";
import { getJobType } from "./utils";
import { prisma } from "../../data/prismaClient";
import { serialize } from "../../data/serialize";

export async function getJobs(ctx: Koa.Context) {
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
    if (!ctx.params.type) {
        const jobs = await prisma.job.findMany({
            orderBy: {
                created: "desc",
            }
        });
        ctx.set("Content-Type", "application/json");
        const data = {
            ok: true,
            jobs,
        }
        ctx.body = serialize(data);
        return;
    }
    const type = getJobType(ctx.params.type);
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
        ctx.set("Content-Type", "application/json");
        const data = {
            ok: true,
            jobs,
        }
        ctx.body = serialize(data);
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
