import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";

import { createResource } from "@/lib/actions/resources";

import PDFParse from "pdf-parse"


const FileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 100 * 1024 * 1024, {
      message: "File size should be less than 100MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
      {
        message: "File type should be JPEG, PNG, or PDF",
      },
    ),
});

//export async function POST(request: Request) {
//  const session = await auth();
//
//  if (!session) {
//    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//  }
//
//  if (request.body === null) {
//    return new Response("Request body is empty", { status: 400 });
//  }
//
//  try {
//    const formData = await request.formData();
//    const file = formData.get("file") as File;
//
//    if (!file) {
//      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//    }
//
//    const validatedFile = FileSchema.safeParse({ file });
//
//    if (!validatedFile.success) {
//      const errorMessage = validatedFile.error.errors
//        .map((error) => error.message)
//        .join(", ");
//
//      return NextResponse.json({ error: errorMessage }, { status: 400 });
//    }
//
//    const filename = file.name;
//    const fileBuffer = await file.arrayBuffer();
//
//    try {
//      const data = await put(`${filename}`, fileBuffer, {
//        access: "public",
//      });
//
//      return NextResponse.json(data);
//    } catch (error) {
//      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
//    }
//  } catch (error) {
//    return NextResponse.json(
//      { error: "Failed to process request" },
//      { status: 500 },
//    );
//  }
//
//}

export async function POST(request: Request) {
  const session = await auth();
  console.log(session);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    console.log(file);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const pdf = await PDFParse(fileBuffer);

    console.log(pdf.text);

    try {
      const data = await createResource({ content: pdf.text, name: filename });
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
//
