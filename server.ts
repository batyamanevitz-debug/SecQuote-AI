import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// The payload carries the whole questionnaire, so allow a little headroom.
app.use(express.json({ limit: "1mb" }));

/** Gemini Flash — fast and cheap. The first model that answers is used. */
const GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

let gemini: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  // A real key is ~39 characters. Anything shorter is a leftover placeholder
  // such as "AIza..." — treat it as unset rather than reporting "configured"
  // and then failing on the first call.
  if (!apiKey || apiKey.length < 20) return null;
  if (!gemini) gemini = new GoogleGenAI({ apiKey });
  return gemini;
}

app.get("/api/health", (req, res) => {
  const configured = !!getGemini();
  res.json({
    status: "ok",
    provider: configured ? "gemini" : "none (local summary)",
    model: configured ? GEMINI_MODELS[0] : null,
    configured,
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
async function callGemini(client: GoogleGenAI, prompt: string): Promise<string | null> {
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

/**
 * The single model call of the whole flow.
 *
 * The questionnaire runs entirely in the browser against a fixed question
 * bank, so nothing is sent while the user answers. This endpoint is hit once,
 * when the quote is produced, with everything that was collected.
 */
app.post("/api/ai/proposal", async (req, res) => {
  const client = getGemini();
  if (!client) {
    // No key configured — the client composes the summary locally.
    return res.status(200).json({
      success: false,
      fallback: true,
      message: "GEMINI_API_KEY not configured; using the local summary.",
    });
  }

  try {
    const raw = await callGemini(client, buildPrompt(req.body ?? {}));

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
      provider: "gemini",
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
