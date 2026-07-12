"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActionResponse } from "./auth";
import fs from "fs";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
];
const ALLOWED_EXTS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".xlsx"];

export async function getAssetDocuments(assetId: string) {
  try {
    const session = await auth();
    if (!session) return [];

    const docs = await db.assetDocument.findMany({
      where: { assetId },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return JSON.parse(JSON.stringify(docs));
  } catch (error) {
    console.error("Failed to fetch asset documents:", error);
    return [];
  }
}

export async function uploadAssetDocument(formData: FormData): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const assetId = formData.get("assetId") as string;
    const documentType = formData.get("documentType") as string;
    const file = formData.get("file") as File;

    if (!assetId || !documentType || !file) {
      return { success: false, message: "Missing required upload parameters." };
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return { success: false, message: "File size exceeds the 10MB limit." };
    }

    // Validate extension / mime type
    const ext = path.extname(file.name).toLowerCase();
    const mime = file.type;

    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIMES.includes(mime)) {
      return { 
        success: false, 
        message: "Unsupported file format. Only PDF, DOCX, XLSX and Images are supported." 
      };
    }

    // Project storage solution: save to public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${cleanFileName}`;
    const destinationPath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(destinationPath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    // Create database metadata record
    const document = await db.assetDocument.create({
      data: {
        assetId,
        fileName: file.name,
        documentType,
        fileMime: mime || ext,
        filePath: fileUrl,
        fileSize: file.size,
        uploadedById: session.user.id,
      },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPLOAD_DOCUMENT",
        entityType: "AssetDocument",
        entityId: document.id,
        newValues: {
          id: document.id,
          fileName: document.fileName,
          documentType: document.documentType,
          assetId: document.assetId,
          filePath: document.filePath,
        },
      },
    });

    // Trigger notification if required
    await db.notification.create({
      data: {
        userId: session.user.id,
        title: "Document Uploaded",
        message: `New document "${document.fileName}" (${document.documentType}) has been uploaded to the asset.`,
        type: "DOCUMENT_UPLOADED",
      },
    });

    return { 
      success: true, 
      message: "Document uploaded successfully.", 
      data: JSON.parse(JSON.stringify(document)) 
    };
  } catch (error) {
    console.error("Document upload action failed:", error);
    return { success: false, message: "Failed to upload document." };
  }
}

export async function replaceAssetDocument(documentId: string, formData: FormData): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const doc = await db.assetDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return { success: false, message: "Document not found." };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "No replacement file was provided." };
    }

    // Validate size and type
    if (file.size > MAX_SIZE) {
      return { success: false, message: "Replacement file exceeds the 10MB limit." };
    }

    const ext = path.extname(file.name).toLowerCase();
    const mime = file.type;

    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIMES.includes(mime)) {
      return { 
        success: false, 
        message: "Unsupported file format. Only PDF, DOCX, XLSX and Images are supported." 
      };
    }

    // Delete old physical file from disk
    const oldPath = path.join(process.cwd(), "public", doc.filePath);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    // Save new file to disk
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${cleanFileName}`;
    const destinationPath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(destinationPath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    // Update database record
    const updated = await db.assetDocument.update({
      where: { id: documentId },
      data: {
        fileName: file.name,
        fileMime: mime || ext,
        filePath: fileUrl,
        fileSize: file.size,
        uploadedById: session.user.id,
      },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPLOAD_DOCUMENT", // log as an upload replacement
        entityType: "AssetDocument",
        entityId: documentId,
        previousValues: {
          fileName: doc.fileName,
          filePath: doc.filePath,
        },
        newValues: {
          fileName: updated.fileName,
          filePath: updated.filePath,
        },
      },
    });

    return { 
      success: true, 
      message: "Document replaced successfully.", 
      data: JSON.parse(JSON.stringify(updated)) 
    };
  } catch (error) {
    console.error("Document replacement action failed:", error);
    return { success: false, message: "Failed to replace document." };
  }
}

export async function deleteAssetDocument(documentId: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const doc = await db.assetDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return { success: false, message: "Document not found." };
    }

    // Remove physical file from local disk
    const filePath = path.join(process.cwd(), "public", doc.filePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("Failed to delete physical file from disk path:", filePath, err);
      }
    }

    // Delete record from database
    await db.assetDocument.delete({
      where: { id: documentId },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_DOCUMENT",
        entityType: "AssetDocument",
        entityId: documentId,
        previousValues: {
          id: doc.id,
          fileName: doc.fileName,
          documentType: doc.documentType,
          assetId: doc.assetId,
        },
      },
    });

    return { success: true, message: "Document deleted successfully." };
  } catch (error) {
    console.error("Document deletion action failed:", error);
    return { success: false, message: "Failed to delete document." };
  }
}

export async function logDocumentDownload(documentId: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized." };

    const doc = await db.assetDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) return { success: false, message: "Document not found." };

    // Write Download Activity Log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DOWNLOAD_DOCUMENT",
        entityType: "AssetDocument",
        entityId: documentId,
        previousValues: {
          id: doc.id,
          fileName: doc.fileName,
          assetId: doc.assetId,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to log document download:", error);
    return { success: false };
  }
}
