import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const { groupId } = await params;
  const body = await request.json();
  const { name, nameTranslations, required, sortOrder, options } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (nameTranslations !== undefined) data.nameTranslations = nameTranslations;
  if (required !== undefined) data.required = required;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  if (options) {
    await prisma.option.deleteMany({ where: { optionGroupId: Number(groupId) } });
    await prisma.option.createMany({
      data: options.map(
        (opt: { name: string; nameTranslations?: string; priceModifier?: number; sortOrder?: number }, idx: number) => ({
          optionGroupId: Number(groupId),
          name: opt.name,
          nameTranslations: opt.nameTranslations ?? "{}",
          priceModifier: opt.priceModifier ?? 0,
          sortOrder: opt.sortOrder ?? idx,
        })
      ),
    });
  }

  const optionGroup = await prisma.optionGroup.update({
    where: { id: Number(groupId) },
    data,
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(optionGroup);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  await prisma.optionGroup.delete({ where: { id: Number(groupId) } });
  return NextResponse.json({ success: true });
}
