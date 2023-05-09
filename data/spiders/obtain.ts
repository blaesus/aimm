import { prisma } from "../prismaClient";
import { hashLocalFile, makeRequester, sleep } from "./utils";
import { promises as fs } from "fs";
import { ServiceUplaodParams, uploadToB2 } from "./s3like";
import { StorageService } from "@prisma/client";

export interface ObtainFilesProps {
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

export async function obtainFiles(props: ObtainFilesProps = {}) {
    const {service = "BackBlaze_B2", batchSize = 100, favourThreshold = 1000} = props;
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
                    none: {}
                }
            }
        })
        console.info(`Found ${fileRecords.length} files for ${repo.name}...`)

        for (const file of fileRecords) {
            // download file
            const requester = makeRequester({
                root: (new URL(file.downloadUrl)).host,
            });
            const localPath = `/tmp/${Math.random().toString()}`;
            console.info(`Saving ${file.downloadUrl} to ${localPath}...`);
            const bytes = await requester.downloadToLocal({
                remotePath: file.downloadUrl,
                localPath,
            });
            if (!bytes) {
                console.info(`Failed to download file ${file.downloadUrl}`);
                continue;
            }
            console.info(`Get ${bytes} bytes`);
            // verify sha256
            const localHash = await hashLocalFile(localPath);
            if (localHash !== file.hashA) {
                console.info(`Hash mismatch for ${file.downloadUrl}: ${localHash}, expecting ${file.hashA}`);
            }
            else {
                // Upload to Backblaze
                const remotePath = `${file.hashA}-${file.filename}`;
                const upload = uploaders[service];
                const response = await upload({
                    localPath,
                    remotePath,
                });
                if (response) {
                    console.info(`Uploaded ${file.downloadUrl} to ${remotePath} on ${service}}`);
                }
            }
            // remove file
            await fs.rm(localPath);
            await sleep(1000);
        }
    }
}
