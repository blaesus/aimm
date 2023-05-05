import * as dotenv from "dotenv";
import { reindexHuggingFaceRepos } from "./huggingface";

async function main() {
    dotenv.config()
    // await reindexCivitaiFromLocal();
    // await reindexCivitaiModels();
    await reindexHuggingFaceRepos();

    console.info(process.env)
}


main().catch(console.error);
