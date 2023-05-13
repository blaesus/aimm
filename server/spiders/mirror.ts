import * as dotenv from "dotenv";
import { obtainFiles } from "./obtain";
import { prisma } from "../../data/prismaClient";
import { uploadToB2 } from "./s3like";

async function main() {
    dotenv.config();
    console.info("START");
    await uploadToB2({
        multipart: true,
        localPath: "/Users/andy/Downloads/ideaIU-2022.3.2.dmg",
        remotePath: "multipart-test/ideaIU-2022.3.2.dmg"
    })
    // await obtainFiles({
    //     batchSize: 1,
    //     registry: "Civitai",
    // })
}

main();
