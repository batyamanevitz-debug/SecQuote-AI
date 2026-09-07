import { UserItem } from '../types';

/**
 * Known common Hebrew female given names
 */
const FEMALE_HEBREW_NAMES = new Set([
  'מיכל',
  'שירה',
  'נועה',
  'מאיה',
  'שרה',
  'דנה',
  'יעל',
  'תמר',
  'הילה',
  'רוני',
  'ענת',
  'רחל',
  'רות',
  'קרן',
  'טליה',
  'ליה',
  'אלה',
  'אורלי',
  'סיגל',
  'ליאת',
  'מורן',
  'מור',
  'שני',
  'עדי',
  'שקד',
  'יסמין',
  'לירז',
  'אילנה',
  'רונית',
  'שיר',
  'נטע',
  'דליה',
  'גלית',
  'אורית',
  'ענבל',
  'מירי',
  'מרים',
  'חנה',
  'אסתר',
  'רבקה',
  'לאה',
  'לימור',
  'עינת',
  'חגית',
  'סיגלית',
  'אביטל',
  'מיטל',
  'בתאל',
  'שירן',
  'שמרית',
  'ספיר',
  'הדר',
  'הגר',
  'דפנה',
  'אילת',
  'איילת',
  'רינת',
  'יפעת',
  'אסנת',
  'קרנית',
  'אפרת',
  'רינה',
  'זהבה',
  'ורד',
  'ורדה',
  'צופית',
  'שושנה',
  'אודליה',
  'אביגיל',
  'נעמה',
  'צילה',
  'אדווה',
  'בתיה',
  'כרמל',
  'עמליה',
  'מעיין',
  'שני',
  'עדן',
  'לירון',
  'רותם',
  'שחר',
  'ניצן',
  'טל',
  'רונה',
  'מיקה',
  'אליס',
]);

/**
 * Hebrew male names ending in 'ה' that should NOT be classified as female
 */
const MALE_HEBREW_EXCEPTIONS = new Set([
  'יהודה',
  'יונה',
  'מנשה',
  'שלמה',
  'אליה',
  'עוזיה',
  'שמחה',
  'אלקנה',
  'חזקיה',
  'ירמיה',
  'ישעיה',
  'טוביה',
]);

/**
 * Returns whether a given Hebrew first name is female
 */
export function isHebrewFemaleName(firstName: string): boolean {
  const trimmed = firstName.trim();
  if (!trimmed) return false;

  if (FEMALE_HEBREW_NAMES.has(trimmed)) {
    return true;
  }

  if (MALE_HEBREW_EXCEPTIONS.has(trimmed)) {
    return false;
  }

  // Names ending with 'ה' (and at least 3 letters) or 'ית' or 'את'
  if (trimmed.length >= 3 && trimmed.endsWith('ה')) {
    return true;
  }

  if (trimmed.endsWith('ית') || trimmed.endsWith('את')) {
    return true;
  }

  return false;
}

/**
 * Generates personalized Hebrew greeting based on user name and gender.
 * Examples:
 * - מיכל אברהם -> "ברוכה הבאה, מיכל"
 * - דוד כהן -> "ברוך הבא, דוד"
 * - שירה לביא -> "ברוכה הבאה, שירה"
 * - איתן שלו -> "ברוך הבא, איתן"
 */
export function getUserGreeting(user?: UserItem | null): string {
  if (!user || !user.name || !user.name.trim()) {
    return 'ברוכים הבאים';
  }

  const rawName = user.name.trim();
  // Extract first name (e.g. "מיכל" from "מיכל אברהם")
  const firstName = rawName.split(/\s+/)[0] || rawName;

  // 1. If explicit gender is provided
  if (user.gender) {
    return user.gender === 'female'
      ? `ברוכה הבאה, ${firstName}`
      : `ברוך הבא, ${firstName}`;
  }

  // 2. Intelligent Hebrew female name detection
  const isFemale = isHebrewFemaleName(firstName);

  return isFemale ? `ברוכה הבאה, ${firstName}` : `ברוך הבא, ${firstName}`;
}
