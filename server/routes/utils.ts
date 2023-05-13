export type FileQuery = "filename" | "sha256" | "pretty" | "case-insensitive"

export type Query = {
    [key in FileQuery]?: string
}

export const fileQueries: { [key in FileQuery]: FileQuery } = {
    filename: "filename",
    sha256: "sha256",
    pretty: "pretty",
    "case-insensitive": "case-insensitive",
};

export function checkQueryKey(key: string): FileQuery | null {
    for (const queryKey of Object.values(fileQueries)) {
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
}

export function getSpiderType(s: string): SpiderType | null {
    for (const spider of Object.values(spiders)) {
        if (spider === s) {
            return spider;
        }
    }
    return null
}
