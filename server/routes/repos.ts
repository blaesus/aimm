import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { Registry } from ".prisma/client";
import { parseQuery, Query } from "./utils";
import { serialize } from "../../data/serialize";
import { getRegistry } from "../serverUtils";
import { GetRepositorySuccess } from "../../data/aimmApi";

export type RepositoryApiItems<BIGINT = bigint> = {
    id: string,
    name: string,
    revisions: {
        id: string,
    }[]
    favour: BIGINT
}


const repositoryOutputSelect = {
    id: true,
    favour: true,
};


export async function repositories(ctx: Koa.Context) {
    const query: Query = parseQuery(ctx.request.querystring);
    const take = query.limit ? parseInt(query.limit) : 1;
    const registry = getRegistry(query.registry);
    let repos: RepositoryApiItems[] = await prisma.repository.findMany({
        take,
        where: {
            registry: {
                equals: registry,
            }
        },
        select: {
            id: true,
            name: true,
            revisions: {
                select: {
                    id: true,
                }
            },
            favour: true
        },
        orderBy: {
            favour: "desc"
        }
    });
    const data: GetRepositorySuccess = {
        ok: true,
        repositories: repos,
    }
    ctx.set("Content-Type", "application/json");
    ctx.body = serialize(data);
}
