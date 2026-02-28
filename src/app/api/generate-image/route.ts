import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMenuImage } from "@/lib/gemini";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { cropToSquare } from "@/lib/image";

export async function POST(request: Request) {
  const body = await request.json();
  const { prompt, menuId, transparentBg, referenceImageUrl } = body;

  if (!prompt) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "이미지 설명을 입력해주세요" } },
      { status: 400 }
    );
  }

  try {
    let referenceImageBase64: string | undefined;

    if (referenceImageUrl) {
      const filePath = path.join(process.cwd(), "public", referenceImageUrl);
      const fileBuffer = await readFile(filePath);
      referenceImageBase64 = fileBuffer.toString("base64");
    }

    const rawBuffer = await generateMenuImage(prompt, {
      transparentBg: transparentBg !== false,
      referenceImageBase64,
    });
    const imageBuffer = await cropToSquare(rawBuffer);
    const fileName = `menu-${menuId || "new"}-${Date.now()}.png`;
    const generatedDir = path.join(process.cwd(), "public", "generated");
    await mkdir(generatedDir, { recursive: true });
    await writeFile(path.join(generatedDir, fileName), imageBuffer);

    const imageUrl = `/generated/${fileName}`;

    if (menuId) {
      await prisma.menu.update({
        where: { id: Number(menuId) },
        data: { imageUrl },
      });
      await prisma.menuImage.create({
        data: {
          menuId: Number(menuId),
          imageUrl,
          prompt,
          transparentBg: transparentBg !== false,
          usedReferenceImage: !!referenceImageUrl,
          isAiGenerated: true,
        },
      });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: { code: "GEMINI_API_ERROR", message: "AI 이미지 생성에 실패했습니다" } },
      { status: 502 }
    );
  }
}
