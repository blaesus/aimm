import * as Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { serialize } from "../../data/serialize";
import { GetBenchesSuccess } from "../../data/aimmApi";

export async function getBenches(ctx: Koa.Context) {
    const benches = await prisma.benchmark.findMany({});
    const data: GetBenchesSuccess = {
        ok: true,
        benches,
    }
    ctx.body = serialize(data);
}
