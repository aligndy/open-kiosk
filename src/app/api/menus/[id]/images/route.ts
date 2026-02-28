import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const images = await prisma.menuImage.findMany({
    where: { menuId: Number(id) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(images);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const menuId = Number(id);
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "multipart/form-data 형식이 필요합니다" } },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "파일이 필요합니다" } },
      { status: 400 }
    );
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "파일 크기는 5MB 이하여야 합니다" } },
      { status: 400 }
    );
  }
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "이미지 파일만 업로드 가능합니다" } },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `menu-${menuId}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);
  const imageUrl = `/uploads/${fileName}`;

  const menuImage = await prisma.menuImage.create({
    data: { menuId, imageUrl },
  });

  // Auto-update menu imageUrl
  await prisma.menu.update({
    where: { id: menuId },
    data: { imageUrl },
  });

  return NextResponse.json(menuImage, { status: 201 });
}
