import { ProjectTemplate } from '../types';
import { ScopingConfig } from './aiScopingService';

export interface ScopingQuestion {
  /** Stable id, used to record the answer against a scope field. */
  id: string;
  text: string;
  options: string[];
  /** Which scope detail this answer feeds. */
  field?:
    | 'client'
    | 'environment'
    | 'roles'
    | 'endpointsOrIps'
    | 'attackVectors'
    | 'testingHours'
    | 'criticalSystems';
  /** Extra man-days when the matching option index is chosen. */
  weights?: number[];
}

/* ------------------------------------------------------------------ *
 * The bank is assembled per session from four sources, in this order:
 *   1. who the quote is for
 *   2. the test category chosen in step 1 (סוג ותצורה)
 *   3. the configuration itself — environment, test type, complexity
 *   4. the template chosen in step 2, which also sets how many to ask
 * ------------------------------------------------------------------ */

const OPENING: ScopingQuestion[] = [
  {
    id: 'client',
    text: 'נתחיל מהבסיס — **עבור מי ההצעה?** רשמו את שם הלקוח או הארגון (אפשר גם להוסיף את שם המערכת הנבדקת).',
    options: [],
    field: 'client',
  },
  {
    id: 'target-system',
    text: '**מהי מערכת היעד המרכזית לבדיקה?** (למשל: אתר WordPress, אפליקציית מובייל, תשתית AWS, פורטל לקוחות)',
    options: ['אתר / פורטל web', 'אפליקציית מובייל', 'תשתית ענן', 'רשת פנים-ארגונית'],
    field: 'environment',
  },
];

