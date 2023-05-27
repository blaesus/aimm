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

export function pickMost<T>(items: T[], evaluate: (item: T) => number): T | null {
    if (!items.length) {
        return null
    }
    let max = evaluate(items[0]);
    let maxItem = items[0];
    for (const item of items) {
        const score = evaluate(item);
        if (score > max) {
            max = score;
            maxItem = item;
        }
    }
    return maxItem;
}
