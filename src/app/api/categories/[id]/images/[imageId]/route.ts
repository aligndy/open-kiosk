import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;
  const categoryId = Number(id);

  const image = await prisma.categoryImage.findUnique({
    where: { id: Number(imageId) },
  });
  if (!image || image.categoryId !== categoryId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "이미지를 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { referenceImageUrl: image.imageUrl },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;
  const categoryId = Number(id);

  const image = await prisma.categoryImage.findUnique({
    where: { id: Number(imageId) },
  });
  if (!image || image.categoryId !== categoryId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "이미지를 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", image.imageUrl);
    await unlink(filePath);
  } catch {
    // File may not exist, continue
  }

  // Delete DB record
  await prisma.categoryImage.delete({ where: { id: Number(imageId) } });

  // If deleted image was the selected one, set to null
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (category?.referenceImageUrl === image.imageUrl) {
    await prisma.category.update({
      where: { id: categoryId },
      data: { referenceImageUrl: null },
    });
  }

  return NextResponse.json({ success: true });
}
