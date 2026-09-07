import React from 'react';
import { Quote, ScopeComponent } from '../types';
import { getOrgFinancialDetails } from '../data/mockData';

export interface ElixSowDocumentProps {
  quote?: Quote | null;
  clientName?: string;
  categoryName?: string;
  testType?: string;
  staging?: boolean;
  complexity?: string;
  mandays?: number;
  totalCost?: number;
  dailyRate?: number;
  components?: ScopeComponent[];
  targetSystem?: string;
  customRequirements?: string[];
  chatSummary?: string;
  scopeDetails?: {
    environment?: string;
    roles?: string;
    endpointsOrIps?: string;
    attackVectors?: string;
    testingHours?: string;
    criticalSystems?: string;
  };
  activePage?: number; // 0 = all pages, 1..5 = specific page
  onClientNameChange?: (name: string) => void;
  editableClientName?: boolean;
  organizationName?: string;
  authorName?: string;
  authorEmail?: string;
  authorPhone?: string;
  hpNumber?: string;
  bankAccountNumber?: string;
  bankNumber?: string;
  branchNumber?: string;
  beneficiaryName?: string;
}

export const ElixSowDocument: React.FC<ElixSowDocumentProps> = ({
  quote,
  clientName: propClientName,
  categoryName: propCategoryName,
  testType: propTestType,
  staging: propStaging,
  complexity: propComplexity,
  mandays: propMandays,
  totalCost: propTotalCost,
  dailyRate = 4200,
  components: propComponents,
  targetSystem: propTargetSystem,
  customRequirements: propCustomRequirements,
  chatSummary: propChatSummary,
  scopeDetails: propScopeDetails,
  activePage = 0,
  onClientNameChange,
  editableClientName = false,
  organizationName: propOrganizationName,
  authorName: propAuthorName,
  authorEmail: propAuthorEmail,
  authorPhone: propAuthorPhone,
  hpNumber: propHpNumber,
  bankAccountNumber: propBankAccountNumber,
  bankNumber: propBankNumber,
  branchNumber: propBranchNumber,
  beneficiaryName: propBeneficiaryName,
}) => {
  const clientName = propClientName || quote?.client || '';
  const categoryName = propCategoryName || quote?.kind || 'מבדק חוסן אפליקטיבי';
  const testType = propTestType || quote?.testType || 'Blackbox';
  const staging = propStaging ?? (quote?.environment === 'Staging');
  const complexity = propComplexity || quote?.complexity || 'בינונית';
  const mandays = propMandays ?? quote?.mandays ?? 3;
  const components = propComponents || quote?.components || [];
  const customRequirements = propCustomRequirements || quote?.customRequirements || [];
  const chatSummary = propChatSummary || quote?.summaryText || '';
  const scopeDetails = propScopeDetails || quote?.scopeDetails || {};
  const rawTotalCost = propTotalCost ?? quote?.rawCost ?? (mandays * dailyRate);

  // Dynamic organization & financial branding
  const rawOrgName = propOrganizationName || quote?.organizationName || 'ELIX SYSTEMS';
  const fin = getOrgFinancialDetails(rawOrgName, {
    organization: rawOrgName,
    hpNumber: propHpNumber || quote?.hpNumber,
    bankAccountNumber: propBankAccountNumber || quote?.bankAccountNumber,
    bankNumber: propBankNumber || quote?.bankNumber,
    branchNumber: propBranchNumber || quote?.branchNumber,
    beneficiaryName: propBeneficiaryName || quote?.beneficiaryName,
    name: propAuthorName || quote?.authorName,
    email: propAuthorEmail || quote?.authorEmail,
  });

  const normalizedOrgName = fin.organization;
  const hpNumber = propHpNumber || quote?.hpNumber || fin.hpNumber;
  const bankAccountNumber = propBankAccountNumber || quote?.bankAccountNumber || fin.bankAccountNumber;
  const bankNumber = propBankNumber || quote?.bankNumber || fin.bankNumber;
  const branchNumber = propBranchNumber || quote?.branchNumber || fin.branchNumber;
  const beneficiaryName = propBeneficiaryName || quote?.beneficiaryName || fin.beneficiaryName;
  const paymentMethod = quote?.paymentMethod || 'העברה בנקאית';
  const quoteNotes = (quote?.quoteNotes || '').trim();
  const authorName = propAuthorName || quote?.authorName || fin.authorName;
  const authorEmail = propAuthorEmail || quote?.authorEmail || fin.authorEmail;
  const authorPhone = propAuthorPhone || fin.authorPhone;

  // Derive target system intelligently
  const targetSystem =
    propTargetSystem ||
    quote?.targetSystem ||
    (categoryName.includes('אפליקטיבי') || categoryName.includes('Web')
      ? 'WordPress Web Application Frontend + Backend'
      : categoryName.includes('מובייל')
      ? 'Mobile Application (iOS & Android)'
      : categoryName.includes('תשתית')
      ? 'Network & Cloud Infrastructure'
      : 'Enterprise Core Systems');

  // Format prices
  const baseCost = rawTotalCost || mandays * dailyRate || 11000;
  const vatAmount = Math.round(baseCost * 0.18);
  const totalWithVat = baseCost + vatAmount;
  const formattedBaseCost = baseCost.toLocaleString('he-IL');
  const formattedVatAmount = vatAmount.toLocaleString('he-IL');
  const formattedTotalWithVat = totalWithVat.toLocaleString('he-IL');

  // Dates
  const today = new Date();
  const dateFormatted = quote?.date || today.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.');

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const validityFormatted = nextMonth.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.');

  // Header for pages 2, 3, 4, 5
  const renderInnerHeader = () => (
    <div className="w-full mb-6">
      <div className="border-t-2 border-[#0d6282] mb-1"></div>
      <div className="flex items-center justify-between text-xs font-bold py-1 px-0.5">
        <span className="text-[#0d6282] font-black text-sm tracking-wide font-sans">{normalizedOrgName}</span>
        <span className="text-slate-800 font-bold text-xs">הצעת מחיר</span>
      </div>
      <div className="border-b border-[#0d6282]"></div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-8 w-full text-[#0f172a]" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      {/* ================= PAGE 1: שער (Cover Page) ================= */}
      {(activePage === 0 || activePage === 1) && (
        <div
          data-pdf-page="true"
          dir="rtl"
          className="pdf-page relative w-full max-w-[794px] min-h-[1123px] bg-white p-8 sm:p-12 shadow-2xl flex flex-col justify-between text-[#0f172a] text-right border border-slate-200"
        >
          {/* Top Banner - full width bleed */}
          <div className="-mx-8 -mt-8 sm:-mx-12 sm:-mt-12 bg-[#0d6282] h-20 sm:h-24 flex items-center justify-between px-8 sm:px-12 text-white">
            <span className="font-sans text-2xl sm:text-3xl font-bold tracking-wide">
              {normalizedOrgName}
            </span>
            <span className="text-xs sm:text-sm font-semibold opacity-90">
              Cyber Security & Digital Solutions
            </span>
          </div>

          {/* Central Title */}
          <div className="text-center my-auto py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-relaxed">
              הצעת מחיר לשירותי סייבר עבור
            </h1>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {editableClientName && onClientNameChange ? (
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => onClientNameChange(e.target.value)}
                  placeholder="שם הלקוח"
                  // Full width: the default input size clipped longer names.
                  className="w-full text-center font-black border-b-2 border-[#0d6282] bg-transparent outline-none px-2 py-0.5 placeholder:text-slate-400 placeholder:font-semibold"
                />
              ) : (
                clientName
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-8">
              {categoryName}
            </div>
            {targetSystem && (
              <div className="text-sm sm:text-base font-semibold text-[#0d6282] mt-2">
                {targetSystem}
              </div>
            )}
          </div>

          {/* Bottom Table: In Hebrew RTL, Right column = Label (140px, bg-slate-50), Left column = Value (1fr) */}
          <div className="w-full max-w-[550px] mx-auto mt-auto mb-8 border border-slate-300 text-xs sm:text-sm" dir="rtl">
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
              <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                לכבוד
              </div>
              <div className="p-2.5 font-bold text-slate-900 text-center flex items-center justify-center">
                {clientName}
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
              <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                תאריך
              </div>
              <div className="p-2.5 font-bold text-slate-900 text-center font-mono flex items-center justify-center" dir="ltr">
                {dateFormatted}
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
              <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                גרסה
              </div>
              <div className="p-2.5 font-bold text-slate-900 text-center font-mono flex items-center justify-center" dir="ltr">
                V1.0
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
              <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                תוקף ההצעה
              </div>
              <div className="p-2.5 font-bold text-slate-900 text-center font-mono flex items-center justify-center" dir="ltr">
                {validityFormatted}
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr]">
              <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                אנשי קשר
              </div>
              <div className="p-2.5 font-bold text-slate-900 text-center flex items-center justify-center" dir="rtl">
                {authorName} – {authorPhone}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE 2: סיכום מנהלים ותמצית תכולה ================= */}
      {(activePage === 0 || activePage === 2) && (
        <div
          data-pdf-page="true"
          dir="rtl"
          className="pdf-page relative w-full max-w-[794px] min-h-[1123px] bg-white p-8 sm:p-12 shadow-2xl flex flex-col text-[#0f172a] text-right border border-slate-200"
        >
          {renderInnerHeader()}

          {/* סיכום מנהלים */}
          <div className="mb-5 text-right">
            <h2 className="text-[#0d6282] font-bold text-lg mb-2 text-right">
              סיכום מנהלים
            </h2>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed flex flex-col gap-2 text-right">
              <p>
                <strong>{normalizedOrgName}</strong> הינה חברת בוטיק מתמחה בדיגיטל, אבטחת מידע וסייבר, המספקת שירותי ייעוץ מתקדמים וליווי מקצועי לארגונים מובילים.
              </p>
              <p>
                חברתינו מתמחה בהקטנת סיכונים תפעוליים, בניית תוכניות הגנה מקיפות, עמידה בדרישות רגולציה ותקינה בארץ ובעולם, ביצוע סקרי סיכונים ובדיקות חדירה תוך ליווי שוטף של פונקציית אבטחת המידע בארגון.
              </p>
              <p>
                הגישה שלנו משלבת ידע טכני עמוק עם הבנה עסקית, במטרה לתמוך בהשגת היעדים האסטרטגיים שלכם עם דגש על שירות אישי, אמינות ומחויבות מלאה להצלחתכם.
              </p>
              <p className="font-semibold text-[#0d6282] bg-sky-50/70 p-2.5 rounded-lg border border-[#0d6282]/20 text-right">
                בהתאם לתהליך האפיון שבוצע בצ'אט, אנו מציעים לבצע בדיקת חדירות מקיפה למערכת - {clientName} ({targetSystem}) בהיקף של {mandays} ימי עבודה.
              </p>

              {/* Chat-derived custom requirements banner if present */}
              {customRequirements.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 mt-1 text-right">
                  <span className="font-bold block mb-1">דרישות מיוחדות שסוכמו באפיון:</span>
                  <ul className="list-disc pr-5 space-y-0.5 text-right">
                    {customRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* תמצית תכולת הבדיקה - RTL Table: Right column is Label (160px), Left column is Content (1fr) */}
          <div className="mb-5 text-right">
            <h2 className="text-[#0d6282] font-bold text-lg mb-2 text-right">
              תמצית תכולת הבדיקה
            </h2>
            <div className="border border-slate-300 overflow-hidden text-xs sm:text-sm" dir="rtl">
              <div className="bg-[#0d6282] h-3.5 w-full"></div>
              <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                <div className="p-2.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-700 text-right pr-3 flex items-center">
                  סביבה נבדקת
                </div>
                <div className="p-2.5 text-slate-900 font-semibold text-right flex items-center">
                  {targetSystem} ({staging ? 'סביבת Staging / מעבדה' : 'סביבת Production / ייצור'})
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                <div className="p-2.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-700 text-right pr-3 flex items-center">
                  סוג הבדיקה
                </div>
                <div className="p-2.5 text-slate-900 font-semibold text-right flex items-center">
                  {categoryName} ({testType})
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                <div className="p-2.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-700 text-right pr-3 flex items-center">
                  רמות הרשאה
                </div>
                <div className="p-2.5 text-slate-900 text-right flex items-center">
                  {scopeDetails?.roles ||
                    (testType === 'Blackbox'
                      ? 'Blackbox (אורח חיצוני ללא הרשאות)'
                      : 'Blackbox (אורח) + Greybox (משתמש רגיל, מנהל/Admin, תפקידים שונים)')}
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                <div className="p-2.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-700 text-right pr-3 flex items-center">
                  היקף / Endpoints
                </div>
                <div className="p-2.5 text-slate-900 font-mono text-right flex items-center">
                  {scopeDetails?.endpointsOrIps ||
                    (components.length > 0
                      ? `${components.length} מודולי בדיקה (${mandays} ימי עבודה)`
                      : 'OWASP Top 10 / PTES / NIST')}
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                <div className="p-2.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-700 text-right pr-3 flex items-center">
                  גישת בדיקה
                </div>
                <div className="p-2.5 text-slate-900 text-right flex items-center">
                  {testType} ({staging ? 'Staging' : 'Production'}) – רמת מורכבות: {complexity}
                </div>
              </div>
              <div className="grid grid-cols-[160px_1fr]">
                <div className="p-2.5 bg-slate-50 border-l border-slate-200 font-bold text-slate-700 text-right pr-3 flex items-center">
                  דוח מסירה
                </div>
                <div className="p-2.5 text-slate-900 text-right flex items-center">
                  דוח מפורט + תקציר מנהלים + מבדק חוזר (Retest)
                </div>
              </div>
            </div>
          </div>

          {/* תכולת הבדיקות */}
          <div className="mb-4 text-right">
            <h2 className="text-[#0d6282] font-bold text-base mb-1 text-right">
              תכולת הבדיקות
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed text-right">
              הבדיקה תתבצע בהתאם למתודולוגיות הבינלאומיות המקובלות ביותר בתעשיית אבטחת המידע. הגישה שלנו משלבת ידע תיאורטי עמוק עם ניסיון מעשי רב שנים, תוך שימוש בכלים מתקדמים ובטכניקות ידניות מורכבות.
            </p>
          </div>

          {/* מסגרת עבודה ותקנים */}
          <div className="text-right">
            <h2 className="text-[#0d6282] font-bold text-base mb-1 text-right">
              מסגרת עבודה ותקנים
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 mb-2 text-right">
              הבדיקה מבוססת על מסגרות העבודה הבאות:
            </p>
            <ul className="text-xs sm:text-sm text-slate-800 flex flex-col gap-1 pr-5 list-disc text-right">
              <li>PTES (Penetration Testing Execution Standard) - מתודולוגיית בדיקות כוללת.</li>
              <li>CVSS - לדירוג חומרת ממצאים.</li>
              <li>CWE - סיווג חולשות.</li>
              <li>OWASP Top 10 / OWASP Web Security Testing Guide (WSTG)</li>
            </ul>
          </div>
        </div>
      )}

      {/* ================= PAGE 3: שלבי הבדיקה ================= */}
      {(activePage === 0 || activePage === 3) && (
        <div
          data-pdf-page="true"
          dir="rtl"
          className="pdf-page relative w-full max-w-[794px] min-h-[1123px] bg-white p-8 sm:p-12 shadow-2xl flex flex-col text-[#0f172a] text-right border border-slate-200"
        >
          {renderInnerHeader()}

          <div className="mb-4 text-right">
            <h2 className="text-[#0d6282] font-bold text-lg mb-1 text-right">
              שלבי הבדיקה
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 mb-3 text-right">
              שלבי הבדיקה על סביבת ה-{targetSystem || categoryName} כוללים:
            </p>

            {/* Scope Table - RTL: # on right, Step in middle, Description on left */}
            <div className="border border-slate-300 text-xs sm:text-sm" dir="rtl">
              <div className="grid grid-cols-[40px_160px_1fr] bg-[#0d6282] text-white font-bold text-center">
                <div className="p-2 border-l border-white/20">#</div>
                <div className="p-2 border-l border-white/20">שלב</div>
                <div className="p-2 text-right pr-3">תיאור הפעילות</div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-[40px_160px_1fr] border-b border-slate-300">
                <div className="bg-[#0d6282] text-white font-bold flex items-center justify-center border-l border-white/20">
                  1
                </div>
                <div className="bg-slate-50 text-[#0d6282] font-bold p-3 border-l border-slate-300 flex flex-col justify-center text-right font-sans">
                  Reconnaissance & Scoping
                </div>
                <div className="p-3 text-slate-800 leading-relaxed text-right">
                  <ul className="list-disc pr-5 space-y-1 text-right">
                    <li>מיפוי ארכיטקטורת האפליקציה, טכנולוגיות Server/Client ו-APIs.</li>
                    <li>זיהוי נקודות קלט (Forms, URL Parameters, Headers, Cookies).</li>
                    <li>מיפוי מנגנוני הזדהות וניהול ניסיון (Authentication & Session Management).</li>
                  </ul>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-[40px_160px_1fr] border-b border-slate-300">
                <div className="bg-[#0d6282] text-white font-bold flex items-center justify-center border-l border-white/20">
                  2
                </div>
                <div className="bg-slate-50 text-[#0d6282] font-bold p-3 border-l border-slate-300 flex flex-col justify-center text-right font-sans">
                  Threat Modeling
                </div>
                <div className="p-3 text-slate-800 leading-relaxed text-right">
                  <ul className="list-disc pr-5 space-y-1 text-right">
                    <li>זיהוי נכסים קריטיים (מידע אישי, נתוני תשלום, סודות וגישות).</li>
                    <li>בניית תרחישי תקיפה: Account Takeover, Privilege Escalation, Data Exposure.</li>
                    <li>תיעדוף לפי סיכון עסקי.</li>
                  </ul>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-[40px_160px_1fr] border-b border-slate-300">
                <div className="bg-[#0d6282] text-white font-bold flex items-center justify-center border-l border-white/20">
                  3
                </div>
                <div className="bg-slate-50 text-[#0d6282] font-bold p-3 border-l border-slate-300 flex flex-col justify-center text-right font-sans">
                  Vulnerability Assessment
                </div>
                <div className="p-3 text-slate-800 leading-relaxed text-right">
                  <p className="font-semibold mb-1">בדיקות ממוקדות על האפליקציה:</p>
                  <ul className="list-disc pr-5 space-y-1 text-right">
                    <li>בדיקת הרשאות ועקיפת בקרות גישה ברמת ה-Plugins וה-API.</li>
                    <li>בדיקת חולשות הזרקה וסקריפטים (SQLi, Authenticated/Unauthenticated XSS, CSRF).</li>
                    <li>בדיקת מנגנוני הזדהות, הגנה מפני BruteForce / Enumeration.</li>
                    <li>מניפולציות לוגיות על תהליכים עסקיים ומחירים.</li>
                  </ul>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-[40px_160px_1fr] border-b border-slate-300">
                <div className="bg-[#0d6282] text-white font-bold flex items-center justify-center border-l border-white/20">
                  4
                </div>
                <div className="bg-slate-50 text-[#0d6282] font-bold p-3 border-l border-slate-300 flex flex-col justify-center text-right font-sans">
                  Business Logic & Access Control Validation
                </div>
                <div className="p-3 text-slate-800 leading-relaxed text-right">
                  <p className="font-semibold mb-1">ניסיון ניצול מבוקר של חולשות:</p>
                  <ul className="list-disc pr-5 space-y-1 text-right">
                    <li>ניסיון ניצול של חולשות להעלאת הרשאות ממשתמש פשוט ל-Admin.</li>
                    <li>ניסיונות לקבלת גישה ישירה למאגרי מידע ובסיסי נתונים.</li>
                  </ul>
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-[40px_160px_1fr] border-b border-slate-300">
                <div className="bg-[#0d6282] text-white font-bold flex items-center justify-center border-l border-white/20">
                  5
                </div>
                <div className="bg-slate-50 text-[#0d6282] font-bold p-3 border-l border-slate-300 flex flex-col justify-center text-right font-sans">
                  Impact Assessment & Data Exposure Analysis
                </div>
                <div className="p-3 text-slate-800 leading-relaxed text-right">
                  <ul className="list-disc pr-5 space-y-1 text-right">
                    <li>ניתוח פוטנציאל הנזק העסקי והרחבת הגישה הבלתי מורשת במערכת.</li>
                    <li>זיהוי Attack Paths מלאים באפליקציה.</li>
                  </ul>
                </div>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-[40px_160px_1fr]">
                <div className="bg-[#0d6282] text-white font-bold flex items-center justify-center border-l border-white/20">
                  6
                </div>
                <div className="bg-slate-50 text-[#0d6282] font-bold p-3 border-l border-slate-300 flex flex-col justify-center text-right font-sans">
                  Reporting & Remediation
                </div>
                <div className="p-3 text-slate-800 leading-relaxed text-right">
                  <ul className="list-disc pr-5 space-y-1 text-right">
                    <li>דוח טכני מפורט לצוות הפיתוח.</li>
                    <li>Executive Summary (תקציר מנהלים לדרג הניהולי).</li>
                    <li>Excel לניהול ותיעדוף ממצאים.</li>
                    <li>המלצות תיקון מעשיות לפי Best Practices.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Chat Components Breakdown */}
            {components.length > 0 && (
              <div className="mt-6 text-right">
                <h3 className="text-sm font-bold text-[#0d6282] mb-2 text-right">
                  פירוט רכיבי האפיון והדרישות המיוחדות מהשיחה (Scope Breakdown):
                </h3>
                <div className="border border-slate-300 rounded overflow-hidden text-xs" dir="rtl">
                  <div className="grid grid-cols-[1fr_90px] bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
                    <div className="text-right pr-2">שם רכיב / בדיקה</div>
                    <div className="text-center font-mono border-r border-slate-300">ימי עבודה</div>
                  </div>
                  {components.map((c, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-[1fr_90px] p-2 border-b last:border-b-0 border-slate-200 items-center ${
                        c.isCustom ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      <div className="text-right pr-2">
                        <div className="text-slate-900 font-bold flex items-center gap-1.5">
                          {c.name}
                          {c.isCustom && (
                            <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-sans">
                              דרישה מהצ'אט
                            </span>
                          )}
                        </div>
                        {c.desc && <div className="text-slate-500 text-[11px] mt-0.5">{c.desc}</div>}
                      </div>
                      <div className="text-center font-mono font-bold text-[#0d6282] border-r border-slate-200">
                        {c.md} MD
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_90px] p-2 bg-slate-50 font-bold text-slate-900">
                    <div className="text-right pr-2">סך ימי עבודה מחושבים:</div>
                    <div className="text-center font-mono text-[#0d6282] font-black border-r border-slate-200">{mandays} MD</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PAGE 4: עלויות, מסגרת זמן וצוות ================= */}
      {(activePage === 0 || activePage === 4) && (
        <div
          data-pdf-page="true"
          dir="rtl"
          className="pdf-page relative w-full max-w-[794px] min-h-[1123px] bg-white p-8 sm:p-12 shadow-2xl flex flex-col text-[#0f172a] text-right border border-slate-200"
        >
          {renderInnerHeader()}

          <div className="mb-6 text-right">
            <h2 className="text-[#0d6282] font-bold text-lg mb-2 text-right">
              עלויות הצעה, קבלה ותנאים
            </h2>
            <h3 className="text-sm font-bold text-slate-900 mb-3 text-right">
              תמחור שירותים:
            </h3>

            {/* Pricing Table - RTL: Service Name on right, Price on left */}
            <div className="border border-slate-300 text-xs sm:text-sm mb-6" dir="rtl">
              <div className="grid grid-cols-[1fr_180px] bg-[#0d6282] text-white font-bold">
                <div className="p-2.5 border-l border-white/20 text-right pr-3">שם השירות</div>
                <div className="p-2.5 text-center">מחיר</div>
              </div>

              <div className="grid grid-cols-[1fr_180px] border-b border-slate-300">
                <div className="p-3 border-l border-slate-300 font-medium text-right">
                  מבדק חדירות ל-{targetSystem} ({mandays} ימי עבודה במודל {testType}) כולל דו"ח מפורט הכולל את הממצאים והמלצותיהם.
                </div>
                <div className="p-3 font-bold text-slate-900 flex items-center justify-center font-mono">
                  {formattedBaseCost} ₪ עלות המבדק
                </div>
              </div>

              {/* Any custom chat requirements listed */}
              {components.filter(c => c.isCustom).map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_180px] border-b border-slate-300 bg-amber-50/40">
                  <div className="p-3 border-l border-slate-300 font-medium text-amber-950 text-right">
                    הרחבת אפיון מהצ'אט: {c.name} ({c.md} MD) – {c.desc}
                  </div>
                  <div className="p-3 font-bold text-amber-900 flex items-center justify-center text-xs">
                    כלול בעלות המבדק
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-[1fr_180px] border-b border-slate-300">
                <div className="p-3 border-l border-slate-300 font-medium text-right">
                  עלות ליווי ניהול טיפול בפערים שימצאו כחלק מהבדיקה.
                </div>
                <div className="p-3 font-bold text-slate-900 flex items-center justify-center font-mono">
                  410 ₪ לשעת עבודה
                </div>
              </div>

              <div className="grid grid-cols-[1fr_180px] border-b border-slate-300">
                <div className="p-3 border-l border-slate-300 font-medium text-right">
                  בדיקה אחת חוזרת (Retest) עד 3 חודשים ממועד שליחת הדו"ח.
                </div>
                <div className="p-3 font-bold text-slate-900 flex items-center justify-center">
                  כלול
                </div>
              </div>

              {/* VAT Row */}
              <div className="grid grid-cols-[1fr_180px] border-b border-slate-300 bg-slate-50">
                <div className="p-2.5 border-l border-slate-300 text-right pr-3 font-bold text-slate-700">
                  מע"מ (18%)
                </div>
                <div className="p-2.5 text-center font-mono text-slate-700 font-bold">
                  ₪ {formattedVatAmount}
                </div>
              </div>

              {/* Total Row */}
              <div className="grid grid-cols-[1fr_180px] bg-[#0d6282] text-white font-bold">
                <div className="p-3 border-l border-white/20 text-right pr-3 font-extrabold text-sm sm:text-base">
                  סה"כ כולל מע"מ
                </div>
                <div className="p-3 font-black text-center text-sm sm:text-base font-mono">
                  ₪ {formattedTotalWithVat}
                </div>
              </div>
            </div>

            {/* מסגרת זמן */}
            <div className="mb-6 text-right">
              <h3 className="text-sm font-bold text-[#0d6282] mb-1.5 text-right">
                מסגרת זמן הפרויקט ותהליך העבודה
              </h3>
              <p className="text-xs sm:text-sm text-slate-800 text-right">
                תאריך תחילת הפעילות – בתוך 7-10 ימי עסקים מחתימת הסכם ההתקשרות.
              </p>
              <p className="text-xs sm:text-sm text-slate-800 text-right">
                משך ביצוע משוער – כ-{Math.max(1, Math.ceil(mandays / 3))} שבועות עבודה (סך {mandays} ימי עבודה מוגדרים).
              </p>
              {scopeDetails?.testingHours && (
                <p className="text-xs sm:text-sm text-slate-800 font-semibold text-[#0d6282] text-right mt-1">
                  שעות בדיקה: {scopeDetails.testingHours}
                </p>
              )}
            </div>

            {/* צוות הפרויקט */}
            <div className="text-right">
              <h3 className="text-sm font-bold text-[#0d6282] mb-1.5 text-right">
                צוות הפרויקט
              </h3>
              <ul className="text-xs sm:text-sm text-slate-800 list-disc pr-5 text-right">
                <li>צוות זה כולל מנהל פרויקט והובלה טכנית מוסמכת (OSCP / CISSP / CEH), ויישמר לאורך כל משך הפרויקט להבטחת עקביות ומקצועיות ללא פשרות.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE 5: תנאים לתשלום, פרטי בנק וחתימות ================= */}
      {(activePage === 0 || activePage === 5) && (
        <div
          data-pdf-page="true"
          dir="rtl"
          className="pdf-page relative w-full max-w-[794px] min-h-[1123px] bg-white p-8 sm:p-12 shadow-2xl flex flex-col justify-between text-[#0f172a] text-right border border-slate-200"
        >
          <div>
            {renderInnerHeader()}

            {/* תנאים לתשלום */}
            <div className="mb-6 text-right">
              <h2 className="text-[#0d6282] font-bold text-lg mb-2 text-right">
                תנאים לתשלום
              </h2>
              <ul className="text-xs sm:text-sm text-slate-800 list-disc pr-5 space-y-1.5 leading-relaxed text-right">
                <li>כלולה בהצעה זו בדיקה חוזרת אחת (Retest) לכל ממצא, עד 3 חודשים ממועד שליחת הדוח הסופי.</li>
                <li>
                  בחתימה על הצעה זו, הלקוח מאשר את הסכמתו להצעה לעיל, לרבות תנאי השירות, היקף העבודה, לוחות הזמנים ומדיניות התשלומים כפי שמופיעים במסמך זה.
                </li>
              </ul>
            </div>

            {/* Bank Details Table - RTL: Label on right (140px), Value on left (1fr) */}
            <div className="w-full max-w-[500px] mx-auto mb-6 border border-slate-300 text-xs sm:text-sm" dir="rtl">
              <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
                <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                  ח.פ
                </div>
                <div className="p-2.5 text-center font-mono font-bold text-slate-900 flex items-center justify-center">
                  {hpNumber}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
                <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                  אמצעי תשלום
                </div>
                <div className="p-2.5 text-center font-bold text-slate-900 flex items-center justify-center">
                  {paymentMethod}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
                <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                  שם המוטב
                </div>
                <div className="p-2.5 text-center font-bold text-slate-900 flex items-center justify-center">
                  {beneficiaryName}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
                <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                  מס' חשבון בנק:
                </div>
                <div className="p-2.5 text-center font-mono font-bold text-slate-900 flex items-center justify-center">
                  {bankAccountNumber}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] border-b border-slate-300">
                <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                  מס' סניף
                </div>
                <div className="p-2.5 text-center font-mono font-bold text-slate-900 flex items-center justify-center">
                  {branchNumber}
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr]">
                <div className="p-2.5 bg-slate-50 border-l border-slate-300 font-bold text-slate-700 text-right pr-4 flex items-center">
                  מס' בנק
                </div>
                <div className="p-2.5 text-center font-mono font-bold text-slate-900 flex items-center justify-center">
                  {bankNumber} {fin.bankName ? `(${fin.bankName})` : ''}
                </div>
              </div>
            </div>

            {/* Free text carried over from the sender's personal area. */}
            {quoteNotes && (
              <div className="w-full max-w-[500px] mx-auto mb-6 border border-slate-300 text-xs sm:text-sm" dir="rtl">
                <div className="p-2.5 bg-slate-50 border-b border-slate-300 font-bold text-slate-700 text-right">
                  הערות ותנאים נוספים
                </div>
                <div className="p-3 text-slate-800 leading-relaxed whitespace-pre-line text-right">
                  {quoteNotes}
                </div>
              </div>
            )}

            {/* סיכום הצעה */}
            <div className="mb-6 text-center">
              <h3 className="text-sm font-bold text-[#0d6282] mb-1">
                סיכום הצעה
              </h3>
              <p className="text-xs sm:text-sm text-slate-800">
                נא לשלוח את ההצעה לכתובת המייל: <span className="font-mono text-[#0d6282] font-semibold" dir="ltr">{authorEmail}</span>
              </p>
            </div>

            {/* פרטי הלקוח המאשר */}
            <div className="mb-8 text-right">
              <h3 className="text-sm font-bold text-slate-900 mb-3 text-right">
                פרטי הלקוח המאשר:
              </h3>
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-slate-700 font-mono text-right" dir="rtl">
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-900 font-sans ml-2">שם החברה:</span>
                  <span className="flex-1 border-b border-slate-400 pb-0.5 font-sans font-semibold">{clientName}</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-900 font-sans ml-2">ח.פ:</span>
                  <span className="flex-1 border-b border-slate-400 pb-0.5">&nbsp;</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-900 font-sans ml-2">שם פרטי:</span>
                  <span className="flex-1 border-b border-slate-400 pb-0.5">&nbsp;</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-900 font-sans ml-2">תפקיד:</span>
                  <span className="flex-1 border-b border-slate-400 pb-0.5">&nbsp;</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-900 font-sans ml-2">תאריך:</span>
                  <span className="flex-1 border-b border-slate-400 pb-0.5">&nbsp;</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-900 font-sans ml-2">כתובת:</span>
                  <span className="flex-1 border-b border-slate-400 pb-0.5">&nbsp;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Signatures - in RTL right is buyer, left is supplier/sign */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs sm:text-sm text-right" dir="rtl">
            <div>
              <span className="font-bold text-slate-900">איש קשר מהרכש:</span>
              <div className="border-b border-slate-400 mt-6">&nbsp;</div>
            </div>
            <div>
              <span className="font-bold text-slate-900">חתום כאן:</span>
              <div className="border-b border-slate-400 mt-6">&nbsp;</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
