import crypto from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import RepositoryCreateInput = Prisma.RepositoryCreateInput;
import RevisionCreateInput = Prisma.RevisionCreateInput;
import { CivitaiModelFileJson, CivitaiModelJson, CivitaiModelVersionJson } from "../../data/civitaiTypes";
import { buildProxyConfigFromEnv, makeRequester, sleep } from "./utils";
import { CivitaiIndexingParams } from "../../data/aimmApi";
import { Spider, SpiderStats } from "./spider";

export interface CivitaiModelPayload {
    metadata: {
        totalItems: number,
        currentPage: number,
        pageSize: number,
        totalPages: number,
        nextPage: string
    },
    items: CivitaiModelJson[];
}

const requester = makeRequester({
    root: "https://civitai.com/",
    proxy: buildProxyConfigFromEnv(),
});

// About 1% of Civitai file-records don't have hashes.
// We manually download it and hash it.
// TODO: Save downloaded file and scan first to save bandwidth
async function completeFileHashes(
    prisma: PrismaClient,
    revision: CivitaiModelVersionJson,
): Promise<CivitaiModelFileJson[] | null> {
    const CATEGORY = "URL-TO-SHA256";
    const processedFiles: CivitaiModelFileJson[] = [];

    for (const f of revision.files) {
        if (f.hashes.SHA256) {
            processedFiles.push(f);
        }
        else {
            let sha256;

            const cached = await prisma.keyValueCache.findFirst({
                where: {
                    category: CATEGORY,
                    key: f.downloadUrl,
                },
            });
            if (cached) {
                sha256 = cached.value;
            }
            else {
                console.info(`Downloading ${f.downloadUrl} to calculate hash...`);
                const result = await requester.hashRemoteFile(f.downloadUrl);
                if (result) {
                    const data = {
                        category: CATEGORY,
                        key: f.downloadUrl,
                        value: result,
                        updated: Date.now(),
                    };
                    await prisma.keyValueCache.upsert({
                        where: {
                            category_key: {
                                category: CATEGORY,
                                key: f.downloadUrl,
                            },
                        },
                        create: data,
                        update: data,
                    });
                    sha256 = result;
                    console.info(`Calculated hash ${result} from ${f.downloadUrl}`);
                }
                else {
                    console.info(`Failed to download ${f.downloadUrl} for ${f.name} of model version ${f.modelVersionId}. This file is omitted from record...`);
                    return null;
                }
            }
            processedFiles.push({
                ...f,
                hashes: {
                    ...f.hashes,
                    SHA256: sha256,
                },
            });
        }
    }

    return processedFiles;
}

// Combine multiple hashes to one, basically Git's method, except:
// 1. the hash algorithm is SHA256
// 2. it directly borrow SHA256 reported by Civitai, not calculating (and prefixing) it by ourselves
// TODO: 2. it doesn't handle directories for now (but is possible to add in a back-compatible way)
function civitaiRevisionHashA(hashHexes: string[]): string {
    const sortedHashes = hashHexes.sort();
    const hasher = crypto.createHash("sha256");
    for (const hash of sortedHashes) {
        hasher.update(hash, "hex");
    }
    return hasher.digest("hex").toLowerCase();
}

async function updateCivitaiModel(prisma: PrismaClient, item: CivitaiModelJson): Promise<void> {
    console.info(`Updating Civitai model ${item.id} ${item.name}`);
    const registry = "Civitai";
    const fetchedRepo: RepositoryCreateInput = {
        name: item.name,
        subtype: item.type,
        registry,
        idInRegistry: item.id.toString(),
        raw: JSON.stringify(item),
        updated: Date.now(),
        favour: item.stats.downloadCount,
    };
    const repo = await prisma.repository.upsert({
        where: {
            registry_idInRegistry: {
                registry,
                idInRegistry: item.id.toString(),
            },
        },
        create: fetchedRepo,
        update: fetchedRepo,
    });

    for (const version of item.modelVersions) {
        const filesWithHash = await completeFileHashes(prisma, version);
        const verionId = version.id.toString();
        if (!filesWithHash) {
            console.info(`Skipping model version ${verionId} due to failure to obtain all file hashes`);
            continue;
        }
        const revisionHashA = civitaiRevisionHashA(filesWithHash.map(f => f.hashes.SHA256 || ""));
        const fetchedRevision: RevisionCreateInput = {
            repo: {
                connect: {
                    id: repo.id,
                },
            },
            hashA: revisionHashA,
            idInRegistry: verionId,
            raw: JSON.stringify(version),
            updated: Date.now(),
        };
        const createdRevision = await prisma.revision.upsert({
            where: {
                repoId_idInRegistry: {
                    repoId: repo.id,
                    idInRegistry: verionId,
                },
            },
            create: fetchedRevision,
            update: fetchedRevision,
        });

        for (const file of filesWithHash) {
            const fileHashA = file.hashes.SHA256?.toLowerCase() || "";
            const fetchedFileRecord: Prisma.FileRecordCreateInput = {
                revision: {
                    connect: {
                        id: createdRevision.id,
                    },
                },
                filename: file.name,
                hashA: fileHashA,
                downloadUrl: file.downloadUrl,
                raw: JSON.stringify(file),
                updated: Date.now(),
            };
            await prisma.fileRecord.upsert({
                where: {
                    revisionId_hashA: {
                        revisionId: createdRevision.id,
                        hashA: fileHashA,
                    },
                },
                create: fetchedFileRecord,
                update: fetchedFileRecord,
            });
        }
    }
}

