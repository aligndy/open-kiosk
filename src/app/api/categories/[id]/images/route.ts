import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMenuImage } from "@/lib/gemini";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { cropToSquare } from "@/lib/image";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const images = await prisma.categoryImage.findMany({
    where: { categoryId: Number(id) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(images);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categoryId = Number(id);
  const contentType = request.headers.get("content-type") || "";

  let imageUrl: string;
  let usedPrompt: string | null = null;
  let isAiGenerated = false;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string | null;
    const file = formData.get("file") as File | null;

    if (prompt) {
      // AI generation
      usedPrompt = prompt;
      isAiGenerated = true;
      let referenceImageBase64: string | undefined;
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (category?.referenceImageUrl) {
        const { readFile } = await import("fs/promises");
        const filePath = path.join(process.cwd(), "public", category.referenceImageUrl);
        try {
          const fileBuffer = await readFile(filePath);
          referenceImageBase64 = fileBuffer.toString("base64");
        } catch {
          // Reference file not found, continue without it
        }
      }

      const rawBuffer = await generateMenuImage(prompt, {
        transparentBg: true,
        referenceImageBase64,
      });
      const imageBuffer = await cropToSquare(rawBuffer);
      const fileName = `category-${categoryId}-${Date.now()}.png`;
      const generatedDir = path.join(process.cwd(), "public", "generated");
      await mkdir(generatedDir, { recursive: true });
      await writeFile(path.join(generatedDir, fileName), imageBuffer);
      imageUrl = `/generated/${fileName}`;
    } else if (file && file.size > 0) {
      // File upload
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
      const fileName = `category-${categoryId}-${Date.now()}.png`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const raw = Buffer.from(await file.arrayBuffer());
      const buffer = await cropToSquare(raw);
      await writeFile(path.join(uploadDir, fileName), buffer);
      imageUrl = `/uploads/${fileName}`;
    } else {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "프롬프트 또는 파일이 필요합니다" } },
        { status: 400 }
      );
    }
  } else {
    // JSON body with prompt
    const body = await request.json();
    const { prompt } = body;
    usedPrompt = prompt || null;
    isAiGenerated = true;
    if (!prompt) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "프롬프트가 필요합니다" } },
        { status: 400 }
      );
    }

    let referenceImageBase64: string | undefined;
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (category?.referenceImageUrl) {
      const { readFile } = await import("fs/promises");
      const filePath = path.join(process.cwd(), "public", category.referenceImageUrl);
      try {
        const fileBuffer = await readFile(filePath);
        referenceImageBase64 = fileBuffer.toString("base64");
      } catch {
        // Reference file not found, continue without it
      }
    }

    const rawBuffer = await generateMenuImage(prompt, {
      transparentBg: true,
      referenceImageBase64,
    });
    const imageBuffer = await cropToSquare(rawBuffer);
    const fileName = `category-${categoryId}-${Date.now()}.png`;
    const generatedDir = path.join(process.cwd(), "public", "generated");
    await mkdir(generatedDir, { recursive: true });
    await writeFile(path.join(generatedDir, fileName), imageBuffer);
    imageUrl = `/generated/${fileName}`;
  }

  // Create CategoryImage record
  const categoryImage = await prisma.categoryImage.create({
    data: {
      categoryId,
      imageUrl,
      prompt: usedPrompt,
      isAiGenerated,
    },
  });

  // Auto-update referenceImageUrl if first image or newly generated
  const imageCount = await prisma.categoryImage.count({ where: { categoryId } });
  if (imageCount === 1) {
    await prisma.category.update({
      where: { id: categoryId },
      data: { referenceImageUrl: imageUrl },
    });
  }

  return NextResponse.json(categoryImage, { status: 201 });
}
