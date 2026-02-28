import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const where = status ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, language } = body;

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "주문 항목이 없습니다" } },
      { status: 400 }
    );
  }

  const lastOrder = await prisma.order.findFirst({
    orderBy: { id: "desc" },
  });
  const nextNum = lastOrder ? lastOrder.id + 1 : 1;
  const orderNumber = `A${String(nextNum).padStart(3, "0")}`;

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const menu = await prisma.menu.findUnique({
      where: { id: item.menuId },
      include: {
        optionGroups: { include: { options: true } },
      },
    });
    if (!menu) continue;

    let itemPrice = menu.price;
    const selectedOpts = [];

    for (const sel of item.selectedOptions || []) {
      const group = menu.optionGroups.find((g) => g.id === sel.groupId);
      const option = group?.options.find((o) => o.id === sel.optionId);
      if (group && option) {
        itemPrice += option.priceModifier;
        selectedOpts.push({
          group: group.name,
          option: option.name,
          price: option.priceModifier,
        });
      }
    }

    const subtotal = itemPrice * item.quantity;
    totalAmount += subtotal;

    orderItems.push({
      menuId: menu.id,
      menuName: menu.name,
      quantity: item.quantity,
      unitPrice: itemPrice,
      selectedOptions: JSON.stringify(selectedOpts),
      subtotal,
    });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      totalAmount,
      language: language || "ko",
      items: { create: orderItems },
    },
    include: { items: true },
  });

  return NextResponse.json(order, { status: 201 });
}
