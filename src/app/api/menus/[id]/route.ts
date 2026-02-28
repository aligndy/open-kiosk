import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const menu = await prisma.menu.findUnique({
    where: { id: Number(id) },
    include: {
      category: true,
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!menu) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "메뉴를 찾을 수 없습니다" } },
      { status: 404 }
    );
  }
  return NextResponse.json(menu);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const menuId = Number(id);
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const data: Record<string, unknown> = {};

    const name = formData.get("name") as string | null;
    if (name) data.name = name;
    const description = formData.get("description") as string | null;
    if (description !== null) data.description = description;
    const price = formData.get("price") as string | null;
    if (price) data.price = Number(price);
    const categoryId = formData.get("categoryId") as string | null;
    if (categoryId) data.categoryId = Number(categoryId);
    const sortOrder = formData.get("sortOrder") as string | null;
    if (sortOrder !== null) data.sortOrder = Number(sortOrder);
    const isActive = formData.get("isActive") as string | null;
    if (isActive !== null) data.isActive = isActive === "true";

    const image = formData.get("image") as File | null;
    if (image && image.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "파일 크기는 5MB 이하여야 합니다" } },
          { status: 400 }
        );
      }
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP)" } },
          { status: 400 }
        );
      }
      const ext = image.name.split(".").pop() || "png";
      const fileName = `menu-${menuId}-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await image.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      data.imageUrl = `/uploads/${fileName}`;
    }

    const menu = await prisma.menu.update({
      where: { id: menuId },
      data,
      include: {
        optionGroups: { include: { options: true } },
      },
    });
    return NextResponse.json(menu);
  }

  const body = await request.json();
  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: body,
    include: {
      optionGroups: { include: { options: true } },
    },
  });
  return NextResponse.json(menu);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.menu.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
