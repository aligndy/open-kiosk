import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function translateTexts(
  items: { id: number; type: string; field: string; value: string }[],
  targetLanguage: string
): Promise<{ id: number; type: string; field: string; value: string }[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_TEXT_MODEL || "gemini-3.0-flash" });

  const prompt = `다음 카페 메뉴 항목들을 ${targetLanguage}로 번역해주세요.
자연스럽고 간결하게 번역하되, 카페 메뉴에 적합한 표현을 사용하세요.
반드시 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만 출력하세요.

입력:
${JSON.stringify({ items }, null, 2)}

출력 형식:
{ "translations": [ { "id": 1, "type": "category", "field": "name", "value": "번역결과" }, ... ] }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse Gemini response");

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.translations;
}

export async function generateMenuImage(
  prompt: string,
  options?: { transparentBg?: boolean; referenceImageBase64?: string }
): Promise<Buffer> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.0-flash",
    generationConfig: { responseModalities: ["image", "text"] } as never,
  });

  const bgInstruction = options?.transparentBg
    ? "The background MUST be pure white (#FFFFFF). No shadows, no gradients, no textures on the background. Only the food/drink item should be visible on a completely clean white background."
    : "";

  const referenceInstruction = options?.referenceImageBase64
    ? "Use the provided reference image as a style guide. Match its visual style, color tone, composition, lighting, and overall aesthetic as closely as possible. Maintain the same size, scale, and angle of the subject as shown in the reference image."
    : "";

  const fullPrompt = `Generate a professional cafe menu photo in a perfect 1:1 square format. Product photography style, top-down or 45-degree angle view. The subject should be centered in the frame.
${bgInstruction}
${referenceInstruction}
Item: ${prompt}
Style: Professional food photography, bright even lighting, high resolution, appetizing presentation, square aspect ratio`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  if (options?.referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: options.referenceImageBase64,
      },
    });
  }
  parts.push({ text: fullPrompt });

  const result = await model.generateContent(parts);
  const responseParts = result.response.candidates?.[0]?.content?.parts;
  if (!responseParts) throw new Error("No image generated");

  for (const part of responseParts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No image data in response");
}

export async function generateMenuDescription(
  menuName: string,
  storeName: string,
  storeDescription: string,
  siblingMenus: { name: string; description: string }[]
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_TEXT_MODEL || "gemini-3.0-flash" });

  const siblingContext = siblingMenus.length > 0
    ? `\n같은 카테고리의 다른 메뉴들:\n${siblingMenus.map((m) => `- ${m.name}: ${m.description}`).join("\n")}`
    : "";

  const prompt = `당신은 카페/음식점 메뉴 설명을 작성하는 전문가입니다.
아래 정보를 참고하여 메뉴 설명을 한 줄로 작성해주세요.

매장명: ${storeName}
${storeDescription ? `매장 설명: ${storeDescription}` : ""}
메뉴명: ${menuName}${siblingContext}

규칙:
- 같은 카테고리의 다른 메뉴 설명이 있다면 톤, 길이, 스타일을 맞춰주세요.
- 없다면 간결하고 매력적인 한 줄 설명을 작성하세요.
- 설명만 출력하세요. 따옴표나 다른 텍스트 없이 설명 텍스트만 반환하세요.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function estimateAge(imageBase64: string, mimeType: string): Promise<number> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_AGE_MODEL || "gemini-3.0-flash" });

  const prompt = `이 사람의 나이대를 숫자로만 추정해서 대답해주세요 (예: 25, 50, 65). 다른 말은 덧붙이지 마세요.
※ 얼굴이 없거나 사람이 아닌 경우 -1을 반환하세요.`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType
    }
  };

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();
  const age = parseInt(text.trim(), 10);

  if (isNaN(age)) {
    return -1;
  }

  return age;
}
