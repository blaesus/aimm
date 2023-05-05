import { PrismaClient } from "@prisma/client";
import { CivitaiModelPayload, saveCivitaiModelPayload } from "@/server/data/civitai";

// Use with care
export async function reindexCivitaiFromLocalFetchRecords() {
    const prisma = new PrismaClient();

    // const keyValues: KeyValueCache[] = JSON.parse((await fs.readFile(`./KeyValueCache.json`)).toString());
    // await prisma.keyValueCache.createMany({
    //     data: keyValues
    // })

    // const fetchRecords: FetchRecord[] = JSON.parse((await fs.readFile(`./FetchRecord.json`)).toString());
    // await prisma.fetchRecord.createMany({
    //     data: fetchRecords
    // });

    const fetchRecords = await prisma.fetchRecord.findMany({
        orderBy: {
            time: "asc",
        },
    });
    const payloads: CivitaiModelPayload[] = fetchRecords.map(record => JSON.parse(record.data));
    for (const payload of payloads) {
        console.info(`Saving ${payload.metadata.currentPage}`);
        await saveCivitaiModelPayload(prisma, payload);
    }
}

