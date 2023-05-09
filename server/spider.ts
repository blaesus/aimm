import Koa from "koa";
import Router from "koa-router";
import { reindexCivitaiModels } from "../data/spiders/civitai";
import { reindexHuggingFaceRepos } from "../data/spiders/huggingface";
import * as dotenv from "dotenv";
import { prisma } from "../data/prismaClient";

dotenv.config()

const app = new Koa();
const router = new Router();

const appSecret = "12321c8sd3";

type Spider = "civitai" | "huggingface"

interface SpiderStatus {
    start: number | null,
    end: number | null,
    remark?: string,
}

const spiderStatuus: { [key in Spider]: SpiderStatus } = {
    civitai: {
        start: null,
        end: null,
    },
    huggingface: {
        start: null,
        end: null,
    },
};

router.get("/hello", async (ctx: Koa.Context) => {
    const count = await prisma.repository.count();
    ctx.body = `Hello world from spider with ${count} repositories!`;
});

router.get("/_spiders/:type", async (ctx) => {
    const authorizationHeader = ctx.request.headers.authorization || "";
    const token = authorizationHeader.replace("Bearer ", "");
    if (token !== appSecret) {
        ctx.status = 401;
        ctx.body = "Unauthorized";
        return;
    }
    const type = getSpiderName(ctx.params.type.toLowerCase());
    if (type) {
        ctx.status = 200;
        ctx.body = spiderStatuus[type];
        return;
    }
    else {
        ctx.status = 404;
        return;
    }
});

function getSpiderName(s: string): Spider | null {
    if (s === "civitai" || s === "huggingface") {
        return s;
    }
    else {
        return null;
    }
}

const reindexers: { [key in Spider]: () => Promise<void> } = {
    civitai: reindexCivitaiModels,
    huggingface: reindexHuggingFaceRepos,
};

async function launchSpider(spiderName: Spider) {
    let start = new Date().toISOString();
    spiderStatuus[spiderName] = {
        start: Date.now(),
        end: null,
        remark: `Started at ${start}`,
    };
    await reindexers[spiderName]();
    spiderStatuus[spiderName] = {
        start: Date.now(),
        end: null,
        remark: `Started at ${new Date().toISOString()}`,
    };
}

router.post("/_spiders/:type", async (ctx) => {
    const authorizationHeader = ctx.request.headers.authorization || "";
    const token = authorizationHeader.replace("Bearer ", "");
    if (token !== appSecret) {
        ctx.status = 401;
        ctx.body = "Unauthorized";
        return;
    }
    const type = getSpiderName(ctx.params.type.toLowerCase());

    if (!type) {
        ctx.status = 404;
        return;
    }
    const status = spiderStatuus[type]
    if (status.start && !status.end) {
        ctx.status = 400;
        ctx.body = JSON.stringify({started: false, reason: "a spider is running"});
    }
    else {
        launchSpider(type).catch(console.error);
        ctx.status = 201;
        ctx.body = JSON.stringify({started: true});
    }

});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4010;
app.listen(PORT, () => {
    console.log(`Spider controller running on port ${PORT}`);
});