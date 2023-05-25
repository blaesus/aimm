import { getJobType, parseQuery, Query } from "./utils";
import { civitaiReindexer } from "../jobs/civitai";
import { huggingfaceIndexer } from "../jobs/huggingface";
import { fileObtainer } from "../jobs/obtain";
import * as Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { JobType, StartJobSuccess } from "../../data/aimmApi";
import { serialize } from "../../data/serialize";
import { JobDescription, runJob } from "../jobs/job";
import { benchExecutor } from "./executeBenches";

const spiders: { [key in JobType]: JobDescription<any, any> } = {
    "civitai-index": civitaiReindexer,
    "huggingface-index": huggingfaceIndexer,
    "obtain-files": fileObtainer,
    "execute-benches": benchExecutor,
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
        };
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
    runJob(spiders[type], requestBody, job.id);

    async function cleanup() {
        const runningJob = await prisma.job.findUnique({
            where: {
                id: job.id,
            },
        })
        if (runningJob && runningJob.status === "Running") {
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    status: "Interrupted",
                    stopped: Date.now(),
                },
            });
        }
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
    ctx.body = serialize(data);
}
