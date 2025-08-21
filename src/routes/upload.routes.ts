import { Router } from "express";
import { UploadController } from "../controllers/upload.controller.js";
import { validate } from "../middlewares/validation.js";
import { uploadValidator } from "../validations/uploadValidator.js";
import { verifyAuth } from "../middlewares/verify-auth.js";

const router = Router();

router.post(
  "/presigned-url",
  verifyAuth,
  validate(uploadValidator.messageAttachmentSchema),
  UploadController.getPresignedUrl,
);

router.get("/", UploadController.getFileUrlEndpoint);

export default router;
