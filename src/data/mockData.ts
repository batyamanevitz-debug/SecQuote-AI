import { Quote, UserItem, MarketTier, ProjectTemplate } from '../types';

export const INITIAL_QUOTES: Quote[] = [
  { id: '1', client: 'בנק מרידיאן - חטיבת סייבר', initials: 'במ', date: '07/09/2026', kind: 'מבדק חדירות תשתיתי (PT)', status: 'טיוטה', cost: '₪35,000', rawCost: 35000, mandays: 7, authorName: 'רותם אלגזי', organizationName: 'Elgazi Cyber Labs', authorEmail: 'rotem@demo.secquote.ai' },
  { id: '2', client: 'אורביט טכנולוגיות בע״מ', initials: 'אט', date: '05/09/2026', kind: 'מבדק אפליקטיבי ו-API', status: 'נשלח', cost: '₪28,000', rawCost: 28000, mandays: 6, authorName: 'רותם אלגזי', organizationName: 'Elgazi Cyber Labs', authorEmail: 'rotem@demo.secquote.ai' },
  { id: '3', client: 'קבוצת נובה ביטוח', initials: 'קנ', date: '02/09/2026', kind: 'תרגיל צוות אדום (Red Team)', status: 'אושר', cost: '₪72,000', rawCost: 72000, mandays: 12, authorName: 'רותם אלגזי', organizationName: 'Elgazi Cyber Labs', authorEmail: 'rotem@demo.secquote.ai' },
  { id: '4', client: 'אוטוסקופ מערכות בע״מ', initials: 'אמ', date: '28/08/2026', kind: 'מבדק תשתיות ענן AWS', status: 'נשלח', cost: '₪91,000', rawCost: 91000, mandays: 16, authorName: 'רותם אלגזי', organizationName: 'Elgazi Cyber Labs', authorEmail: 'rotem@demo.secquote.ai' },
  { id: '5', client: 'עיריית כרמל־הים', initials: 'עכ', date: '21/08/2026', kind: 'מבדק פורטל וממשקי תושב', status: 'טיוטה', cost: '₪47,500', rawCost: 47500, mandays: 9, authorName: 'רותם אלגזי', organizationName: 'Elgazi Cyber Labs', authorEmail: 'rotem@demo.secquote.ai' },
  { id: '6', client: 'מרכז רפואי הדסים', initials: 'מה', date: '14/08/2026', kind: 'תרגיל סייבר משולב OT/IT', status: 'אושר', cost: '₪124,000', rawCost: 124000, mandays: 20, authorName: 'רותם אלגזי', organizationName: 'Elgazi Cyber Labs', authorEmail: 'rotem@demo.secquote.ai' },
];

export interface OrgFinancialInfo {
  organization: string;
  hpNumber: string;
  bankNumber: string;
  bankName: string;
  branchNumber: string;
  bankAccountNumber: string;
  beneficiaryName: string;
  authorName: string;
  authorEmail: string;
  authorPhone: string;
}

/**
 * Demo-only billing profiles. Every value here is fictional on purpose:
 * demo mode is reachable without signing in, so nothing real belongs in it.
 * A signed-in user's own details come from their profile row, never from here.
 */
