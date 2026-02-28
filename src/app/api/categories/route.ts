import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      menus: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          optionGroups: {
            orderBy: { sortOrder: "asc" },
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const sortOrder = Number(formData.get("sortOrder") || "0");
    const image = formData.get("referenceImage") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "이름은 필수입니다" } },
        { status: 400 }
      );
    }

    let referenceImageUrl: string | null = null;
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
      referenceImageUrl = `/uploads/${fileName}`;
    }

    const category = await prisma.category.create({
      data: { name, sortOrder, referenceImageUrl },
    });
    return NextResponse.json(category, { status: 201 });
  }

  const body = await request.json();
  const { name, sortOrder } = body;
  if (!name) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "이름은 필수입니다" } },
      { status: 400 }
    );
  }
  const category = await prisma.category.create({
    data: { name, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(category, { status: 201 });
}
