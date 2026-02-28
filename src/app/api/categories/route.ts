import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(request: Request) {
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
