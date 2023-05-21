import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import * as dotenv from "dotenv";

import { files } from "./routes/files";
import { hello } from "./routes/hello";
import { search } from "./routes/search";
import { repositories } from "./routes/repos";

dotenv.config()

const app = new Koa();
const router = new Router();

app.use(bodyParser());


router.prefix("/api");
router.get("/hello", hello);
router.get("/repositories", repositories);
router.get("/files", files);
router.get("/search/:keyword", search);

app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
