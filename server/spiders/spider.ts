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
    let state = await spider.init(params);
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

}
