import { PrismaClient, FileRecord } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSizes() {
    try {
        // Count records without a size
        const count = await prisma.fileRecord.count({
            where: {
                size: null,
            },
        });

        const pageSize = 100; // Number of records to process per page
        let processedCount = 0;

        for (let skip = 0; skip < count; skip += pageSize) {
            // Find records without a size, paginated
            const recordsWithoutSize = await prisma.fileRecord.findMany({
                where: {
                    size: null,
                },
                take: pageSize,
                skip: skip,
            });

            for (const record of recordsWithoutSize) {
                // Find records with the same hashA
                const matchingRecords = await prisma.fileRecord.findMany({
                    where: {
                        hashA: record.hashA,
                        size: {
                            not: null,
                        },
                    },
                    take: 1, // Retrieve only one matching record
                });

                if (matchingRecords.length > 0) {
                    const matchingRecord = matchingRecords[0];
                    // Update the size of the current record with the matching record's size
                    await prisma.fileRecord.update({
                        where: {
                            id: record.id,
                        },
                        data: {
                            size: matchingRecord.size,
                        },
                    });
                    console.log(`Updated size for record with id ${record.id}`);
                } else {
                    console.log(`No matching records found for record with id ${record.id}`);
                }

                processedCount++;
                console.log(`Processed ${processedCount} out of ${count}`);
            }
        }

        console.log('Finished updating sizes.');
    } catch (error) {
        console.error('Error updating sizes:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateSizes();
