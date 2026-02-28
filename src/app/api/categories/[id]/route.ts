import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const sortOrder = Number(formData.get("sortOrder") || "0");
    const image = formData.get("referenceImage") as File | null;

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    data.sortOrder = sortOrder;

    if (image && image.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "파일 크기는 5MB 이하여야 합니다" } },
          { status: 400 }
        );
      }
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "이미지 파일만 업로드 가능합니다" } },
          { status: 400 }
        );
      }
      const ext = image.name.split(".").pop() || "png";
      const fileName = `category-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await image.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      data.referenceImageUrl = `/uploads/${fileName}`;
    }

    // Allow clearing the reference image
    const clearImage = formData.get("clearReferenceImage");
    if (clearImage === "true") {
      data.referenceImageUrl = null;
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(category);
  }

  const body = await request.json();
  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.category.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
