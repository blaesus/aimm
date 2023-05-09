import * as dotenv from "dotenv";
import { obtainFiles } from "./obtain";
import { prisma } from "../prismaClient";

async function main() {
    dotenv.config();
    // await obtainFiles({
    //     batchSize: 1,
    // })
    // const repos = await prisma.repository.count({
    //     where: {
    //         favour: {
    //             gt: 1000,
    //         },
    //     },
    // });
    // console.info(repos)
}

main();
