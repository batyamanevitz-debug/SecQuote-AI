import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  BarChart3,
  Check,
  Building2,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import {
  supabase,
  isSupabaseConfigured,
  authErrorToHebrew,
  fetchAuthCapabilities,
} from '../lib/supabase';
import { initialsOf } from '../services/dataService';

interface AuthViewProps {
  /** Enters the local, non-persisted demo workspace. */
  onEnterDemo: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onEnterDemo }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  /** null while we still don't know whether the Google provider is configured. */
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const [autoConfirm, setAutoConfirm] = useState(false);

  const isLogin = mode === 'login';

  useEffect(() => {
    let cancelled = false;
    fetchAuthCapabilities().then((caps) => {
      if (cancelled) return;
      setGoogleEnabled(caps.google);
      setAutoConfirm(caps.autoConfirm);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setShowPassword(false);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError('החיבור ל-Supabase לא מוגדר. הוסף VITE_SUPABASE_URL ו-VITE_SUPABASE_PUBLISHABLE_KEY לקובץ .env, או היכנס למצב דמו.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isLogin) {
      if (password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים.');
        return;
      }
      if (password !== confirmPassword) {
        setError('הסיסמאות אינן תואמות.');
        return;
      }
      if (!name.trim()) {
        setError('יש להזין שם מלא.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
        // App listens on onAuthStateChange and takes it from here.
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              organization: organization.trim(),
              initials: initialsOf(name),
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          // Email confirmation is off — the listener in App picks this up.
          return;
        }
        setNotice(
          `נשלח מייל אימות לכתובת ${trimmedEmail}. יש ללחוץ על הקישור שבמייל (בדוק גם בתיקיית הספאם) ואז להתחבר.`
        );
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(authErrorToHebrew(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError('החיבור ל-Supabase לא מוגדר. היכנס למצב דמו כדי לראות את המערכת.');
      return;
    }

    // Say what is actually missing instead of bouncing the user to Supabase's
    // raw "Unsupported provider" JSON page.
    if (googleEnabled === false) {
      setError(
        'התחברות עם Google עדיין לא הופעלה. יש להגדיר Google כ-Provider בלוח הבקרה של Supabase (Authentication → Providers), ואז הכפתור יעבוד מיד. בינתיים אפשר להתחבר עם אימייל וסיסמה.'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) throw oauthError;
      // Browser redirects to Google from here.
    } catch (err) {
      setError(authErrorToHebrew(err));
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const target = resetEmail.trim().toLowerCase();
    if (!target) {
      setResetError('יש להזין כתובת אימייל.');
      return;
    }
    if (!isSupabaseConfigured) {
      setResetError('החיבור ל-Supabase לא מוגדר.');
      return;
    }

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: window.location.origin,
      });
      if (resetErr) throw resetErr;
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setResetModalOpen(false);
      }, 2600);
    } catch (err) {
      setResetError(authErrorToHebrew(err));
    }
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(1200px_700px_at_78%_8%,#101c3a_0%,rgba(16,28,58,0)_60%),linear-gradient(160deg,#0f172a_0%,#080d1c_48%,#070b19_100%)] font-['Heebo'] text-[#e8f2ff] flex items-center justify-center p-3 sm:p-6 md:p-12"
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(125,211,252,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.06) 1px, transparent 1px)',
          backgroundSize: '68px 68px',
          maskImage: 'radial-gradient(900px 600px at 50% 30%, #000 0%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(900px 600px at 50% 30%, #000 0%, transparent 85%)',
        }}
      />

      {/* Floating ambient orbs */}
      <div className="absolute -top-44 -right-28 w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.42)_0%,rgba(37,99,235,0)_68%)] blur-[45px] animate-sq-float pointer-events-none" />
      <div className="absolute -bottom-56 right-1/4 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28)_0%,rgba(34,211,238,0)_70%)] blur-[55px] animate-sq-float-reverse pointer-events-none" />
      <div className="absolute top-1/5 -left-40 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.2)_0%,rgba(59,130,246,0)_70%)] blur-[60px] animate-sq-float pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1200px] flex flex-wrap-reverse md:flex-nowrap items-center justify-center gap-10 md:gap-14">
        {/* Form Card */}
        <section className="w-full max-w-[420px] flex-none relative rounded-[28px] p-[1px] bg-gradient-to-br from-[#7dd3fc]/60 via-[#3b82f6]/20 to-[#22d3ee]/40 shadow-[0_40px_90px_-30px_rgba(2,8,23,0.9),0_0_70px_-20px_rgba(34,211,238,0.28)]">
          {/* Top Edge Glow */}
          <div className="absolute -top-[1px] left-[18%] right-[18%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent shadow-[0_0_18px_#22d3ee] animate-sq-pulse" />

          <div className="rounded-[27px] bg-gradient-to-br from-[#121c34]/90 to-[#0a1020]/95 backdrop-blur-2xl p-7 md:p-9">
            {/* Tabs */}
            <div className="flex gap-7 items-end mb-7">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`cursor-pointer flex flex-col gap-2.5 items-center font-['Heebo'] text-xl font-bold tracking-tight transition-colors ${
                  isLogin ? 'text-[#22d3ee]' : 'text-[#cbe1ff]/55 hover:text-[#dff2ff]'
                }`}
              >
                <span>התחברות</span>
                <span
                  className={`block w-full h-[3px] rounded-full transition-all duration-300 ${
                    isLogin ? 'bg-[#22d3ee] shadow-[0_0_16px_#22d3ee]' : 'bg-transparent'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`cursor-pointer flex flex-col gap-2.5 items-center font-['Heebo'] text-xl font-bold tracking-tight transition-colors ${
                  !isLogin ? 'text-[#22d3ee]' : 'text-[#cbe1ff]/55 hover:text-[#dff2ff]'
                }`}
              >
                <span>הרשמה</span>
                <span
                  className={`block w-full h-[3px] rounded-full transition-all duration-300 ${
                    !isLogin ? 'bg-[#22d3ee] shadow-[0_0_16px_#22d3ee]' : 'bg-transparent'
                  }`}
                />
              </button>

              <div className="flex-1 h-[1px] bg-gradient-to-r from-[#7dd3fc]/30 to-transparent mb-1.5" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {!isLogin && (
                <>
                  <div className="relative flex items-center">
                    <User className="w-5 h-5 absolute right-4.5 text-[#7dd3fc] opacity-85 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="שם מלא"
                      autoComplete="name"
                      required
                      className="w-full h-13 pr-13 pl-5 rounded-full border border-[#7dd3fc]/20 bg-white/[0.035] text-[#e8f2ff] text-base outline-none transition-all duration-200 focus:border-[#22d3ee] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#22d3ee]/15 focus:shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)]"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Building2 className="w-5 h-5 absolute right-4.5 text-[#7dd3fc] opacity-85 pointer-events-none" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="שם הארגון / העסק"
                      autoComplete="organization"
                      className="w-full h-13 pr-13 pl-5 rounded-full border border-[#7dd3fc]/20 bg-white/[0.035] text-[#e8f2ff] text-base outline-none transition-all duration-200 focus:border-[#22d3ee] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#22d3ee]/15 focus:shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)]"
                    />
                  </div>
                </>
              )}

              <div className="relative flex items-center">
                <Mail className="w-5 h-5 absolute right-4.5 text-[#7dd3fc] opacity-85 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="כתובת אימייל"
                  autoComplete="email"
                  required
                  className="w-full h-13 pr-13 pl-5 rounded-full border border-[#7dd3fc]/20 bg-white/[0.035] text-[#e8f2ff] text-base outline-none transition-all duration-200 focus:border-[#22d3ee] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#22d3ee]/15 focus:shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)]"
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="w-5 h-5 absolute right-4.5 text-[#7dd3fc] opacity-85 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'סיסמה' : 'סיסמה (6 תווים לפחות)'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  className="w-full h-13 pr-13 pl-13 rounded-full border border-[#7dd3fc]/20 bg-white/[0.035] text-[#e8f2ff] text-base outline-none transition-all duration-200 focus:border-[#22d3ee] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#22d3ee]/15 focus:shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="הצג או הסתר סיסמה"
                  className="cursor-pointer absolute left-3 w-8 h-8 rounded-full flex items-center justify-center text-[#9fd4ff] hover:bg-[#7dd3fc]/15 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative flex items-center">
                  <Check className="w-5 h-5 absolute right-4.5 text-[#7dd3fc] opacity-85 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="אימות סיסמה"
                    autoComplete="new-password"
                    required
                    className="w-full h-13 pr-13 pl-5 rounded-full border border-[#7dd3fc]/20 bg-white/[0.035] text-[#e8f2ff] text-base outline-none transition-all duration-200 focus:border-[#22d3ee] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#22d3ee]/15 focus:shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)]"
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex justify-start items-center -mt-0.5 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetError(null);
                      setResetModalOpen(true);
                    }}
                    className="text-sm font-medium text-[#7dd3fc] hover:text-[#d8f3ff] transition-colors cursor-pointer"
                  >
                    שכחת סיסמה?
                  </button>
                </div>
              )}

              {/* Error / notice */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-500/12 border border-red-400/35 text-red-200 text-[13px] font-medium leading-relaxed">
                  <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {notice && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-500/12 border border-emerald-400/35 text-emerald-200 text-[13px] font-medium leading-relaxed">
                  <Check className="w-4 h-4 flex-none mt-0.5" />
                  <span>{notice}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden mt-2 cursor-pointer h-14 rounded-full font-['Heebo'] text-lg font-extrabold text-[#04121f] bg-gradient-to-r from-[#1d4ed8] via-[#0ea5e9] to-[#22d3ee] shadow-[0_16px_40px_-14px_rgba(34,211,238,0.75),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_22px_54px_-12px_rgba(34,211,238,0.95)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0"
              >
                <span className="relative z-10 pointer-events-none">
                  {loading ? 'טוען...' : isLogin ? 'התחבר' : 'צור חשבון'}
                </span>
                <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sq-sweep pointer-events-none" />
              </button>

              {!isLogin && !autoConfirm && (
                <p className="text-[11px] text-[#cbe1ff]/50 text-center leading-relaxed px-2 -mt-0.5">
                  לאחר ההרשמה יישלח מייל אימות. יש לאשר אותו לפני ההתחברות הראשונה.
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3.5 my-3.5">
                <span className="flex-1 h-[1px] bg-gradient-to-l from-[#7dd3fc]/30 to-transparent" />
                <span className="text-xs font-medium text-[#c7e1ff]/60 whitespace-nowrap">
                  או התחבר באמצעות
                </span>
                <span className="flex-1 h-[1px] bg-gradient-to-r from-[#7dd3fc]/30 to-transparent" />
              </div>

              {/* Google Button. Always shown. When the provider is not yet
                  configured the click explains what is missing rather than
                  dead-ending on Supabase's raw error page. */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="cursor-pointer h-13.5 rounded-full border border-[#7dd3fc]/25 bg-white/[0.05] text-[#eaf4ff] text-base font-semibold flex items-center justify-center gap-3 hover:bg-white/10 hover:border-[#7dd3fc]/50 hover:shadow-[0_0_26px_-8px_rgba(125,211,252,0.45)] transition-all duration-200 disabled:opacity-60"
              >
                <span className="w-7.5 h-7.5 rounded-full bg-white flex items-center justify-center flex-none">
                  <svg width="17" height="17" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.5 17.6 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.2-.44-4.7H24v9.1h12.6c-.55 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.45-4.1 7-10.2 7-17.4Z" />
                    <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.6 24c0-1.65.3-3.25.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.93 7.55 2.5 10.8l7.9-6.1Z" />
                    <path fill="#34A853" d="M24 48c6.2 0 11.5-2.05 15.5-5.6l-7.6-5.9c-2.1 1.45-4.85 2.3-7.9 2.3-6.4 0-11.7-4-13.6-9.8l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" />
                  </svg>
                </span>
                <span>התחבר באמצעות Google</span>
              </button>

              {/* Demo entry */}
              <div className="mt-3 pt-3.5 border-t border-white/[0.08] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onEnterDemo}
                  className="cursor-pointer h-12 rounded-full border border-[#22d3ee]/30 bg-[#22d3ee]/8 text-[#a5f3fc] text-[15px] font-bold flex items-center justify-center gap-2.5 hover:bg-[#22d3ee]/15 hover:border-[#22d3ee]/55 transition-all duration-200"
                >
                  <PlayCircle className="w-4.5 h-4.5" />
                  <span>הצג מצב דמו — בלי הרשמה</span>
                </button>
                <p className="text-[11px] text-[#cbe1ff]/50 text-center leading-relaxed px-2">
                  סיור במערכת עם נתונים לדוגמה. שינויים במצב דמו אינם נשמרים.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-[#7dd3fc]/12 flex items-center justify-center gap-2 text-sm text-[#cbe1ff]/70">
              <span>{isLogin ? 'אין לך חשבון?' : 'יש לך חשבון?'}</span>
              <button
                type="button"
                onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                className="font-bold text-[#7dd3fc] hover:text-[#e2f6ff] transition-colors cursor-pointer"
              >
                {isLogin ? 'הירשם עכשיו' : 'התחבר'}
              </button>
            </div>
          </div>
        </section>

        {/* Hero Presentation */}
        <section className="flex-1 min-w-[300px] max-w-[560px] flex flex-col items-center text-center">
          <Logo size={92} textSize="text-[44px]" subtitle="Cyber Quoting Platform" className="mb-6" />

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f4f9ff] mb-4 leading-tight">
            ברוכים הבאים למערכת{' '}
            <span className="text-[#22d3ee] drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              SecQuote AI
            </span>
          </h1>

          <p className="text-lg text-[#cbe1ff]/75 max-w-[46ch] leading-relaxed mb-7">
            המערכת החכמה לאפיון ותמחור הצעות מחיר בסייבר ליועצים ועסקים. התחל ליצור הצעות תוך דקות.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/8 text-sm font-medium text-[#d8eeff]">
              <Zap className="w-4 h-4 text-[#22d3ee]" />
              אפיון אוטומטי בדקות
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/8 text-sm font-medium text-[#d8eeff]">
              <ShieldCheck className="w-4 h-4 text-[#22d3ee]" />
              תמחור לפי מודל סיכון
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/8 text-sm font-medium text-[#d8eeff]">
              <BarChart3 className="w-4 h-4 text-[#22d3ee]" />
              מעקב רווחיות והמרות
            </span>
          </div>
        </section>
      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#7dd3fc]/30 bg-[#0f172a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#f4f9ff] mb-2">איפוס סיסמה</h3>
            <p className="text-xs text-[#cbe1ff]/75 mb-4">
              הזן את כתובת האימייל שלך ונשלח אליך קישור מאובטח לאיפוס הסיסמה.
            </p>

            {resetSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center">
                קישור לאיפוס הסיסמה נשלח בהצלחה לכתובת האימייל שלך ✓
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="כתובת אימייל"
                  className="w-full h-12 px-4 rounded-xl border border-[#7dd3fc]/25 bg-white/[0.04] text-sm text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                />

                {resetError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/12 border border-red-400/35 text-red-200 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-none mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#cbe1ff]/75 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] hover:brightness-105 transition-all cursor-pointer"
                  >
                    שלח קישור איפוס
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