const BY_CATEGORY: Record<ScopingConfig['categoryKey'], ScopingQuestion[]> = {
  infra: [
    {
      id: 'infra-ips',
      text: '**כמה כתובות IP ופריטי ציוד ייכללו בבדיקה?**',
      options: ['פחות מ-20', '20-50', '50-100', 'מעל 100'],
      field: 'endpointsOrIps',
      weights: [0, 1, 2, 4],
    },
    {
      id: 'infra-ad',
      text: '**האם הסביבה כוללת דומיין Active Directory, שרתי לינוקס פנימיים או ענן היברידי?**',
      options: [
        'Active Directory ושרתי Windows',
        'שרתי Linux בלבד',
        'סביבה היברידית (AD + Cloud + Linux)',
        'ללא שרתים פנימיים',
      ],
      field: 'environment',
      weights: [1, 1, 3, 0],
    },
    {
      id: 'infra-segmentation',
      text: '**האם קיימת הפרדת רשתות (Segmentation) שצריך לבדוק מעבר בינה?**',
      options: ['כן, VLANים מרובים', 'הפרדה חלקית', 'רשת שטוחה אחת', 'לא ידוע'],
      weights: [2, 1, 0, 1],
    },
    {
      id: 'infra-vpn',
      text: '**האם יש גישת VPN או עבודה מרחוק שצריך לכלול בהיקף?**',
      options: ['כן, VPN ארגוני', 'כן, גישת ספקים חיצוניים', 'שניהם', 'לא'],
      weights: [1, 1, 2, 0],
    },
    {
      id: 'infra-wifi',
      text: '**האם לכלול בדיקת רשתות אלחוטיות (Wi-Fi) באתר הלקוח?**',
      options: ['כן, כולל ביקור באתר', 'כן, מרחוק בלבד', 'לא'],
      weights: [2, 1, 0],
    },
    {
      id: 'infra-ot',
      text: '**האם קיימות מערכות OT/ICS או ציוד ייעודי (מצלמות, בקרים) בהיקף?**',
      options: ['כן, מערכות OT קריטיות', 'ציוד IoT בלבד', 'לא'],
      weights: [4, 2, 0],
    },
  ],
  app: [
    {
      id: 'app-endpoints',
      text: '**כמה נקודות קצה (API Endpoints) קיימות במערכת?**',
      options: ['עד 15', '15-40', 'מעל 40 (מיקרוסרוויסים)', 'ללא API חיצוני'],
      field: 'endpointsOrIps',
      weights: [0, 2, 4, 0],
    },
    {
      id: 'app-roles',
      text: '**אילו רמות הרשאה קיימות ויש לבדוק ביניהן הסלמה?**',
      options: ['אורח + משתמש', 'משתמש + מנהל', 'שלוש רמות ומעלה', 'משתמש יחיד בלבד'],
      field: 'roles',
      weights: [1, 2, 3, 0],
    },
    {
      id: 'app-auth',
      text: '**כיצד מתבצעת ההזדהות במערכת?**',
      options: ['שם משתמש וסיסמה', 'SSO / OAuth', 'MFA מלא', 'משולב'],
      weights: [0, 1, 2, 2],
    },
    {
      id: 'app-payments',
      text: '**האם קיימות אינטגרציות תשלום או מערכות צד-שלישי קריטיות?**',
      options: ['כן, סליקת אשראי', 'כן, CRM/ERP', 'Webhooks בלבד', 'אין'],
      weights: [3, 2, 1, 0],
    },
    {
      id: 'app-upload',
      text: '**האם המערכת מאפשרת העלאת קבצים או עיבוד מסמכים?**',
      options: ['כן, העלאה חופשית', 'כן, מוגבל לסוגים', 'לא'],
      weights: [2, 1, 0],
    },
    {
      id: 'app-tech',
      text: '**מהו הסטאק הטכנולוגי המרכזי?**',
      options: ['WordPress / CMS', 'React/Node', '.NET / Java', 'אחר'],
      weights: [0, 1, 1, 1],
    },
  ],
  mobile: [
    {
      id: 'mobile-platforms',
      text: '**אילו פלטפורמות נכללות בבדיקה?**',
      options: ['iOS בלבד', 'Android בלבד', 'שתיהן', 'שתיהן + טאבלט'],
      weights: [0, 0, 3, 4],
    },
    {
      id: 'mobile-hardening',
      text: '**אילו מנגנוני הגנה קיימים באפליקציה?**',
      options: [
        'SSL Pinning + זיהוי Root/Jailbreak',
        'SSL Pinning בסיסי',
        'ללא מנגנוני הגנה',
        'לא ידוע',
      ],
      weights: [3, 1, 0, 1],
    },
    {
      id: 'mobile-storage',
      text: '**האם האפליקציה שומרת מידע רגיש במכשיר?**',
      options: ['כן, כולל אישורים', 'כן, מידע לא רגיש', 'לא שומרת', 'לא ידוע'],
      field: 'criticalSystems',
      weights: [2, 1, 0, 1],
    },
    {
      id: 'mobile-api',
      text: '**האם שרתי ה-API של האפליקציה נכללים בהיקף?**',
      options: ['כן, כולל', 'רק חלקית', 'לא, האפליקציה בלבד'],
      field: 'endpointsOrIps',
      weights: [3, 1, 0],
    },
    {
      id: 'mobile-biometric',
      text: '**האם קיימת הזדהות ביומטרית או מנגנון תשלום בתוך האפליקציה?**',
      options: ['ביומטרי בלבד', 'תשלומים בלבד', 'שניהם', 'אין'],
      weights: [1, 2, 3, 0],
    },
    {
      id: 'mobile-distribution',
      text: '**כיצד תסופק האפליקציה לבדיקה?**',
      options: ['חנות רשמית', 'TestFlight / APK', 'סביבת בדיקות ייעודית', 'טרם הוחלט'],
      weights: [0, 0, 1, 1],
    },
  ],
  red: [
    {
      id: 'red-vectors',
      text: '**אילו וקטורי תקיפה מורשים בתרגיל?**',
      options: [
        'פישינג ממוקד + עקיפת EDR',
        'תשתיתי מרחוק בלבד',
        'כל הווקטורים כולל הנדסה אנושית',
        'Assumed Breach (תוקף פנימי)',
      ],
      field: 'attackVectors',
      weights: [3, 1, 5, 2],
    },
    {
      id: 'red-goal',
      text: '**מהי מטרת התרגיל (Flag) שיש להשיג?**',
      options: [
        'השתלטות על Domain Admin',
        'גישה למידע לקוחות',
        'הוכחת שרשרת תקיפה מלאה',
        'בדיקת יכולות הזיהוי של ה-SOC',
      ],
      field: 'criticalSystems',
      weights: [3, 3, 4, 2],
    },
    {
      id: 'red-awareness',
      text: '**האם צוות ההגנה מודע לתרגיל?**',
      options: ['לא, תרגיל עיוור מלא', 'רק ההנהלה מודעת', 'כן, תרגיל משותף (Purple)'],
      weights: [2, 1, 0],
    },
    {
      id: 'red-physical',
      text: '**האם התרגיל כולל חדירה פיזית לאתרי הארגון?**',
      options: ['כן, כולל כניסה פיזית', 'רק בדיקת היקף חיצוני', 'לא'],
      weights: [4, 1, 0],
    },
    {
      id: 'red-duration',
      text: '**מהו משך התרגיל המבוקש?**',
      options: ['שבוע', 'שבועיים', 'חודש ומעלה', 'גמיש'],
      weights: [0, 2, 5, 1],
    },
    {
      id: 'red-persistence',
      text: '**האם נדרש להדגים שרידות (Persistence) לאורך זמן?**',
      options: ['כן', 'לא', 'רק אם יתאפשר'],
      weights: [2, 0, 1],
    },
  ],
};

