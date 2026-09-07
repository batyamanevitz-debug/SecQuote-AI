import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode, Quote, UserItem, QuoteStatus } from './types';
import { INITIAL_QUOTES, INITIAL_USERS, DEMO_OWNER } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Logo } from './components/Logo';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { WizardView } from './views/WizardView';
import { MarketView } from './views/MarketView';
import { UsersView } from './views/UsersView';
import { SowDocumentView } from './views/SowDocumentView';
import { Menu, LayoutDashboard, FileText, Users, Settings, PlayCircle, X, LogOut } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import * as db from './services/dataService';

/**
 * 'booting'  — restoring a session, nothing rendered yet
 * 'auth'     — signed out, showing the login screen
 * 'live'     — signed in, every change persists to Supabase
 * 'demo'     — local sandbox with sample data, nothing persists
 */
type SessionMode = 'booting' | 'auth' | 'live' | 'demo';

export default function App() {
  /* ------------------------- public client link ------------------------- */

  const shareTokenFromUrl = (() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('doc') || params.get('proposal');
  })();

  const [isPublicClientView, setIsPublicClientView] = useState<boolean>(() => !!shareTokenFromUrl);
  const [publicDocLoading, setPublicDocLoading] = useState<boolean>(() => !!shareTokenFromUrl);

  /* ----------------------------- session ------------------------------- */

  const [mode, setMode] = useState<SessionMode>(shareTokenFromUrl ? 'auth' : 'booting');
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [team, setTeam] = useState<UserItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [selectedQuoteForSow, setSelectedQuoteForSow] = useState<Quote | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(shareTokenFromUrl ? 'sow_doc' : 'auth');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState<boolean>(false);

  const isDemo = mode === 'demo';
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2800);
  }, []);

  /* --------------------- resolve a shared proposal ---------------------- */

  useEffect(() => {
    if (!shareTokenFromUrl) return;
    let cancelled = false;

    (async () => {
      try {
        if (isSupabaseConfigured) {
          const found = await db.fetchSharedQuote(shareTokenFromUrl);
          if (!cancelled && found) {
            setSelectedQuoteForSow(found);
            setPublicDocLoading(false);
            return;
          }
        }
      } catch {
        /* fall through to the local/demo lookup below */
      }

      // Demo links (and links opened on the machine that produced them).
      try {
        const cached = localStorage.getItem(`secquote_doc_${shareTokenFromUrl}`);
        if (cached && !cancelled) {
          setSelectedQuoteForSow(JSON.parse(cached));
          setPublicDocLoading(false);
          return;
        }
      } catch {
        /* ignore */
      }

      const demoMatch = INITIAL_QUOTES.find((q) => q.id === shareTokenFromUrl);
      if (!cancelled) {
        setSelectedQuoteForSow(demoMatch || null);
        setPublicDocLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareTokenFromUrl]);

  /* ----------------------------- auth wiring ---------------------------- */

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMode((m) => (m === 'booting' ? 'auth' : m));
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const uid = data.session?.user?.id ?? null;
      setAuthUserId(uid);
      setMode((m) => (m === 'demo' ? m : uid ? 'live' : 'auth'));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setAuthUserId(uid);
      if (uid) {
        setMode('live');
      } else {
        setMode((m) => (m === 'demo' ? m : 'auth'));
        setQuotes([]);
        setTeam([]);
        setCurrentUser(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ------------------- load this account's own data --------------------- */

  useEffect(() => {
    if (mode !== 'live' || !authUserId) return;
    let cancelled = false;

    (async () => {
      setDataLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;

        const profile = await db.ensureProfile(authUserId, {
          email: authUser?.email || '',
          name:
            (authUser?.user_metadata?.name as string) ||
            (authUser?.user_metadata?.full_name as string) ||
            '',
          organization: (authUser?.user_metadata?.organization as string) || '',
        });

        const [loadedQuotes, loadedTeam] = await Promise.all([
          db.fetchQuotes(authUserId),
          db.fetchTeam(authUserId),
        ]);

        if (cancelled) return;
        setCurrentUser(profile);
        setQuotes(loadedQuotes);
        setTeam(loadedTeam);
        setCurrentView((v) => (v === 'auth' ? 'dashboard' : v));
        showToast(`ברוך/ה הבא/ה, ${profile.name} ✓`);
      } catch (err) {
        if (!cancelled) showToast(`שגיאה בטעינת הנתונים: ${(err as Error).message}`);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, authUserId, showToast]);

  /* ------------------------------ demo mode ----------------------------- */

  const enterDemo = () => {
    setMode('demo');
    setQuotes(INITIAL_QUOTES);
    setTeam(INITIAL_USERS);
    setCurrentUser(DEMO_OWNER);
    setCurrentView('dashboard');
    showToast('מצב דמו — הנתונים לדוגמה בלבד ולא נשמרים');
  };

  const handleLogout = async () => {
    if (isDemo) {
      setMode('auth');
      setQuotes([]);
      setTeam([]);
      setCurrentUser(null);
      setCurrentView('auth');
      return;
    }
    await supabase.auth.signOut();
    setCurrentView('auth');
  };

  /** Demo-only: hop between the sample profiles. */
  const handleSwitchUser = (userId: string) => {
    if (!isDemo) return;
    const target = team.find((u) => u.id === userId);
    if (!target) return;
    setCurrentUser(target);
    showToast(`הוחלף פרופיל ל-${target.name} (${target.organization || 'SecQuote'}) ✓`);
  };

  /* ---------------------------- quote actions --------------------------- */

  const persistStatus = async (quoteId: string, newStatus: QuoteStatus, message: string) => {
    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q)));
    setSelectedQuoteForSow((prev) =>
      prev && prev.id === quoteId ? { ...prev, status: newStatus } : prev
    );

    if (isDemo || !authUserId) {
      showToast(message);
      return;
    }
    try {
      await db.updateQuoteFields(quoteId, authUserId, { status: newStatus });
      showToast(message);
    } catch (err) {
      showToast(`השמירה נכשלה: ${(err as Error).message}`);
    }
  };

  const handleSendQuote = (quoteId: string) =>
    persistStatus(quoteId, 'נשלח', 'הצעת המחיר נשלחה בהצלחה ללקוח ✓');

  const handleQuoteStatusUpdate = (quoteId: string, newStatus: QuoteStatus) =>
    persistStatus(quoteId, newStatus, `סטטוס ההצעה עודכן ל-${newStatus} ✓`);

  const handleViewSow = (quote: Quote) => {
    setIsPublicClientView(false);
    setSelectedQuoteForSow(quote);
    setCurrentView('sow_doc');
  };

  const handleFinishWizard = async (newQuote: Quote) => {
    const wasEditing = quotes.some((q) => q.id === newQuote.id);

    if (isDemo || !authUserId) {
      setQuotes((prev) =>
        wasEditing ? prev.map((q) => (q.id === newQuote.id ? newQuote : q)) : [newQuote, ...prev]
      );
      try {
        localStorage.setItem(`secquote_doc_${newQuote.id}`, JSON.stringify(newQuote));
      } catch {
        /* ignore */
      }
      showToast(wasEditing ? 'ההצעה עודכנה (מצב דמו — לא נשמר) ✓' : 'ההצעה הופקה (מצב דמו — לא נשמר) ✓');
      setSelectedQuoteForSow(null);
      setCurrentView('dashboard');
      return;
    }

    try {
      const saved = await db.saveQuote(newQuote, authUserId);
      setQuotes((prev) => {
        const without = prev.filter((q) => q.id !== newQuote.id && q.id !== saved.id);
        return [saved, ...without];
      });
      showToast(
        wasEditing ? 'הצעת המחיר עודכנה בהצלחה במערכת ✓' : 'הצעת המחיר הופקה ונשמרה במערכת ✓'
      );
      setSelectedQuoteForSow(null);
      setCurrentView('dashboard');
    } catch (err) {
      showToast(`השמירה נכשלה: ${(err as Error).message}`);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    const backup = quotes;
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));

    if (isDemo || !authUserId) {
      showToast('הצעת המחיר נמחקה (מצב דמו) ✓');
      return;
    }
    try {
      await db.deleteQuote(quoteId, authUserId);
      showToast('הצעת המחיר נמחקה מהמערכת ✓');
    } catch (err) {
      setQuotes(backup);
      showToast(`המחיקה נכשלה: ${(err as Error).message}`);
    }
  };

  const handleDuplicateQuote = async (quoteToDup: Quote) => {
    const dup: Quote = {
      ...quoteToDup,
      id: `new-${Date.now()}`,
      shareToken: undefined,
      client: `${quoteToDup.client} (שכפול)`,
      date: new Date().toLocaleDateString('he-IL'),
      status: 'טיוטה',
      authorName: currentUser?.name || quoteToDup.authorName,
      organizationName: currentUser?.organization || quoteToDup.organizationName,
      authorEmail: currentUser?.email || quoteToDup.authorEmail,
    };

    if (isDemo || !authUserId) {
      setQuotes((prev) => [dup, ...prev]);
      showToast(`ההצעה שוכפלה (מצב דמו) עבור ${dup.client} ✓`);
      return;
    }
    try {
      const saved = await db.saveQuote(dup, authUserId);
      setQuotes((prev) => [saved, ...prev]);
      showToast(`ההצעה שוכפלה בהצלחה עבור ${saved.client} ✓`);
    } catch (err) {
      showToast(`השכפול נכשל: ${(err as Error).message}`);
    }
  };

  /* ---------------------------- team actions ---------------------------- */

  const handleAddUser = async (user: Omit<UserItem, 'id' | 'initials' | 'avatar' | 'joined'>) => {
    if (isDemo || !authUserId) {
      setTeam((prev) => [
        {
          ...user,
          id: `demo-${Date.now()}`,
          initials: db.initialsOf(user.name),
          joined: new Date().toLocaleDateString('he-IL'),
          avatar: 'linear-gradient(140deg, #2563eb, #22d3ee)',
        },
        ...prev,
      ]);
      showToast(`${user.name} נוסף לצוות (מצב דמו) ✓`);
      return;
    }
    try {
      const created = await db.addTeamMember(authUserId, user);
      setTeam((prev) => [created, ...prev]);
      showToast(`המשתמש ${created.name} נוסף בהצלחה למערכת ✓`);
    } catch (err) {
      showToast(`ההוספה נכשלה: ${(err as Error).message}`);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserItem>) => {
    // Editing your own row updates the profile, not the team list.
    const isSelf = currentUser?.id === id;

    if (isSelf) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev));
      if (isDemo || !authUserId) {
        showToast('הפרופיל עודכן (מצב דמו) ✓');
        return;
      }
      try {
        const saved = await db.updateProfile(authUserId, updates);
        setCurrentUser(saved);
        showToast('הפרופיל שלך עודכן בהצלחה ✓');
      } catch (err) {
        showToast(`העדכון נכשל: ${(err as Error).message}`);
      }
      return;
    }

    setTeam((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    if (isDemo || !authUserId) {
      showToast('פרטי המשתמש עודכנו (מצב דמו) ✓');
      return;
    }
    try {
      const saved = await db.updateTeamMember(authUserId, id, updates);
      setTeam((prev) => prev.map((u) => (u.id === id ? saved : u)));
      showToast('פרטי המשתמש עודכנו בהצלחה במערכת ✓');
    } catch (err) {
      showToast(`העדכון נכשל: ${(err as Error).message}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      showToast('לא ניתן למחוק את המשתמש הפעיל המחובר כעת');
      return;
    }
    const victim = team.find((u) => u.id === id);
    const backup = team;
    setTeam((prev) => prev.filter((u) => u.id !== id));

    if (isDemo || !authUserId) {
      showToast(`${victim?.name || ''} הוסר (מצב דמו) ✓`);
      return;
    }
    try {
      await db.deleteTeamMember(authUserId, id);
      showToast(`המשתמש ${victim?.name || ''} הוסר מהמערכת בהצלחה ✓`);
    } catch (err) {
      setTeam(backup);
      showToast(`המחיקה נכשלה: ${(err as Error).message}`);
    }
  };

  /* ------------------------------ rendering ----------------------------- */

  // Client-facing document link, or the internal SOW preview.
  if (isPublicClientView || currentView === 'sow_doc') {
    if (publicDocLoading) {
      return (
        <div
          dir="rtl"
          className="min-h-screen w-full flex flex-col items-center justify-center gap-5 bg-[linear-gradient(160deg,#0f172a_0%,#080d1c_52%,#070b19_100%)] font-['Heebo'] text-[#e8f2ff]"
        >
          <Logo size={72} textSize="text-3xl" subtitle="Cyber Quoting Platform" />
          <div className="text-sm text-[#7dd3fc] animate-pulse">טוען את מסמך ההצעה...</div>
        </div>
      );
    }

    return (
      <SowDocumentView
        quote={selectedQuoteForSow}
        isPublicView={isPublicClientView}
        currentUser={currentUser}
        onBack={() => {
          setIsPublicClientView(false);
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', window.location.pathname);
          }
          setCurrentView(mode === 'live' || mode === 'demo' ? 'dashboard' : 'auth');
        }}
        onQuoteStatusUpdate={handleQuoteStatusUpdate}
      />
    );
  }

  // Restoring an existing session.
  if (mode === 'booting') {
    return (
      <div
        dir="rtl"
        className="min-h-screen w-full flex flex-col items-center justify-center gap-5 bg-[linear-gradient(160deg,#0f172a_0%,#080d1c_52%,#070b19_100%)] font-['Heebo'] text-[#e8f2ff]"
      >
        <Logo size={82} textSize="text-4xl" subtitle="Cyber Quoting Platform" />
        <div className="text-sm text-[#7dd3fc] animate-pulse">מאמת את החיבור שלך...</div>
      </div>
    );
  }

  if (mode === 'auth') {
    return <AuthView onEnterDemo={enterDemo} />;
  }

  // Signed in, still fetching this account's rows.
  if (mode === 'live' && dataLoading && !currentUser) {
    return (
      <div
        dir="rtl"
        className="min-h-screen w-full flex flex-col items-center justify-center gap-5 bg-[linear-gradient(160deg,#0f172a_0%,#080d1c_52%,#070b19_100%)] font-['Heebo'] text-[#e8f2ff]"
      >
        <Logo size={82} textSize="text-4xl" subtitle="Cyber Quoting Platform" />
        <div className="text-sm text-[#7dd3fc] animate-pulse">טוען את סביבת העבודה שלך...</div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'לוח בקרה', icon: LayoutDashboard },
    { id: 'wizard' as ViewMode, label: 'הצעות', icon: FileText },
    { id: 'users' as ViewMode, label: 'משתמשים', icon: Users },
    { id: 'market' as ViewMode, label: 'שוק', icon: Settings },
  ];

  // The team list plus the account owner, so the owner appears in "משתמשים".
  const usersForManagement: UserItem[] = currentUser
    ? [currentUser, ...team.filter((u) => u.id !== currentUser.id)]
    : team;

  return (
    <div
      dir="rtl"
      className="relative flex h-screen w-full overflow-hidden bg-[radial-gradient(1100px_620px_at_88%_-4%,#12203f_0%,rgba(18,32,63,0)_62%),linear-gradient(160deg,#0f172a_0%,#080d1c_52%,#070b19_100%)] font-['Heebo',system-ui,sans-serif] text-[#e8f2ff]"
    >
      {/* Ambient background glowing orbs */}
      <div className="absolute -top-40 -left-36 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.22)_0%,rgba(37,99,235,0)_70%)] blur-[50px] animate-sq-float pointer-events-none" />
      <div className="absolute -bottom-52 left-1/4 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14)_0%,rgba(34,211,238,0)_72%)] blur-[60px] animate-sq-float-reverse pointer-events-none" />

      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        users={isDemo ? usersForManagement : []}
        onSwitchUser={isDemo ? handleSwitchUser : undefined}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {isDemo && (
          <div className="flex-none z-30 flex items-center justify-center gap-2.5 px-4 py-1.5 bg-amber-400/12 border-b border-amber-300/25 text-amber-200 text-[12px] font-bold">
            <PlayCircle className="w-3.5 h-3.5 flex-none" />
            <span>מצב דמו — נתונים לדוגמה. שינויים אינם נשמרים.</span>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-300/15 hover:bg-amber-300/30 border border-amber-300/35 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>יציאה והרשמה</span>
            </button>
          </div>
        )}

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              quotes={quotes}
              currentUser={currentUser}
              users={isDemo ? usersForManagement : undefined}
              onSwitchUser={isDemo ? handleSwitchUser : undefined}
              onNavigate={(view) => setCurrentView(view)}
              onNewQuote={() => {
                setSelectedQuoteForSow(null);
                setCurrentView('wizard');
              }}
              onEditQuote={(q) => {
                setSelectedQuoteForSow(q);
                setCurrentView('wizard');
              }}
              onViewSow={handleViewSow}
              onSendQuote={handleSendQuote}
              onQuoteStatusUpdate={handleQuoteStatusUpdate}
              onDeleteQuote={handleDeleteQuote}
              onDuplicateQuote={handleDuplicateQuote}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          )}

          {currentView === 'wizard' && (
            <WizardView
              initialQuote={selectedQuoteForSow}
              currentUser={currentUser}
              onFinishWizard={handleFinishWizard}
              onViewSowDocument={handleViewSow}
              onCancel={() => {
                setSelectedQuoteForSow(null);
                setCurrentView('dashboard');
              }}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          )}

          {currentView === 'market' && (
            <MarketView onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          )}

          {currentView === 'users' && (
            <UsersView
              users={usersForManagement}
              currentUser={currentUser}
              onSwitchUser={isDemo ? handleSwitchUser : undefined}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          )}
        </main>

        {/* Mobile + tablet navigation. The pill floats over the content — no
            reserved strip beneath it. Each view carries `pb-28` so the last
            row can still scroll clear of the bar. */}
        {currentView !== 'sow_doc' && (
          <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,520px)] h-[68px] rounded-full bg-[#0b1220]/92 border border-[#7dd3fc]/20 backdrop-blur-2xl px-1.5 flex items-center justify-around shadow-[0_18px_45px_-10px_rgba(2,8,23,0.95),0_0_30px_-18px_rgba(34,211,238,0.7)]">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const active =
                (item.id === 'dashboard' && currentView === 'dashboard') ||
                (item.id === 'wizard' && (currentView === 'wizard' || currentView === 'sow_doc'));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] rounded-full transition-all duration-200 cursor-pointer ${
                    active ? 'text-[#22d3ee]' : 'text-[#cbe1ff]/60 hover:text-[#eaf9ff]'
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-all ${active ? 'bg-[#22d3ee]/15 scale-110' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium tracking-tight mt-0.5">{item.label}</span>
                </button>
              );
            })}

            {/* Centre: the logo doubles as the way out of the workspace. */}
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              aria-label="יציאה מהמערכת"
              className="relative flex-none -mt-9 w-[74px] flex flex-col items-center justify-start cursor-pointer group"
            >
              <span className="relative flex items-center justify-center w-[54px] h-[54px] rounded-full bg-gradient-to-br from-[#132244] to-[#0a1224] border border-[#22d3ee]/45 shadow-[0_10px_26px_-6px_rgba(2,8,23,0.95),0_0_26px_-8px_rgba(34,211,238,0.75)] transition-transform duration-200 group-active:scale-95">
                <Logo size={34} showText={false} />
                <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0b1220] flex items-center justify-center shadow-md">
                  <LogOut className="w-2.5 h-2.5 text-white" />
                </span>
              </span>
              <span className="mt-1 text-[11px] font-semibold tracking-tight text-[#cbe1ff]/75 group-hover:text-[#eaf9ff]">
                יציאה
              </span>
            </button>

            {navItems.slice(2).map((item) => {
              const Icon = item.icon;
              const active =
                (item.id === 'users' && currentView === 'users') ||
                (item.id === 'market' && currentView === 'market');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] rounded-full transition-all duration-200 cursor-pointer ${
                    active ? 'text-[#22d3ee]' : 'text-[#cbe1ff]/60 hover:text-[#eaf9ff]'
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-all ${active ? 'bg-[#22d3ee]/15 scale-110' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium tracking-tight mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Exit confirmation. The centre button sits where a thumb naturally
          lands, so signing out is never a single accidental tap. */}
      {logoutConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm mb-24 rounded-3xl border border-[#7dd3fc]/25 bg-[#0d1526] p-5 shadow-[0_30px_70px_rgba(2,8,23,0.95)]"
          >
            <div className="flex flex-col items-center text-center gap-2.5">
              <Logo size={44} showText={false} />
              <h3 className="text-base font-bold text-[#f4f9ff]">לצאת מהמערכת?</h3>
              <p className="text-xs text-[#cbe1ff]/70 leading-relaxed">
                {isDemo
                  ? 'תחזור/י למסך הפתיחה. נתוני הדמו ממילא אינם נשמרים.'
                  : 'תתנתק/י מהחשבון. כל ההצעות שלך שמורות וימתינו לך בכניסה הבאה.'}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 h-11 rounded-full text-sm font-bold text-[#cbe1ff]/80 bg-white/[0.06] hover:bg-white/10 transition-colors cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  handleLogout();
                }}
                className="flex-1 h-11 rounded-full text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>יציאה</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:right-auto sm:left-6 z-50 px-5 py-3 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-center sm:text-right">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
