import Koa from "koa";
import Router from "koa-router";
import { reindexCivitaiModels } from "../data/spiders/civitai";
import { reindexHuggingFaceRepos } from "../data/spiders/huggingface";
import * as dotenv from "dotenv";
import { prisma } from "../data/prismaClient";
import { obtainFiles } from "../data/spiders/obtain";

dotenv.config()

const app = new Koa();
const router = new Router();

const appSecret = "12321c8sd3";

type Spider = "civitai" | "huggingface" | "obtain-files"

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
    "obtain-files": {
        start: null,
        end: null,
    }
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
    if (s === "civitai" || s === "huggingface" || s === "obtain-files") {
        return s;
    }
    else {
        return null;
    }
}


const spiders: { [key in Spider]: (params: {}) => Promise<void> } = {
    civitai: reindexCivitaiModels,
    huggingface: reindexHuggingFaceRepos,
    "obtain-files": obtainFiles,
};

async function launchSpider(spiderName: Spider, data: {}) {
    let start = new Date().toISOString();
    spiderStatuus[spiderName] = {
        start: Date.now(),
        end: null,
        remark: `Started at ${start}`,
    };
    await spiders[spiderName](data);
    spiderStatuus[spiderName] = {
        ...spiderStatuus[spiderName],
        end: Date.now(),
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
        const requestBody = ctx.request.body || {};
        launchSpider(type, requestBody).catch(console.error);
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
