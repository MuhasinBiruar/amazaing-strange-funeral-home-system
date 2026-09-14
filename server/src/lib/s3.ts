import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * S3-compatible client for Supabase Storage.
 *
 * @remarks
 * This must stay server-only: `S3_SECRET_ACCESS_KEY` can never reach the
 * browser. The bucket itself is public, so *viewing* an uploaded file needs
 * no credentials — {@link publicDocumentUrl} just builds a plain URL — only
 * *writing* to it does.
 */

const region = process.env.S3_REGION;
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET;
const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

if (
  !region ||
  !endpoint ||
  !accessKeyId ||
  !secretAccessKey ||
  !bucket ||
  !publicBaseUrl
) {
  throw new Error(
    'Missing one or more S3 environment variables: S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_PUBLIC_BASE_URL',
  );
}

export const S3_BUCKET = bucket;

const s3Client = new S3Client({
  forcePathStyle: true,
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

/** Uploads a file's bytes to the documents bucket under the given key. */
export async function uploadDocumentFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Builds the public URL for an object key in the (public) documents bucket. */
export function publicDocumentUrl(key: string): string {
  return `${publicBaseUrl}/${S3_BUCKET}/${key}`;
}
