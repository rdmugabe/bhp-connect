import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Lazy initialization to ensure environment variables are loaded
let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";

    s3ClientInstance = new S3Client({
      region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-2",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

function getBucketName(): string {
  return process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "bhp-connect-documents";
}

interface UploadParams {
  key: string;
  body: Buffer;
  contentType: string;
}

export async function uploadToS3({
  key,
  body,
  contentType,
}: UploadParams): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });

  await getS3Client().send(command);

  return key;
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  await getS3Client().send(command);
}

export async function getFileFromS3(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  const response = await getS3Client().send(command);
  const bodyContents = await response.Body?.transformToByteArray();

  if (!bodyContents) {
    throw new Error("Failed to get file contents from S3");
  }

  return {
    buffer: Buffer.from(bodyContents),
    contentType: response.ContentType || "application/octet-stream",
  };
}

export function generateFileKey(
  facilityIdOrType: string,
  typeOrUserId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${typeOrUserId}/${facilityIdOrType}/${timestamp}-${sanitizedFilename}`;
}

// Aliases for backwards compatibility
export const uploadFile = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  return uploadToS3({ key, body: buffer, contentType });
};

export const deleteFile = deleteFromS3;
