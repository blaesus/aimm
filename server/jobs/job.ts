import { prisma } from "../../data/prismaClient";

export interface JobStats {
    total?: number,
    processed?: number,
}

export interface JobDescription<P, S extends JobStats> {
    name?: string,
    init(params: P): Promise<S>;
    iterate(state: S): Promise<boolean>;
}

export async function runJob<P, S extends JobStats>(spider: JobDescription<P, S>, params: P, jobId?: string) {
    console.info(`Spider ${spider.name} starting with params ${JSON.stringify(params)} of job ${jobId}...`)
    try {
        let state = await spider.init(params);
        let earlyExit = false;
        while (await spider.iterate(state)) {
            if (jobId) {
                const job = await prisma.job.findUnique({
                    where: {
                        id: jobId,
                    }
                });
                if (job && job.status === "Cancelled") {
                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            stopped: Date.now(),
                            total: state.total,
                            processed: state.processed,
                        }
                    })
                    earlyExit = true;
                    console.info(`Spider ${spider.name} (job ${jobId}) cancelled`);
                    break;
                }
                await prisma.job.update({
                    where: {
                        id: jobId,
                    },
                    data: {
                        total: state.total,
                        processed: state.processed,
                    }
                })
            }
        }
        if (jobId && !earlyExit) {
            await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    status: "Success",
                    stopped: Date.now(),
                },
            });
        }
        console.info(`Spider ${spider.name} (job ${jobId}) finished`)
    }
    catch (error) {
        if (jobId) {
            await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    status: "Failure",
                    stopped: Date.now(),
                },
            });
        }
        console.error(`Spider ${spider.name} (job ${jobId}) failed: ${error}`)
    }

}
