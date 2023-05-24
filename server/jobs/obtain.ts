import { prisma } from "../../data/prismaClient";
import { hashLocalFile, makeRequester, sleep } from "./utils";
import { promises as fs } from "fs";
import { ServiceUplaodParams, uploadToB2 } from "./s3like";
import { FileRecord, StorageService } from "@prisma/client";
import { Registry } from ".prisma/client";
import { ObtainFilesParams } from "../../data/aimmApi";
import { getRegistry } from "../serverUtils";
import { JobDescription } from "./job";

const MULTIPART_UPLOAD_LIMIT = 1_000_000;


async function dummyUploaders(params: ServiceUplaodParams) {
    console.error("NOT IMPLEMENTED UPLOADER");
    return null;
}

const uploaders: { [key in StorageService]: (params: ServiceUplaodParams) => Promise<any> } = {
    BackBlaze_B2: uploadToB2,
    CloudFlare_R2: dummyUploaders,
    AWS_S3: dummyUploaders,
    Local: dummyUploaders,
};


async function fetchFileRecord(fileRecord: FileRecord, service: StorageService, recordMeta?: {}) {
    // download file
    const requester = makeRequester({
        root: (new URL(fileRecord.downloadUrl)).host,
    });
    const localPath = `/tmp/temp-aimm-blob-${Date.now()}`;
    console.info(`Saving ${fileRecord.filename}(${fileRecord.downloadUrl}) to ${localPath}...`);
    const bytes = await requester.downloadToLocal({
        remotePath: fileRecord.downloadUrl,
        localPath,
    });
    if (!bytes) {
        console.info(`Failed to download file ${fileRecord.downloadUrl}`);
        return
    }
    // verify sha256
    const localHash = await hashLocalFile(localPath);
    if (!localHash) {
        console.error(`Failed to hash ${localHash}`);
    }
    else if (localHash !== fileRecord.hashA) {
        console.error(`Hash mismatch for ${fileRecord.downloadUrl}: ${localHash}, expecting ${fileRecord.hashA}`);
    }
    else {
        // Upload to Backblaze
        console.info(`Uploading to storage server ${service}...`);
        const remotePath = fileRecord.hashA;
        const upload = uploaders[service];
        const multipart = bytes > MULTIPART_UPLOAD_LIMIT;
        const response = await upload({
            localPath,
            remotePath,
            multipart,
        });
        if (response) {
            console.info(`Uploaded ${fileRecord.downloadUrl} to ${remotePath} on ${service}`);
            const now = Date.now();
            const newStorageRecord = await prisma.fileStorageRecord.create({
                data: {
                    hashA: localHash,
                    service,
                    idInService: remotePath,
                    created: now,
                    size: bytes,
                    raw: {
                        response,
                        filename: fileRecord.filename,
                        repo: recordMeta,
                        revision: fileRecord.revisionId,
                    },
                },
            });
            await prisma.fileStorageRecordOnFileRecord.create({
                data: {
                    fileRecordId: fileRecord.id,
                    fileStorageRecordId: newStorageRecord.id,
                    assignmentTime: now,
                },
            });
        }
    }
    // remove file
    await fs.rm(localPath);
}

interface State {
    service: StorageService
    repos: Array<any>, // Replace with the appropriate type for your repos
    total: number,
    processed: number,
}

export const fileObtainer: JobDescription<ObtainFilesParams, State> = {
    name: "file-obtainer",
    async init(props) {
        const {id, registry, batchSize = 100, favourThreshold = 10_000, service = "BackBlaze_B2"} = props;
        const targetRegistry = getRegistry(registry);
        const repos = await prisma.repository.findMany({
            where: {
                id,
                registry: targetRegistry,
                favour: {
                    gte: favourThreshold,
                },
            },
            orderBy: {
                favour: "desc",
            },
            take: batchSize,
        });
        return {
            repos,
            service,
            total: repos.length,
            processed: 0,
        };
    },
    async iterate(state: State): Promise<boolean> {
        const {repos, processed, service} = state;
        const repo = repos[processed];
        if (!repo) {
            return false;
        }
        const fileRecords = await prisma.fileRecord.findMany({
            where: {
                revision: {
                    repoId: repo.id,
                },
                storageRecords: {
                    none: {},
                },
            },
        });
        console.info(`Obtaining ${repo.name}, found ${fileRecords.length} files to download...`);

        for (const fileRecord of fileRecords) {
            // File if the file is already uploaded
            const existingStorageRecords = await prisma.fileStorageRecord.findMany({
                where: {
                    hashA: fileRecord.hashA,
                },
            });
            if (existingStorageRecords.length >= 1) {
                console.info(`File ${fileRecord.downloadUrl} is already uploaded to ${existingStorageRecords.length} storage records; creating a relation`);
                const time = Date.now();
                for (const storeage of existingStorageRecords) {
                    await prisma.fileStorageRecordOnFileRecord.create({
                        data: {
                            fileRecordId: fileRecord.id,
                            fileStorageRecordId: storeage.id,
                            assignmentTime: time,
                        },
                    });
                }
                continue;
            }
            await fetchFileRecord(fileRecord, service, {
                repo: {
                    id: repo.id,
                    name: repo.name,
                }
            });
            await sleep(1000);
        }
        state.processed += 1;

        if (state.processed > state.total) {
            console.info("Obtain finished.");
            return false;
        }

        return true;
    },
};
