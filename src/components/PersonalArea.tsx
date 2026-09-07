import React, { useEffect, useMemo, useState } from 'react';
import {
  UserCheck,
  Pencil,
  Save,
  X,
  Building2,
  Landmark,
  FileText,
  Check,
  Info,
} from 'lucide-react';
import { UserItem, Quote } from '../types';

interface PersonalAreaProps {
  currentUser?: UserItem | null;
  quotes: Quote[];
  /** Saves the profile, and optionally stamps the billing block onto quotes. */
  onSaveProfile: (patch: Partial<UserItem>, applyToQuoteIds: string[]) => void;
  onManageUsers?: () => void;
  /** Demo-only profile switcher, rendered next to the manage-users button. */
  switcherSlot?: React.ReactNode;
}

const PAYMENT_METHODS = ['העברה בנקאית', 'שיק', 'כרטיס אשראי', 'PayPal', 'מזומן'];

/** What gets copied onto a quote — kept in one place so the UI and the save agree. */
type BillingDraft = Pick<
  UserItem,
  | 'name'
  | 'organization'
  | 'role'
  | 'hpNumber'
  | 'beneficiaryName'
  | 'bankNumber'
  | 'branchNumber'
  | 'bankAccountNumber'
  | 'paymentMethod'
  | 'quoteNotes'
>;

const emptyDraft = (u?: UserItem | null): BillingDraft => ({
  name: u?.name || '',
  organization: u?.organization || '',
  role: u?.role || '',
  hpNumber: u?.hpNumber || '',
  beneficiaryName: u?.beneficiaryName || '',
  bankNumber: u?.bankNumber || '',
  branchNumber: u?.branchNumber || '',
  bankAccountNumber: u?.bankAccountNumber || '',
  paymentMethod: u?.paymentMethod || 'העברה בנקאית',
  quoteNotes: u?.quoteNotes || '',
});

