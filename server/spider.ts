import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import * as dotenv from "dotenv";

import { hello } from "./routes/hello";
import { getSpider } from "./routes/getSpider";
import { startSpider } from "./routes/startSpider";
import { spiderAdminAuth } from "./routes/spiderAdminAuth";

dotenv.config();

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(spiderAdminAuth);

router.get("/hello", hello);

router.get("/_spiders/:type", getSpider);
router.post("/_spiders/:type", startSpider);

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4010;
app.listen(PORT, () => {
    console.log(`Spider controller running on port ${PORT}`);
});
