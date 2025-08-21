import { Request, Response } from "express";
import { MessageAttachment } from "../validations/uploadValidator.js";
import { S3 } from "../config/blobStorageConfig.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { BaseError, ErrorFactory } from "../error.js";
import { globalErrorHandler } from "../globalErrorHandler.js";
import { apiResponse } from "../globalResponseHandler.js";

export class UploadController {
  static async getPresignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, contentType, size } = req.body as MessageAttachment;
      if (!fileName || !contentType || !size) {
        throw ErrorFactory.badRequest("Invalid request body");
      }

      const allowed = new Set(["image/jpeg", "image/png", "application/pdf"]);
      if (!allowed.has(contentType)) {
        throw ErrorFactory.badRequest("Unsupported content type");
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

      apiResponse(res, {
        statusCode: 200,
        message: "Presigned URL generated successfully",
        data: { presignedUrl, key },
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getFileUrlEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const key = req.query.key as string;
      if (!key) {
        throw ErrorFactory.badRequest("Key is required");
      }

      const getObj = new GetObjectCommand({
        Bucket: "jive",
        Key: key,
      });

      const url = await getSignedUrl(S3, getObj, { expiresIn: 60 * 5 });
      apiResponse(res, {
        statusCode: 200,
        message: "File URL generated successfully",
        data: { url },
      });
      return;
    } catch (error) {
      globalErrorHandler(error as BaseError, req, res);
    }
  }

  static async getFileUrl(key: string) {
    try {
      if (!key) {
        throw ErrorFactory.badRequest("Key is required");
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
