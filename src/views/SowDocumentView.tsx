import React, { useState, useRef } from 'react';
import { ArrowRight, Printer, Download, FileCheck, Share2, Check, Loader2, FileText, MessageCircle, Mail, Building2 } from 'lucide-react';
import { Quote, UserItem } from '../types';
import { exportElementToPdf } from '../utils/pdfExport';
import { exportToWord } from '../utils/exportWord';
import { getOrgFinancialDetails } from '../data/mockData';
import { ElixSowDocument } from '../components/ElixSowDocument';

interface SowDocumentViewProps {
  quote?: Quote | null;
  onBack: () => void;
  isPublicView?: boolean;
  onQuoteStatusUpdate?: (quoteId: string, status: 'טיוטה' | 'נשלח' | 'אושר') => void;
  currentUser?: UserItem | null;
}

export const SowDocumentView: React.FC<SowDocumentViewProps> = ({
  quote,
  onBack,
  isPublicView = false,
  onQuoteStatusUpdate,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isClientApproved, setIsClientApproved] = useState(quote?.status === 'אושר');
  const [approvedToast, setApprovedToast] = useState(false);
  const [activePage, setActivePage] = useState<number>(0);
  const documentRef = useRef<HTMLDivElement | null>(null);
  const fullExportRef = useRef<HTMLDivElement | null>(null);

  const clientName = quote?.client || 'Cyber Insurance Academy';
  const totalCost = quote?.cost || '₪12,980';
  const totalMd = quote?.mandays || 7;

  // Resolve dynamic organization & financial details
  const rawOrg = quote?.organizationName || currentUser?.organization || 'ELIX SYSTEMS';
  const fin = getOrgFinancialDetails(rawOrg, currentUser);
  const displayOrgName = fin.organization;

  const authorName = quote?.authorName || fin.authorName;
  const authorEmail = quote?.authorEmail || fin.authorEmail;
  const authorPhone = fin.authorPhone;
  const hpNumber = quote?.hpNumber || fin.hpNumber;
  const bankAccountNumber = quote?.bankAccountNumber || fin.bankAccountNumber;
  const bankNumber = quote?.bankNumber || fin.bankNumber;
  const branchNumber = quote?.branchNumber || fin.branchNumber;
  const beneficiaryName = quote?.beneficiaryName || fin.beneficiaryName;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = async () => {
    setIsGeneratingWord(true);
    try {
      await exportToWord({
        clientName,
        categoryName: quote?.kind || 'מבדק חוסן',
        testType: quote?.testType || 'Blackbox',
        staging: quote?.environment === 'Staging',
        complexity: quote?.complexity || 'בינונית',
        mandays: quote?.mandays || 7,
        totalCost: quote?.rawCost || 12980,
        dailyRate: 4200,
        components: quote?.components || [],
        targetSystem: quote?.targetSystem || 'Target System Infrastructure & Applications',
        customRequirements: quote?.customRequirements || [],
        scopeDetails: quote?.scopeDetails || {},
        organizationName: displayOrgName,
        authorName,
        authorEmail,
        authorPhone,
        hpNumber,
        bankAccountNumber,
        bankNumber,
        branchNumber,
        beneficiaryName,
      });
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleDownloadPdf = async () => {
    const target = fullExportRef.current || documentRef.current;
    if (!target) return;
    setIsGeneratingPdf(true);
    try {
      await exportElementToPdf(
        target,
        `SOW_${clientName.replace(/\s+/g, '_')}_${displayOrgName.replace(/\s+/g, '')}.pdf`,
        {
          scale: 2.5,
          backgroundColor: '#ffffff',
        }
      );
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getShareDetails = () => {
    const docId = quote?.id || 'Q-2024-001';
    // The client link carries the secret share token; the row id stays private.
    const shareToken = quote?.shareToken || docId;
    try {
      if (quote) {
        // Demo fallback so a link still opens on the machine that made it.
        localStorage.setItem(`secquote_doc_${shareToken}`, JSON.stringify(quote));
      }
    } catch {}
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?doc=${encodeURIComponent(shareToken)}&public=true`;
    const message = `שלום ${clientName},\nמצורפת הצעת המחיר ומפרט העבודה (SOW) מאת ${displayOrgName} עבור ${quote?.kind || 'מבדק חדירות'}:\n• מזהה הצעה: ${docId}\n• היקף: ${totalMd} MD\n• עלות כוללת: ${totalCost}\n• איש קשר: ${authorName}\n\nלצפייה במסמך המלא ובאישור דיגיטלי:\n${shareUrl}`;
    return { shareUrl, message, docId };
  };

  const handleShare = () => {
    const { shareUrl } = getShareDetails();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  const handleShareWhatsApp = () => {
    const { message } = getShareDetails();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const { message } = getShareDetails();
    const subject = `הצעת מחיר ואיפיון מקצועי (SOW) עבור ${clientName} - ${displayOrgName}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_self');
  };

  const handleClientApprove = () => {
    setIsClientApproved(true);
    setApprovedToast(true);
    const docId = quote?.id || 'Q-2024-001';
    if (onQuoteStatusUpdate) {
      onQuoteStatusUpdate(docId, 'אושר');
    }
    try {
      if (quote) {
        const updated = { ...quote, status: 'אושר' as const };
        localStorage.setItem(`secquote_doc_${docId}`, JSON.stringify(updated));
      }
    } catch {}
    setTimeout(() => setApprovedToast(false), 4000);
  };

  return (
    <div dir="rtl" className="flex-1 min-w-0 flex flex-col h-full bg-[#070b19] overflow-y-auto">
      {/* Action Bar (Hidden on print) */}
      <div className="no-print sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-3 sm:px-6 py-3 bg-[#0a1122]/95 border-b border-[#7dd3fc]/15 backdrop-blur-md">
        {/* If public view, show branded document header with optional return button for system preview */}
        {isPublicView ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              title="חזרה למערכת"
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-[#7dd3fc]/20 text-xs font-bold text-[#cbe1ff] hover:text-white transition-all active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>חזרה למערכת</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center shadow-[0_0_12px_rgba(2,132,199,0.5)] flex-none">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-[#f2f8ff]">SecQuote AI</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    תצוגת מסמך לקוח
                  </span>
                </div>
                <div className="text-[11px] text-[#cbe1ff]/65">
                  עבור: <strong className="text-[#9fd4ff]">{clientName}</strong> · מזהה מסמך: <span className="font-mono text-[#7dd3fc]">{quote?.id || 'Q-2024-001'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-[#7dd3fc]/20 text-xs sm:text-sm font-bold text-[#cbe1ff] hover:text-white transition-all active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזרה למערכת</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d6282]/30 border border-[#0d6282]/60 text-sky-200 text-xs font-bold font-mono shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{displayOrgName}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Public View Approval Button */}
          {isPublicView && (
            isClientApproved ? (
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>ההצעה אושרה בהצלחה ✓</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClientApprove}
                className="cursor-pointer h-8 sm:h-9 px-3.5 sm:px-4 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 border border-emerald-400/40 inline-flex items-center gap-1.5 transition-all shadow-[0_0_18px_rgba(16,185,129,0.4)] active:scale-95"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>אישור הצעת מחיר דיגיטלי</span>
              </button>
            )
          )}

          {/* Share Buttons (Only in Internal View) */}
          {!isPublicView && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="cursor-pointer h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/35 inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="שלח ישירות בוואטסאפ ללקוח"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">וואטסאפ</span>
              </button>

              <button
                type="button"
                onClick={handleShareEmail}
                className="cursor-pointer h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-bold text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/35 inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="שלח ישירות במייל ללקוח"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">אימייל</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleShare}
                  className="cursor-pointer h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-bold text-[#eaf4ff] bg-white/10 hover:bg-white/15 border border-[#7dd3fc]/20 inline-flex items-center gap-1.5 transition-all active:scale-95"
                  title="העתק קישור לצפייה במסמך זה בלבד (ללא גישה למערכת)"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'קישור הועתק!' : 'העתק קישור'}</span>
                </button>
                {copied && (
                  <div className="absolute top-full right-0 mt-1.5 z-40 w-64 p-2 rounded-xl bg-[#091124] border border-emerald-500/40 text-[11px] text-emerald-300 shadow-2xl backdrop-blur-xl pointer-events-none">
                    ✓ הועתק קישור לצפייה במסמך זה בלבד (הלקוח לא יקבל גישה למערכת)
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isGeneratingWord}
            onClick={handleDownloadWord}
            className="cursor-pointer h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-bold text-sky-200 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-75"
            title="הורד כמסמך Word מלא ומעוצב"
          >
            {isGeneratingWord ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">מייצר Word...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">הורד מסמך Word</span>
                <span className="sm:hidden">Word</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="cursor-pointer h-8 sm:h-9 px-3 sm:px-4 rounded-full text-xs font-bold text-[#eaf4ff] bg-white/10 hover:bg-white/15 border border-[#7dd3fc]/20 inline-flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">הדפס / שמור כ-PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="cursor-pointer h-8 sm:h-9 px-3.5 sm:px-5 rounded-full text-xs font-extrabold text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] inline-flex items-center gap-2 transition-all shadow-[0_4px_16px_rgba(34,211,238,0.55)] hover:brightness-105 active:scale-95 disabled:opacity-75"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>מייצר PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>הורד מסמך PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {approvedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600/90 border border-emerald-300 text-white text-xs font-bold shadow-2xl backdrop-blur-xl animate-sq-slide-down flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>הצעת המחיר אושרה ונחתמה דיגיטלית על ידי הלקוח! הודעה נשלחה למנהל המערכת.</span>
        </div>
      )}

      {/* Sheet Container on Strong Blue Background */}
      <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 md:p-10 bg-gradient-to-b from-[#0b2254] via-[#08183c] to-[#040d22] overflow-y-auto">
        {/* Page Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-3 max-w-[820px] w-full no-scrollbar">
          {[
            { id: 0, label: "כל 5 העמודים ברצף" },
            { id: 1, label: "עמוד 1: שער" },
            { id: 2, label: "עמוד 2: סיכום מנהלים" },
            { id: 3, label: "עמוד 3: שלבי הבדיקה" },
            { id: 4, label: "עמוד 4: עלויות ותמחור" },
            { id: 5, label: "עמוד 5: תנאים וחתימות" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePage(tab.id)}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activePage === tab.id
                  ? "bg-[#0d6282] text-white shadow-md shadow-[#0d6282]/40"
                  : "bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visible Document Container */}
        <div
          ref={documentRef}
          data-pdf-export-target="true"
          className="w-full max-w-[820px] flex flex-col items-center gap-8"
        >
          <ElixSowDocument
            quote={quote}
            clientName={clientName}
            categoryName={quote?.kind}
            totalCost={quote?.rawCost}
            mandays={quote?.mandays}
            components={quote?.components}
            targetSystem={quote?.targetSystem}
            customRequirements={quote?.customRequirements}
            scopeDetails={quote?.scopeDetails}
            activePage={activePage}
            editableClientName={false}
            organizationName={displayOrgName}
            authorName={authorName}
            authorEmail={authorEmail}
            authorPhone={authorPhone}
            hpNumber={hpNumber}
            bankAccountNumber={bankAccountNumber}
            bankNumber={bankNumber}
            branchNumber={branchNumber}
            beneficiaryName={beneficiaryName}
          />
        </div>

        {/* Hidden 5-Page Full Export Container */}
        <div style={{ position: "fixed", left: "-99999px", top: 0, opacity: 0, pointerEvents: "none" }}>
          <div ref={fullExportRef}>
            <ElixSowDocument
              quote={quote}
              clientName={clientName}
              categoryName={quote?.kind}
              totalCost={quote?.rawCost}
              mandays={quote?.mandays}
              components={quote?.components}
              targetSystem={quote?.targetSystem}
              customRequirements={quote?.customRequirements}
              scopeDetails={quote?.scopeDetails}
              activePage={0}
              editableClientName={false}
              organizationName={displayOrgName}
              authorName={authorName}
              authorEmail={authorEmail}
              authorPhone={authorPhone}
              hpNumber={hpNumber}
              bankAccountNumber={bankAccountNumber}
              bankNumber={bankNumber}
              branchNumber={branchNumber}
              beneficiaryName={beneficiaryName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