/** Questions that only make sense given the step-1 configuration. */
function configQuestions(config: ScopingConfig): ScopingQuestion[] {
  const out: ScopingQuestion[] = [];

  if (config.staging) {
    out.push({
      id: 'cfg-staging-parity',
      text: '**עד כמה סביבת ה-Staging זהה לסביבת הייצור?**',
      options: ['זהה לחלוטין', 'דומה עם נתוני דמה', 'שונה מהותית'],
      field: 'environment',
      weights: [0, 1, 2],
    });
  } else {
    out.push({
      id: 'cfg-prod-risk',
      text: 'הבדיקה מתבצעת ב-**סביבת ייצור חי**. **אילו מגבלות יש להקפיד עליהן?**',
      options: [
        'ללא בדיקות עומס או DoS',
        'ללא שינוי נתונים',
        'שתי המגבלות',
        'ללא מגבלות מיוחדות',
      ],
      field: 'criticalSystems',
      weights: [1, 1, 2, 0],
    });
  }

  if (config.testType === 'Whitebox' || config.testType === 'Greybox') {
    out.push({
      id: 'cfg-access',
      text: `בחרת מודל **${config.testType}**. **איזה חומר יימסר לצוות הבודק?**`,
      options: [
        'משתמשי בדיקה בלבד',
        'משתמשים + תיעוד ארכיטקטורה',
        'גישה מלאה לקוד המקור',
        'טרם הוחלט',
      ],
      field: 'roles',
      weights: [0, 1, 2, 1],
    });
  } else {
    out.push({
      id: 'cfg-blackbox-recon',
      text: 'בחרת **Blackbox**. **האם נדרש שלב איסוף מודיעין (OSINT) מקדים?**',
      options: ['כן, מקיף', 'בסיסי בלבד', 'לא נדרש'],
      weights: [2, 1, 0],
    });
  }

  if (config.complexity === 'מורכבת') {
    out.push({
      id: 'cfg-complex-envs',
      text: 'סימנת מורכבות **גבוהה**. **כמה סביבות נפרדות ייכללו בבדיקה?**',
      options: ['שתיים', 'שלוש', 'ארבע ומעלה'],
      weights: [1, 2, 4],
    });
  }

  out.push({
    id: 'cfg-hours',
    text: '**מהם חלונות הזמן המועדפים לביצוע הבדיקה?**',
    options: [
      'שעות עבודה רגילות',
      'לילות בלבד',
      'סופי שבוע',
      'ללא מגבלה',
    ],
    field: 'testingHours',
    weights: [0, 2, 2, 0],
  });

  return out;
}

