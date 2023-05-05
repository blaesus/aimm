import { Prisma, PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    const failedRecordIds = [
        "b3ff6392-1f39-401b-acec-5d5b490bf955",
        "822c8920-0e11-43bf-97a8-e343afbb08ed",
        "bf96237a-18af-4c6b-924a-be5369fc250c",
        "ecd65b17-01b9-41ee-9b22-2d1beb924b69",
        "61e92bce-43fc-4a40-8ae4-867dee4bda84",
        "45082f7b-9af6-4fd3-9901-17b0be5c6a83",
        "2632b8f6-40e9-4406-98a0-f9f539406b87",
        "16b12cfb-0de0-4829-9657-aa78930983eb",
        "e82f881c-7c07-4a93-9366-960ca24cc8f1",
        "d33944a0-5a23-495d-b0a9-ab58b89c6b66",
        "745c9fee-fd41-4a5a-86f5-9644fc608bf9",
        "9e3f8bde-78bb-48e7-b6e0-20cb3d2dfc4d",
        "0ed19c4d-f8f8-4e27-824c-1ae688907415",
        "92829a99-45d2-49f1-be21-b6ea5200cfe8",
        "4955d4fe-13a4-481c-a526-a8ffe051c864",
        "3a734c32-11c6-4379-9bad-d79d96b5aadc",
        "a63a5a56-0aac-4ac1-8298-3c55fe8566ab",
        "4a29d949-c44f-4f18-9c09-6baa4bfb22b8",
        "9c22e035-18c7-48a7-ae79-bf9c32764d23",
        "49c51e7f-267e-4017-8a08-dfb4423dd99d",
        "54fd84ab-0781-4ebb-bd3a-daef13d6821a",
        "b4c9b0a1-b8ef-4f7a-8a78-4194de68fd3b",
        "bce8e2bd-5a7f-4762-a62e-145113818d83",
        "307f7504-c8d4-4147-b09f-e186903909f0",
        "76289d91-5755-4908-8f5f-66df21b8c739",
        "fce2b26a-aafc-4788-b0ab-fcb871dbb7e4",
    ];
    for (const id of failedRecordIds) {
        const record = await prisma.fileRecord.findUnique({
            where: {
                id,
            },
        });
        if (record) {
            const hash = record.hashA;
            const altRecord = await prisma.fileRecord.findFirst({
                where: {
                    hashA: hash.toLowerCase(),
                },
            });
            if (altRecord) {
                console.info(record, altRecord)
            }
            else {
                throw Error("A")
            }
        }
        else {
            throw Error("B")
        }
    }
}

main().catch(console.error);
