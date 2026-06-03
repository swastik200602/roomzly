import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/config/env.js";
import { badRequest } from "@/lib/app-error.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedChatAttachments = new Set([...allowed, "application/pdf"]);

function assertConfigured(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw badRequest("Cloudinary is not configured");
  }
}

function uploadBuffer(file: Express.Multer.File, folder: string, transformation: Record<string, unknown>): Promise<UploadApiResponse> {
  if (!allowed.has(file.mimetype)) throw badRequest("Only jpeg, png, and webp images are allowed");
  if (file.size > 10 * 1024 * 1024) throw badRequest("Image must be 10MB or smaller");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error("Cloudinary returned no result"));
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

function uploadAttachmentBuffer(
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "raw",
  transformation?: Record<string, unknown>
): Promise<UploadApiResponse> {
  if (!allowedChatAttachments.has(file.mimetype)) throw badRequest("Only jpeg, png, webp, and PDF attachments are allowed");
  if (file.size > 5 * 1024 * 1024) throw badRequest("Attachment must be 5MB or smaller");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(transformation ? { transformation } : {})
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error("Cloudinary returned no result"));
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

export const uploadService = {
  async image(userId: string, file: Express.Multer.File, type: "avatar" | "property", propertyId?: string) {
    assertConfigured();
    const folder = type === "avatar" ? `roomzly/avatars/${userId}` : `roomzly/properties/${propertyId ?? "unassigned"}/${Date.now()}`;
    const transformation =
      type === "avatar"
        ? { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto", fetch_format: "webp" }
        : { width: 1200, quality: "auto:good", fetch_format: "webp" };
    const result = await uploadBuffer(file, folder, transformation);
    return { url: result.secure_url, publicId: result.public_id };
  },

  async verificationDocument(userId: string, file: Express.Multer.File) {
    assertConfigured();
    const result = await uploadBuffer(file, `roomzly/verification/${userId}/${Date.now()}`, {
      quality: "auto:good",
      fetch_format: "webp"
    });
    return { url: result.secure_url, publicId: result.public_id };
  },

  signedUrl(publicId: string, resourceType: "image" | "raw" = "image") {
    assertConfigured();
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 10 * 60
    });
  },

  async propertyVerificationDocument(userId: string, propertyId: string, file: Express.Multer.File) {
    assertConfigured();
    const result = await uploadBuffer(file, `roomzly/property-verification/${propertyId}/${userId}/${Date.now()}`, {
      quality: "auto:good",
      fetch_format: "webp"
    });
    return { url: result.secure_url, publicId: result.public_id };
  },

  async images(userId: string, files: Express.Multer.File[], propertyId?: string) {
    if (files.length > 10) throw badRequest("Upload at most 10 images");
    return Promise.all(files.map((file) => this.image(userId, file, "property", propertyId)));
  },

  async chatAttachments(userId: string, threadId: string, files: Express.Multer.File[]) {
    assertConfigured();
    if (files.length > 3) throw badRequest("Attach up to 3 files per message");
    const folder = `roomzly/chat/${threadId}/${userId}/${Date.now()}`;
    return Promise.all(
      files.map(async (file) => {
        const isImage = file.mimetype.startsWith("image/");
        const result = await uploadAttachmentBuffer(
          file,
          folder,
          isImage ? "image" : "raw",
          isImage ? { width: 1600, quality: "auto:good", fetch_format: "webp" } : undefined
        );
        return {
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: isImage ? "image" : "raw",
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        };
      })
    );
  },

  async destroy(publicId: string) {
    assertConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return { deleted: true };
  },

  async destroyResource(publicId: string, resourceType: "image" | "raw") {
    assertConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return { deleted: true };
  }
};
