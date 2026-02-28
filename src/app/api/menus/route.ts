import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const includeInactive = request.nextUrl.searchParams.get("includeInactive");

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = Number(categoryId);
  if (!includeInactive) where.isActive = true;

  const menus = await prisma.menu.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: {
      category: true,
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return NextResponse.json(menus);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const price = Number(formData.get("price"));
    const categoryId = Number(formData.get("categoryId"));
    const sortOrder = Number(formData.get("sortOrder") || "0");
    const image = formData.get("image") as File | null;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "필수 필드가 누락되었습니다" } },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
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
      const fileName = `menu-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await image.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      imageUrl = `/uploads/${fileName}`;
    }

    const menu = await prisma.menu.create({
      data: { name, description, price, categoryId, sortOrder, imageUrl },
      include: {
        optionGroups: {
          include: { options: true },
        },
      },
    });
    return NextResponse.json(menu, { status: 201 });
  }

  const body = await request.json();
  const { name, description, price, categoryId, sortOrder, imageUrl } = body;
  if (!name || !price || !categoryId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "필수 필드가 누락되었습니다" } },
      { status: 400 }
    );
  }
  const menu = await prisma.menu.create({
    data: {
      name,
      description: description || "",
      price,
      categoryId,
      sortOrder: sortOrder ?? 0,
      imageUrl: imageUrl || null,
    },
    include: {
      optionGroups: {
        include: { options: true },
      },
    },
  });
  return NextResponse.json(menu, { status: 201 });
}