export const ORG_FINANCIAL_PROFILES: Record<string, OrgFinancialInfo> = {
  'Elgazi Cyber Labs': {
    organization: 'Elgazi Cyber Labs',
    hpNumber: '500000101',
    bankNumber: '12',
    bankName: 'בנק הפועלים',
    branchNumber: '100',
    bankAccountNumber: '100101',
    beneficiaryName: 'Elgazi Cyber Labs (דמו)',
    authorName: 'רותם אלגזי',
    authorEmail: 'rotem@demo.secquote.ai',
    authorPhone: '050-0000101',
  },
  'Northgate Security': {
    organization: 'Northgate Security',
    hpNumber: '500000102',
    bankNumber: '14',
    bankName: 'אוצר החייל',
    branchNumber: '200',
    bankAccountNumber: '100102',
    beneficiaryName: 'Northgate Security (דמו)',
    authorName: 'דוד כהן',
    authorEmail: 'david.cohen@demo.secquote.ai',
    authorPhone: '050-0000102',
  },
  'Redstone Systems': {
    organization: 'Redstone Systems',
    hpNumber: '500000103',
    bankNumber: '10',
    bankName: 'בנק לאומי',
    branchNumber: '300',
    bankAccountNumber: '100103',
    beneficiaryName: 'Redstone Systems (דמו)',
    authorName: 'שירה לביא',
    authorEmail: 'shira.lavi@demo.secquote.ai',
    authorPhone: '050-0000103',
  },
  'Aegis Defense Labs': {
    organization: 'Aegis Defense Labs',
    hpNumber: '500000104',
    bankNumber: '12',
    bankName: 'בנק הפועלים',
    branchNumber: '400',
    bankAccountNumber: '100104',
    beneficiaryName: 'Aegis Defense Labs (דמו)',
    authorName: 'מיכל אברהם',
    authorEmail: 'michal.a@demo.secquote.ai',
    authorPhone: '050-0000104',
  },
  'Sentinel IR Group': {
    organization: 'Sentinel IR Group',
    hpNumber: '500000105',
    bankNumber: '11',
    bankName: 'בנק דיסקונט',
    branchNumber: '500',
    bankAccountNumber: '100105',
    beneficiaryName: 'Sentinel IR Group (דמו)',
    authorName: 'איתן שלו',
    authorEmail: 'eitan.shalev@demo.secquote.ai',
    authorPhone: '050-0000105',
  },
  'Meridian Cyber Advisory': {
    organization: 'Meridian Cyber Advisory',
    hpNumber: '500000106',
    bankNumber: '20',
    bankName: 'בנק מזרחי טפחות',
    branchNumber: '600',
    bankAccountNumber: '100106',
    beneficiaryName: 'Meridian Cyber Advisory (דמו)',
    authorName: 'נועה ברק',
    authorEmail: 'noa.barak@demo.secquote.ai',
    authorPhone: '050-0000106',
  },
  'Vaultline Security': {
    organization: 'Vaultline Security',
    hpNumber: '500000107',
    bankNumber: '12',
    bankName: 'בנק הפועלים',
    branchNumber: '700',
    bankAccountNumber: '100107',
    beneficiaryName: 'Vaultline Security (דמו)',
    authorName: 'יובל רזי',
    authorEmail: 'yuval.razi@demo.secquote.ai',
    authorPhone: '050-0000107',
  },
};

/** Used when nothing is known — better a blank line on a document than someone else's bank account. */
const EMPTY_FINANCIAL: OrgFinancialInfo = {
  organization: '',
  hpNumber: '',
  bankNumber: '',
  bankName: '',
  branchNumber: '',
  bankAccountNumber: '',
  beneficiaryName: '',
  authorName: '',
  authorEmail: '',
  authorPhone: '',
};

export function getOrgFinancialDetails(
  orgName?: string,
  user?: Partial<UserItem> | null
): OrgFinancialInfo {
  const rawOrg = user?.organization || orgName || '';

  // Only the demo personas have canned billing details. For everyone else the
  // user's own profile is the single source of truth — falling back to another
  // organisation's bank account would print the wrong payee on a real document.
  const matchedKey =
    Object.keys(ORG_FINANCIAL_PROFILES).find(
      (k) => k.toLowerCase() === rawOrg.trim().toLowerCase()
    ) || null;

  const base = matchedKey ? ORG_FINANCIAL_PROFILES[matchedKey] : EMPTY_FINANCIAL;

  return {
    organization: user?.organization || orgName || base.organization,
    hpNumber: user?.hpNumber || base.hpNumber,
    bankNumber: user?.bankNumber || base.bankNumber,
    bankName: base.bankName,
    branchNumber: user?.branchNumber || base.branchNumber,
    bankAccountNumber: user?.bankAccountNumber || base.bankAccountNumber,
    beneficiaryName:
      user?.beneficiaryName ||
      (user?.name ? `${user.name}${user.organization ? ` - ${user.organization}` : ''}` : base.beneficiaryName),
    authorName: user?.name || base.authorName,
    authorEmail: user?.email || base.authorEmail,
    authorPhone: base.authorPhone,
  };
}

/** The persona demo mode signs in as. Entirely fictional. */
export const DEMO_OWNER: UserItem = {
  id: 'demo-user-100',
  name: 'רותם אלגזי',
  email: 'rotem@demo.secquote.ai',
  organization: 'Elgazi Cyber Labs',
  hpNumber: '500000101',
  bankNumber: '12',
  branchNumber: '100',
  bankAccountNumber: '100101',
  beneficiaryName: 'Elgazi Cyber Labs (דמו)',
  role: 'Chief Security Consultant & Founder',
  access: 'admin',
  joined: '01/01/2024',
  status: 'active',
  initials: 'רא',
  avatar: 'linear-gradient(140deg, #2563eb, #22d3ee)',
  gender: 'female',
};

