import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "주문을 찾을 수 없습니다" } },
      { status: 404 }
    );
  }
  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !["pending", "completed"].includes(status)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "유효하지 않은 상태입니다" } },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id: Number(id) },
    data: { status },
    include: { items: true },
  });
  return NextResponse.json(order);
}
