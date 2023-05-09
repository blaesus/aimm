import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import { PutObjectCommandInput } from "@aws-sdk/client-s3/dist-types/commands/PutObjectCommand";

interface UploadParams {
    endpoint: string,
    region: string,
    bucketName: string;
    localPath: string;
    remotePath: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export async function uploadFileToS3Like(params: UploadParams) {
    const {endpoint, region, bucketName, localPath, remotePath, accessKeyId, secretAccessKey} = params;

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
        Key: encodeURIComponent(remotePath),
        Body: fileStream,
    };

    const command = new PutObjectCommand(uploadParams);

    try {
        return s3.send(command);
    } catch (err) {
        return null;
    }
}

export type ServiceUplaodParams = Pick<UploadParams, "localPath" | "remotePath">;

export async function uploadToB2(params: ServiceUplaodParams) {
    const {localPath, remotePath} = params;
    return uploadFileToS3Like({
        endpoint: process.env["B2_ENDPOINT"] || "",
        region: process.env["B2_REGION"] || "",
        bucketName: process.env["AI_BLOBS_BUCKET"] || "",
        localPath,
        remotePath,
        accessKeyId: process.env["B2_KEY_ID"] || "",
        secretAccessKey: process.env["B2_KEY"] || "",
    });

}// Example usage