const HARD_PAGE_LIMIT = 10_000; // Prevent infinite loop
export async function reindexCivitaiModels(jobId: string, params?: CivitaiIndexingParams) {
    const pageSize = params?.pageSize ?? 100;
    const requestWaitMs = params?.requestWaitMs ?? 10_000;

    const prisma = new PrismaClient();

    const batch = Date.now().toString();

    let total = 1;

    for (let page = 1; page <= HARD_PAGE_LIMIT; page += 1) {
        const job = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
        });
        if (job && job.status === "Cancelled") {
            await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    stopped: Date.now(),
                },
            });
            break;
        }

        const url = `https://civitai.com/api/v1/models?page=${page}&limit=${pageSize}`;
        console.info(`Civitai: fetching ${url}`);
        await prisma.job.update({
            where: {
                id: jobId,
            },
            data: {
                processed: page,
            },
        });

        try {
            const response = await requester.getData<CivitaiModelPayload>(url);
            await prisma.fetchRecord.create({
                data: {
                    fetcher: "civitai-fetcher",
                    remotePath: url,
                    time: Date.now(),
                    headers: JSON.stringify(response.headers),
                    data: JSON.stringify(response.data),
                    status: response.status,
                    successful: response.status >= 200 && response.status < 300,
                    batch,
                },
            });
            const {data} = response;
            total = data.metadata.totalPages;
            await prisma.job.update({
                where: {
                    id: jobId,
                },
                data: {
                    total,
                },
            });
            total = data.metadata.totalPages;
            for (const model of data.items) {
                await updateCivitaiModel(prisma, model);
            }
        } catch (err: any) {
            console.log("Error: ", err);
        }
        if (page > total) {
            console.info("Civitai reindex finished");
            break;
        }
        await sleep(requestWaitMs);
    }
}

interface State extends SpiderStats {
    pageSize: number
    requestWaitMs: number
    prisma: PrismaClient,
    batch: string
    total: number,
    page: number,
    processed: number,
}

export const civitaiReindexer: Spider<CivitaiIndexingParams, State> = {
    async init(params) {
        return {
            pageSize: params.pageSize ?? 100,
            requestWaitMs: params?.requestWaitMs ?? 10_000,
            prisma: new PrismaClient(),
            batch: Date.now().toString(),
            total: 1,
            page: 1,
            processed: 0,
        };
    },
    async iterate(state: State): Promise<boolean> {
        const {pageSize, prisma, page, batch, requestWaitMs} = state;

        const url = `https://civitai.com/api/v1/models?page=${page}&limit=${pageSize}`;
        console.info(`Civitai: fetching ${url}`);

        try {
            const response = await requester.getData<CivitaiModelPayload>(url);
            await prisma.fetchRecord.create({
                data: {
                    fetcher: "civitai-fetcher",
                    remotePath: url,
                    time: Date.now(),
                    headers: JSON.stringify(response.headers),
                    data: JSON.stringify(response.data),
                    status: response.status,
                    successful: response.status >= 200 && response.status < 300,
                    batch,
                },
            });
            const {data} = response;
            state.total = data.metadata.totalPages;
            for (const model of data.items) {
                await updateCivitaiModel(prisma, model);
            }
        } catch (err: any) {
            console.log("Error: ", err);
        }
        if (page > state.total || page > HARD_PAGE_LIMIT) {
            return false;
        }
        state.processed = page;
        state.page += 1;
        await sleep(requestWaitMs);
        return true;
    },
};
