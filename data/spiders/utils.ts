import crypto from "crypto";
import { pipeline } from "node:stream/promises";
import axios, { AxiosPromise, AxiosProxyConfig, AxiosRequestConfig } from "axios";
import Agent from "agentkeepalive"

interface Requester {
    getData<T>(url: string): AxiosPromise<T>,

    getTextData(url: string): AxiosPromise<string>,

    hashRemoteFile(url: string): Promise<string | null>,
}

interface RequesterOptions {
    root?: string,
    proxy?: AxiosProxyConfig,
}

export function buildProxyConfigFromEnv(): AxiosProxyConfig | undefined {
    const host = process.env.AXIOS_PROXY_HOST;
    const port = process.env.AXIOS_PROXY_PORT;
    const protocol = process.env.AXIOS_PROXY_PROTOCOL;

    if (host && port && protocol) {
        return {
            host,
            port: Number.parseInt(port),
            protocol,
        }
    }
}

export function makeRequester(options?: RequesterOptions): Requester {
    const keepAliveAgent = new Agent({
        maxSockets: 4,
        maxFreeSockets: 10,
        timeout: 60000, // active socket keepalive for 60 seconds
        freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
    });
    const root = options?.root ?? "https://civitai.com";
    const axiosParams: AxiosRequestConfig = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Content-Type": "application/json",
            "Origin": root,
            "Referer": root,
        },
        proxy: options?.proxy,
        httpAgent: keepAliveAgent,
    };

    const axiosInstance = axios.create(axiosParams);

    async function hashRemoteFile(url: string): Promise<string | null> {
        try {
            const {data} = await axiosInstance.get(url, {
                ...axiosParams,
                responseType: "stream",
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });
            const hash = crypto.createHash("sha256").setEncoding("binary");
            await pipeline(data, hash);
            return hash.digest().toString("hex");
        } catch (error) {
            console.error(`cannot get remote path for hashing ${url}: ${error}`);
            return null;
        }
    }

    async function getData<T>(url: string): AxiosPromise<T> {
        return axiosInstance.get<T>(url);
    }

    async function getTextData(url: string): AxiosPromise<string> {
        return axiosInstance.get<string>(url, {
            responseType: "text",
        });
    }

    return {
        hashRemoteFile,
        getData,
        getTextData,
    };
}

export interface LfsPointer {
    version: string,
    oidSha256: string,
    size: string
}

// Git LFS pointer looks like this:
//
// version https://git-lfs.github.com/spec/v1
// oid sha256:192e8257ae9e8f796f764630f4a488a6a16d1461762d62b49ef7405df951a283
// size 497764120
export function parsePossibleLfsPointer(content: string): LfsPointer | null {
    if (!content || typeof content !== "string") {
        return null;
    }
    const regex = /version\s(.*?)\noid\ssha256:(.*?)\nsize\s(.*)/;
    const match = content.match(regex);
    if (match) {
        return {
            version: match[1],
            oidSha256: match[2],
            size: match[3],
        };
    }
    else {
        return null;
    }
}
