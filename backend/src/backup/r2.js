/**
 * Cliente S3-compatible para Cloudflare R2.
 */

const fs = require('fs');
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { safeErrorMessage } = require('./redact');

function createR2Client(r2Config) {
  return new S3Client({
    region: r2Config.region || 'auto',
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

async function uploadFile({ client, bucket, key, filePath, contentType }) {
  const body = fs.createReadStream(filePath);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      }),
    );
  } catch (err) {
    const e = new Error(safeErrorMessage(err));
    e.code = 'BACKUP_R2_UPLOAD_FAILED';
    throw e;
  }
}

async function uploadJson({ client, bucket, key, object }) {
  const body = Buffer.from(JSON.stringify(object, null, 2), 'utf8');
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'application/json',
      }),
    );
  } catch (err) {
    const e = new Error(safeErrorMessage(err));
    e.code = 'BACKUP_R2_UPLOAD_FAILED';
    throw e;
  }
}

async function headObject({ client, bucket, key }) {
  try {
    const out = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return {
      exists: true,
      contentLength: Number(out.ContentLength || 0),
      etag: out.ETag || null,
    };
  } catch (err) {
    if (err && (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404)) {
      return { exists: false, contentLength: 0, etag: null };
    }
    const e = new Error(safeErrorMessage(err));
    e.code = 'BACKUP_R2_VERIFY_FAILED';
    throw e;
  }
}

async function listDumpObjects({ client, bucket, prefix = 'postgresql/daily/' }) {
  const keys = [];
  let continuationToken;
  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const item of out.Contents || []) {
      if (item.Key && item.Key.endsWith('.dump')) {
        keys.push({
          key: item.Key,
          size: Number(item.Size || 0),
          lastModified: item.LastModified || null,
        });
      }
    }
    continuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function deleteObject({ client, bucket, key }) {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

module.exports = {
  createR2Client,
  uploadFile,
  uploadJson,
  headObject,
  listDumpObjects,
  deleteObject,
};
