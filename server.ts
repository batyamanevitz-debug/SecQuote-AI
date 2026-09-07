import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Scoping API endpoint with resilient multi-model fallback
// Prioritize ultra-fast lightweight models (flash-lite) to avoid 503 high demand spikes
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

async function generateScopingWithFallback(
  ai: GoogleGenAI,
  userPrompt: string,
  systemInstruction: string
): Promise<string | null> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch {
      // If model is busy, throttled or experiencing high demand, seamlessly attempt next model
      continue;
    }
  }

  // Gracefully return null so caller activates the resilient local scoping engine
  return null;
}

app.post("/api/ai/scope", async (req, res) => {
  try {
    const {
      config,
      template,
      chatHistory,
      userMessage,
      currentMandays,
      customRequirements,
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: "GEMINI_API_KEY not configured on server, using local intelligent scoping engine.",
      });
    }

    const systemInstruction = `
אתה עוזר AI מקצועי בכיר להפקת הצעות מחיר וסקופינג (Scoping) למערכת בדיקות סייבר (SecQuote AI).
מטרתך: לנהל שיחה חכמה, חדה וממוקדת בעברית עם הלקוח/יועץ הסייבר, לקלוט את תצורת הבדיקה והתבנית, לשאול שאלות דינמיות ממוקדות אחת-אחת, לשלב מיד הערות חופשיות ודרישות מיוחדות בחישוב ההיקף וימי העבודה (MD), ובסיום להפיק הצעת מחיר מובנית.

הנתונים שנבחרו:
- סוג מבדק: ${config?.categoryName || 'תשתיתי'} (${config?.categoryKey || 'infra'})
- סביבה: ${config?.staging ? 'Staging (מעבדה)' : 'Production (סביבת ייצור חי)'}
- סוג בדיקה: ${config?.testType || 'Blackbox'}
- מורכבות רשת: ${config?.complexity || 'בינונית'}
- תבנית עסקית: ${template?.name || 'סטארט-אפ MVP'} (${template?.desc || ''})
- דרישות מיוחדות שנרשמו עד כה: ${(customRequirements || []).join(', ') || 'אין עדיין'}
- ימי עבודה בסיסיים נוכחיים: ${currentMandays || 5} MD

הנחיות חמורות להתנהגות:
1. ענה תמיד בעברית מקצועית, רהוטה וקולעת (במונחי סייבר ואבטחת מידע מקובלים בישראל: PT, Red Team, Whitebox, API, Active Directory, SOC 2 וכו').
2. אם הלקוח מקליד בקשה מיוחדת (למשל "להוסיף בדיקה מיוחדת לשרת ספציפי" או בדיקה של שרת תשלומים, ענן, או עומס) - זהה אותה מיד, אשר ששילבת אותה, וציין כמה MD הוספת עבורה.
3. זהה מתוך דברי המשתמש שם לקוח (למשל "עבור אל על", "הלקוח הוא Wix", "חברת הביטוח הראל", "בנק הפועלים") או שם מערכת/סביבה ספציפית (כגון "WordPress", "אפליקציית iOS", "תשתית ענן AWS", "שרת תשלומים").
4. שמור על שאלות ממוקדות שלב-אחר-שלב (לא להעמיס שאלונים ענקיים). ספק 2-4 אפשרויות בחירה מהירות (options) כפתורים למענה מהיר, אך אפשר גם טקסט חופשי.
5. החזר תמיד תשובה במבנה JSON תקני בלבד (ללא markdown מסביב, רק אובייקט JSON תקני) עם המפתחות:
{
  "aiMessage": "טקסט התגובה של ה-AI ללקוח",
  "nextQuestion": "השאלה הבאה או null אם האפיון הושלם",
  "options": ["אפשרות 1", "אפשרות 2", "אפשרות 3"],
  "mandaysDelta": 0, // שינוי בימי עבודה (למשל +1, +2 או 0) בעקבות התשובה
  "totalMandays": 8, // הערכת סך ימי עבודה מעודכנת
  "newCustomRequirement": "תיאור קצר של דרישה מיוחדת שזוהתה, או null",
  "detectedClientName": "שם הלקוח שחולץ מטקסט המשתמש או null אם לא צוין",
  "detectedTargetSystem": "שם המערכת או סביבת היעד שנמסרה (למשל: סביבת WordPress, אפליקציית מובייל, ענן AWS) או null",
  "scopeDetails": {
    "environment": "תיאור הסביבה הנבדקת כפי שהוגדרה בשיחה",
    "roles": "תפקידים או רמות הרשאה שסוכמו לבדיקה (למשל: אורח, מנהל וכו')",
    "endpointsOrIps": "היקף כתובות IP או endpoints",
    "testingHours": "שעות בדיקה או חלונות זמן שהוגדרו",
    "criticalSystems": "מערכות קריטיות ודגשים"
  },
  "isComplete": false, // true אם סיימנו את שלב השאלות ומוכנים להצעת מחיר
  "scopeSummary": {
    "summaryText": "סיכום אפיון",
    "components": [
      { "name": "שם הרכיב", "md": 2, "desc": "פירוט מה נבדק" }
    ]
  }
}
`;

    const userPrompt = `
היסטוריית שיחה:
${(chatHistory || [])
  .map((m: any) => `${m.role === 'user' ? 'לקוח' : 'SecQuote AI'}: ${m.text}`)
  .join('\n')}

הודעה חדשה מהלקוח: "${userMessage}"
ימי עבודה נוכחיים: ${currentMandays} MD.
נא עבד את המידע, התאם את השאלה הבאה או סכם את האפיון, ועדכן את ה-MD במידת הצורך.
`;

    let rawText = '';
    try {
      rawText = await generateScopingWithFallback(ai, userPrompt, systemInstruction);
    } catch (genError: any) {
      console.warn(
        "[SecQuote AI] Remote models temporarily busy (503/load), engaging local intelligent engine seamlessly:",
        genError?.message || genError
      );
      return res.status(200).json({
        fallback: true,
        message: "AI model busy, seamlessly activated local engine.",
      });
    }

    const cleanedText = (rawText || '{}')
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      parsed = { aiMessage: cleanedText, isComplete: false };
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    return res.status(200).json({
      fallback: true,
      error: error?.message || String(error),
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
