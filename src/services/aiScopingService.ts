import { ScopeComponent, ProjectTemplate } from '../types';

export interface ScopingConfig {
  categoryKey: 'infra' | 'app' | 'red' | 'mobile';
  categoryName: string;
  staging: boolean;
  testType: 'Blackbox' | 'Greybox' | 'Whitebox';
  complexity: 'פשוטה' | 'בינונית' | 'מורכבת';
}

export interface AiScopingResponse {
  aiMessage: string;
  nextQuestion?: string | null;
  options?: string[];
  mandaysDelta?: number;
  totalMandays?: number;
  newCustomRequirement?: string | null;
  detectedClientName?: string | null;
  detectedTargetSystem?: string | null;
  scopeDetails?: {
    environment?: string;
    roles?: string;
    endpointsOrIps?: string;
    attackVectors?: string;
    testingHours?: string;
    criticalSystems?: string;
  };
  components?: ScopeComponent[];
  isComplete: boolean;
  proposal?: {
    summary: string;
    components: ScopeComponent[];
    totalMd: number;
    totalCost: number;
  };
}

// Generate the initial welcome message and first question based on Step 1 + Step 2
export function getInitialAiGreeting(
  config: ScopingConfig,
  template: ProjectTemplate,
  dailyRate: number
): { message: string; options: string[]; baseMd: number; components: ScopeComponent[] } {
  const envText = config.staging ? 'סביבת Staging (מעבדה)' : 'סביבת Production (ייצור חי)';
  const baseComponents: ScopeComponent[] = [];
  let baseMd = 3;

  if (template.key === 'mvp') {
    baseMd = 4;
  } else if (template.key === 'fintech') {
    baseMd = 8;
  } else if (template.key === 'core') {
    baseMd = 12;
  } else if (template.key === 'mobile') {
    baseMd = 6;
  }

  // Adjust for complexity and test type
  if (config.complexity === 'מורכבת') baseMd += 2;
  if (config.testType === 'Whitebox') baseMd += 2;
  if (config.testType === 'Greybox') baseMd += 1;

  // Build domain components
  if (config.categoryKey === 'infra') {
    baseComponents.push(
      { name: 'סריקת חשיפה ומיפוי פורטים', md: 1, desc: 'מיפוי שירותים גלויים, פרוטוקולים וסריקת פגיעויות רוחבית' },
      { name: 'מבדק חדירה תשתיתי (OS & Network)', md: Math.max(2, baseMd - 2), desc: `ניצול חולשות תשתית במודל ${config.testType} ב-${envText}` },
      { name: 'דוח ממצאים מקצועי ו-Retest', md: 1, desc: 'דוח מנהלים, פירוט ממצאים טכני ומבדק חוזר לאחר תיקון' }
    );
  } else if (config.categoryKey === 'app') {
    baseComponents.push(
      { name: 'מיפוי לוגיקה עסקית ואימות הרשאות (RBAC)', md: 1.5, desc: 'בדיקת שבירת הזדהות, BOLA/IDOR ומנגנוני Sessions' },
      { name: 'מבדק חדירה אפליקטיבי מקיף (OWASP Top 10)', md: Math.max(2, baseMd - 2.5), desc: `הזרקות, XSS, SSRF, העלאת קבצים וליקויים ב-${envText}` },
      { name: 'דוח ממצאים טכני ומבדק חוזר (Retest)', md: 1, desc: 'המלצות מעשיות לצוות הפיתוח ומבדק תיקוף' }
    );
  } else if (config.categoryKey === 'mobile') {
    baseComponents.push(
      { name: 'ניתוח סטטי ודינמי לאפליקציה (Client-Side)', md: 2, desc: 'בדיקת אחסון מקומי (Keychain/KeyStore), הצפנה, SSL Pinning' },
      { name: 'בדיקת ממשקי API ושירותי Backend', md: Math.max(2, baseMd - 3), desc: 'בדיקת אבטחת נקודות קצה של האפליקציה ואימות טוקנים' },
      { name: 'דוח ממצאים טכני ו-Retest', md: 1, desc: 'דוח תיקונים לצוות המובייל ומבדק חוזר' }
    );
  } else {
    // Red team
    baseComponents.push(
      { name: 'איסוף מודיעין גלוי (OSINT) ומיפוי אפיקי תקיפה', md: 2, desc: 'מיפוי נוכחות דיגיטלית, עובדים, דומיינים ודליפות מידע' },
      { name: 'סימולציית תקיפה מתקדמת (Assumed Breach / Spear Phishing)', md: Math.max(3, baseMd - 3), desc: `פעילות צוות אדום חשאית להשגת יעדי דגל בסביבת ${envText}` },
      { name: 'תחקיר מול צוות ה-SOC ודוח תובנות ארגוני', md: 1, desc: 'מפגש הפקת לקחים, בחינת זמני תגובה וכיול מערכות הגנה' }
    );
  }

  // First question based on template and category
  let firstQuestion = '';
  let options: string[] = [];

  if (config.categoryKey === 'infra') {
    firstQuestion = `שלום! אני עוזר ה-AI של SecQuote לאפיון וסקופינג מבדקי סייבר.
קלטתי את הבחירה שלך: **${config.categoryName}**, במודל **${config.testType}**, על גבי **${envText}**, עם תבנית **${template.name}**.

כדי לדייק את היקף העבודה, נתחיל בבסיס הרשת: **כמה כתובות IP חיצוניות/פנימיות וציוד רשת (Firewalls, Switches) נכללים בסקופ?**`;
    options = ['עד 20 כתובות IP', '20-50 כתובות IP', '50-100 כתובות IP', 'מעל 100 כתובות IP / רשת מורכבת'];
  } else if (config.categoryKey === 'app') {
    firstQuestion = `שלום! אני עוזר ה-AI של SecQuote לאפיון וסקופינג מבדקי סייבר.
קלטתי את הבחירה שלך: **${config.categoryName}**, במודל **${config.testType}**, על גבי **${envText}**, עם תבנית **${template.name}**.

כדי להגדיר את היקף הבדיקה: **כמה תפקידי משתמשים שונים (Roles / RBAC) יש במערכת (למשל: Admin, Manager, User)? וכמה עמודים/מסכים עיקריים?**`;
    options = ['1-2 תפקידים (עד 15 מסכים)', '3-4 תפקידים (עד 30 מסכים)', '5+ תפקידים כולל Super Admin', 'מערכת מרובת דיירים (Multi-Tenant)'];
  } else if (config.categoryKey === 'mobile') {
    firstQuestion = `שלום! אני עוזר ה-AI של SecQuote לאפיון וסקופינג מבדקי סייבר.
קלטתי את הבחירה שלך: **${config.categoryName}**, במודל **${config.testType}**, על גבי **${envText}**, עם תבנית **${template.name}**.

שאלה ראשונה: **האם הבדיקה מיועדת לשתי הפלטפורמות (iOS + Android) או רק לאחת מהן? ובאיזו טכנולוגיה פותחה האפליקציה (Native, Flutter, React Native)?**`;
    options = ['iOS ו-Android במקביל (Flutter/React Native)', 'iOS ו-Android פיתוח Native נפרד', 'אפליקציית iOS בלבד', 'אפליקציית Android בלבד'];
  } else {
    firstQuestion = `שלום! אני עוזר ה-AI של SecQuote לאפיון וסקופינג מבדקי סייבר.
קלטתי את הבחירה שלך: **${config.categoryName}**, במודל **${config.testType}**, על גבי **${envText}**, עם תבנית **${template.name}**.

שאלה ראשונה לפעילות: **מהו היעד המרכזי של הפעילות (Crown Jewels)? (למשל: השגת Domain Admin, חדירה למסד נתונים רגיש, או תפיסת שרת קריטי)?**`;
    options = ['השגת שליטת Domain Admin בארגון', 'גישה לבסיס נתונים פיננסי / כרטיסי אשראי', 'חדירה מחוץ לארגון לרשת הפנימית', 'בדיקת מודעות עובדים ופישינג בלבד'];
  }

  return {
    message: firstQuestion,
    options,
    baseMd,
    components: baseComponents,
  };
}

