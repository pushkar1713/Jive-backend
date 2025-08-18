import { Request, Response } from "express";
import { MessageAttachment } from "../validations/uploadValidator.js";
import { S3 } from "../config/blobStorageConfig.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { toJSONSchema } from "zod";

export class UploadController {
  static async getPresignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, contentType, size } = req.body as MessageAttachment;
      if (!fileName || !contentType || !size) {
        res.status(400).json({ error: "Invalid request body" });
        return;
      }

      const allowed = new Set(["image/jpeg", "image/png", "application/pdf"]);
      if (!allowed.has(contentType)) {
        res.status(415).json({ error: "Unsupported content type" });
        return;
      }

      const ext = fileName.includes(".") ? "." + fileName.split(".").pop() : "";
      const date = new Date().toISOString().slice(0, 10);
      const key = `uploads/${date}/${crypto.randomUUID()}${ext}`;

      const putObj = new PutObjectCommand({
        Bucket: "jive",
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(S3, putObj, {
        expiresIn: 60 * 5,
      });

      res.status(200).json({
        presignedUrl,
        key,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  static async getFileUrlEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ error: "Key is required" });
        return;
      }

      const getObj = new GetObjectCommand({
        Bucket: "jive",
        Key: key,
      });

      const url = await getSignedUrl(S3, getObj, { expiresIn: 60 * 5 });
      res.status(200).json({ url });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  static async getFileUrl(key: string) {
    try {
      if (!key) {
        throw new Error("Key is required");
      }

      const getObj = new GetObjectCommand({
        Bucket: "jive",
        Key: key,
      });

      const url = await getSignedUrl(S3, getObj, { expiresIn: 60 * 5 });
      return url;
    } catch (error) {
      console.error(error);
      throw new Error("Internal server error");
    }
  }
}
