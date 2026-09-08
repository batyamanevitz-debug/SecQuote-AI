import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  TrendingUp,
  Search,
  Pencil,
  Send,
  Eye,
  Mail,
  MessageCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Trash2,
  Plus,
  Filter,
  Users,
  UserCheck,
} from 'lucide-react';
import { Quote, UserItem, QuoteStatus, ViewMode } from '../types';
import { Header } from '../components/Header';
import { getUserGreeting } from '../utils/greeting';
import { PersonalArea } from '../components/PersonalArea';

interface DashboardViewProps {
  quotes: Quote[];
  currentUser?: UserItem | null;
  users?: UserItem[];
  onSwitchUser?: (userId: string) => void;
  onNavigate?: (view: ViewMode) => void;
  onNewQuote: () => void;
  onEditQuote: (quote: Quote) => void;
  onViewSow: (quote: Quote) => void;
  onSendQuote: (quoteId: string) => void;
  onQuoteStatusUpdate?: (quoteId: string, newStatus: QuoteStatus) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onDuplicateQuote?: (quote: Quote) => void;
  /** Saves the profile and optionally stamps billing onto chosen quotes. */
  onSaveProfile?: (patch: Partial<UserItem>, applyToQuoteIds: string[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotes,
  currentUser,
  users,
  onSwitchUser,
  onNavigate,
  onNewQuote,
  onEditQuote,
  onViewSow,
  onSendQuote,
  onQuoteStatusUpdate,
  onDeleteQuote,
  onDuplicateQuote,
  onSaveProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [userScope, setUserScope] = useState<'all' | 'my'>('all');
  const [activeShareQuote, setActiveShareQuote] = useState<Quote | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  // Dynamic calculations based on all quotes
  const totalCount = quotes.length;
  const approvedQuotes = quotes.filter((q) => q.status === 'אושר');
  const draftQuotes = quotes.filter((q) => q.status === 'טיוטה');
  const sentQuotes = quotes.filter((q) => q.status === 'נשלח');

  const approvedCount = approvedQuotes.length;
  const draftCount = draftQuotes.length;
  const sentCount = sentQuotes.length;

  const totalRevenue = quotes.reduce((acc, q) => acc + (q.rawCost || 0), 0);
  const approvedRevenue = approvedQuotes.reduce((acc, q) => acc + (q.rawCost || 0), 0);
  const totalMandays = quotes.reduce((acc, q) => acc + (q.mandays || 0), 0);
  const closeRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  // Filtered quotes based on scope, search, and status
  const filteredQuotes = quotes.filter((q) => {
    // Scope filter (all vs my quotes)
    if (userScope === 'my' && currentUser) {
      const matchUser =
        (q.authorEmail && q.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        q.authorName === currentUser.name ||
        q.organizationName === currentUser.organization;
      if (!matchUser) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && q.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      const matchClient = q.client.toLowerCase().includes(term);
      const matchKind = q.kind.toLowerCase().includes(term);
      const matchId = q.id.toLowerCase().includes(term);
      const matchOrg = q.organizationName ? q.organizationName.toLowerCase().includes(term) : false;
      return matchClient || matchKind || matchId || matchOrg;
    }

    return true;
  });

  const getDocLink = (quote: Quote) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    // The client link carries the secret share token, never the row id — the
    // row id is only readable by its owner.
    const token = quote.shareToken || quote.id;
    return `${origin}${path}?doc=${encodeURIComponent(token)}&public=true`;
  };

  const getShareMessage = (quote: Quote) => {
    const link = getDocLink(quote);
    return `שלום ${quote.client},\nמצורפת הצעת המחיר ומפרט העבודה (SOW) עבור ${quote.kind}:\n• היקף: ${quote.mandays || 'מותאם'}\n• עלות כוללת: ${quote.cost}\n\nלצפייה במסמך המלא ובאישור דיגיטלי:\n${link}`;
  };

  const handleOpenWhatsApp = (quote: Quote) => {
    const message = getShareMessage(quote);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onSendQuote(quote.id);
    setActiveShareQuote(null);
  };

  const handleOpenEmail = (quote: Quote) => {
    const subject = `הצעת מחיר ואיפיון מקצועי (SOW) עבור ${quote.client} - SecQuote`;
    const body = getShareMessage(quote);
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
    onSendQuote(quote.id);
    setActiveShareQuote(null);
  };

  const handleCopyLink = (quote: Quote) => {
    const link = getDocLink(quote);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedLink(true);
    onSendQuote(quote.id);
    setTimeout(() => {
      setCopiedLink(false);
      setActiveShareQuote(null);
    }, 2000);
  };

  const handleStatusSelect = (quoteId: string, newStatus: QuoteStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuoteStatusUpdate) {
      onQuoteStatusUpdate(quoteId, newStatus);
    }
    setOpenStatusMenuId(null);
  };

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'טיוטה':
        return {
          bg: 'bg-amber-400/15 border-amber-400/35 hover:bg-amber-400/25',
          text: 'text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'נשלח':
        return {
          bg: 'bg-sky-400/15 border-sky-400/35 hover:bg-sky-400/25',
          text: 'text-sky-300',
          dot: 'bg-sky-400',
        };
      case 'אושר':
        return {
          bg: 'bg-emerald-400/15 border-emerald-400/35 hover:bg-emerald-400/25',
          text: 'text-emerald-300',
          dot: 'bg-emerald-400',
        };
    }
  };

