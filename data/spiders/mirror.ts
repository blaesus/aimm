import * as dotenv from "dotenv";
import { reindexCivitaiModels } from "@/server/data/civitai";
import { reindexCivitaiFromLocalFetchRecords } from "@/server/data/localCivitai";
import { reindexHuggingFaceRepos } from "@/server/data/huggingface";


async function main() {
    dotenv.config()
    // await reindexCivitaiFromLocal();
    // await reindexCivitaiModels();
    await reindexHuggingFaceRepos();

    console.info(process.env)
}


main().catch(console.error);
