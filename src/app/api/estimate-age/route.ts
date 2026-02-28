import { NextRequest, NextResponse } from "next/server";
import { estimateAge } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get("image") as File | null;

        if (!image) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", message: "이미지가 없습니다" } },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        const base64 = buffer.toString("base64");

        const age = await estimateAge(base64, image.type);

        const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });

        // settings가 없거나 useCameraDetection이 false면 자판기 모드 미작동
        if (!settings || !settings.useCameraDetection) {
            return NextResponse.json({ estimatedAge: age, isVendingMode: false });
        }

        const isVendingMode = age >= settings.vendingModeAge;

        return NextResponse.json({ estimatedAge: age, isVendingMode });
    } catch (error) {
        console.error("Age estimation error:", error);
        return NextResponse.json(
            { error: { code: "GEMINI_API_ERROR", message: "나이 추정에 실패했습니다" } },
            { status: 502 }
        );
    }
}
