import { prisma } from "../../data/prismaClient";

export interface SpiderStats {
    total?: number,
    processed?: number,
}

export interface Spider<P, S extends SpiderStats> {
    init(params: P): Promise<S>;
    iterate(state: S): Promise<boolean>;
}

export async function runSpider<P, T extends SpiderStats>(spider: Spider<P, T>, params: P, jobId?: string) {
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
        console.error(error);
    }

}
