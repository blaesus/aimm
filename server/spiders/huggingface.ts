import crypto from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import RepositoryCreateInput = Prisma.RepositoryCreateInput;
import RevisionCreateInput = Prisma.RevisionCreateInput;
import {
    HuggingfaceCommitJson_FromList,
    HuggingfaceCommitJson_Full,
    HuggingFaceFilePointer,
} from "../../data/huggingfaceTypes";
import { buildProxyConfigFromEnv, makeRequester, parsePossibleLfsPointer, sleep } from "./utils";
import { HuggingFaceReindexParams, HuggingfaceRepoType } from "../../data/aimmApi";
import { Spider, SpiderStats } from "./spider";

type HuggingfaceCommitResponse = HuggingfaceCommitJson_FromList[]

interface HuggingFaceFileRecord extends HuggingFaceFilePointer {
    sha256: string,
    pointerUrl: string,
    downloadUrl: string,
    size: number,
}

const requester = makeRequester({
    root: "https://huggingface.co/",
    proxy: buildProxyConfigFromEnv(),
});

async function fetchFileMeta(
    prisma: PrismaClient,
    revision: HuggingfaceCommitJson_Full,
    repoType: HuggingfaceRepoType
): Promise<HuggingFaceFileRecord[]> {
    const HASH_CATEGORY = "URL-TO-SHA256";
    const SIZE_CATEGORY = "URL-TO-SIZE";
    const CONTENT_CATEGORY = "URL-TO-RAW-CONTENT";
    const processedFiles: HuggingFaceFileRecord[] = [];
    await Promise.allSettled(revision.siblings.map(async (f) => {
        let sha256;

        let rawUrl = `https://huggingface.co/${revision.id}/raw/${revision.sha}/${f.rfilename}`;
        let downloadUrl  = `https://huggingface.co/${revision.id}/resolve/${revision.sha}/${f.rfilename}`;
        if (repoType === "datasets") {
            rawUrl = `https://huggingface.co/datasets/${revision.id}/raw/${revision.sha}/${f.rfilename}`;
            downloadUrl  = `https://huggingface.co/datasets/${revision.id}/resolve/${revision.sha}/${f.rfilename}`;
        }

        let size = 0;

        const cachedHash = await prisma.keyValueCache.findUnique({
            where: {
                category_key: {
                    category: HASH_CATEGORY,
                    key: rawUrl,
                },
            },
        });
        const cachedSize = await prisma.keyValueCache.findUnique({
            where: {
                category_key: {
                    category: SIZE_CATEGORY,
                    key: rawUrl,
                },
            },
        });
        if (cachedHash && cachedSize) {
            sha256 = cachedHash.value;
            size = Number.parseInt(cachedSize.value) || 0;
        }
        else {
            try {
                let content;
                const cachedContent = await prisma.keyValueCache.findFirst({
                    where: {
                        category: CONTENT_CATEGORY,
                        key: rawUrl,
                    },
                });
                if (cachedContent) {
                    content = cachedContent.value;
                }
                else {
                    const {data} = await requester.getTextData(rawUrl);
                    content = data;
                }

                const lfsPointer = parsePossibleLfsPointer(content);

                if (lfsPointer) {
                    sha256 = lfsPointer.oidSha256;
                    size = Number.parseInt(lfsPointer.size);
                }
                else {
                    sha256 = crypto.createHash("sha256").update(content).digest().toString("hex");
                    size = content.length;
                }
                const time = Date.now();
                // TODO: handle non-text data (binary?)
                if (!cachedHash) {
                    const data = {
                        category: HASH_CATEGORY,
                        key: rawUrl,
                        value: sha256,
                        updated: time,
                    };
                    await prisma.keyValueCache.upsert({
                        where: {
                            category_key: {
                                category: data.category,
                                key: data.key,
                            },
                        },
                        create: data,
                        update: data,
                    });
                }
                if (!cachedSize) {
                    const data = {
                        category: SIZE_CATEGORY,
                        key: rawUrl,
                        value: size.toString(),
                        updated: time,
                    };
                    await prisma.keyValueCache.upsert({
                        where: {
                            category_key: {
                                category: data.category,
                                key: data.key,
                            },
                        },
                        create: data,
                        update: data,
                    });
                }
                // Cache files smaller than 8k.
                if (content.length < 8 * 1024) {
                    const data = {
                        category: CONTENT_CATEGORY,
                        key: rawUrl,
                        value: content,
                        updated: time,
                    };
                    await prisma.keyValueCache.upsert({
                        where: {
                            category_key: {
                                category: data.category,
                                key: data.key,
                            },
                        },
                        create: data,
                        update: data,
                    });
                }
            } catch (error) {
                console.info(`Failed to download ${rawUrl} for ${f.rfilename} of model version ${revision.id}.\nThis file is omitted from record.\nError: ${error}`);
                return;
            }
        }
        processedFiles.push({
            ...f,
            sha256,
            pointerUrl: rawUrl,
            downloadUrl,
            size,
        });
    }));

    return processedFiles;
}

