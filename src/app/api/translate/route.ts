import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translateTexts } from "@/lib/gemini";

export async function POST(request: Request) {
  const body = await request.json();
  const { targetLanguage, onlyMissing } = body;

  if (!targetLanguage) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "대상 언어를 선택해주세요" } },
      { status: 400 }
    );
  }

  try {
    const categories = await prisma.category.findMany();
    const menus = await prisma.menu.findMany();
    const optionGroups = await prisma.optionGroup.findMany();
    const options = await prisma.option.findMany();

    const items: { id: number; type: string; field: string; value: string }[] = [];

    const hasTrans = (json: string | null, lang: string): boolean => {
      try {
        const map = JSON.parse(json || "{}");
        return !!map[lang]?.trim();
      } catch {
        return false;
      }
    };

    for (const cat of categories) {
      if (onlyMissing && hasTrans(cat.nameTranslations, targetLanguage)) continue;
      items.push({ id: cat.id, type: "category", field: "name", value: cat.name });
    }
    for (const menu of menus) {
      if (!(onlyMissing && hasTrans(menu.nameTranslations, targetLanguage))) {
        items.push({ id: menu.id, type: "menu", field: "name", value: menu.name });
      }
      if (menu.description) {
        if (!(onlyMissing && hasTrans(menu.descriptionTranslations, targetLanguage))) {
          items.push({ id: menu.id, type: "menu", field: "description", value: menu.description });
        }
      }
    }
    for (const group of optionGroups) {
      if (onlyMissing && hasTrans(group.nameTranslations, targetLanguage)) continue;
      items.push({ id: group.id, type: "optionGroup", field: "name", value: group.name });
    }
    for (const opt of options) {
      if (onlyMissing && hasTrans(opt.nameTranslations, targetLanguage)) continue;
      items.push({ id: opt.id, type: "option", field: "name", value: opt.name });
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, translatedCount: 0, language: targetLanguage });
    }

    const translations = await translateTexts(items, targetLanguage);

    for (const t of translations) {
      if (t.type === "category") {
        const cat = categories.find((c) => c.id === t.id);
        if (cat) {
          const existing = JSON.parse(cat.nameTranslations || "{}");
          existing[targetLanguage] = t.value;
          await prisma.category.update({
            where: { id: t.id },
            data: { nameTranslations: JSON.stringify(existing) },
          });
        }
      } else if (t.type === "menu") {
        const menu = menus.find((m) => m.id === t.id);
        if (menu) {
          if (t.field === "name") {
            const existing = JSON.parse(menu.nameTranslations || "{}");
            existing[targetLanguage] = t.value;
            await prisma.menu.update({
              where: { id: t.id },
              data: { nameTranslations: JSON.stringify(existing) },
            });
          } else if (t.field === "description") {
            const existing = JSON.parse(menu.descriptionTranslations || "{}");
            existing[targetLanguage] = t.value;
            await prisma.menu.update({
              where: { id: t.id },
              data: { descriptionTranslations: JSON.stringify(existing) },
            });
          }
        }
      } else if (t.type === "optionGroup") {
        const group = optionGroups.find((g) => g.id === t.id);
        if (group) {
          const existing = JSON.parse(group.nameTranslations || "{}");
          existing[targetLanguage] = t.value;
          await prisma.optionGroup.update({
            where: { id: t.id },
            data: { nameTranslations: JSON.stringify(existing) },
          });
        }
      } else if (t.type === "option") {
        const opt = options.find((o) => o.id === t.id);
        if (opt) {
          const existing = JSON.parse(opt.nameTranslations || "{}");
          existing[targetLanguage] = t.value;
          await prisma.option.update({
            where: { id: t.id },
            data: { nameTranslations: JSON.stringify(existing) },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      translatedCount: translations.length,
      language: targetLanguage,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: { code: "GEMINI_API_ERROR", message: "AI 번역 서비스에 오류가 발생했습니다" } },
      { status: 502 }
    );
  }
}
