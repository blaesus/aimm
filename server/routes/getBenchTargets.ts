import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { Registry } from ".prisma/client";
import { parseQuery, Query } from "./utils";
import { serialize } from "../../data/serialize";
import { getRegistry } from "../serverUtils";
import { GetBenchTargetsSuccess } from "../../data/aimmApi";

export type BenchTargetApiItems<BIGINT = bigint> = {
    id: string,
    name: string,
    revisions: {
        id: string,
        fileRecords: {
            id: string
            hashA: string
            filename: string,
            downloadUrl: string,
        }[]
    }[]
    favour: BIGINT
}


const repositoryOutputSelect = {
    id: true,
    favour: true,
};


export async function getBenchTargets(ctx: Koa.Context) {
    const query: Query = parseQuery(ctx.request.querystring);
    const take = query.limit ? parseInt(query.limit) : 1;
    const registry = getRegistry(query.registry);
    const subtype = query.subtype;
    let repos: BenchTargetApiItems[] = await prisma.repository.findMany({
        take,
        where: {
            registry,
            subtype,
        },
        select: {
            id: true,
            name: true,
            revisions: {
                select: {
                    id: true,
                    fileRecords: {
                        select: {
                            id: true,
                            downloadUrl: true,
                            hashA: true,
                            filename: true,
                        }
                    }
                }
            },
            favour: true
        },
        orderBy: {
            favour: "desc"
        }
    });
    const data: GetBenchTargetsSuccess = {
        ok: true,
        repositories: repos,
    }
    ctx.set("Content-Type", "application/json");
    ctx.body = serialize(data);
}
