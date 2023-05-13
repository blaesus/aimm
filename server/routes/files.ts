import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { Registry } from ".prisma/client";
import { parseQuery, Query } from "./utils";

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
    }
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

function fileRecordOutputReplacer(this: any, key: string, value: any) {
    if (typeof value === "bigint") {
        if (key === "time" || key === "updated") {
            return new Date(Number(value)).toISOString();
        }
        else if (value < Number.MAX_SAFE_INTEGER) {
            return Number(value);
        }
        else {
            return value.toString();
        }
    }
    else {
        return value;
    }
}


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
        const jsonSpace = query.pretty ? 4 : undefined;
        ctx.set("Content-Type", "application/json");
        ctx.body = JSON.stringify(files, fileRecordOutputReplacer, jsonSpace);
}