async function updateHuggingfaceCommit(
    prisma: PrismaClient,
    commit: HuggingfaceCommitJson_Full,
    repoType: HuggingfaceRepoType,
    fallbackSubtype = "model",
): Promise<void> {
    console.info(`Updating HuggingFace model ${commit.id} @ ${commit.sha}`);
    const registry = "Huggingface";
    const fetchedRepo: RepositoryCreateInput = {
        name: commit.id,
        registry,
        subtype: commit.pipeline_tag || fallbackSubtype,
        idInRegistry: commit.id.toString(),
        raw: JSON.stringify(commit),
        updated: Date.now(),
        favour: commit.downloads,
    };
    const repo = await prisma.repository.upsert({
        where: {
            registry_idInRegistry: {
                registry,
                idInRegistry: commit.id.toString(),
            },
        },
        create: fetchedRepo,
        update: fetchedRepo,
    });

    {
        const enhancedFileRecords = await fetchFileMeta(prisma, commit, repoType);
        const revisionHashA = commit.sha;
        const fetchedRevision: RevisionCreateInput = {
            repo: {
                connect: {
                    id: repo.id,
                },
            },
            hashA: revisionHashA,
            idInRegistry: revisionHashA,
            raw: JSON.stringify(commit),
            updated: Date.now(),
        };
        const targetRevision = await prisma.revision.upsert({
            where: {
                repoId_idInRegistry: {
                    repoId: repo.id,
                    idInRegistry: revisionHashA,
                },
            },
            create: fetchedRevision,
            update: fetchedRevision,
        });

        for (const file of enhancedFileRecords) {
            const fetchedFileRecord: Prisma.FileRecordCreateInput = {
                revision: {
                    connect: {
                        id: targetRevision.id,
                    },
                },
                filename: file.rfilename,
                hashA: file.sha256.toLowerCase(),
                downloadUrl: file.downloadUrl,
                raw: JSON.stringify(file),
                updated: Date.now(),
                size: file.size,
            };
            await prisma.fileRecord.upsert({
                where: {
                    revisionId_hashA: {
                        revisionId: targetRevision.id,
                        hashA: file.sha256,
                    },
                },
                create: fetchedFileRecord,
                update: fetchedFileRecord,
            });
        }
    }

}

function parseLinkHeader(s: string): { link: string, relation: string } | null {
    const matches = s.match(/<(.*)>;\s*rel="(\w*)"/);
    if (matches !== null) {
        return {link: matches[1], relation: matches[2]};
    }
    else {
        return null;
    }
}

interface State extends SpiderStats {
    url: string,
    requestWaitMs: number,
    repoType: HuggingfaceRepoType,
    batch: string,
    prisma: PrismaClient,
    processed: number,
}

export const huggingfaceIndexer: Spider<HuggingFaceReindexParams, State> = {
    name: "huggingface-indexer",
    async init(params) {
        const repoType = params.repoType ?? "models";
        const pageSize = params.pageSize ?? 10_000;

        const defaultInitPage = `https://huggingface.co/api/${repoType}?limit=${pageSize}&full=true&sort=downloads&direction=-1`;
        const initialPage = params?.initialPage ?? defaultInitPage;

        return {
            repoType,
            url: initialPage,
            pageSize,
            requestWaitMs: params?.requestWaitMs ?? 60_000,
            prisma: new PrismaClient(),
            batch: Date.now().toString(),
            page: 1,
            total: undefined,
            processed: 0,
        }
    },
    async iterate(state: State): Promise<boolean> {
        const {batch, url, repoType, prisma, requestWaitMs} = state;

        console.info(`Loading Huggingface model index page ${url}`);
        try {
            const response = await requester.getData<HuggingfaceCommitResponse>(url);
            // TODO: mark batch
            await prisma.fetchRecord.create({
                data: {
                    fetcher: "huggingface-index-fetcher",
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

            for (const item of data) {
                // full returns from /api/models has "siblings" field, so we just need the index
                // however, full returns from /api/datasets doesn't have such field, and we need to manually download
                // each item for the file list.
                if (repoType === "models") {
                    await updateHuggingfaceCommit(prisma, item as HuggingfaceCommitJson_Full, repoType, "model");
                }
                else {
                    const itemUrl = `https://huggingface.co/api/${repoType}/${item.id}/revision/${item.sha}`;
                    const response = await requester.getData<HuggingfaceCommitJson_Full>(itemUrl);
                    await prisma.fetchRecord.create({
                        data: {
                            fetcher: "huggingface-item-fetcher",
                            remotePath: itemUrl,
                            time: Date.now(),
                            headers: JSON.stringify(response.headers),
                            data: JSON.stringify(response.data),
                            status: response.status,
                            successful: response.status >= 200 && response.status < 300,
                            batch,
                        },
                    });
                    await updateHuggingfaceCommit(prisma, response.data, repoType, "dataset");
                }
            }

            if (!response.headers.link) {
                console.info("No more pages for Huggingface", url);
                return false;
            }
            const nextPageInstruction = parseLinkHeader(response.headers.link);
            if (nextPageInstruction && nextPageInstruction.relation === "next") {
                state.url = nextPageInstruction.link;
                console.info("Switching to next page", url);
            }
            else {
                console.error("Cannot find proper link header", response.headers.link);
                return false;
            }

        } catch (err: any) {
            console.error("Error: ", err);
        }
        state.processed += 1;
        await sleep(requestWaitMs);
        return state.processed <= 10000;
    }

}
