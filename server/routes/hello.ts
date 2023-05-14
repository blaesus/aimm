import Koa from "koa";
import { prisma } from "../../data/prismaClient";

export const hello = async (ctx: Koa.Context) => {
    const repos = await prisma.repository.count();
    const files = await prisma.fileRecord.count();
    ctx.body = {
        ok: true,
        message: `Hello world from API with ${repos} repositories and ${files} files!`
    }

}
