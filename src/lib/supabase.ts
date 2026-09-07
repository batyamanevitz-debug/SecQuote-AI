import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/**
 * True when the app has real Supabase credentials. When false the app still
 * runs, but only in demo mode — every account action explains why.
 */
export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface AuthCapabilities {
  /** Google OAuth is configured on the project. */
  google: boolean;
  /** New accounts are usable immediately, with no email confirmation step. */
  autoConfirm: boolean;
}

/**
 * Asks the project which auth methods are actually turned on, so the UI does
 * not offer a Google button that dead-ends on a "provider is not enabled" page.
 */
export async function fetchAuthCapabilities(): Promise<AuthCapabilities> {
  if (!isSupabaseConfigured) return { google: false, autoConfirm: false };
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key as string } });
    if (!res.ok) throw new Error(String(res.status));
    const settings = await res.json();
    return {
      google: Boolean(settings?.external?.google),
      autoConfirm: Boolean(settings?.mailer_autoconfirm),
    };
  } catch {
    // Offline or blocked — assume nothing extra is available.
    return { google: false, autoConfirm: false };
  }
}

/** Turns a Supabase/PostgREST error into something a Hebrew speaker can act on. */
export function authErrorToHebrew(raw: unknown): string {
  const msg = String((raw as { message?: string })?.message || raw || '').toLowerCase();

  if (msg.includes('invalid login credentials')) return 'אימייל או סיסמה שגויים.';
  if (msg.includes('email not confirmed')) return 'החשבון עדיין לא אומת. בדוק את תיבת המייל שלך ולחץ על קישור האימות.';
  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return 'כתובת האימייל הזו כבר רשומה במערכת. עבור ללשונית "התחברות".';
  if (msg.includes('password should be at least')) return 'הסיסמה חייבת להכיל לפחות 6 תווים.';
  if (
    msg.includes('unable to validate email') ||
    msg.includes('invalid email') ||
    (msg.includes('email address') && msg.includes('is invalid'))
  )
    return 'כתובת האימייל אינה תקינה או שהדומיין שלה חסום. נסה כתובת אמיתית.';
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider'))
    return 'התחברות עם Google עדיין לא הופעלה בפרויקט. יש להפעיל את Google כ-Provider בלוח הבקרה של Supabase.';
  if (msg.includes('for security purposes') || msg.includes('rate limit') || msg.includes('too many'))
    return 'יותר מדי ניסיונות. המתן דקה ונסה שוב.';
  if (msg.includes('failed to fetch') || msg.includes('networkerror'))
    return 'אין חיבור לשרת. בדוק את חיבור האינטרנט.';

  return (raw as { message?: string })?.message || 'אירעה שגיאה. נסה שוב.';
}
