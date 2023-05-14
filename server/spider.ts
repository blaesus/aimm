import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
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

router.prefix("/admin-api")
router.get("/hello", hello);
router.get("/jobs/:type", getSpider);
router.post("/jobs/:type", startSpider);

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4100;
app.listen(PORT, () => {
    console.log(`Admin controller running on port ${PORT}`);
});
