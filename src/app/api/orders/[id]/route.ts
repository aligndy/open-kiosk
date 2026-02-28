import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
