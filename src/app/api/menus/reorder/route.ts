import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const body = await request.json();
  const { items } = body as { items: { id: number; sortOrder: number }[] };

  if (!items || !Array.isArray(items)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "items 배열이 필요합니다" } },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.menu.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
