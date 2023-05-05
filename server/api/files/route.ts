import { type NextRequest } from "next/server";
import { prisma } from "@/app/api/shared/prisma";
import type { Registry } from ".prisma/client";

type FileQuery = "filename" | "sha256" | "pretty" | "case-insensitive"

const fileQueries: { [key in FileQuery]: FileQuery } = {
    filename: "filename",
    sha256: "sha256",
    pretty: "pretty",
    "case-insensitive": "case-insensitive",
};

type Query = {
    [key in FileQuery]?: string
}

function checkQueryKey(key: string): FileQuery | null {
    for (const queryKey of Object.values(fileQueries)) {
        if (queryKey === key) {
            return queryKey;
        }
    }
    return null;
}

function parseQuery(queryString: string | undefined): Query {
    if (!queryString) {
        return {};
    }
    const query: Query = {};
    const pairs = queryString.split("&");
    for (const pair of pairs) {
        const kv = pair.split("=").map(decodeURIComponent);
        const key = checkQueryKey(kv[0]);
        if (key) {
            query[key] = kv[1] || "";
        }
    }
    return query;
}

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

export async function GET(request: NextRequest) {
    const query = parseQuery(request.url.split("?")[1]);
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
    return new Response(JSON.stringify(files, fileRecordOutputReplacer, jsonSpace), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
