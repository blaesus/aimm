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

export type SpiderType = "civitai" | "huggingface" | "obtain-files"

const spiders: { [key in SpiderType]: SpiderType } = {
    civitai: "civitai",
    huggingface: "huggingface",
    "obtain-files": "obtain-files",
};

export function getSpiderType(s?: string): SpiderType | null {
    for (const spider of Object.values(spiders)) {
        if (spider === s) {
            return spider;
        }
    }
    return null;
}

export function jsonReplacerWithBigint(this: any, key: string, value: any) {
    if (typeof value === "bigint") {
        if (key === "time" || key === "updated" || key === "created" || key === "started" || key === "stopped") {
            return new Date(Number(value)).toISOString();
        }
        else if (value < Number.MAX_SAFE_INTEGER) {
            return Number(value);
        }
        else {
            return value.toString();
        }
    }
    else {
        return value;
    }
}

