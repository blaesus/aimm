import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import * as dotenv from "dotenv";

import { hello } from "./routes/hello";
import { getJobs } from "./routes/getJobs";
import { startJob } from "./routes/startJob";
import { spiderAdminAuth } from "./routes/spiderAdminAuth";
import { stopJob } from "./routes/stopJob";
import { addBench } from "./routes/addBench";
import { executeBenches } from "./routes/executeBenches";

dotenv.config();

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(spiderAdminAuth);

router.prefix("/admin-api")

router.get("/hello", hello);

router.get("/jobs", getJobs);
router.get("/jobs/:type", getJobs);
router.post("/jobs/:type", startJob);
router.delete("/jobs/:id", stopJob);

router.post("/benchmarks", addBench);
router.post("/benchmarks/execute", executeBenches);

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4100;
app.listen(PORT, () => {
    console.log(`Admin controller running on port ${PORT}`);
});
