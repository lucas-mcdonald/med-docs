import { z } from "zod";
import { createResource } from "../actions/resources";
import PDFParse from "pdf-parse";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

// Define allowed file types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_FILE_SIZE, "File size should be less than 100MB"),
  mimeType: z.string().refine(
    (type) => ALLOWED_MIME_TYPES.includes(type),
    {
      message: "File type should be JPEG, PNG, or PDF",
    }
  ),
});

type FileValidation = z.infer<typeof FileSchema>;

async function extractContent(filePath: string, mimeType: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  
  if (mimeType === "application/pdf") {
    const pdf = await PDFParse(fileBuffer);
    return pdf.text;
  } else if (mimeType.startsWith("image/")) {
    // For images, we'll just return the filename as content
    // You might want to implement OCR or other image processing here
    return `Image file: ${path.basename(filePath)}`;
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function handleUploadedFile(filePath: string) {
  try {
    // Validate file exists and is accessible
    if (!filePath) {
      throw new Error("File path is required");
    }

    const absolutePath = path.resolve(filePath);
    const fileStats = await fs.stat(absolutePath).catch(() => {
      throw new Error(`File not found or inaccessible: ${filePath}`);
    });

    const filename = path.basename(absolutePath);
    const mimeType = mime.lookup(absolutePath) || "";

    // Validate file metadata
    const fileValidation: FileValidation = {
      name: filename,
      size: fileStats.size,
      mimeType,
    };

    const validatedFile = FileSchema.safeParse(fileValidation);

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");
      throw new Error(errorMessage);
    }

    // Extract content based on file type
    const content = await extractContent(absolutePath, mimeType);

    // Call server action
    const data = await createResource({ 
      content, 
      name: filename 
    });
    
    console.log("Resource created:", data);
    return data;
  } catch (error) {
    console.error("Failed to handle uploaded file:", error);
    throw error;
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Please provide a file path as an argument");
    process.exit(1);
  }

  console.log('Processing file:', filePath);
  await handleUploadedFile(filePath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