// Client service calling backend or dynamic fallback
export async function sendScopingMessage(params: {
  config: ScopingConfig;
  template: ProjectTemplate;
  chatHistory: { role: 'ai' | 'user'; text: string }[];
  userMessage: string;
  currentMandays: number;
  currentComponents: ScopeComponent[];
  customRequirements: string[];
  dailyRate: number;
}): Promise<AiScopingResponse> {
  const {
    config,
    template,
    chatHistory,
    userMessage,
    currentMandays,
    currentComponents,
    customRequirements,
    dailyRate,
  } = params;

  // Try calling the server-side API first
  try {
    const response = await fetch('/api/ai/scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        template,
        chatHistory,
        userMessage,
        currentMandays,
        customRequirements,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && !result.fallback) {
        const d = result.data;
        const newReq = d.newCustomRequirement;
        const updatedReqs = newReq
          ? [...customRequirements, newReq]
          : customRequirements;

        let finalMd = d.totalMandays || currentMandays + (d.mandaysDelta || 0);
        let components = currentComponents;

        if (d.scopeSummary?.components?.length) {
          components = d.scopeSummary.components;
        } else if (newReq) {
          components = [
            ...components,
            {
              name: `בדיקה ייעודית: ${newReq}`,
              md: 1.5,
              desc: `הורחב לבקשת הלקוח: ${newReq}`,
              isCustom: true,
            },
          ];
          finalMd += 1.5;
        }

        const totalCost = finalMd * dailyRate;

        return {
          aiMessage: d.aiMessage,
          nextQuestion: d.nextQuestion,
          options: d.options || [],
          mandaysDelta: d.mandaysDelta || 0,
          totalMandays: finalMd,
          newCustomRequirement: newReq,
          detectedClientName: d.detectedClientName || null,
          detectedTargetSystem: d.detectedTargetSystem || null,
          scopeDetails: d.scopeDetails || undefined,
          components,
          isComplete: d.isComplete || false,
          proposal: d.isComplete
            ? {
                summary:
                  d.scopeSummary?.summaryText ||
                  `מבדק ${config.categoryName} מותאם אישית לתבנית ${template.name}`,
                components,
                totalMd: finalMd,
                totalCost,
              }
            : undefined,
        };
      }
    }
  } catch (err) {
    console.warn('API call failed or in offline mode, falling back to local engine:', err);
  }

  // Local Intelligent Scoping Engine (Guaranteed 100% reliability & responsiveness)
  return runLocalIntelligentScopingEngine({
    config,
    template,
    chatHistory,
    userMessage,
    currentMandays,
    currentComponents,
    customRequirements,
    dailyRate,
  });
}

