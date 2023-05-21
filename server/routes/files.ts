import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { Registry } from ".prisma/client";
import { parseQuery, Query } from "./utils";
import { serialize } from "../../data/serialize";

export type FileRecordApiItem<BIGINT = bigint> = {
    id: string,
    hashA: string,
    downloadUrl: string,
    revision: {
        id: string,
        idInRegistry: string,
        repo: {
            id: string,
            name: string,
            registry: Registry,
            idInRegistry: string,
            favour: BIGINT,
        }
    } | null,
}

const fileRecordOutputSelect = {
    id: true,
    hashA: true,
    downloadUrl: true,
    filename: true,
    revision: {
        select: {
            id: true,
            idInRegistry: true,
            repo: {
                select: {
                    id: true,
                    name: true,
                    registry: true,
                    idInRegistry: true,
                    favour: true,
                },
            },
        },
    },

};


export async function files(ctx: Koa.Context) {
        const query: Query = parseQuery(ctx.request.querystring);
        let files: FileRecordApiItem[] = [];
        if (query.sha256) {
            files = await prisma.fileRecord.findMany({
                where: {
                    hashA: {
                        equals: query.sha256.toLowerCase(),
                    },
                },
                orderBy: {
                    revision: {
                        repo: {
                            favour: "desc",
                        },
                    },
                },
                select: fileRecordOutputSelect,
            });
        }
        else if (query.filename) {
            files = await prisma.fileRecord.findMany({
                where: {
                    filename: {
                        contains: query.filename,
                        mode: query["case-insensitive"] ? "insensitive" : undefined,
                    },
                },
                orderBy: {
                    revision: {
                        repo: {
                            favour: "desc",
                        },
                    },
                },
                select: fileRecordOutputSelect,
                take: 1000,
            });
        }
        ctx.set("Content-Type", "application/json");
        ctx.body = serialize(files);
}
