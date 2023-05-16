import { getJobType, jsonReplacerWithBigint, parseQuery, Query } from "./utils";
import { civitaiReindexer, reindexCivitaiModels } from "../spiders/civitai";
import { huggingfaceIndexer, reindexHuggingFaceRepos } from "../spiders/huggingface";
import { fileObtainer, obtainFiles } from "../spiders/obtain";
import * as Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { JobType, StartJobSuccess } from "../../data/aimmApi";
import { runSpider, Spider } from "../spiders/spider";

const spiders: { [key in JobType]: Spider<any, any> } = {
    "civitai-index": civitaiReindexer,
    "huggingface-index": huggingfaceIndexer,
    "obtain-files": fileObtainer,
};

// For spider labels; changed each time this process is re-started
const processNumber = Date.now().toString();

export async function startJob(ctx: Koa.Context) {
    const type = getJobType(ctx.params.type.toLowerCase());
    if (!type) {
        ctx.status = 404;
        ctx.body = {
            ok: false,
            reason: `unknown job type ${type}`,
        }
        return;
    }
    const query: Query = parseQuery(ctx.request.querystring);
    const force = !!query.force;

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
    runSpider(spiders[type], requestBody, job.id)
        .then(async () => {
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    status: "Success",
                    stopped: Date.now(),
                },
            });
        })
        .catch(async error => {
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    status: "Failure",
                    stopped: Date.now(),
                },
            });
            console.error(error);
        });

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
    const data: StartJobSuccess = {
        ok: true,
        job,
    };
    ctx.set("Content-Type", "application/json");
    ctx.body = JSON.stringify(data, jsonReplacerWithBigint, 4);
}
