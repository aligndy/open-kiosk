import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const menuId = Number(id);
  const body = await request.json();
  const { name, required, sortOrder, options } = body;

  if (!name) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "옵션 그룹명은 필수입니다" } },
      { status: 400 }
    );
  }

  const optionGroup = await prisma.optionGroup.create({
    data: {
      menuId,
      name,
      required: required ?? false,
      sortOrder: sortOrder ?? 0,
      options: {
        create:
          options?.map(
            (opt: { name: string; priceModifier?: number; sortOrder?: number }, idx: number) => ({
              name: opt.name,
              priceModifier: opt.priceModifier ?? 0,
              sortOrder: opt.sortOrder ?? idx,
            })
          ) || [],
      },
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(optionGroup, { status: 201 });
}
