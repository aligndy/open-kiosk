import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MESSAGES_DIR = path.join(__dirname, "../src/messages");
const SOURCE_LANG = "ko";
const TARGET_LANGS = ["en", "ja", "zh", "es", "fr", "de", "vi", "th"];
const BATCH_SIZE = 50;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  fr: "French",
  de: "German",
  vi: "Vietnamese",
  th: "Thai",
};

// Keys that should NOT be translated (keep original)
const SKIP_KEYS = new Set(["common.priceFormat"]);

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Read source messages
  const koPath = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`);
  const koMessages: Record<string, string> = JSON.parse(
    fs.readFileSync(koPath, "utf-8"),
  );

  for (const lang of TARGET_LANGS) {
    const targetPath = path.join(MESSAGES_DIR, `${lang}.json`);
    let existing: Record<string, string> = {};
    if (fs.existsSync(targetPath)) {
      existing = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
    }

    // Find missing keys (exclude SKIP_KEYS)
    const missingKeys = Object.keys(koMessages).filter(
      (key) => !SKIP_KEYS.has(key) && !existing[key],
    );

    if (missingKeys.length === 0) {
      console.log(`[${lang}] All keys already translated (${Object.keys(existing).length} keys)`);
      continue;
    }

    console.log(`[${lang}] Translating ${missingKeys.length} missing keys...`);

    // Batch translate
    for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
      const batch = missingKeys.slice(i, i + BATCH_SIZE);
      const toTranslate: Record<string, string> = {};
      for (const key of batch) {
        toTranslate[key] = koMessages[key];
      }

      const prompt = `Translate the following Korean UI texts to ${LANG_NAMES[lang]}.
This is for a cafe kiosk application. Keep translations concise and natural for UI buttons/labels.
Preserve {variable} placeholders exactly as-is (e.g., {amount}, {seconds}, {count}).
Do NOT translate text inside curly braces.

Return ONLY a valid JSON object with the same keys and translated values. No markdown, no explanation.

${JSON.stringify(toTranslate, null, 2)}`;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        // Extract JSON from response (handle possible markdown wrapping)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`  [${lang}] batch ${i}: Failed to parse response`);
          continue;
        }
        const translated = JSON.parse(jsonMatch[0]);
        Object.assign(existing, translated);
        console.log(`  [${lang}] batch ${i}-${i + batch.length}: OK (${batch.length} keys)`);
      } catch (err) {
        console.error(`  [${lang}] batch ${i}: Error -`, err);
      }
    }

    // Write sorted output
    const sorted: Record<string, string> = {};
    for (const key of Object.keys(koMessages)) {
      if (existing[key]) sorted[key] = existing[key];
    }
    // Preserve any extra keys from existing
    for (const key of Object.keys(existing)) {
      if (!sorted[key]) sorted[key] = existing[key];
    }

    fs.writeFileSync(targetPath, JSON.stringify(sorted, null, 2) + "\n");
    console.log(`[${lang}] Done - ${Object.keys(sorted).length} total keys`);
  }

  console.log("\nTranslation complete!");
}

main().catch(console.error);
