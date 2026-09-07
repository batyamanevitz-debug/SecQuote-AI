import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Building2,
  ChevronUp,
  Check,
} from 'lucide-react';
import { ViewMode, UserItem } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  currentUser?: UserItem | null;
  users?: UserItem[];
  onSwitchUser?: (userId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  currentUser,
  users = [],
  onSwitchUser,
}) => {
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const isItemActive = (view: ViewMode) => {
    if (view === 'dashboard' && currentView === 'dashboard') return true;
    if (view === 'wizard' && (currentView === 'wizard' || currentView === 'sow_doc')) return true;
    if (view === 'users' && currentView === 'users') return true;
    if (view === 'market' && currentView === 'market') return true;
    return false;
  };

  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'לוח בקרה',
      icon: LayoutDashboard,
    },
    {
      id: 'wizard' as ViewMode,
      label: 'הצעות מחיר',
      icon: FileText,
    },
    {
      id: 'users' as ViewMode,
      label: 'ניהול משתמשים',
      icon: Users,
    },
    {
      id: 'market' as ViewMode,
      label: 'הגדרות שוק',
      icon: Settings,
    },
  ];

  const handleItemClick = (view: ViewMode) => {
    onNavigate(view);
  };

  return (
    <>
      {/* Sidebar Container */}
      {/* Desktop only. On phones and tablets the floating bottom bar is the
          sole navigation, so there is no drawer to slide in. */}
      <aside className="hidden lg:flex static z-20 w-[240px] flex-none self-stretch flex-col px-3.5 py-5 sm:py-6 bg-gradient-to-b from-[#0d152a] to-[#080d1c] border-l border-[#7dd3fc]/15 backdrop-blur-2xl select-none">
        {/* Brand Header */}
        <div className="relative flex items-center justify-center pt-1 pb-6 w-full">
          <div className="cursor-pointer flex justify-center w-full" onClick={() => handleItemClick('dashboard')}>
            <Logo
              size={48}
              textSize="text-lg sm:text-xl"
              className="w-[177px] mx-auto"
              style={{ width: 177 }}
            />
          </div>
        </div>

        {/* Nav List */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = isItemActive(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-['Heebo'] text-[15px] font-semibold tracking-tight transition-all duration-200 text-right min-h-[44px] ${
                  active
                    ? 'text-[#eaf9ff] bg-gradient-to-l from-[#22d3ee]/20 to-[#2563eb]/15 shadow-[inset_-3px_0_0_#22d3ee,0_0_24px_-12px_#22d3ee]'
                    : 'text-[#cbe1ff]/70 hover:bg-[#7dd3fc]/10 hover:text-[#eaf9ff]'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 flex-none ${active ? 'text-[#22d3ee]' : 'text-current opacity-85'}`} />
                <span className="flex-1 min-w-0 text-right whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* User Profile Footer */}
        <div className="relative">
          {showUserSwitcher && onSwitchUser && users.length > 0 && (
            <div className="absolute bottom-full mb-2 right-0 left-0 p-2 rounded-2xl bg-[#0b1329] border border-[#7dd3fc]/25 shadow-[0_-10px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 flex flex-col gap-1 max-h-60 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-bold text-[#7dd3fc] flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
                <span>החלף פרופיל משתמש</span>
                <span className="text-[10px] text-[#cbe1ff]/60">הארגון משפיע על התבנית</span>
              </div>
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      if (onSwitchUser) onSwitchUser(u.id);
                      setShowUserSwitcher(false);
                    }}
                    className={`cursor-pointer w-full flex items-center gap-2.5 p-2 rounded-xl text-right transition-all ${
                      isCurrent
                        ? 'bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-white'
                        : 'hover:bg-white/5 text-[#cbe1ff]/80 hover:text-white'
                    }`}
                  >
                    <div
                      className="flex-none w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-[#04121f]"
                      style={{ background: u.avatar || 'linear-gradient(135deg, #1d4ed8, #22d3ee)' }}
                    >
                      {u.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#22d3ee]" />}
                      </div>
                      <div className="text-[10px] text-[#7dd3fc] truncate font-mono">
                        {u.organization || 'SecQuote Cyber Labs'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 p-2 rounded-2xl border border-[#7dd3fc]/15 bg-white/[0.035] backdrop-blur-md">
            <button
              type="button"
              onClick={() => onSwitchUser && setShowUserSwitcher(!showUserSwitcher)}
              className={`flex-1 min-w-0 flex items-center gap-2.5 text-right transition-opacity ${
                onSwitchUser ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
              }`}
              title={onSwitchUser ? 'לחץ להחלפת פרופיל משתמש' : currentUser?.name || ''}
            >
              <div
                className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-[#04121f] shadow-sm"
                style={{
                  background: currentUser?.avatar || 'linear-gradient(135deg, #1d4ed8, #22d3ee)',
                }}
              >
                {currentUser?.initials || 'דכ'}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="text-[13px] font-bold text-[#eaf4ff] flex items-center justify-between gap-1">
                  <span className="truncate">{currentUser?.name || 'דוד כהן'}</span>
                  <ChevronUp className="w-3.5 h-3.5 text-[#7dd3fc]/70 flex-none" />
                </div>
                <div
                  className="text-[11px] text-[#22d3ee] font-semibold truncate font-mono"
                  title={currentUser?.organization || 'ELIX SYSTEMS'}
                >
                  {currentUser?.organization || 'ELIX SYSTEMS'}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="התנתקות"
              title="התנתקות"
              className="flex-none w-8 h-8 rounded-full flex items-center justify-center text-[#9fd4ff] hover:bg-red-500/15 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