export const INITIAL_USERS: UserItem[] = [
  DEMO_OWNER,
  {
    id: 'demo-user-1',
    name: 'דוד כהן',
    email: 'david.cohen@demo.secquote.ai',
    organization: 'Northgate Security',
    hpNumber: '500000102',
    bankNumber: '14',
    branchNumber: '200',
    bankAccountNumber: '100102',
    beneficiaryName: 'Northgate Security (דמו)',
    role: 'Admin',
    access: 'admin',
    joined: '02/01/2024',
    status: 'active',
    initials: 'דכ',
    avatar: 'linear-gradient(140deg, #1d4ed8, #22d3ee)',
    gender: 'male',
  },
  {
    id: 'demo-user-2',
    name: 'מיכל אברהם',
    email: 'michal.a@demo.secquote.ai',
    organization: 'Aegis Defense Labs',
    hpNumber: '500000104',
    bankNumber: '12',
    branchNumber: '400',
    bankAccountNumber: '100104',
    beneficiaryName: 'Aegis Defense Labs (דמו)',
    role: 'Senior Security Consultant',
    access: 'edit',
    joined: '14/03/2024',
    status: 'active',
    initials: 'מא',
    avatar: 'linear-gradient(140deg, #7c3aed, #22d3ee)',
    gender: 'female',
  },
  {
    id: 'demo-user-3',
    name: 'איתן שלו',
    email: 'eitan.shalev@demo.secquote.ai',
    organization: 'Sentinel IR Group',
    hpNumber: '500000105',
    bankNumber: '11',
    branchNumber: '500',
    bankAccountNumber: '100105',
    beneficiaryName: 'Sentinel IR Group (דמו)',
    role: 'Security Consultant',
    access: 'edit',
    joined: '29/04/2024',
    status: 'active',
    initials: 'אש',
    avatar: 'linear-gradient(140deg, #0ea5e9, #34d399)',
    gender: 'male',
  },
  {
    id: 'demo-user-4',
    name: 'נועה ברק',
    email: 'noa.barak@demo.secquote.ai',
    organization: 'Meridian Cyber Advisory',
    hpNumber: '500000106',
    bankNumber: '20',
    branchNumber: '600',
    bankAccountNumber: '100106',
    beneficiaryName: 'Meridian Cyber Advisory (דמו)',
    role: 'Auditor',
    access: 'view',
    joined: '07/06/2024',
    status: 'active',
    initials: 'נב',
    avatar: 'linear-gradient(140deg, #f59e0b, #fbbf24)',
    gender: 'female',
  },
  {
    id: 'demo-user-5',
    name: 'יובל רזי',
    email: 'yuval.razi@demo.secquote.ai',
    organization: 'Vaultline Security',
    hpNumber: '500000107',
    bankNumber: '12',
    branchNumber: '700',
    bankAccountNumber: '100107',
    beneficiaryName: 'Vaultline Security (דמו)',
    role: 'Security Consultant',
    access: 'view',
    joined: '19/07/2024',
    status: 'suspended',
    initials: 'יר',
    avatar: 'linear-gradient(140deg, #64748b, #94a3b8)',
    gender: 'male',
  },
  {
    id: 'demo-user-6',
    name: 'שירה לביא',
    email: 'shira.lavi@demo.secquote.ai',
    organization: 'Redstone Systems',
    hpNumber: '500000103',
    bankNumber: '10',
    branchNumber: '300',
    bankAccountNumber: '100103',
    beneficiaryName: 'Redstone Systems (דמו)',
    role: 'Admin',
    access: 'admin',
    joined: '02/08/2024',
    status: 'active',
    initials: 'של',
    avatar: 'linear-gradient(140deg, #db2777, #22d3ee)',
    gender: 'female',
  },
];

