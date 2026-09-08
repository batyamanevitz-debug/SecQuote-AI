import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// The payload carries the whole questionnaire, so allow a little headroom.
app.use(express.json({ limit: "1mb" }));

/**
 * Two providers are supported; whichever key is present is used.
 * ANTHROPIC_API_KEY wins when both are set.
 *
 * Claude Haiku 4.5 is the current fast, low-cost model. Note for anyone
 * revisiting this: claude-3-haiku-20240307 was deprecated and retired on
 * 2026-04-19, so that id no longer works.
 */
const CLAUDE_MODEL = "claude-haiku-4-5";
const GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

let anthropic: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;

function activeProvider(): "anthropic" | "gemini" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

function getAnthropic(): Anthropic {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });
  return anthropic;
}

function getGemini(): GoogleGenAI {
  if (!gemini) gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  return gemini;
}

app.get("/api/health", (req, res) => {
  const provider = activeProvider();
  res.json({
    status: "ok",
    provider: provider ?? "none (local summary)",
    model: provider === "anthropic" ? CLAUDE_MODEL : provider === "gemini" ? GEMINI_MODELS[0] : null,
    configured: !!provider,
    time: new Date().toISOString(),
  });
});

const SYSTEM_PROMPT =
  "אתה יועץ סייבר בכיר שכותב סיכומי אפיון להצעות מחיר בעברית מקצועית. " +
  "החזר JSON תקין בלבד, ללא markdown, במבנה: " +
  '{"summary": "פסקה אחת עד שתיים המסכמת את האפיון", "components": [{"name": "...", "md": 2, "desc": "..."}]}. ' +
  "שמור על סך ימי העבודה הנתון — אל תשנה אותו.";

function buildPrompt(b: Record<string, unknown>): string {
  const config = (b.config ?? {}) as Record<string, unknown>;
  const template = (b.template ?? {}) as Record<string, unknown>;
  return [
    `סוג מבדק: ${config.categoryName}`,
    `מודל בדיקה: ${config.testType} · מורכבות: ${config.complexity}`,
    `סביבה: ${config.staging ? "Staging" : "Production"}`,
    `תבנית: ${template.name}`,
    `לקוח: ${b.clientName || "לא צוין"}`,
    `מערכת יעד: ${b.targetSystem || "לא צוינה"}`,
    `היקף: ${b.mandays} ימי עבודה בתעריף ${b.dailyRate}₪ ליום`,
    `רכיבים: ${JSON.stringify(b.components ?? [])}`,
    `דרישות מיוחדות: ${JSON.stringify(b.customRequirements ?? [])}`,
    `פרטי אפיון: ${JSON.stringify(b.scopeDetails ?? {})}`,
    "",
    "כתוב את הסיכום ואת פירוט הרכיבים.",
  ].join("\n");
}

/** Gemini can be busy on a given model; try the next before giving up. */
async function callGemini(prompt: string): Promise<string | null> {
  const client = getGemini();
  for (const model of GEMINI_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json" },
      });
      if (response.text) return response.text;
    } catch {
      continue;
    }
  }
  return null;
}

async function callClaude(prompt: string): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  // content is a union — narrow before reading .text
  let raw = "";
  for (const b of message.content) {
    if (b.type === "text") raw += b.text;
  }
  return raw;
}

/**
 * The single model call of the whole flow.
 *
 * The questionnaire runs entirely in the browser against a fixed question
 * bank, so nothing is sent while the user answers. This endpoint is hit once,
 * when the quote is produced, with everything that was collected.
 */
app.post("/api/ai/proposal", async (req, res) => {
  const provider = activeProvider();
  if (!provider) {
    // No key for either provider — the client composes the summary locally.
    return res.status(200).json({
      success: false,
      fallback: true,
      message: "No ANTHROPIC_API_KEY or GEMINI_API_KEY configured; using the local summary.",
    });
  }

  try {
    const prompt = buildPrompt(req.body ?? {});
    const raw = provider === "anthropic" ? await callClaude(prompt) : await callGemini(prompt);

    if (!raw) {
      return res.status(200).json({ success: false, fallback: true, message: "Model returned nothing." });
    }

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: { summary?: string; components?: unknown } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Model returned prose rather than JSON — still usable as the summary.
      parsed = { summary: cleaned };
    }

    return res.json({
      success: true,
      provider,
      summary: parsed.summary ?? cleaned,
      components: Array.isArray(parsed.components) ? parsed.components : req.body?.components,
    });
  } catch (error) {
    // Never block the wizard on the model — the client falls back locally.
    console.warn("[SecQuote] proposal generation failed:", (error as Error)?.message);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: (error as Error)?.message ?? String(error),
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SecQuote Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
