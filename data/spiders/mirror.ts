import * as dotenv from "dotenv";
import { obtainFiles } from "./obtain";

async function main() {
    dotenv.config();
    await obtainFiles({
        batchSize: 1,
    })
}

main();
