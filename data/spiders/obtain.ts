import { prisma } from "../prismaClient";
import { hashLocalFile, makeRequester, sleep } from "./utils";
import { promises as fs } from "fs";
import { ServiceUplaodParams, uploadToB2 } from "./s3like";
import { StorageService } from "@prisma/client";

export interface ObtainFilesParams {
    service?: StorageService,
    batchSize?: number;
    // Minimal favour for a repo to be obtained
    favourThreshold?: number;
}

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

export async function obtainFiles(props: ObtainFilesParams = {}) {
    console.info("Obtain files loaded with params", props);
    const {service = "BackBlaze_B2", batchSize = 100, favourThreshold = 10_000} = props;
    const repos = await prisma.repository.findMany({
        where: {
            favour: {
                gt: favourThreshold,
            },
        },
        orderBy: {
            favour: "desc",
        },
        take: batchSize,
    });
    for (const repo of repos) {
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
        console.info(`Found undownloaded ${fileRecords.length} files for ${repo.name}...`);

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

            // download file
            const requester = makeRequester({
                root: (new URL(fileRecord.downloadUrl)).host,
            });
            const localPath = `/tmp/temp-aimm-blob-${Date.now()}`;
            console.info(`Saving ${fileRecord.downloadUrl} to ${localPath}...`);
            const bytes = await requester.downloadToLocal({
                remotePath: fileRecord.downloadUrl,
                localPath,
            });
            if (!bytes) {
                console.info(`Failed to download file ${fileRecord.downloadUrl}`);
                continue;
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
                const response = await upload({
                    localPath,
                    remotePath,
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
                                repo: {
                                    id: repo.id,
                                    name: repo.name,
                                },
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
            await sleep(1000);
        }
    }
}
