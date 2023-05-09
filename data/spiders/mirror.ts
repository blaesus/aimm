import * as dotenv from "dotenv";
import { obtainFiles } from "./obtain";
import { uploadFileToS3Like, uploadToB2 } from "./s3like";
import { prisma } from "../prismaClient";

async function main() {
    dotenv.config();
    await obtainFiles({
        batchSize: 100,
    })
}

main();
