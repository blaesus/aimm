import { JobType, jobTypes } from "../../data/aimmApi";
import { ObjectWithId } from "../../data/sharedTypes";

export type QueryKey =
    "filename" | "sha256" | "pretty" | "case-insensitive" | "force"

export type Query = {
    [key in QueryKey]?: string
}

export const queryKeys: { [key in QueryKey]: QueryKey } = {
    filename: "filename",
    sha256: "sha256",
    pretty: "pretty",
    "case-insensitive": "case-insensitive",
    force: "force",
};

export function checkQueryKey(key: string): QueryKey | null {
    for (const queryKey of Object.values(queryKeys)) {
        if (queryKey === key) {
            return queryKey;
        }
    }
    return null;
}

export function parseQuery(queryString: string | undefined): Query {
    if (!queryString) {
        return {};
    }
    const query: Query = {};
    const pairs = queryString.split("&");
    for (const pair of pairs) {
        const kv = pair.split("=").map(decodeURIComponent);
        const key = checkQueryKey(kv[0]);
        if (key) {
            query[key] = kv[1] || "";
        }
    }
    return query;
}

export function getJobType(s?: string): JobType | null {
    for (const spider of Object.values(jobTypes)) {
        if (spider === s) {
            return spider;
        }
    }
    return null;
}


export function dedupeById<T extends ObjectWithId>(list: T[]): T[] {
    const result: T[] = [];
    for (const item of list) {
        if (result.every(x => x.id !== item.id)) {
            result.push(item);
        }
    }
    return result;
}
