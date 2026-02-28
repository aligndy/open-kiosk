import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const source = await prisma.menu.findUnique({
    where: { id: Number(id) },
    include: {
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!source) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "메뉴를 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  const duplicate = await prisma.menu.create({
    data: {
      name: `${source.name} (복사)`,
      description: source.description,
      price: source.price,
      categoryId: source.categoryId,
      sortOrder: source.sortOrder + 1,
      imageUrl: source.imageUrl,
      nameTranslations: source.nameTranslations,
      descriptionTranslations: source.descriptionTranslations,
      optionGroups: {
        create: source.optionGroups.map((g) => ({
          name: g.name,
          nameTranslations: g.nameTranslations,
          required: g.required,
          sortOrder: g.sortOrder,
          options: {
            create: g.options.map((o) => ({
              name: o.name,
              nameTranslations: o.nameTranslations,
              priceModifier: o.priceModifier,
              sortOrder: o.sortOrder,
            })),
          },
        })),
      },
    },
    include: {
      optionGroups: { include: { options: true } },
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
