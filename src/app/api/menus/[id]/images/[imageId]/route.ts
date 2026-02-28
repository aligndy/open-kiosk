import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;
  const menuId = Number(id);

  const image = await prisma.menuImage.findUnique({
    where: { id: Number(imageId) },
  });
  if (!image || image.menuId !== menuId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "이미지를 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  await prisma.menu.update({
    where: { id: menuId },
    data: { imageUrl: image.imageUrl },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;
  const menuId = Number(id);

  const image = await prisma.menuImage.findUnique({
    where: { id: Number(imageId) },
  });
  if (!image || image.menuId !== menuId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "이미지를 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  // Only delete file if no other menu or menuImage references it
  const otherMenuRefs = await prisma.menu.count({
    where: { imageUrl: image.imageUrl, id: { not: menuId } },
  });
  const otherImageRefs = await prisma.menuImage.count({
    where: { imageUrl: image.imageUrl, id: { not: Number(imageId) } },
  });
  if (otherMenuRefs === 0 && otherImageRefs === 0) {
    try {
      const filePath = path.join(process.cwd(), "public", image.imageUrl);
      await unlink(filePath);
    } catch {
      // File may not exist, continue
    }
  }

  // Delete DB record
  await prisma.menuImage.delete({ where: { id: Number(imageId) } });

  // If deleted image was the selected one, set to null
  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (menu?.imageUrl === image.imageUrl) {
    await prisma.menu.update({
      where: { id: menuId },
      data: { imageUrl: null },
    });
  }

  return NextResponse.json({ success: true });
}
