import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

/** İstemciye olduğu gibi gösterilebilecek doğrulama hatası (dosya tipi/boyutu). */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

function client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2 yapılandırılmamış (R2_ACCOUNT_ID boş)");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "" },
  });
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createPresignedUpload(kind: "barber" | "haircut", contentType: string, contentLength: number): Promise<{ url: string; key: string }> {
  if (!ALLOWED.has(contentType)) throw new UploadValidationError("Sadece JPEG, PNG veya WebP yüklenebilir");
  if (!Number.isInteger(contentLength) || contentLength <= 0) throw new UploadValidationError("Dosya boyutu okunamadı");
  if (contentLength > MAX_UPLOAD_BYTES) throw new UploadValidationError("Dosya en fazla 8 MB olabilir");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `${kind}s/${randomUUID()}.${ext}`;
  // ContentLength imzaya dahil: yüklenen dosya bildirilen boyuttan büyük olamaz.
  const cmd = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType, ContentLength: contentLength });
  const url = await getSignedUrl(client(), cmd, { expiresIn: 300 });
  return { url, key };
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  } catch (e) {
    console.error("[storage:delete]", key, e);
  }
}