export const MARKET_TIERS: MarketTier[] = [
  { name: 'Junior', years: '0-2 שנים', avg: 2800, lo: 2500, hi: 3200, rangeText: '₪2,500 - ₪3,200' },
  { name: 'Mid-Level', years: '2-5 שנים', avg: 3800, lo: 3300, hi: 4200, rangeText: '₪3,300 - ₪4,200' },
  { name: 'Senior', years: '5+ שנים', avg: 4900, lo: 4300, hi: 5500, rangeText: '₪4,300 - ₪5,500' },
  { name: 'Expert', years: 'Red Team / Architect', avg: 6400, lo: 5600, hi: 7500, rangeText: '₪5,600 - ₪7,500+' },
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: 'mvp',
    name: 'סטארט-אפ (MVP)',
    desc: 'אפיון מהיר ורזה לפרודקט צעיר עם סטאק יחיד.',
    md: '7 ימים',
    q: '12 שאלות',
    bench: '₪28,000 - ₪38,000',
    spark: [18, 22, 20, 26, 24, 30, 33],
    includes: [
      '12 שאלות AI ממוקדות לסטאק יחיד',
      'סריקת Web + API בסיסית',
      'דוח מנהלים מקוצר',
      'ללא בדיקות רגולציה',
    ],
  },
  {
    key: 'fintech',
    name: 'פינטק (Regulated)',
    desc: 'דרישות אבטחה מחמירות ורגולציה — PCI DSS, SOC 2.',
    md: '14 ימים',
    q: '24 שאלות',
    bench: '₪62,000 - ₪86,000',
    spark: [22, 30, 34, 40, 46, 52, 58],
    includes: [
      '24 שאלות AI כולל מיפוי רגולטורי',
      'PCI DSS + SOC 2 כנספחים',
      'בדיקת הרשאות ותהליכי כספים',
      'Retest אחד כלול',
    ],
  },
  {
    key: 'core',
    name: 'אנטרפרייז (Core)',
    desc: 'ארגונים גדולים, תשתיות מורכבות ומספר סביבות.',
    md: '21 ימים',
    q: '31 שאלות',
    bench: '₪95,000 - ₪140,000',
    spark: [26, 34, 44, 52, 60, 68, 74],
    includes: [
      '31 שאלות AI לפי אזורי תשתית',
      'AD, ענן היברידי ורשתות OT',
      'תיאום חלונות בדיקה ותחקיר',
      'שני Retest ודוח מפורט',
    ],
  },
  {
    key: 'mobile',
    name: 'אפליקציה (Mobile)',
    desc: 'בדיקות ממוקדות לאפליקציה ולשרתי ה-API שלה.',
    md: '9 ימים',
    q: '16 שאלות',
    bench: '₪36,000 - ₪52,000',
    spark: [20, 24, 28, 30, 34, 38, 42],
    includes: [
      '16 שאלות AI ל-iOS ו-Android',
      'בדיקת אחסון מקומי והצפנה',
      'API ממוקד לאפליקציה',
      'דוח ממצאים לצוות הפיתוח',
    ],
  },
];

export const CHAT_QUESTIONS = [
  {
    text: 'שלום, אני כאן כדי לדייק את היקף הפרויקט. נתחיל בתשתיות: כמה כתובות IP וציוד יש לכלול בבדיקה?',
    options: ['פחות מ-20', '20-50', '50-100', 'מעל 100'],
  },
  {
    text: 'מצוין! ולגבי שרתים פנימיים — יש מעל 50 שרתים בסביבה?',
    options: ['כן, מעל 50', 'לא, בין 20 ל-50', 'לא, פחות מ-20', 'לא רלוונטי / לא יודע'],
  },
  {
    text: 'תודה! משהו נוסף שחשוב שנדע — מקרי קצה או דרישות מיוחדות? אפשר לכתוב בתיבה למטה או לדלג.',
    options: ['דלג'],
  },
];

export const ACCESS_OPTIONS = [
  { key: 'view' as const, label: 'צפייה בלבד', bg: 'rgba(148,163,184,0.16)', fg: '#cbd5e1' },
  { key: 'edit' as const, label: 'עריכת הצעות מחיר', bg: 'rgba(56,189,248,0.16)', fg: '#7dd3fc' },
  { key: 'admin' as const, label: 'הרשאות ניהול מלאות', bg: 'rgba(34,211,238,0.18)', fg: '#67e8f9' },
];

export const CATEGORIES_DATA = [
  { key: 'infra' as const, name: 'מבדק חוסן תשתיתי', note: 'רשת, שרתים, ענן' },
  { key: 'app' as const, name: 'מבדק חוסן אפליקטיבי', note: 'Web, API' },
  { key: 'red' as const, name: 'פעילות צוות אדום', note: 'Red Team' },
  { key: 'mobile' as const, name: 'מבדק חוסן מובייל', note: 'iOS, Android' },
];

export const TEST_TYPES = ['Blackbox', 'Greybox', 'Whitebox'] as const;
export const COMPLEXITY_LEVELS = ['פשוטה', 'בינונית', 'מורכבת'] as const;
