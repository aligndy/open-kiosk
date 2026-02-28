import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  let settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.storeSettings.create({ data: {} });
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const data: Record<string, unknown> = {};

    const storeName = formData.get("storeName") as string | null;
    if (storeName !== null) data.storeName = storeName;
    const storeDescription = formData.get("storeDescription") as string | null;
    if (storeDescription !== null) data.storeDescription = storeDescription;
    const supportedLanguages = formData.get("supportedLanguages") as string | null;
    if (supportedLanguages !== null) data.supportedLanguages = supportedLanguages;

    const logo = formData.get("logo") as File | null;
    if (logo && logo.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (logo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "파일 크기는 5MB 이하여야 합니다" } },
          { status: 400 }
        );
      }
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!ALLOWED_TYPES.includes(logo.type)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "이미지 파일만 업로드 가능합니다" } },
          { status: 400 }
        );
      }
      const ext = logo.name.split(".").pop() || "png";
      const fileName = `logo-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await logo.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      data.logoUrl = `/uploads/${fileName}`;
    }

    const clearLogo = formData.get("clearLogo");
    if (clearLogo === "true") {
      data.logoUrl = null;
    }

    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { ...data, id: 1 },
    });
    return NextResponse.json(settings);
  }

  const body = await request.json();
  const settings = await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: body,
    create: { ...body, id: 1 },
  });
  return NextResponse.json(settings);
}
