import * as Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { CreateBenchmarkRequest } from "../../data/aimmApi";
import { serialize } from "../../data/serialize";

export async function addBench(ctx: Koa.Context) {
    const requestBody: CreateBenchmarkRequest = (ctx.request.body || {}) as any;
    const bench = await prisma.benchmark.create({
        data: {
            ...requestBody,
            parameters: JSON.parse(JSON.stringify(requestBody.parameters)),
            created: Date.now()
        },
    });
    ctx.set("Content-Type", "application/json")
    ctx.body = serialize({
        ok: true,
        bench,
    });
}