export const PersonalArea: React.FC<PersonalAreaProps> = ({
  currentUser,
  quotes,
  onSaveProfile,
  onManageUsers,
  switcherSlot,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BillingDraft>(() => emptyDraft(currentUser));
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  // Re-seed whenever the account changes (or a save round-trips).
  useEffect(() => {
    setDraft(emptyDraft(currentUser));
  }, [currentUser]);

  const set = <K extends keyof BillingDraft>(key: K, value: BillingDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const billingFilled = useMemo(
    () =>
      [draft.hpNumber, draft.beneficiaryName, draft.bankAccountNumber].filter(Boolean).length,
    [draft]
  );

  const toggleQuote = (id: string) =>
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = () => {
    onSaveProfile(draft, selectedQuoteIds);
    setSelectedQuoteIds([]);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(emptyDraft(currentUser));
    setSelectedQuoteIds([]);
    setEditing(false);
  };

  const field = (
    label: string,
    key: keyof BillingDraft,
    placeholder: string,
    mono = false
  ) => (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold text-[#cbe1ff]/60">{label}</span>
      <input
        type="text"
        value={(draft[key] as string) || ''}
        onChange={(e) => set(key, e.target.value as BillingDraft[typeof key])}
        placeholder={placeholder}
        className={`w-full h-10 px-3 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-[13px] text-[#e8f2ff] outline-none transition-all focus:border-[#22d3ee] focus:bg-white/[0.07] ${
          mono ? 'font-mono' : ''
        }`}
      />
    </label>
  );

  /* ------------------------------ read view ------------------------------ */

  if (!editing) {
    return (
      <div className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-2xl border border-[#22d3ee]/25 bg-gradient-to-r from-[#172a48]/75 via-[#0e1b33]/85 to-[#0c1628]/75 backdrop-blur-md flex flex-col gap-3 shadow-[0_14px_34px_rgba(2,8,23,0.65)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex-none w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-[#04121f] shadow-md ring-2 ring-[#22d3ee]/40"
              style={{ background: currentUser?.avatar || 'linear-gradient(140deg, #2563eb, #22d3ee)' }}
            >
              {currentUser?.initials || 'מש'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-[#f2f8ff] tracking-tight">
                  {currentUser?.name || 'משתמש'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  חשבון פעיל ומאומת
                </span>
              </div>
              <div className="text-xs text-[#9fd4ff]/80 flex items-center gap-2 mt-0.5 flex-wrap">
                {currentUser?.organization && (
                  <>
                    <span className="font-semibold text-[#7dd3fc]">{currentUser.organization}</span>
                    <span className="text-[#7dd3fc]/40">·</span>
                  </>
                )}
                <span className="font-mono text-[#cbe1ff]/70">{currentUser?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap md:justify-end text-xs">
            {currentUser?.role && (
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-[#7dd3fc]/15 flex items-center gap-2">
                <span className="text-[#cbe1ff]/60 text-[11px]">תפקיד ארגוני:</span>
                <span className="font-bold text-[#f2f8ff] text-[11px]">{currentUser.role}</span>
              </div>
            )}
            {switcherSlot}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/40 text-[#a5f3fc] hover:bg-[#22d3ee]/25 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>האזור האישי שלי</span>
            </button>
            {onManageUsers && (
              <button
                type="button"
                onClick={onManageUsers}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-[#7dd3fc]/20 text-[#cbe1ff] hover:bg-[#7dd3fc]/15 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ניהול משתמשים</span>
              </button>
            )}
          </div>
        </div>

        {/* Billing summary — what will land on the next proposal. */}
        <div className="pt-2.5 border-t border-[#7dd3fc]/10 flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-[#cbe1ff]/55 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-[#7dd3fc]/70" />
            פרטי חיוב להצעות:
          </span>
          {billingFilled === 0 ? (
            <span className="text-amber-300/90 font-semibold">
              עדיין לא הוגדרו — לחצי על "האזור האישי שלי" כדי למלא
            </span>
          ) : (
            <>
              {draft.hpNumber && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-[#7dd3fc]/15 text-[#cbe1ff]/80 font-mono">
                  ח.פ {draft.hpNumber}
                </span>
              )}
              {draft.beneficiaryName && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-[#7dd3fc]/15 text-[#cbe1ff]/80">
                  {draft.beneficiaryName}
                </span>
              )}
              {draft.bankAccountNumber && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-[#7dd3fc]/15 text-[#cbe1ff]/80 font-mono">
                  בנק {draft.bankNumber} · סניף {draft.branchNumber} · ח-ן {draft.bankAccountNumber}
                </span>
              )}
              {draft.paymentMethod && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-[#7dd3fc]/15 text-[#cbe1ff]/80">
                  {draft.paymentMethod}
                </span>
              )}
            </>
          )}
          {draft.quoteNotes && (
            <span className="px-2 py-0.5 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/25 text-[#a5f3fc] max-w-[280px] truncate" title={draft.quoteNotes}>
              הערה: {draft.quoteNotes}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------ edit view ------------------------------ */

  return (
    <div className="mb-4 sm:mb-5 p-4 sm:p-5 rounded-2xl border border-[#22d3ee]/35 bg-gradient-to-br from-[#152744]/90 to-[#0a1224]/92 backdrop-blur-md shadow-[0_20px_45px_rgba(2,8,23,0.75)] flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex-none w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-[#04121f] ring-2 ring-[#22d3ee]/40"
            style={{ background: currentUser?.avatar || 'linear-gradient(140deg, #2563eb, #22d3ee)' }}
          >
            {currentUser?.initials || 'מש'}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#f2f8ff]">האזור האישי שלי</h2>
            <p className="text-[11px] text-[#cbe1ff]/60 font-mono truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="סגור"
          className="flex-none p-1.5 rounded-lg text-[#cbe1ff]/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Identity */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[12px] font-bold text-[#7dd3fc] flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          פרטי הזהות שלי
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {field('שם מלא', 'name', 'השם שיופיע על ההצעה')}
          {field('ארגון / עסק', 'organization', 'שם החברה')}
          {field('תפקיד', 'role', 'למשל: יועץ סייבר בכיר')}
        </div>
        <p className="text-[11px] text-[#cbe1ff]/45">
          כתובת האימייל היא מזהה החשבון ולכן אינה ניתנת לשינוי כאן.
        </p>
      </section>

      {/* Billing */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[12px] font-bold text-[#7dd3fc] flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5" />
          פרטי חיוב שיופיעו בהצעת המחיר
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {field('ח.פ / ע.מ', 'hpNumber', 'מספר ח.פ', true)}
          {field('שם המוטב', 'beneficiaryName', 'שם בעל החשבון')}
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-semibold text-[#cbe1ff]/60">אמצעי תשלום</span>
            <select
              value={draft.paymentMethod || 'העברה בנקאית'}
              onChange={(e) => set('paymentMethod', e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#7dd3fc]/20 bg-[#0f1a30] text-[13px] text-[#e8f2ff] outline-none focus:border-[#22d3ee] cursor-pointer"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {field('מס׳ בנק', 'bankNumber', '12', true)}
          {field('מס׳ סניף', 'branchNumber', '680', true)}
          {field('מס׳ חשבון', 'bankAccountNumber', 'מספר חשבון', true)}
        </div>
      </section>

      {/* Free text appended to proposals */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[12px] font-bold text-[#7dd3fc] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          פרטים נוספים שיתווספו להצעת המחיר
        </h3>
        <textarea
          value={draft.quoteNotes || ''}
          onChange={(e) => set('quoteNotes', e.target.value)}
          rows={3}
          placeholder="למשל: תנאי תשלום שוטף +30 · ההצעה בתוקף ל-30 יום · המחירים אינם כוללים מע״מ"
          className="w-full px-3 py-2.5 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-[13px] leading-relaxed text-[#e8f2ff] outline-none resize-y transition-all focus:border-[#22d3ee] focus:bg-white/[0.07]"
        />
      </section>

      {/* Scope: which proposals does this apply to */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[12px] font-bold text-[#7dd3fc] flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          על אילו הצעות מחיר להחיל?
        </h3>

        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#22d3ee]/8 border border-[#22d3ee]/25 text-[11px] text-[#a5f3fc] leading-relaxed">
          <Info className="w-3.5 h-3.5 flex-none mt-0.5" />
          <span>
            הפרטים האלה נשמרים בפרופיל ומשובצים אוטומטית <strong>בכל הצעה חדשה</strong> שתפיקי מעכשיו.
            אם תרצי לעדכן גם הצעות שכבר קיימות, סמני אותן כאן.
          </span>
        </div>

        {quotes.length === 0 ? (
          <p className="text-[11px] text-[#cbe1ff]/45">אין עדיין הצעות קיימות לעדכון.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedQuoteIds(quotes.map((q) => q.id))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-[#7dd3fc]/20 text-[#cbe1ff]/80 hover:bg-white/10 cursor-pointer"
              >
                בחר הכל ({quotes.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuoteIds([])}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-[#7dd3fc]/20 text-[#cbe1ff]/80 hover:bg-white/10 cursor-pointer"
              >
                נקה בחירה
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {quotes.map((q) => {
                const checked = selectedQuoteIds.includes(q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleQuote(q.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-right transition-all cursor-pointer ${
                      checked
                        ? 'bg-[#22d3ee]/15 border-[#22d3ee]/40'
                        : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span
                      className={`flex-none w-4 h-4 rounded-md border flex items-center justify-center ${
                        checked ? 'bg-[#22d3ee] border-[#22d3ee]' : 'border-[#7dd3fc]/40'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-[#04121f]" />}
                    </span>
                    <span className="flex-1 min-w-0 text-[12px] font-semibold text-[#eaf4ff] truncate">
                      {q.client}
                    </span>
                    <span className="flex-none text-[11px] text-[#7dd3fc]/70 font-mono">{q.cost}</span>
                    <span className="flex-none text-[10px] text-[#cbe1ff]/45">{q.status}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#cbe1ff]/75 hover:bg-white/10 transition-colors cursor-pointer"
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          <span>
            שמור
            {selectedQuoteIds.length > 0 ? ` והחל על ${selectedQuoteIds.length} הצעות` : ''}
          </span>
        </button>
      </div>
    </div>
  );
};