  return (
    <div
      className="flex-1 min-w-0 flex flex-col h-full overflow-hidden"
      onClick={() => setOpenStatusMenuId(null)}
    >
      {/* Pinned Top Header */}
      <div className="flex-none px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-[#080d1c]/90 backdrop-blur-xl border-b border-[#7dd3fc]/15 z-20">
        <Header
          title={getUserGreeting(currentUser)}
          subtitle={`${currentUser?.organization || 'הארגון שלי'} · ${totalCount} הצעות במערכת · ${draftCount} טיוטות · ${approvedCount} אושרו`}
          onNewQuote={onNewQuote}
          currentUser={currentUser}
          quotes={quotes}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto pb-28 lg:pb-8">
        {/* Personal area: identity, billing details reused on every quote,
            and the free text the user wants appended to proposals. */}
        <PersonalArea
          currentUser={currentUser}
          quotes={quotes}
          onSaveProfile={onSaveProfile ?? (() => {})}
          onManageUsers={onNavigate ? () => onNavigate('users') : undefined}
          switcherSlot={
            <>
                {/* Dynamic User Switcher */}
                {users && users.length > 0 && onSwitchUser && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
                      className="px-3 py-1.5 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/35 text-[#67e8f9] hover:bg-[#22d3ee]/25 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title="החלפת משתמש מהירה"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>החלף משתמש ({users.length})</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isUserSwitcherOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserSwitcherOpen && (
                      <div className="absolute left-0 top-[calc(100%+6px)] z-40 min-w-[260px] p-2 rounded-2xl border border-[#22d3ee]/35 bg-[#091020]/95 shadow-[0_24px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#7dd3fc] border-b border-white/10 mb-1 flex items-center justify-between">
                          <span>משתמשים פעילים במערכת</span>
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserSwitcherOpen(false);
                                onNavigate('users');
                              }}
                              className="text-[10px] text-[#22d3ee] hover:underline cursor-pointer"
                            >
                              ניהול משתמשים →
                            </button>
                          )}
                        </div>
                        <div className="max-h-[220px] overflow-y-auto flex flex-col gap-1 pr-1">
                          {users.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                onSwitchUser(u.id);
                                setIsUserSwitcherOpen(false);
                              }}
                              className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-xs text-right cursor-pointer transition-colors ${
                                currentUser?.id === u.id
                                  ? 'bg-[#22d3ee]/20 text-[#f2f8ff] font-bold'
                                  : 'text-[#cbe1ff]/80 hover:bg-white/10'
                              }`}
                            >
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#04121f] flex-none"
                                style={{ background: u.avatar }}
                              >
                                {u.initials}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold truncate">{u.name}</div>
                                <div className="text-[10px] text-[#7dd3fc]/70 truncate">{u.organization || 'ללא ארגון'}</div>
                              </div>
                              {currentUser?.id === u.id ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">פעיל</span>
                              ) : (
                                <span className="text-[10px] text-[#22d3ee] opacity-0 hover:opacity-100">בחר</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </>
          }
        />

        {/* Metric Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Active Quotes */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#14203a]/80 to-[#0a1020]/85 shadow-[0_24px_50px_-30px_rgba(2,8,23,0.9)] transition-all">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs sm:text-sm font-medium text-[#cbe1ff]/70">
                הצעות מחיר פעילות
              </span>
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-400/15 flex items-center justify-center text-[#7dd3fc]">
                <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f6fbff]">
                {totalCount}
              </span>
              <span className="text-xs text-[#7dd3fc] font-mono">
                {totalMandays} ימי עבודה
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-sky-400 font-semibold">
                {sentCount} נשלחו ללקוחות
              </span>
              <span className="text-amber-300 font-medium">
                {draftCount} בטיוטה
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#7dd3fc]/10 flex items-center justify-between text-[11px]">
              <span className="text-[#cbe1ff]/60">פרופיל אחראי:</span>
              <span className="text-[#7dd3fc] font-semibold truncate max-w-[170px]" title={currentUser?.name}>
                {currentUser?.name || 'משתמש'} ({currentUser?.organization || 'הארגון שלי'})
              </span>
            </div>
          </div>

          {/* Card 2: Approved Quotes & Conversion */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#14203a]/80 to-[#0a1020]/85 shadow-[0_24px_50px_-30px_rgba(2,8,23,0.9)] transition-all">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs sm:text-sm font-medium text-[#cbe1ff]/70">
                אושרו ונסגרו
              </span>
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-400/15 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f6fbff]">
                {approvedCount}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {closeRate}% שיעור סגירה
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-[#cbe1ff]/70 font-mono">
                ₪{approvedRevenue.toLocaleString('he-IL')} סגור
              </span>
              <span className="text-emerald-400/90 font-medium">
                {approvedQuotes.length > 0 ? `${approvedCount} עסקאות חתומות` : 'טרם נסגרו'}
              </span>
            </div>
          </div>

          {/* Card 3: Revenue Pipeline */}
          <div className="sm:col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl border border-[#22d3ee]/35 bg-gradient-to-br from-[#172a48]/90 to-[#0a1224]/90 shadow-[0_24px_50px_-30px_rgba(2,8,23,0.9),0_0_44px_-22px_rgba(34,211,238,0.5)] transition-all">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs sm:text-sm font-medium text-[#cbe1ff]/70">
                צבר הכנסות כולל
              </span>
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#22d3ee]/15 flex items-center justify-center text-[#67e8f9]">
                <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f6fbff]">
                ₪{totalRevenue.toLocaleString('he-IL')}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">
                ₪{approvedRevenue.toLocaleString('he-IL')} אושרו בפועל
              </span>
              <span className="text-[#7dd3fc] truncate font-medium max-w-[200px]" title={currentUser?.organization || 'הארגון שלי'}>
                {currentUser?.name || 'משתמש'} · {currentUser?.organization || 'הארגון שלי'}
              </span>
            </div>
          </div>
        </section>

        {/* First-run empty state — a brand new account has nothing to list yet. */}
        {totalCount === 0 ? (
          <section className="flex-1 flex flex-col items-center justify-center text-center mt-6 sm:mt-7 px-6 py-14 rounded-2xl sm:rounded-3xl border border-dashed border-[#7dd3fc]/25 bg-gradient-to-br from-[#101a30]/60 to-[#090f1e]/80">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#22d3ee]/10 border border-[#22d3ee]/30 mb-5">
              <FileText className="w-7 h-7 text-[#22d3ee]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f2f8ff] mb-2.5">
              עדיין אין לך הצעות מחיר
            </h2>
            <p className="text-sm text-[#cbe1ff]/70 max-w-[44ch] leading-relaxed mb-7">
              זו סביבת העבודה הפרטית שלך. צור את ההצעה הראשונה והאשף ילווה אותך משלב האפיון ועד
              מסמך ה-SOW המוכן לשליחה ללקוח.
            </p>
            <button
              type="button"
              onClick={onNewQuote}
              className="cursor-pointer h-12 px-7 rounded-full font-['Heebo'] text-base font-extrabold text-[#04121f] bg-gradient-to-r from-[#1d4ed8] via-[#0ea5e9] to-[#22d3ee] shadow-[0_16px_40px_-14px_rgba(34,211,238,0.75)] hover:-translate-y-0.5 transition-all duration-200"
            >
              צור הצעת מחיר ראשונה
            </button>
          </section>
        ) : (
        /* Quotes Container */
        <section className="flex-1 flex flex-col mt-6 sm:mt-7 rounded-2xl sm:rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/90 shadow-[0_30px_70px_-34px_rgba(2,8,23,0.95)] overflow-visible md:overflow-hidden">
          {/* Table Top Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 p-4 sm:p-5 md:px-6 border-b border-[#7dd3fc]/10">
            {/* Title & Count */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#f2f8ff]">
                  היסטוריית הצעות מחיר
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7dd3fc]/15 text-[#9fd4ff] border border-[#7dd3fc]/25 font-mono">
                  {filteredQuotes.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onNewQuote}
                className="sm:hidden cursor-pointer h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>חדשה</span>
              </button>
            </div>

            {/* Filter Tabs & Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060c1c]/80 border border-[#7dd3fc]/15 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'all'
                      ? 'bg-[#22d3ee]/20 text-[#22d3ee] shadow-sm'
                      : 'text-[#cbe1ff]/60 hover:text-white'
                  }`}
                >
                  <span>הכל</span>
                  <span className="text-[10px] px-1 rounded-full bg-white/10">{quotes.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('טיוטה')}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'טיוטה'
                      ? 'bg-amber-400/20 text-amber-300 shadow-sm'
                      : 'text-[#cbe1ff]/60 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>טיוטה</span>
                  <span className="text-[10px] px-1 rounded-full bg-white/10">{draftCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('נשלח')}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'נשלח'
                      ? 'bg-sky-400/20 text-sky-300 shadow-sm'
                      : 'text-[#cbe1ff]/60 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>נשלח</span>
                  <span className="text-[10px] px-1 rounded-full bg-white/10">{sentCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('אושר')}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'אושר'
                      ? 'bg-emerald-400/20 text-emerald-300 shadow-sm'
                      : 'text-[#cbe1ff]/60 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>אושר</span>
                  <span className="text-[10px] px-1 rounded-full bg-white/10">{approvedCount}</span>
                </button>
              </div>

              {/* User Scope Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060c1c]/80 border border-[#7dd3fc]/15">
                <button
                  type="button"
                  onClick={() => setUserScope('all')}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    userScope === 'all'
                      ? 'bg-[#22d3ee]/20 text-[#22d3ee]'
                      : 'text-[#cbe1ff]/60 hover:text-white'
                  }`}
                >
                  כלל ההצעות
                </button>
                <button
                  type="button"
                  onClick={() => setUserScope('my')}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    userScope === 'my'
                      ? 'bg-[#22d3ee]/20 text-[#22d3ee]'
                      : 'text-[#cbe1ff]/60 hover:text-white'
                  }`}
                >
                  ההצעות שלי
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex items-center flex-1 sm:flex-none sm:min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute right-3.5 text-[#7dd3fc] opacity-85 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש לפי לקוח..."
                  className="w-full h-9 pr-9 pl-3 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-[#e8f2ff] text-xs outline-none transition-all duration-200 focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/15"
                />
              </div>
            </div>
          </div>

          {/* Mobile Cards View (Visible on mobile/tablet < md) */}
          <div className="md:hidden flex flex-col divide-y divide-[#7dd3fc]/10 p-3 sm:p-4">
            {filteredQuotes.map((row) => {
              const badge = getStatusBadge(row.status);
              const isStatusMenuOpen = openStatusMenuId === row.id;

              return (
                <div
                  key={row.id}
                  className="py-4 first:pt-1 last:pb-2 flex flex-col gap-3 rounded-2xl transition-all"
                >
                  {/* Card Header: Client & Interactive Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex-none w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563eb]/20 to-[#22d3ee]/20 border border-[#7dd3fc]/30 flex items-center justify-center text-xs font-black text-[#67e8f9] shadow-sm">
                        {row.initials}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[#f0f7ff] block truncate">
                          {row.client}
                        </span>
                        <span className="text-[11px] font-mono text-[#cbe1ff]/50">
                          {row.id} · {row.authorName || currentUser?.name || ''}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Status Switcher */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuId(isStatusMenuOpen ? null : row.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shadow-sm transition-all cursor-pointer ${badge.bg} ${badge.text}`}
                        title="לחץ לשינוי סטטוס דינמי"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{row.status}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      {isStatusMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 mt-1.5 z-40 w-32 p-1 rounded-xl bg-[#091122] border border-[#7dd3fc]/35 shadow-[0_10px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl flex flex-col gap-0.5"
                        >
                          {(['טיוטה', 'נשלח', 'אושר'] as QuoteStatus[]).map((st) => {
                            const b = getStatusBadge(st);
                            const isCurrent = row.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={(e) => handleStatusSelect(row.id, st, e)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-white/10 text-white'
                                    : 'text-[#cbe1ff]/70 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                                  <span>{st}</span>
                                </div>
                                {isCurrent && <Check className="w-3 h-3 text-[#22d3ee]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#070d1c]/70 border border-[#7dd3fc]/15 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-[#cbe1ff]/50 mb-0.5">
                        סוג מבדק
                      </span>
                      <span className="font-semibold text-[#d8eeff] truncate block">
                        {row.kind}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-[#cbe1ff]/50 mb-0.5">
                        תאריך
                      </span>
                      <span className="font-mono text-[#cbe1ff]/85 block">
                        {row.date}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-[#cbe1ff]/50 mb-0.5">
                        עלות משוערת
                      </span>
                      <span className="font-mono font-bold text-[#67e8f9] block">
                        {row.cost}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions Toolbar */}
                  {row.sharedWithMe ? (
                    <div className="pt-0.5 flex items-center gap-2 text-[11px] text-[#7dd3fc]/80">
                      {row.sharedCanEdit ? (
                        <Pencil className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {row.sharedCanEdit
                          ? 'הצעה ששותפה איתך · ניתנת לעריכה'
                          : 'הצעה ששותפה איתך · צפייה בלבד'}
                      </span>
                      {row.sharedCanEdit && (
                        <button
                          type="button"
                          onClick={() => onEditQuote(row)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/35 text-emerald-300 font-bold cursor-pointer"
                        >
                          ערוך
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewSow(row)}
                        className="mr-auto px-2.5 py-1 rounded-lg bg-[#22d3ee]/15 border border-[#22d3ee]/35 text-[#67e8f9] font-bold cursor-pointer"
                      >
                        פתח מסמך
                      </button>
                    </div>
                  ) : (
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onEditQuote(row)}
                      className="cursor-pointer h-9 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-[#e0f2fe] bg-sky-500/15 border border-[#38bdf8]/40 hover:bg-[#38bdf8]/25 active:scale-95 transition-all shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>עריכה</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveShareQuote(row)}
                      className="cursor-pointer h-9 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold text-[#67e8f9] bg-gradient-to-r from-[#0284c7]/20 to-[#0369a1]/20 border border-[#38bdf8]/35 hover:bg-[#38bdf8]/20 active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>שליחה</span>
                    </button>
                    {onDuplicateQuote && (
                      <button
                        type="button"
                        onClick={() => onDuplicateQuote(row)}
                        className="cursor-pointer h-9 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold text-[#cbe1ff]/80 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#7dd3fc]" />
                        <span>שכפל</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onViewSow(row)}
                      className="cursor-pointer h-9 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] shadow-[0_4px_14px_rgba(34,211,238,0.35)] hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>SOW</span>
                    </button>
                  </div>
                  )}
                </div>
              );
            })}

            {filteredQuotes.length === 0 && (
              <div className="p-8 text-center text-xs text-[#cbe1ff]/60">
                לא נמצאו הצעות מחיר התואמות את הסינון הנוכחי.
              </div>
            )}
          </div>

          {/* Desktop Table Area (Visible on md+) */}
          <div className="hidden md:block flex-1 overflow-x-auto">
            <div className="min-w-[840px]">
              {/* Header Row */}
              <div className="grid grid-cols-[1.6fr_1fr_1.3fr_1.1fr_1fr_1.4fr] gap-3 px-6 py-3 bg-[#7dd3fc]/[0.06] border-b border-[#7dd3fc]/12 text-xs font-bold text-[#cbe1ff]/70 tracking-wide">
                <span>שם הלקוח</span>
                <span>תאריך</span>
                <span>סוג מבדק</span>
                <span>סטטוס (דינמי)</span>
                <span>עלות</span>
                <span className="text-left">פעולות</span>
              </div>

              {/* Rows */}
              {filteredQuotes.map((row) => {
                const badge = getStatusBadge(row.status);
                const isStatusMenuOpen = openStatusMenuId === row.id;

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.6fr_1fr_1.3fr_1.1fr_1fr_1.4fr] gap-3 items-center min-h-[64px] px-6 py-2.5 border-b border-[#7dd3fc]/[0.07] hover:bg-[#7dd3fc]/[0.04] transition-colors"
                  >
                    {/* Client with Initials */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex-none w-8.5 h-8.5 rounded-xl bg-[#7dd3fc]/10 border border-[#7dd3fc]/20 flex items-center justify-center text-xs font-extrabold text-[#9fd4ff]">
                        {row.initials}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-[#eaf4ff] truncate block">
                          {row.client}
                        </span>
                        <span className="text-[11px] text-[#cbe1ff]/50 font-mono">
                          {row.organizationName || currentUser?.organization || ''}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <span className="text-sm text-[#cbe1ff]/75 font-mono">
                      {row.date}
                    </span>

                    {/* Kind */}
                    <span className="text-sm text-[#d8eeff]/85 whitespace-nowrap">
                      {row.kind}
                    </span>

                    {/* Interactive Status Badge with Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuId(isStatusMenuOpen ? null : row.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${badge.bg} ${badge.text}`}
                        title="לחץ לעדכון סטטוס דינמי"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{row.status}</span>
                        <ChevronDown className="w-3 h-3 opacity-70 transition-transform" />
                      </button>

                      {isStatusMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1.5 z-40 w-32 p-1 rounded-xl bg-[#091122] border border-[#7dd3fc]/35 shadow-[0_10px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl flex flex-col gap-0.5"
                        >
                          {(['טיוטה', 'נשלח', 'אושר'] as QuoteStatus[]).map((st) => {
                            const b = getStatusBadge(st);
                            const isCurrent = row.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={(e) => handleStatusSelect(row.id, st, e)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-white/10 text-white'
                                    : 'text-[#cbe1ff]/70 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                                  <span>{st}</span>
                                </div>
                                {isCurrent && <Check className="w-3 h-3 text-[#22d3ee]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#f2f8ff] font-mono">
                        {row.cost}
                      </span>
                      {row.mandays && (
                        <span className="text-[10px] text-[#7dd3fc]/70 font-mono">
                          {row.mandays} ימי עבודה
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {row.sharedWithMe ? (
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={
                            row.sharedCanEdit
                              ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/25'
                              : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#22d3ee]/10 text-[#7dd3fc] border border-[#22d3ee]/25'
                          }
                        >
                          {row.sharedCanEdit ? (
                            <Pencil className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          {row.sharedCanEdit ? 'שותף · עריכה' : 'צפייה בלבד'}
                        </span>
                        {row.sharedCanEdit && (
                          <button
                            type="button"
                            title="ערוך הצעה משותפת"
                            onClick={() => onEditQuote(row)}
                            className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-emerald-300 hover:bg-emerald-400/15 border border-transparent hover:border-emerald-400/35 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="פתח מסמך"
                          onClick={() => onViewSow(row)}
                          className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[#7dd3fc] hover:bg-[#38bdf8]/20 hover:text-white border border-transparent hover:border-[#38bdf8]/35 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="ערוך הצעה"
                        onClick={() => onEditQuote(row)}
                        className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[#7dd3fc] hover:bg-[#38bdf8]/20 hover:text-white border border-transparent hover:border-[#38bdf8]/35 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="שלח ללקוח (WhatsApp / אימייל / קישור)"
                        onClick={() => setActiveShareQuote(row)}
                        className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[#38bdf8] hover:bg-[#38bdf8]/15 hover:text-white transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      {onDuplicateQuote && (
                        <button
                          type="button"
                          title="שכפל הצעה זו"
                          onClick={() => onDuplicateQuote(row)}
                          className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[#cbe1ff]/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="צפה במסמך SOW"
                        onClick={() => onViewSow(row)}
                        className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-[#9fd4ff] hover:bg-[#7dd3fc]/15 hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteQuote && (
                        <button
                          type="button"
                          title="מחק הצעה"
                          onClick={() => setQuoteToDelete(row)}
                          className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                );
              })}

              {filteredQuotes.length === 0 && (
                <div className="p-12 text-center text-sm text-[#cbe1ff]/60">
                  לא נמצאו הצעות מחיר התואמות את הסינון הנוכחי.
                </div>
              )}
            </div>
          </div>
        </section>
        )}
      </div>

      {/* Share / Send Modal */}
      {activeShareQuote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveShareQuote(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#7dd3fc]/25 bg-[#091122] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#7dd3fc]/15 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center text-white shadow-[0_0_15px_rgba(2,132,199,0.4)]">
                  <Send className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    שליחת הצעת מחיר ללקוח
                  </h3>
                  <p className="text-xs text-[#cbe1ff]/60">
                    {activeShareQuote.client} · {activeShareQuote.kind}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveShareQuote(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#cbe1ff]/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex flex-col gap-3.5">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(activeShareQuote)}
                className="cursor-pointer w-full p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <MessageCircle className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white group-hover:text-emerald-200">
                      שליחה ישירה ב-WhatsApp
                    </div>
                    <div className="text-[11px] text-emerald-400/80">
                      פתיחת צ'אט עם הודעה מוכנה וקישור למסמך
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenEmail(activeShareQuote)}
                className="cursor-pointer w-full p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white group-hover:text-sky-200">
                      שליחה בדוא"ל
                    </div>
                    <div className="text-[11px] text-sky-400/80">
                      פתיחת תוכנת האימייל עם נושא ומלל מוכנים
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-sky-400" />
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink(activeShareQuote)}
                className="cursor-pointer w-full p-3.5 rounded-xl border border-[#7dd3fc]/25 bg-white/[0.03] hover:bg-white/[0.07] text-[#cbe1ff] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#7dd3fc]">
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4.5 h-4.5" />}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {copiedLink ? 'הקישור הועתק בהצלחה!' : 'העתקת קישור ישיר למסמך ה-SOW'}
                    </div>
                    <div className="text-[11px] text-[#cbe1ff]/60">
                      קישור לקריאה וחתימה דיגיטלית עבור הלקוח
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#7dd3fc]">
                  {copiedLink ? 'הועתק ✓' : 'העתק'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quoteToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setQuoteToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#0c1220] p-5 shadow-2xl flex flex-col gap-4 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  מחיקת הצעת מחיר
                </h3>
                <p className="text-xs text-[#cbe1ff]/60">
                  {quoteToDelete.client} ({quoteToDelete.cost})
                </p>
              </div>
            </div>
            <p className="text-xs text-[#cbe1ff]/80">
              האם אתה בטוח שברצונך למחוק את הצעת המחיר הזו לצמיתות מהמערכת? פעולה זו אינה ניתנת לביטול.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#cbe1ff]/70 hover:text-white hover:bg-white/10 transition-all"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteQuote) onDeleteQuote(quoteToDelete.id);
                  setQuoteToDelete(null);
                }}
                className="cursor-pointer px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-900/40"
              >
                מחק הצעה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