/** Deeper questions unlocked by the chosen template. */
const BY_TEMPLATE: Record<ProjectTemplate['key'], ScopingQuestion[]> = {
  mvp: [
    {
      id: 'mvp-stage',
      text: '**באיזה שלב נמצא המוצר?**',
      options: ['טרום השקה', 'בטא מוקדמת', 'בייצור עם לקוחות'],
      weights: [0, 1, 2],
    },
    {
      id: 'mvp-report',
      text: '**איזה סוג דוח נדרש?**',
      options: ['דוח מנהלים מקוצר', 'דוח טכני מלא', 'שניהם'],
      weights: [0, 1, 2],
    },
  ],
  fintech: [
    {
      id: 'fin-regulation',
      text: '**אילו תקנים רגולטוריים רלוונטיים לבדיקה?**',
      options: ['PCI DSS', 'SOC 2', 'שניהם', 'הוראות בנק ישראל / רשות ניע'],
      field: 'criticalSystems',
      weights: [3, 3, 5, 4],
    },
    {
      id: 'fin-pii',
      text: '**האם המערכת מעבדת מידע פיננסי או מזהה אישי של לקוחות?**',
      options: ['כן, כרטיסי אשראי', 'כן, מידע אישי בלבד', 'שניהם', 'לא'],
      weights: [3, 2, 4, 0],
    },
    {
      id: 'fin-flows',
      text: '**אילו תהליכים כספיים יש לבדוק לעומק?**',
      options: ['העברות כספים', 'אישור הרשאות ומורשי חתימה', 'התאמות וסליקה', 'כל התהליכים'],
      weights: [2, 2, 2, 5],
    },
    {
      id: 'fin-audit',
      text: '**האם נדרש ליווי לצורך ביקורת חיצונית או דוח לרגולטור?**',
      options: ['כן, כולל מסמכי ביקורת', 'רק דוח סטנדרטי', 'לא'],
      weights: [3, 0, 0],
    },
    {
      id: 'fin-retest',
      text: '**כמה סבבי Retest נדרשים לאחר התיקונים?**',
      options: ['אחד', 'שניים', 'ללא Retest'],
      weights: [1, 3, 0],
    },
  ],
  core: [
    {
      id: 'core-sites',
      text: '**כמה אתרים או סניפים פיזיים נכללים בהיקף?**',
      options: ['אתר יחיד', '2-3 אתרים', '4 ומעלה'],
      weights: [0, 2, 5],
    },
    {
      id: 'core-cloud',
      text: '**אילו ספקי ענן בשימוש?**',
      options: ['AWS', 'Azure', 'GCP', 'מולטי-קלאוד'],
      weights: [2, 2, 2, 5],
    },
    {
      id: 'core-ad-tier',
      text: '**האם קיים מודל Tiering ל-Active Directory שיש לבדוק?**',
      options: ['כן, מיושם במלואו', 'חלקית', 'לא מיושם', 'לא ידוע'],
      weights: [2, 2, 3, 2],
    },
    {
      id: 'core-soc',
      text: '**האם קיים SOC פעיל שיש לתאם מולו?**',
      options: ['כן, 24/7', 'כן, שעות עבודה', 'מיקור חוץ', 'אין'],
      weights: [2, 1, 1, 0],
    },
    {
      id: 'core-change',
      text: '**האם נדרש תהליך אישור שינויים (Change Management) לפני כל בדיקה?**',
      options: ['כן, פורמלי', 'תיאום בסיסי', 'לא נדרש'],
      weights: [2, 1, 0],
    },
    {
      id: 'core-legacy',
      text: '**האם קיימות מערכות Legacy שדורשות טיפול זהיר?**',
      options: ['כן, קריטיות', 'כן, משניות', 'לא'],
      field: 'criticalSystems',
      weights: [3, 1, 0],
    },
    {
      id: 'core-dr',
      text: '**האם לכלול בדיקה של סביבת DR / גיבויים?**',
      options: ['כן', 'רק סקירה', 'לא'],
      weights: [3, 1, 0],
    },
  ],
  mobile: [
    {
      id: 'mob-users',
      text: '**מהו היקף משתמשי האפליקציה?**',
      options: ['עד 1,000', '1,000-50,000', 'מעל 50,000'],
      weights: [0, 1, 2],
    },
    {
      id: 'mob-offline',
      text: '**האם האפליקציה פועלת גם במצב לא מקוון?**',
      options: ['כן, סנכרון מלא', 'חלקית', 'לא'],
      weights: [2, 1, 0],
    },
    {
      id: 'mob-sdk',
      text: '**האם משולבים SDK של צד-שלישי (אנליטיקס, פרסום, תשלומים)?**',
      options: ['כן, מרובים', 'אחד או שניים', 'אין'],
      weights: [2, 1, 0],
    },
  ],
};

/** Closing question, always last, lets the user add anything free-form. */
const CLOSING: ScopingQuestion = {
  id: 'closing',
  text: '**דרישות מיוחדות או מערכות שאסור להשבית?** אפשר לכתוב חופשי, או לסיים ולהפיק את ההצעה.',
  options: ['אין דרישות מיוחדות', 'סיים אפיון והפק הצעת מחיר'],
  field: 'criticalSystems',
};

/** How many questions the chosen template promises (e.g. "24 שאלות" → 24). */
export function plannedQuestionCount(template: ProjectTemplate): number {
  const n = parseInt(String(template.q).replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

/**
 * Assembles the run of questions for this session. The template decides how
 * many are asked; when the bank has fewer distinct questions than promised,
 * the remainder is filled with focused depth-probes rather than repeats.
 */
export function buildQuestionRun(
  config: ScopingConfig,
  template: ProjectTemplate
): ScopingQuestion[] {
  const target = plannedQuestionCount(template);

  const core: ScopingQuestion[] = [
    ...OPENING,
    ...(BY_CATEGORY[config.categoryKey] || []),
    ...configQuestions(config),
    ...(BY_TEMPLATE[template.key] || []),
  ];

  // Trim to the promised count, always keeping the closing question last.
  const body = core.slice(0, Math.max(1, target - 1));

  // If the template promises more than the bank holds, top up with
  // per-area depth probes so the count is honoured without repetition.
  const AREAS = [
    'ניהול משתמשים והרשאות',
    'הצפנה ואחסון מידע',
    'ממשקים חיצוניים',
    'ניטור ותיעוד (Logging)',
    'גיבוי ושחזור',
    'ניהול סיסמאות וסודות',
    'עדכוני אבטחה וגרסאות',
    'הקשחת שרתים',
    'ניהול צד-שלישי וספקים',
    'המשכיות עסקית',
  ];
  let area = 0;
  while (body.length < target - 1) {
    const name = AREAS[area % AREAS.length];
    body.push({
      id: `depth-${area}`,
      text: `**${name}** — עד כמה תחום זה נדרש להיכלל בעומק הבדיקה?`,
      options: ['בדיקה מעמיקה', 'סקירה בלבד', 'לא רלוונטי'],
      weights: [2, 1, 0],
    });
    area += 1;
  }

  return [...body, CLOSING];
}
