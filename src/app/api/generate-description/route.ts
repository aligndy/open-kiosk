import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMenuDescription } from "@/lib/gemini";

export async function POST(request: Request) {
  const body = await request.json();
  const { menuName, categoryId } = body;

  if (!menuName || !categoryId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "메뉴명과 카테고리는 필수입니다" } },
      { status: 400 }
    );
  }

  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
    const storeName = settings?.storeName || "카페";
    const storeDescription = settings?.storeDescription || "";

    const menus = await prisma.menu.findMany({
      where: { categoryId: Number(categoryId), description: { not: "" } },
      select: { name: true, description: true },
    });

    const description = await generateMenuDescription(
      menuName,
      storeName,
      storeDescription,
      menus
    );

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Description generation error:", error);
    return NextResponse.json(
      { error: { code: "GEMINI_API_ERROR", message: "AI 설명 생성에 실패했습니다" } },
      { status: 502 }
    );
  }
}
