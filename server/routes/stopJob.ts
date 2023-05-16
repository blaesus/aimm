import * as Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { StopJobSuccess } from "../../data/aimmApi";
import { jsonReplacerWithBigint } from "./utils";

export async function stopJob(ctx: Koa.Context) {
    const id = ctx.params.id.toLowerCase();
    if (!id) {
        ctx.status = 404;
        ctx.body = {
            ok: false,
            reason: `No specified job id`,
        };
        return;
    }
    const job = await prisma.job.findUnique({
        where: {
            id,
        },
    });
    if (!job) {
        ctx.status = 404;
        ctx.body = {
            ok: false,
            reason: `Job ${id} not found`,
        };
        return;
    }
    const newJob = await prisma.job.update({
        where: {
            id,
        },
        data: {
            status: "Cancelled",
        },
    });
    ctx.status = 200;
    const data: StopJobSuccess = {
        ok: true,
        job: newJob,
    };
    ctx.set("Content-Type", "application/json");
    ctx.body = JSON.stringify(data, jsonReplacerWithBigint, 4);
}
