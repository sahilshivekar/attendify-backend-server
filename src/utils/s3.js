import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand
} from '@aws-sdk/client-s3';
import {
    getSignedUrl
} from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import {
    ApiError
} from './ApiError.js';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

const getContentType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.heic': 'image/heic',
        '.heif': 'image/heif'
    };
    return contentTypeMap[ext] || 'application/octet-stream';
};

export const uploadToS3 = async (localFilePath, s3Key) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const contentType = getContentType(s3Key);

        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType
        };

        await s3Client.send(new PutObjectCommand(params), {
            abortSignal: AbortSignal.timeout(60000)
        });

        const presignedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
        }), {
            expiresIn: 3600
        });

        return {
            key: s3Key,
            presignedUrl
        };
    } catch (error) {
        throw new ApiError(500, `Failed to upload file to S3: ${error.message}`);
    }
};

export const deleteFromS3 = async (s3Key) => {
    try {
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key
        };

        await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        throw new ApiError(500, `Failed to delete file from S3: ${error.message}`);
    }
};

export const deleteMultipleFromS3 = async (s3Keys) => {
    if (!s3Keys || s3Keys.length === 0) {
        return;
    }

    try {
        const params = {
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: s3Keys.map((key) => ({
                    Key: key
                }))
            }
        };

        await s3Client.send(new DeleteObjectsCommand(params), {
            abortSignal: AbortSignal.timeout(15000)
        });
    } catch (error) {
        throw new ApiError(500, `Failed to delete multiple files from S3: ${error.message}`);
    }
};

export const getStudentPresignedUrls = async (s3Keys) => {
    try {
        const presignedUrls = await Promise.all(
            s3Keys.map(async (key) => {
                const params = {
                    Bucket: BUCKET_NAME,
                    Key: key
                };
                const url = await getSignedUrl(s3Client, new GetObjectCommand(params), {
                    expiresIn: 3600
                });
                return {
                    key,
                    url
                };
            })
        );

        return presignedUrls;
    } catch (error) {
        throw new ApiError(500, `Failed to generate presigned URLs: ${error.message}`);
    }
};
