import { getSpiderType, parseQuery, Query, SpiderType } from "./utils";
import { reindexCivitaiModels } from "../spiders/civitai";
import { reindexHuggingFaceRepos } from "../spiders/huggingface";
import { obtainFiles } from "../spiders/obtain";
import Koa from "koa";
import { prisma } from "../../data/prismaClient";

const spiders: { [key in SpiderType]: (jobId: string, params: {}) => Promise<void> } = {
    civitai: reindexCivitaiModels,
    huggingface: reindexHuggingFaceRepos,
    "obtain-files": obtainFiles,
};

// For spider labels; changed each time this process is re-started
const processNumber = Date.now().toString();

export async function startSpider(ctx: Koa.Context) {
    const type = getSpiderType(ctx.params.type.toLowerCase());
    const query: Query = parseQuery(ctx.request.querystring);
    const force = !!query.force;

    if (!type) {
        ctx.status = 404;
        return;
    }
    if (!force) {
        const existingJobs = await prisma.job.findMany({
            where: {
                type,
                status: "Running",
            },
        });
        if (existingJobs.length >= 1) {
            ctx.status = 409;
            ctx.body = {
                ok: false,
                reason: "a spider of label is already running",
            };
            return;
        }
    }
    const requestBody = ctx.request.body || {};
    const job = await prisma.job.create({
        data: {
            type,
            status: "Running",
            label: processNumber,
            created: Date.now(),
            data: ctx.params,
        },
    });
    spiders[type](job.id, requestBody)
        .then(() => {
            prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    status: "Success",
                    stopped: Date.now(),
                },
            });
        })
        .catch(console.error);

    async function cleanup() {
        await prisma.job.update({
            where: {
                id: job.id,
            },
            data: {
                status: "Interrupted",
                stopped: Date.now(),
            },
        });
        process.exit();
    }

    process.once("SIGINT", cleanup);
    process.once("SIGTERM", cleanup);

    ctx.status = 201;
    ctx.body = JSON.stringify({ok: true, job: job.id});
}
