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
  prompt: string
): Promise<Buffer> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.0-flash",
    generationConfig: { responseModalities: ["image", "text"] } as never,
  });

  const fullPrompt = `카페 메뉴 사진을 생성해주세요. 음식/음료 사진 스타일로, 깨끗한 배경에 메뉴만 부각되도록 합니다.
설명: ${prompt}
스타일: 프로페셔널 푸드 포토그래피, 밝은 조명, 깨끗한 배경`;

  const result = await model.generateContent(fullPrompt);
  const parts = result.response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No image generated");

  for (const part of parts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("No image data in response");
}
