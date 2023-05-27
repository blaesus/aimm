import { Revision } from "@prisma/client";

interface RevisionInput {
    // createdAt: string,
    updatedAt: string,
}
export function getLatestUpdateDate(revisions: RevisionInput[]): {updated: bigint | undefined} {
    if (revisions.length === 0) {
        return {
            updated: undefined,
        }
    }
    const dates = revisions.map(r => {
        return {
            updated: BigInt(+new Date(r.updatedAt)),
        }
    })
    const updated = dates.sort((a, b) => Number(b.updated - a.updated))[0].updated;
    return {updated};
}