function runLocalIntelligentScopingEngine(params: {
  config: ScopingConfig;
  template: ProjectTemplate;
  chatHistory: { role: 'ai' | 'user'; text: string }[];
  userMessage: string;
  currentMandays: number;
  currentComponents: ScopeComponent[];
  customRequirements: string[];
  dailyRate: number;
}): AiScopingResponse {
  const {
    config,
    template,
    chatHistory,
    userMessage,
    currentMandays,
    currentComponents,
    customRequirements,
    dailyRate,
  } = params;

  const msg = userMessage.trim();
  const lower = msg.toLowerCase();
  const userTurnCount = chatHistory.filter((m) => m.role === 'user').length + 1;

  let deltaMd = 0;
  let newRequirement: string | null = null;
  const updatedComponents = [...currentComponents];

  // 1. Natural Language Extraction of Client Name from chat
  let detectedClientName: string | null = null;
  const clientMatch = msg.match(/(?:עבור|שם הלקוח הוא|שם הלקוח:|שם הלקוח|לקוח:|הלקוח הוא|הלקוח|חברת|חברה|בנק)\s*[:\-–]?\s*([A-Za-z0-9\u0590-\u05FF\s\-&]+)/i);
  if (clientMatch && clientMatch[1]) {
    const raw = clientMatch[1].trim().replace(/[.,!?:;]+$/, '');
    const blockedKeywords = ['בדיקה', 'שרת', 'האפליקציה', 'מערכת', 'סיים', 'הפק', 'חלונות'];
    if (raw.length >= 2 && raw.length <= 40 && !blockedKeywords.some(b => raw.includes(b))) {
      detectedClientName = raw;
    }
  }

  // 2. Natural Language Extraction of Target System
  let detectedTargetSystem: string | null = null;
  if (msg.includes('וורדפרס') || lower.includes('wordpress')) {
    detectedTargetSystem = 'סביבת WordPress ו-Plugins';
  } else if (lower.includes('api') || msg.includes('נקודות קצה')) {
    detectedTargetSystem = 'ממשקי API ושירותי Backend';
  } else if (lower.includes('ios') || lower.includes('android') || msg.includes('מובייל') || lower.includes('mobile') || msg.includes('אפליקציה')) {
    detectedTargetSystem = 'אפליקציית מובייל (iOS & Android)';
  } else if (lower.includes('aws') || lower.includes('azure') || msg.includes('ענן') || lower.includes('cloud')) {
    detectedTargetSystem = 'תשתיות ענן ו-Cloud Architecture';
  } else if (msg.includes('איקומרס') || msg.includes('סחר') || lower.includes('ecommerce')) {
    detectedTargetSystem = 'פלטפורמת מסחר אלקטרוני (eCommerce)';
  }

  // 3. Scope Details Extraction from chat
  const scopeDetails: {
    environment?: string;
    roles?: string;
    endpointsOrIps?: string;
    attackVectors?: string;
    testingHours?: string;
    criticalSystems?: string;
  } = {};

  if (msg.includes('כתובות IP') || msg.includes('כתובת IP') || lower.includes('ip')) {
    scopeDetails.endpointsOrIps = msg;
  } else if (msg.includes('endpoints') || lower.includes('endpoint')) {
    scopeDetails.endpointsOrIps = msg;
  }
  if (msg.includes('תפקידים') || msg.includes('הרשאות') || lower.includes('rbac') || lower.includes('admin') || msg.includes('מנהל')) {
    scopeDetails.roles = msg;
  }
  if (msg.includes('שעות') || msg.includes('לילה') || msg.includes('סופ"ש') || msg.includes('חלונות בדיקה')) {
    scopeDetails.testingHours = msg;
  }
  if (msg.includes('סליקה') || msg.includes('תשלום') || msg.includes('בסיס נתונים') || msg.includes('קריטי')) {
    scopeDetails.criticalSystems = msg;
  }

  // 4. Check for explicit custom requirement instructions (התחשבות בהנחיות אישיות)
  const isServerSpecial =
    msg.includes('שרת') || msg.includes('שרת ספציפי') || lower.includes('server');
  const isPaymentOrFintech =
    msg.includes('תשלום') ||
    msg.includes('אשראי') ||
    msg.includes('סליקה') ||
    lower.includes('stripe') ||
    lower.includes('pci') ||
    lower.includes('payment');
  const isDDoS =
    msg.includes('עומס') ||
    msg.includes('ddos') ||
    lower.includes('dos') ||
    msg.includes('הצפה');
  const isCodeAudit =
    msg.includes('קוד') ||
    msg.includes('סקירת קוד') ||
    lower.includes('whitebox') ||
    lower.includes('source code');
  const isMicroservices =
    msg.includes('מיקרוסרוויס') ||
    msg.includes('kubernetes') ||
    msg.includes('k8s') ||
    msg.includes('קונטיינר');
  const isCloudSpecial =
    msg.includes('ענן') ||
    lower.includes('aws') ||
    lower.includes('azure') ||
    lower.includes('gcp');

  if (isServerSpecial && !customRequirements.some((r) => r.includes('שרת ספציפי'))) {
    newRequirement = 'בדיקת עומק ייעודית לשרת ספציפי';
    deltaMd += 1.5;
    updatedComponents.push({
      name: 'בדיקת עומק ייעודית לשרת ספציפי',
      md: 1.5,
      desc: 'סקירת קונפיגורציה, הרשאות שורש ובדיקת חדירות פרטנית לרכיב הנבחר',
      isCustom: true,
    });
  } else if (isPaymentOrFintech && !customRequirements.some((r) => r.includes('תשלום'))) {
    newRequirement = 'בדיקת עמידה בתקני סליקה ואבטחת תשלומים (PCI-DSS)';
    deltaMd += 2;
    updatedComponents.push({
      name: 'בדיקת מודול סליקה ותשלומים (PCI-DSS Focus)',
      md: 2,
      desc: 'בדיקת הצפנת כרטיסי אשראי, ניתוב תשלומים ואימות תעודות מול Gateway',
      isCustom: true,
    });
  } else if (isDDoS && !customRequirements.some((r) => r.includes('עומס'))) {
    newRequirement = 'בדיקת עמידות לעומסים ופגיעות למניעת שירות (DoS/DDoS Simulation)';
    deltaMd += 1;
    updatedComponents.push({
      name: 'בדיקת שרידות עומסים ו-DoS לוגי',
      md: 1,
      desc: 'בדיקת Rate Limiting, חסימת הצפות בקשות ומניעת השבתת שירות',
      isCustom: true,
    });
  } else if (isCodeAudit && !customRequirements.some((r) => r.includes('קוד מקור'))) {
    newRequirement = 'סקירת קוד מקור ידנית ואוטומטית (SAST / Whitebox Review)';
    deltaMd += 2.5;
    updatedComponents.push({
      name: 'סקירת קוד מקור (Whitebox Code Review)',
      md: 2.5,
      desc: 'ניתוח סטטי ידני וממוחשב של קוד האפליקציה למניעת חולשות מובנות',
      isCustom: true,
    });
  } else if (isMicroservices && !customRequirements.some((r) => r.includes('מיקרוסרוויסים'))) {
    newRequirement = 'סריקת ארכיטקטורת Kubernetes ומיקרוסרוויסים';
    deltaMd += 2;
    updatedComponents.push({
      name: 'בדיקת אבטחת K8s וארכיטקטורת Microservices',
      md: 2,
      desc: 'אימות הפרדות סגמנטציה בתוך הקלאסטר, הרשאות Service Accounts וסודות',
      isCustom: true,
    });
  } else if (isCloudSpecial && !customRequirements.some((r) => r.includes('ענן'))) {
    newRequirement = 'בדיקת תצורת ענן ו-IAM (Cloud Security Review)';
    deltaMd += 1.5;
    updatedComponents.push({
      name: 'סקירת אבטחת ענן (Cloud Configuration & IAM)',
      md: 1.5,
      desc: 'בדיקת הגדרות S3/Storage, חוקי Security Groups ומדיניות הרשאות IAM',
      isCustom: true,
    });
  } else if (msg.length > 20 && !msg.includes('כתובות') && !msg.includes('תפקידים') && !msg.includes('מעל') && !msg.includes('עד')) {
    // Arbitrary custom requirement
    newRequirement = `הנחיה מיוחדת: "${msg.slice(0, 45)}..."`;
    deltaMd += 1;
    updatedComponents.push({
      name: `דרישה מותאמת: ${msg.slice(0, 30)}`,
      md: 1,
      desc: `שולב לבקשת הלקוח בצ'אט: ${msg}`,
      isCustom: true,
    });
  }

  // Answer handling according to the steps
  if (msg.includes('מעל 100') || msg.includes('רשת מורכבת')) {
    deltaMd += 3;
  } else if (msg.includes('50-100') || msg.includes('5+ תפקידים')) {
    deltaMd += 2;
  } else if (msg.includes('20-50') || msg.includes('3-4 תפקידים')) {
    deltaMd += 1;
  }

  const updatedTotalMd = currentMandays + deltaMd;
  const totalCost = updatedTotalMd * dailyRate;

  // Question sequences based on turn count
  if (userTurnCount === 1) {
    let nextQ = '';
    let options: string[] = [];

    if (config.categoryKey === 'infra') {
      nextQ = `רשמתי לפניי. ${newRequirement ? `שילבתי מיד את הדרישה הייעודית: "${newRequirement}" (+${deltaMd} MD). ` : ''}
שאלה הבאה: **לגבי שרתים וסביבות פנימיות — האם המערכת כוללת דומיין Active Directory, שרתי לינוקס פנימיים או שילוב ענן היברידי?**`;
      options = ['סביבת Active Directory ושרתי Windows', 'שרתי Linux בלבד (בענן)', 'סביבה היברידית (AD + Cloud + Linux)', 'ללא שרתים פנימיים (רק שירותים מנוהלים)'];
    } else if (config.categoryKey === 'app') {
      nextQ = `מעולה, הנתון עודכן. ${newRequirement ? `הוספתי את הדרישה המיוחדת: "${newRequirement}" (+${deltaMd} MD). ` : ''}
שאלה הבאה: **כמה נקודות קצה של API (Endpoints) ישנן? והאם קיימות אינטגרציות צד-שלישי קריטיות (מערכות תשלומים, CRM, Webhooks)?**`;
      options = ['עד 15 endpoints פשוטים', '15-40 endpoints כולל אינטגרציות צד ג', 'מעל 40 endpoints וארכיטקטורת מיקרוסרוויסים', 'ללא API חיצוני (מונולית בלבד)'];
    } else if (config.categoryKey === 'mobile') {
      nextQ = `הבנתי. ${newRequirement ? `שילבתי את הדגש המיוחד: "${newRequirement}" (+${deltaMd} MD). ` : ''}
שאלה הבאה: **האם באפליקציה קיימים מנגנוני הגנה מתקדמים שצריך לעקוף/לבדוק (כגון Certificate Pinning, Root/Jailbreak Detection, חסימת צילומי מסך)?**`;
      options = ['כן, יש SSL Pinning והגנת Root/Jailbreak', 'רק SSL Pinning בסיסי', 'אין מנגנוני הגנה מיוחדים בצד הלקוח', 'לא ידוע כרגע / דורש בירור'];
    } else {
      nextQ = `מצוין. ${newRequirement ? `שילבתי את הדגש: "${newRequirement}" (+${deltaMd} MD). ` : ''}
שאלה הבאה: **אילו וקטורי תקיפה מורשים בפעילות? (האם ניתן לבצע פישינג לעובדים, ניסיונות עקיפת EDR, או פריצה פיזית)?**`;
      options = ['פישינג ממוקד (Spear Phishing) + עקיפת EDR', 'תקיפה תשתיתית מרחוק בלבד (ללא הנדסה אנושית)', 'כל הווקטורים מורשים כולל הנדסה אנושית', 'הדמיית תוקף פנימי (Assumed Breach)'];
    }

    return {
      aiMessage: `קיבלתי ועיבדתי את הנתונים. המחשבון החי עודכן ל-${updatedTotalMd} ימי אדם (MD).`,
      nextQuestion: nextQ,
      options,
      mandaysDelta: deltaMd,
      totalMandays: updatedTotalMd,
      newCustomRequirement: newRequirement,
      detectedClientName,
      detectedTargetSystem,
      scopeDetails,
      components: updatedComponents,
      isComplete: false,
    };
  }

  if (userTurnCount === 2) {
    const nextQ = `תודה! ${newRequirement ? `הוספתי בהצלחה את הדרישה: "${newRequirement}". ` : ''}
שאלה אחרונה לדיוק הסופי: **האם ישנן מערכות קריטיות שאסור להשבית, שעות בדיקה מועדפות (בלילה / סופ"ש) או הנחיות אישיות נוספות?**
(ניתן לבחור מהאפשרויות או להקליד דרישות חופשיות בתיבה למטה)`;
    const options = ['חלונות בדיקה רגילים (שעות עבודה)', 'בדיקות לילה/סופ"ש בלבד (+תוספת MD)', 'ללא מגבלות זמן מיוחדות', 'סיים אפיון והפק הצעת מחיר'];

    return {
      aiMessage: `פרטי הסביבה נקלטו במדויק. היקף הפרויקט עומד כעת על ${updatedTotalMd} ימי עבודה (MD).`,
      nextQuestion: nextQ,
      options,
      mandaysDelta: deltaMd,
      totalMandays: updatedTotalMd,
      newCustomRequirement: newRequirement,
      detectedClientName,
      detectedTargetSystem,
      scopeDetails,
      components: updatedComponents,
      isComplete: false,
    };
  }

  // Turn 3 or user finished / typed "סיים" / "הפק"
  const summary = `אפיון מקצועי למבדק ${config.categoryName} (${config.testType}) בסביבת ${config.staging ? 'Staging' : 'Production'}, מותאם לתבנית ${template.name}. שולבו כלל רכיבי האפיון והדגשים המיוחדים שהוזנו בצ'אט.`;

  return {
    aiMessage: `תהליך האפיון והסקופינג הושלם בהצלחה! שכללתי את כל הנתונים, המורכבות וההנחיות האישיות מהשיחה להצעת מחיר סופית מדויקת.`,
    nextQuestion: null,
    options: [],
    mandaysDelta: deltaMd,
    totalMandays: updatedTotalMd,
    newCustomRequirement: newRequirement,
    detectedClientName,
    detectedTargetSystem,
    scopeDetails,
    components: updatedComponents,
    isComplete: true,
    proposal: {
      summary,
      components: updatedComponents,
      totalMd: updatedTotalMd,
      totalCost,
    },
  };
}
