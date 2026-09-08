import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// The payload carries the whole questionnaire, so allow a little headroom.
app.use(express.json({ limit: "1mb" }));

/**
 * Claude Haiku 4.5 — the current fast, low-cost model.
 *
 * Note for anyone revisiting this: claude-3-haiku-20240307 was deprecated and
 * retired on 2026-04-19. Pointing this at that id would fail outright.
 */
const MODEL = "claude-haiku-4-5";

let anthropic: Anthropic | null = null;
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!anthropic) anthropic = new Anthropic({ apiKey });
  return anthropic;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: MODEL, configured: !!getClient(), time: new Date().toISOString() });
});

/**
 * The single model call of the whole flow.
 *
 * The questionnaire itself runs entirely in the browser against a fixed
 * question bank, so nothing is sent while the user answers. This endpoint is
 * hit once, when the quote is produced, with everything that was collected.
 */
app.post("/api/ai/proposal", async (req, res) => {
  const client = getClient();
  if (!client) {
    // No key configured — the client composes the summary locally.
    return res.status(200).json({
      success: false,
      fallback: true,
      message: "ANTHROPIC_API_KEY not configured; using the local summary.",
    });
  }

  try {
    const {
      config,
      template,
      clientName,
      targetSystem,
      mandays,
      dailyRate,
      components,
      customRequirements,
      scopeDetails,
    } = req.body ?? {};

    const system =
      "אתה יועץ סייבר בכיר שכותב סיכומי אפיון להצעות מחיר בעברית מקצועית. " +
      "החזר JSON תקין בלבד, ללא markdown, במבנה: " +
      '{"summary": "פסקה אחת עד שתיים המסכמת את האפיון", "components": [{"name": "...", "md": 2, "desc": "..."}]}. ' +
      "שמור על סך ימי העבודה הנתון — אל תשנה אותו.";

    const userPrompt = [
      `סוג מבדק: ${config?.categoryName}`,
      `מודל בדיקה: ${config?.testType} · מורכבות: ${config?.complexity}`,
      `סביבה: ${config?.staging ? "Staging" : "Production"}`,
      `תבנית: ${template?.name}`,
      `לקוח: ${clientName || "לא צוין"}`,
      `מערכת יעד: ${targetSystem || "לא צוינה"}`,
      `היקף: ${mandays} ימי עבודה בתעריף ${dailyRate}₪ ליום`,
      `רכיבים: ${JSON.stringify(components ?? [])}`,
      `דרישות מיוחדות: ${JSON.stringify(customRequirements ?? [])}`,
      `פרטי אפיון: ${JSON.stringify(scopeDetails ?? {})}`,
      "",
      "כתוב את הסיכום ואת פירוט הרכיבים.",
    ].join("\n");

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    // content is a union — narrow before reading .text
    let raw = "";
    for (const b of message.content) {
      if (b.type === "text") raw += b.text;
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
      summary: parsed.summary ?? cleaned,
      components: Array.isArray(parsed.components) ? parsed.components : components,
      usage: message.usage,
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
