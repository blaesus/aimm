import * as Koa from "koa";
import { prisma } from "../../data/prismaClient";

export async function stopJob(ctx: Koa.Context) {
    const id = ctx.params.id.toLowerCase();
    if (!id) {
        ctx.status = 404;
        return;
    }
    const job = await prisma.job.findUnique({
        where: {
            id,
        }
    })
    if (!job) {
        ctx.status = 404;
        return;
    }
    await prisma.job.update({
        where: {
            id,
        },
        data: {
            status: "Cancelled",
        }
    })
}
