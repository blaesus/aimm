import * as dotenv from "dotenv";
import { obtainFiles } from "./obtain";
import { prisma } from "../prismaClient";

async function main() {
    dotenv.config();
    await obtainFiles({
        batchSize: 1,
    })
}

main();
