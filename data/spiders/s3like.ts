import * as fs from "fs";

import { S3Client, PutObjectCommand, S3, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { PutObjectCommandInput } from "@aws-sdk/client-s3/dist-types/commands/PutObjectCommand";
import { Upload } from "@aws-sdk/lib-storage";


interface UploadParams {
    endpoint: string,
    region: string,
    bucketName: string;
    localPath: string;
    remotePath: string;
    accessKeyId: string;
    secretAccessKey: string;

    multipart?: boolean
}

export async function uploadFileToS3Like(params: UploadParams) {
    const {endpoint, region, bucketName, localPath, remotePath, accessKeyId, secretAccessKey, multipart} = params;

    const s3 = new S3Client({
        endpoint,
        region,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    const fileStream = fs.createReadStream(localPath);

    const uploadParams: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: remotePath,
        Body: fileStream,
    };

    if (multipart) {
        const multipartUpload = new Upload({
            client: s3,
            params: uploadParams,
            partSize: 100 * 1024 * 1024,
            queueSize: 4,
            leavePartsOnError: false,
        });
        // multipartUpload.on("httpUploadProgress", (progress) => {
        //     console.log(`Upload part: ${progress.part}`);
        // });

        try {
            return multipartUpload.done();
        } catch (error) {
            return null;
        }
    }
    else {
        const command = new PutObjectCommand(uploadParams);

        try {
            return s3.send(command);
        } catch (err) {
            return null;
        }
    }

}

export type ServiceUplaodParams = Pick<UploadParams, "localPath" | "remotePath" | "multipart">;

export async function uploadToB2(params: ServiceUplaodParams) {
    const {localPath, remotePath, multipart} = params;
    return uploadFileToS3Like({
        endpoint: process.env["B2_ENDPOINT"] || "",
        region: process.env["B2_REGION"] || "",
        bucketName: process.env["AI_BLOBS_BUCKET"] || "",
        localPath,
        remotePath,
        multipart,
        accessKeyId: process.env["B2_KEY_ID"] || "",
        secretAccessKey: process.env["B2_KEY"] || "",
    });

}// Example usage
