import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

export const blobStorageConfig = {
  accountId: process.env.ACCOUNT_ID || "",
  accessKeyId: process.env.ACCESS_KEY_ID || "",
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
};

if (
  !blobStorageConfig.accountId ||
  !blobStorageConfig.accessKeyId ||
  !blobStorageConfig.secretAccessKey
) {
  throw new Error(
    "Missing Cloudflare R2 credentials. Ensure ACCOUNT_ID, ACCESS_KEY_ID, and SECRET_ACCESS_KEY are set in your environment (.env).",
  );
}

export const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${blobStorageConfig.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: blobStorageConfig.accessKeyId,
    secretAccessKey: blobStorageConfig.secretAccessKey,
  },
});
