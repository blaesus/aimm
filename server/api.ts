import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { prisma } from "../data/prismaClient";
import { Registry } from ".prisma/client";

const app = new Koa();
const router = new Router();

// Use bodyParser middleware to parse request body
app.use(bodyParser());

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

// Define a route for handling GET requests to the root URL
router.get("/hello", async (ctx: Koa.Context) => {
    const count = await prisma.repository.count();
    ctx.body = `Hello, world from ${count} repositories!`;
});

type FileQuery = "filename" | "sha256" | "pretty" | "case-insensitive"

type Query = {
    [key in FileQuery]?: string
}

const fileQueries: { [key in FileQuery]: FileQuery } = {
    filename: "filename",
    sha256: "sha256",
    pretty: "pretty",
    "case-insensitive": "case-insensitive",
};

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

router.get("/files", async (ctx: Koa.Context) => {
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

});

// Add router middleware to the app
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
const PORT = 3030;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
