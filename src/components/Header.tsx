import React, { useState, useMemo } from 'react';
import { Bell, Plus, Check, X, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { UserItem, Quote } from '../types';
import { buildNotifications } from '../utils/notifications';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNewQuoteBtn?: boolean;
  onNewQuote?: () => void;
  currentUser?: UserItem | null;
  /** Notifications are derived from these, so they describe real rows. */
  quotes?: Quote[];
}

/** Ids the user has already dismissed, kept per browser. */
const READ_KEY = 'secquote_read_notifications';

const loadRead = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
  } catch {
    return [];
  }
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showNewQuoteBtn = true,
  onNewQuote,
  currentUser,
  quotes = [],
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(loadRead);

  // Built from the account's own quotes rather than a fixed list.
  const notifications = useMemo(
    () => buildNotifications(quotes, currentUser),
    [quotes, currentUser]
  );

  const persistRead = (ids: string[]) => {
    setReadIds(ids);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      /* a full or blocked store just means the badge returns next visit */
    }
  };

  const markAllAsRead = () => persistRead([...new Set([...readIds, ...notifications.map((n) => n.id)])]);
  const markOneAsRead = (id: string) => persistRead([...new Set([...readIds, id])]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <header className="relative z-30 flex items-center justify-between gap-3 sm:gap-4 select-none w-full">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#f4f9ff] truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[#cbe1ff]/65 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 flex-none">
        <div className="relative">
            <button
              type="button"
              aria-label="התראות"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="cursor-pointer relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#7dd3fc]/20 flex items-center justify-center text-[#9fd4ff] hover:bg-[#7dd3fc]/12 hover:border-[#7dd3fc]/45 transition-all"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-[#22d3ee] shadow-[0_0_10px_#22d3ee]" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                  onClick={() => setShowNotifications(false)}
                />
                {/* On phones the panel is pinned to the viewport, not to the
                    bell: anchoring it to the button pushed it off the edge in
                    RTL. From sm up it hangs under the bell as before. */}
                <div className="fixed top-[68px] inset-x-3 w-auto sm:absolute sm:top-auto sm:inset-x-auto sm:left-0 sm:mt-2 sm:w-96 z-50 rounded-2xl border border-[#22d3ee]/40 bg-[#091124] shadow-[0_24px_50px_-10px_rgba(0,0,0,0.95)] backdrop-blur-2xl p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#7dd3fc]/15 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#f4f9ff]">
                        התראות מערכת
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22d3ee]/20 text-[#67e8f9]">
                          {unreadCount} חדשות
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] text-[#7dd3fc] hover:underline cursor-pointer"
                        >
                          סמן הכל כנקרא
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-[#cbe1ff]/60 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="py-6 text-center text-xs text-[#cbe1ff]/50">
                        אין התראות חדשות.
                      </p>
                    )}
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markOneAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          readIds.includes(n.id)
                            ? 'bg-white/[0.02] border-white/[0.05] text-[#cbe1ff]/65'
                            : 'bg-[#22d3ee]/10 border-[#22d3ee]/30 text-[#f4f9ff]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {n.type === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
                          )}
                          {n.type === 'alert' && (
                            <ShieldAlert className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
                          )}
                          {n.type === 'info' && (
                            <Clock className="w-4 h-4 text-[#22d3ee] flex-none mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold leading-relaxed">{n.title}</p>
                            <span className="text-[10px] text-[#cbe1ff]/45 mt-0.5 block">
                              {n.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

        {showNewQuoteBtn && onNewQuote && (
          <button
            type="button"
            onClick={onNewQuote}
            className="cursor-pointer h-10 sm:h-11 px-3.5 sm:px-5 rounded-full font-['Heebo'] text-xs sm:text-[15px] font-bold tracking-tight text-[#04121f] inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_10px_26px_-12px_rgba(34,211,238,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(34,211,238,0.85)] hover:brightness-105 active:translate-y-0 transition-all duration-200 whitespace-nowrap min-h-[40px]"
          >
            <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-[#04121f]/15 flex items-center justify-center flex-none">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </span>
            <span>הצעת מחיר חדשה</span>
          </button>
        )}
      </div>
    </header>
  );
};
