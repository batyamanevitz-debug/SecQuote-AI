import { Quote, UserItem } from '../types';

export interface AppNotification {
  /** Stable across renders, so the read state survives a refresh. */
  id: string;
  title: string;
  /** Relative time, e.g. "לפני שעתיים". */
  time: string;
  /** Sort key — newest first. */
  at: number;
  type: 'success' | 'alert' | 'info';
  /** The quote this refers to, so clicking can open it. */
  quoteId?: string;
}

/** "לפני 3 שעות" and friends, from a real timestamp. */
function relativeTime(iso?: string): { text: string; at: number } {
  if (!iso) return { text: '', at: 0 };
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return { text: '', at: 0 };

  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return { text: 'הרגע', at: then };
  if (mins < 60) return { text: `לפני ${mins} דקות`, at: then };

  const hours = Math.round(mins / 60);
  if (hours < 24) {
    return { text: hours === 1 ? 'לפני שעה' : hours === 2 ? 'לפני שעתיים' : `לפני ${hours} שעות`, at: then };
  }

  const days = Math.round(hours / 24);
  if (days < 30) {
    return { text: days === 1 ? 'אתמול' : days === 2 ? 'לפני יומיים' : `לפני ${days} ימים`, at: then };
  }

  const months = Math.round(days / 30);
  return { text: months === 1 ? 'לפני חודש' : `לפני ${months} חודשים`, at: then };
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Builds the notification list from the account's actual quotes.
 *
 * There is no event log behind this: every item is derived from real rows, so
 * it can only ever say something that is true of this user's own data.
 */
export function buildNotifications(
  quotes: Quote[],
  currentUser?: UserItem | null
): AppNotification[] {
  const out: AppNotification[] = [];
  const now = Date.now();

  for (const q of quotes) {
    const stamp = relativeTime(q.updatedAt || q.createdAt);

    // Someone opened one of their quotes up to this user.
    if (q.sharedWithMe) {
      out.push({
        id: `shared-${q.id}`,
        title: `${q.authorName || 'משתמש אחר'} שיתף איתך את ההצעה עבור ${q.client}${
          q.sharedCanEdit ? ' (הרשאת עריכה)' : ' (צפייה בלבד)'
        }`,
        time: stamp.text,
        at: stamp.at,
        type: 'info',
        quoteId: q.id,
      });
      continue;
    }

    if (q.status === 'אושר') {
      out.push({
        id: `approved-${q.id}`,
        title: `הצעת המחיר עבור ${q.client} אושרה${q.cost ? ` · ${q.cost}` : ''}`,
        time: stamp.text,
        at: stamp.at,
        type: 'success',
        quoteId: q.id,
      });
      continue;
    }

    if (q.status === 'נשלח') {
      const age = stamp.at ? now - stamp.at : 0;
      // Only nag once a proposal has actually been sitting unanswered.
      if (age > 3 * DAY) {
        out.push({
          id: `awaiting-${q.id}`,
          title: `ההצעה עבור ${q.client} נשלחה וטרם התקבלה תשובה`,
          time: stamp.text,
          at: stamp.at,
          type: 'alert',
          quoteId: q.id,
        });
      } else {
        out.push({
          id: `sent-${q.id}`,
          title: `ההצעה עבור ${q.client} נשלחה ללקוח`,
          time: stamp.text,
          at: stamp.at,
          type: 'info',
          quoteId: q.id,
        });
      }
      continue;
    }

    if (q.status === 'טיוטה') {
      const age = stamp.at ? now - stamp.at : 0;
      if (age > 2 * DAY) {
        out.push({
          id: `draft-${q.id}`,
          title: `טיוטת ההצעה עבור ${q.client} ממתינה לשליחה`,
          time: stamp.text,
          at: stamp.at,
          type: 'alert',
          quoteId: q.id,
        });
      }
    }
  }

  // A nudge to complete the billing block, which otherwise prints blank.
  if (currentUser && !currentUser.hpNumber && !currentUser.bankAccountNumber) {
    out.push({
      id: 'profile-billing',
      title: 'לא הוגדרו פרטי חיוב באזור האישי — הם יופיעו ריקים בהצעות המחיר',
      time: '',
      at: now,
      type: 'alert',
    });
  }

  return out.sort((a, b) => b.at - a.at);
}
