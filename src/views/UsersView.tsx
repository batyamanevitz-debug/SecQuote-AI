import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  ChevronDown,
  Check,
  Pencil,
  KeyRound,
  Share2,
  UserX,
  X,
  Building2,
  UserCheck,
  Landmark,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Shield,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { UserItem, AccessLevel, Quote } from '../types';
import type { QuoteShare } from '../services/dataService';
import { ACCESS_OPTIONS, getOrgFinancialDetails } from '../data/mockData';
import { isHebrewFemaleName } from '../utils/greeting';

interface UsersViewProps {
  users: UserItem[];
  /** The owner's quotes, offered for sharing when editing a member. */
  quotes?: Quote[];
  /** Shares already granted, keyed by lowercased member email. */
  sharesByEmail?: Record<string, QuoteShare[]>;
  /** Persists the exact set of quotes a member may see, and at what permission. */
  onSetShares?: (memberEmail: string, shares: QuoteShare[]) => void;
  onAddUser: (user: Omit<UserItem, 'id' | 'initials' | 'avatar' | 'joined'>) => void;
  onUpdateUser: (id: string, updates: Partial<UserItem>) => void;
  onDeleteUser?: (id: string) => void;
  currentUser?: UserItem | null;
  onSwitchUser?: (userId: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  quotes = [],
  sharesByEmail = {},
  onSetShares,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
  onSwitchUser,
}) => {
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'admin'>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'joined' | 'name' | 'org' | 'status'>('joined');

  // Interactive UI State
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** Quotes ticked for the member currently being added or edited. */
  const [sharedQuotes, setSharedQuotes] = useState<QuoteShare[]>([]);
  /** The member whose quote access is open in the standalone share panel. */
  const [shareTarget, setShareTarget] = useState<UserItem | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // Form Fields State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newRole, setNewRole] = useState('Security Consultant');
  const [newAccess, setNewAccess] = useState<AccessLevel>('edit');
  const [newHpNumber, setNewHpNumber] = useState('');
  const [newBankNumber, setNewBankNumber] = useState('');
  const [newBranchNumber, setNewBranchNumber] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');

  // Dynamic Calculations
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const adminCount = users.filter((u) => u.access === 'admin').length;

  const uniqueOrgs = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.organization) set.add(u.organization);
    });
    return Array.from(set);
  }, [users]);

  // Dynamic Filtering & Sorting
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Status filter
        if (statusFilter === 'active' && u.status !== 'active') return false;
        if (statusFilter === 'suspended' && u.status !== 'suspended') return false;
        if (statusFilter === 'admin' && u.access !== 'admin') return false;

        // Org filter
        if (orgFilter !== 'all' && u.organization !== orgFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = u.name.toLowerCase().includes(q);
          const matchEmail = u.email.toLowerCase().includes(q);
          const matchOrg = (u.organization || '').toLowerCase().includes(q);
          const matchRole = (u.role || '').toLowerCase().includes(q);
          const matchHp = (u.hpNumber || '').includes(q);
          return matchName || matchEmail || matchOrg || matchRole || matchHp;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'he');
        if (sortBy === 'org') return (a.organization || '').localeCompare(b.organization || '', 'he');
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        return String(b.id).localeCompare(String(a.id)); // newest first
      });
  }, [users, statusFilter, orgFilter, searchQuery, sortBy]);

  const openNewUserModal = () => {
    setEditingUserId(null);
    setNewName('');
    setNewEmail('');
    const defaultOrg = currentUser?.organization || '';
    setNewOrg(defaultOrg);
    const defaultFin = getOrgFinancialDetails(defaultOrg);
    setNewHpNumber(defaultFin.hpNumber);
    setNewBankNumber(defaultFin.bankNumber);
    setNewBranchNumber(defaultFin.branchNumber);
    setNewBankAccountNumber(defaultFin.bankAccountNumber);
    setNewBeneficiaryName(defaultFin.beneficiaryName);
    setNewRole('Security Consultant');
    setNewAccess('edit');
    setSharedQuotes([]);
    setIsModalOpen(true);
  };

  const openEditUserModal = (u: UserItem) => {
    const fin = getOrgFinancialDetails(u.organization || '', u);
    setEditingUserId(u.id);
    setNewName(u.name);
    setNewEmail(u.email);
    setNewOrg(u.organization || '');
    setNewRole(u.role);
    setNewAccess(u.access);
    setNewHpNumber(u.hpNumber || fin.hpNumber);
    setNewBankNumber(u.bankNumber || fin.bankNumber);
    setNewBranchNumber(u.branchNumber || fin.branchNumber);
    setNewBankAccountNumber(u.bankAccountNumber || fin.bankAccountNumber);
    setNewBeneficiaryName(u.beneficiaryName || fin.beneficiaryName);
    setSharedQuotes(sharesByEmail[(u.email || '').trim().toLowerCase()] || []);
    setIsModalOpen(true);
  };

  /** Shares already granted to a member, for the row badge and the panel. */
  const sharesOf = (email: string): QuoteShare[] =>
    sharesByEmail[(email || '').trim().toLowerCase()] || [];

  const openShareModal = (u: UserItem) => {
    setShareTarget(u);
    setSharedQuotes(sharesOf(u.email));
  };

  const saveShareModal = () => {
    if (shareTarget && onSetShares) {
      onSetShares(shareTarget.email.trim().toLowerCase(), sharedQuotes);
    }
    setShareTarget(null);
    setSharedQuotes([]);
  };

  const handleOrgChange = (org: string) => {
    setNewOrg(org);
    const fin = getOrgFinancialDetails(org);
    setNewHpNumber(fin.hpNumber);
    setNewBankNumber(fin.bankNumber);
    setNewBranchNumber(fin.branchNumber);
    setNewBankAccountNumber(fin.bankAccountNumber);
    setNewBeneficiaryName(fin.beneficiaryName);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const orgToSave = newOrg.trim() || currentUser?.organization || '';

    const userPayload = {
      name: newName.trim(),
      email: newEmail.trim(),
      organization: orgToSave,
      role: newRole,
      access: newAccess,
      gender: (isHebrewFemaleName(newName.trim().split(/\s+/)[0]) ? 'female' : 'male') as 'female' | 'male',
      hpNumber: newHpNumber.trim(),
      bankNumber: newBankNumber.trim(),
      branchNumber: newBranchNumber.trim(),
      bankAccountNumber: newBankAccountNumber.trim(),
      beneficiaryName: newBeneficiaryName.trim(),
    };

    if (editingUserId !== null) {
      onUpdateUser(editingUserId, userPayload);
    } else {
      onAddUser({
        ...userPayload,
        status: 'active',
      });
    }

    // Access is granted against the email, so it applies whether or not this
    // person has registered yet.
    if (onSetShares) onSetShares(newEmail.trim().toLowerCase(), sharedQuotes);
    setNewName('');
    setNewEmail('');
    setNewOrg('');
    setEditingUserId(null);
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string, currentStatus: UserItem['status']) => {
    onUpdateUser(id, {
      status: currentStatus === 'active' ? 'suspended' : 'active',
    });
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    if (onDeleteUser) {
      onDeleteUser(userToDelete.id);
    }
    setUserToDelete(null);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
      {/* Pinned Top Header */}
      <div className="flex-none px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-[#080d1c]/90 backdrop-blur-xl border-b border-[#7dd3fc]/15 z-20">
        <div className="flex items-center justify-between gap-3 sm:gap-4 select-none">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#f4f9ff] truncate">
                ניהול משתמשים והרשאות
              </h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[#cbe1ff]/60">
                {users.length} משתמשים רשומים · {uniqueOrgs.length} ארגונים · {activeCount} פעילים
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewUserModal}
            className="cursor-pointer h-9 sm:h-10 px-3.5 sm:px-5 rounded-full font-['Heebo'] text-xs sm:text-sm font-bold text-[#04121f] inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_10px_26px_-12px_rgba(34,211,238,0.7)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(34,211,238,0.85)] hover:brightness-105 active:translate-y-0 transition-all duration-200 whitespace-nowrap flex-none"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>הוספת משתמש</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto pb-28 lg:pb-8">
        {/* Dynamic Metric Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {/* Total Users */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#121e36]/80 to-[#0a1122]/90 shadow-md">
            <div className="flex items-center justify-between text-[#cbe1ff]/70 text-xs font-semibold">
              <span>סה״כ משתמשים</span>
              <span className="w-7 h-7 rounded-lg bg-sky-400/15 text-[#38bdf8] flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#f4f9ff]">{totalCount}</span>
              <span className="text-[11px] text-[#9fd4ff]/70 font-mono">במאגר</span>
            </div>
          </div>

          {/* Active Users */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#0c261e]/70 to-[#081512]/80 shadow-md">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
              <span>משתמשים פעילים</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-400/15 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300">{activeCount}</span>
              <span className="text-[11px] text-emerald-400/80 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                מחוברים
              </span>
            </div>
          </div>

          {/* Suspended Users */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-[#2a1219]/60 to-[#14080d]/80 shadow-md">
            <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
              <span>משתמשים מושהים</span>
              <span className="w-7 h-7 rounded-lg bg-rose-400/15 text-rose-400 flex items-center justify-center">
                <UserX className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-300">{suspendedCount}</span>
              <span className="text-[11px] text-rose-400/70 font-mono">מושבתים</span>
            </div>
          </div>

          {/* Connected Organizations */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-[#22d3ee]/25 bg-gradient-to-br from-[#0d2238]/70 to-[#071322]/80 shadow-md">
            <div className="flex items-center justify-between text-[#67e8f9] text-xs font-semibold">
              <span>ארגונים רשומים</span>
              <span className="w-7 h-7 rounded-lg bg-[#22d3ee]/15 text-[#22d3ee] flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#67e8f9]">{uniqueOrgs.length}</span>
              <span className="text-[11px] text-[#22d3ee]/80 font-mono">חברות</span>
            </div>
          </div>
        </section>

        {/* Dynamic Controls Toolbar: Search, Filters, Sorting */}
        <section className="p-3.5 sm:p-4 rounded-2xl border border-[#7dd3fc]/15 bg-gradient-to-r from-[#0f1a30]/90 to-[#0a1222]/90 shadow-md mb-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-[#7dd3fc] opacity-80 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש מהיר לפי שם, אימייל, חברה או תפקיד..."
              className="w-full h-10 pr-10 pl-9 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-xs sm:text-sm text-[#e8f2ff] placeholder:text-[#cbe1ff]/40 outline-none focus:border-[#22d3ee] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#cbe1ff]/60 hover:text-white absolute left-2.5 top-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs & Organization Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060c1c]/80 border border-[#7dd3fc]/15 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-[#22d3ee]/20 text-[#22d3ee] shadow-sm'
                    : 'text-[#cbe1ff]/60 hover:text-white'
                }`}
              >
                הכל ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'active'
                    ? 'bg-emerald-400/20 text-emerald-300 shadow-sm'
                    : 'text-[#cbe1ff]/60 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>פעילים ({activeCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('suspended')}
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'suspended'
                    ? 'bg-rose-400/20 text-rose-300 shadow-sm'
                    : 'text-[#cbe1ff]/60 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>מושהים ({suspendedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('admin')}
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'admin'
                    ? 'bg-indigo-400/25 text-indigo-300 shadow-sm'
                    : 'text-[#cbe1ff]/60 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3 text-indigo-400" />
                <span>מנהלים ({adminCount})</span>
              </button>
            </div>

            {/* Organization Filter */}
            {uniqueOrgs.length > 1 && (
              <div className="relative">
                <select
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#7dd3fc]/20 bg-[#060c1c]/90 text-xs font-semibold text-[#9fd4ff] outline-none cursor-pointer hover:border-[#22d3ee] transition-colors"
                >
                  <option value="all">כל הארגונים ({uniqueOrgs.length})</option>
                  {uniqueOrgs.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 rounded-xl border border-[#7dd3fc]/20 bg-[#060c1c]/90 text-xs font-semibold text-[#9fd4ff] outline-none cursor-pointer hover:border-[#22d3ee] transition-colors"
              >
                <option value="joined">מיון: חדשים תחילה</option>
                <option value="name">מיון: שם משתמש (א-ת)</option>
                <option value="org">מיון: לפי ארגון</option>
                <option value="status">מיון: לפי סטטוס</option>
              </select>
            </div>
          </div>
        </section>

        {/* Mobile Card List (sm / mobile) */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-[#7dd3fc]/15 bg-[#0e1628]/60 text-sm text-[#cbe1ff]/60">
              לא נמצאו משתמשים התואמים לסינון הנוכחי.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const accessMeta =
                ACCESS_OPTIONS.find((a) => a.key === u.access) || ACCESS_OPTIONS[0];
              const isActive = u.status === 'active';
              const isCurrentUser = currentUser?.id === u.id;
              const isDropdownOpen = openDropdownId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all shadow-lg flex flex-col gap-3 ${
                    isCurrentUser
                      ? 'border-[#22d3ee]/40 bg-gradient-to-br from-[#162744]/90 to-[#0c162a]/95 ring-1 ring-[#22d3ee]/30'
                      : 'border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-[#04121f] shadow-md"
                        style={{ background: u.avatar }}
                      >
                        {u.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#eaf4ff] truncate">{u.name}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#22d3ee]/20 text-[#67e8f9] border border-[#22d3ee]/35">
                              פרופיל נוכחי
                            </span>
                          )}
                        </div>
                        <div dir="ltr" className="text-xs text-[#cbe1ff]/60 truncate font-mono text-right">
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatus(u.id, u.status)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/35 hover:bg-emerald-400/25'
                          : 'bg-rose-400/15 text-rose-300 border-rose-400/35 hover:bg-rose-400/25'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {isActive ? 'Active' : 'Suspended'}
                    </button>
                  </div>

                  {/* Organization & Financial details */}
                  <div className="flex flex-col gap-1 pt-2 border-t border-[#7dd3fc]/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#cbe1ff]/50">שם הארגון:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#22d3ee]/10 text-[#7dd3fc] border border-[#22d3ee]/20 truncate max-w-[200px]">
                        <Building2 className="w-3.5 h-3.5 flex-none text-[#22d3ee]" />
                        <span className="truncate">{u.organization || 'ללא ארגון'}</span>
                      </span>
                    </div>
                    {(() => {
                      const fin = getOrgFinancialDetails(u.organization || '', u);
                      return (
                        <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 font-mono">
                          <span>ח.פ: {fin.hpNumber}</span>
                          <span>•</span>
                          <span>בנק {fin.bankNumber} ח-ן {fin.bankAccountNumber}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Role & Access */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#7dd3fc]/10 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-[#cbe1ff]/50">תפקיד:</span>
                      <span className="font-semibold text-[#d8eeff]">{u.role}</span>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : u.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:brightness-110 transition-all"
                        style={{
                          backgroundColor: accessMeta.bg,
                          color: accessMeta.fg,
                        }}
                      >
                        {accessMeta.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute z-30 top-[calc(100%+6px)] left-0 min-w-[170px] p-1.5 rounded-2xl border border-[#22d3ee]/35 bg-[#091020]/95 shadow-xl backdrop-blur-xl">
                          {ACCESS_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                onUpdateUser(u.id, { access: opt.key });
                                setOpenDropdownId(null);
                              }}
                              className="w-full p-2 rounded-xl flex items-center justify-between text-xs font-semibold text-[#d8eeff] hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <span>{opt.label}</span>
                              {opt.key === u.access && <Check className="w-3.5 h-3.5 text-[#22d3ee]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Profile Switch */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#7dd3fc]/10 text-xs">
                    <div>
                      {isCurrentUser ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> פעיל
                        </span>
                      ) : onSwitchUser ? (
                        <button
                          type="button"
                          onClick={() => onSwitchUser(u.id)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22d3ee]/15 text-[#67e8f9] border border-[#22d3ee]/35 hover:bg-[#22d3ee]/25 flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" /> החלף לפרופיל זה
                        </button>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => openShareModal(u)}
                          className="px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold text-[#67e8f9] bg-[#22d3ee]/12 border border-[#22d3ee]/30 hover:bg-[#22d3ee]/22 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          שיתוף
                          {sharesOf(u.email).length > 0 && ` (${sharesOf(u.email).length})`}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditUserModal(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#9fd4ff] hover:bg-[#7dd3fc]/15 transition-colors cursor-pointer"
                      >
                        ערוך
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToDelete(u)}
                        className="p-1 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        title="מחק משתמש"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Users Table (Desktop) */}
        <section className="hidden md:flex flex-1 flex-col rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/90 shadow-[0_30px_70px_-34px_rgba(2,8,23,0.95)] overflow-hidden">
          <div className="grid grid-cols-[1.3fr_1.3fr_1.2fr_1.2fr_0.8fr_0.7fr_1.6fr] gap-3 px-6 py-3.5 bg-[#7dd3fc]/[0.06] border-b border-[#7dd3fc]/12 text-xs font-bold text-[#cbe1ff]/70 tracking-wide select-none">
            <span>שם משתמש</span>
            <span>שם הארגון:</span>
            <span>אימייל</span>
            <span>תפקיד / הרשאה</span>
            <span>תאריך הצטרפות</span>
            <span>סטטוס</span>
            <span className="text-left">פרופיל ופעולות</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[980px]">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#cbe1ff]/60">
                  לא נמצאו משתמשים התואמים לחיפוש ולסינון הנוכחיים.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const accessMeta =
                    ACCESS_OPTIONS.find((a) => a.key === u.access) || ACCESS_OPTIONS[0];
                  const isActive = u.status === 'active';
                  const isCurrentUser = currentUser?.id === u.id;
                  const isDropdownOpen = openDropdownId === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`grid grid-cols-[1.3fr_1.3fr_1.2fr_1.2fr_0.8fr_0.7fr_1.6fr] gap-3 items-center min-h-[66px] px-6 py-2.5 border-b border-[#7dd3fc]/[0.07] transition-all duration-200 ${
                        isCurrentUser
                          ? 'bg-[#22d3ee]/[0.07] border-l-4 border-l-[#22d3ee]'
                          : 'hover:bg-[#7dd3fc]/[0.04]'
                      } ${!isActive ? 'opacity-65' : 'opacity-100'}`}
                    >
                      {/* Name with Avatar */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-[#04121f] shadow-sm"
                          style={{ background: u.avatar }}
                        >
                          {u.initials}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#eaf4ff] truncate">{u.name}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#22d3ee]/20 text-[#67e8f9] border border-[#22d3ee]/30 whitespace-nowrap">
                                נוכחי
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Organization Name & Financial Quick View */}
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#22d3ee]/10 text-[#7dd3fc] border border-[#22d3ee]/20 truncate max-w-full">
                          <Building2 className="w-3.5 h-3.5 flex-none text-[#22d3ee]" />
                          <span className="truncate">{u.organization || 'ללא ארגון'}</span>
                        </span>
                        {(() => {
                          const fin = getOrgFinancialDetails(u.organization || '', u);
                          return (
                            <div
                              className="flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate"
                              title={`ח.פ: ${fin.hpNumber} | בנק ${fin.bankNumber} ח-ן ${fin.bankAccountNumber}`}
                            >
                              <span>ח.פ: {fin.hpNumber}</span>
                              <span>•</span>
                              <span>בנק {fin.bankNumber} ח-ן {fin.bankAccountNumber}</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Email */}
                      <span dir="ltr" className="text-xs text-[#cbe1ff]/70 text-right truncate font-mono">
                        {u.email}
                      </span>

                      {/* Role & Access Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : u.id)}
                          className="flex flex-col gap-1 items-start cursor-pointer group"
                        >
                          <span className="text-xs font-bold text-[#eaf4ff] truncate max-w-[150px]">{u.role}</span>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-sm group-hover:brightness-110"
                            style={{
                              backgroundColor: accessMeta.bg,
                              color: accessMeta.fg,
                            }}
                          >
                            {accessMeta.label}
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${
                                isDropdownOpen ? 'rotate-180' : 'rotate-0'
                              }`}
                            />
                          </span>
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute z-30 top-[calc(100%+6px)] right-0 min-w-[200px] p-1.5 rounded-2xl border border-[#22d3ee]/35 bg-[#091020]/95 shadow-[0_24px_50px_-20px_rgba(2,8,23,0.95)] backdrop-blur-xl animate-in fade-in zoom-in-95">
                            {ACCESS_OPTIONS.map((opt) => {
                              const isSelected = opt.key === u.access;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    onUpdateUser(u.id, { access: opt.key });
                                    setOpenDropdownId(null);
                                  }}
                                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                                    isSelected ? 'bg-[#22d3ee]/15 text-[#eaf9ff]' : 'text-[#d8eeff]/80 hover:bg-[#7dd3fc]/10'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-[#22d3ee] stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Joined Date */}
                      <span className="text-xs text-[#cbe1ff]/70 font-mono">{u.joined}</span>

                      {/* Status Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleStatus(u.id, u.status)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/35 hover:bg-emerald-400/25'
                              : 'bg-rose-400/15 text-rose-300 border-rose-400/35 hover:bg-rose-400/25'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {isActive ? 'Active' : 'Suspended'}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5">
                        {isCurrentUser ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 flex items-center gap-1 shadow-sm whitespace-nowrap">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>פרופיל פעיל</span>
                          </span>
                        ) : onSwitchUser ? (
                          <button
                            type="button"
                            onClick={() => onSwitchUser(u.id)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#22d3ee]/15 text-[#67e8f9] border border-[#22d3ee]/35 hover:bg-[#22d3ee]/25 flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap active:scale-95"
                            title="התחבר/החלף לפרופיל משתמש זה (שם הארגון ישתנה במסמכים)"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>החלף לפרופיל זה</span>
                          </button>
                        ) : null}
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            title="בחר אילו הצעות מחיר המשתמש יראה"
                            onClick={() => openShareModal(u)}
                            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[11px] font-bold text-[#67e8f9] bg-[#22d3ee]/12 hover:bg-[#22d3ee]/22 border border-[#22d3ee]/30 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>
                              שיתוף הצעות
                              {sharesOf(u.email).length > 0 && ` (${sharesOf(u.email).length})`}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          title="ערוך פרטים"
                          onClick={() => openEditUserModal(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9fd4ff] hover:bg-[#7dd3fc]/15 hover:text-white transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="שינוי הרשאות מהיר"
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : u.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9fd4ff] hover:bg-[#7dd3fc]/15 hover:text-white transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title={isActive ? 'השעה משתמש' : 'הפעל משתמש'}
                          onClick={() => toggleStatus(u.id, u.status)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            isActive
                              ? 'text-[#9fd4ff] hover:bg-rose-500/15 hover:text-rose-300'
                              : 'text-rose-300 hover:bg-emerald-500/15 hover:text-emerald-300'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="מחיקת משתמש"
                          onClick={() => setUserToDelete(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#cbe1ff]/40 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl border border-rose-500/35 bg-gradient-to-br from-[#1a0f16] via-[#140b12] to-[#0a0609] shadow-[0_30px_70px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-rose-500/20">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-none">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#fff1f2]">אישור מחיקת משתמש</h3>
                <p className="text-xs text-[#fda4af]/70">פעולה בלתי הפיכה במערכת</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-white/[0.03] border border-rose-500/15 flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#04121f] flex-none"
                style={{ background: userToDelete.avatar }}
              >
                {userToDelete.initials}
              </span>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[#fff1f2] truncate">{userToDelete.name}</div>
                <div className="text-xs text-[#cbe1ff]/60 font-mono truncate">{userToDelete.email}</div>
                <div className="text-[11px] text-[#22d3ee] mt-0.5">{userToDelete.organization || 'ללא ארגון'}</div>
              </div>
            </div>

            {currentUser?.id === userToDelete.id ? (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 mb-4">
                שים לב: זהו הפרופיל המחובר שלך כעת! לא ניתן למחוק את המשתמש הפעיל בעת התחברות. יש להחליף פרופיל תחילה.
              </div>
            ) : (
              <p className="text-xs text-[#e2e8f0]/80 leading-relaxed mb-5">
                האם אתה בטוח שברצונך להסיר את <strong>{userToDelete.name}</strong> מהמערכת? המשתמש יוסר מרשימת היועצים ויושבתו כל הרשאות הגישה שלו.
              </p>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 h-11 rounded-full text-xs sm:text-sm font-semibold text-[#cbe1ff]/80 border border-[#7dd3fc]/20 hover:bg-white/5 cursor-pointer"
              >
                ביטול
              </button>
              {currentUser?.id !== userToDelete.id && (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 h-11 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-[0_10px_24px_-8px_rgba(244,63,94,0.7)] cursor-pointer active:scale-98 transition-all"
                >
                  מחק משתמש לצמיתות
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {/* Standalone quote-sharing panel for one team member. */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#22d3ee]/35 bg-gradient-to-br from-[#121c34] to-[#0a1020] p-5 sm:p-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-[#04121f]"
                  style={{ background: shareTarget.avatar || 'linear-gradient(140deg,#2563eb,#22d3ee)' }}
                >
                  {shareTarget.initials}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#f4f9ff] truncate">
                    שיתוף הצעות מחיר עם {shareTarget.name}
                  </h3>
                  <p className="text-[11px] text-[#cbe1ff]/60 font-mono truncate">
                    {shareTarget.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                aria-label="סגור"
                className="flex-none p-1.5 rounded-lg text-[#cbe1ff]/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#cbe1ff]/65 leading-relaxed">
              סמני אילו הצעות מחיר {shareTarget.name} יראה כשייכנס למערכת עם החשבון
              שלו. לכל הצעה אפשר לבחור <strong className="text-[#7dd3fc]">צפייה</strong> או
              גם <strong className="text-emerald-300">עריכה</strong>. מחיקה נשארת תמיד רק אצלך.
            </p>

            {quotes.length === 0 ? (
              <p className="text-[12px] text-amber-300/85">
                אין עדיין הצעות מחיר לשיתוף. צרי הצעה ואז תוכלי לשתף אותה.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSharedQuotes(quotes.map((q) => ({ quoteId: q.id, canEdit: false })))
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-[#7dd3fc]/20 text-[#cbe1ff]/80 hover:bg-white/10 cursor-pointer"
                  >
                    סמן הכל
                  </button>
                  <button
                    type="button"
                    onClick={() => setSharedQuotes([])}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-[#7dd3fc]/20 text-[#cbe1ff]/80 hover:bg-white/10 cursor-pointer"
                  >
                    נקה הכל
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {quotes.map((q) => {
                    const share = sharedQuotes.find((sh) => sh.quoteId === q.id);
                    const checked = !!share;
                    const setPermission = (canEdit: boolean) =>
                      setSharedQuotes((prev) =>
                        prev.map((sh) => (sh.quoteId === q.id ? { ...sh, canEdit } : sh))
                      );
                    return (
                      <div
                        key={q.id}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                          checked
                            ? 'bg-[#22d3ee]/15 border-[#22d3ee]/40'
                            : 'bg-white/[0.03] border-white/[0.07]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSharedQuotes((prev) =>
                              checked
                                ? prev.filter((sh) => sh.quoteId !== q.id)
                                : [...prev, { quoteId: q.id, canEdit: false }]
                            )
                          }
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-right cursor-pointer"
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
                          <span className="flex-none text-[11px] text-[#7dd3fc]/70 font-mono">
                            {q.cost}
                          </span>
                        </button>

                        {checked && (
                          <div className="flex-none flex items-center rounded-lg overflow-hidden border border-[#22d3ee]/30">
                            <button
                              type="button"
                              onClick={() => setPermission(false)}
                              className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                                !share!.canEdit
                                  ? 'bg-[#22d3ee] text-[#04121f]'
                                  : 'text-[#cbe1ff]/70 hover:bg-white/10'
                              }`}
                            >
                              צפייה
                            </button>
                            <button
                              type="button"
                              onClick={() => setPermission(true)}
                              className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                                share!.canEdit
                                  ? 'bg-emerald-400 text-[#04121f]'
                                  : 'text-[#cbe1ff]/70 hover:bg-white/10'
                              }`}
                            >
                              עריכה
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                className="flex-1 h-11 rounded-full text-sm font-semibold text-[#cbe1ff]/70 border border-[#7dd3fc]/20 hover:bg-white/5 cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={saveShareModal}
                className="flex-1 h-11 rounded-full text-sm font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] hover:brightness-105 cursor-pointer"
              >
                שמור שיתוף
                {sharedQuotes.length > 0 && ` (${sharedQuotes.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl border border-[#22d3ee]/35 bg-gradient-to-br from-[#121c34] to-[#0a1020] shadow-[0_30px_70px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#7dd3fc]/15">
              <h3 className="text-lg font-bold text-[#f4f9ff]">
                {editingUserId !== null ? 'עריכת פרטי משתמש' : 'הוספת משתמש חדש'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#cbe1ff]/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col gap-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-[#cbe1ff]/70 mb-1.5">
                  שם מלא
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="לדוגמה: רועי לוי"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-sm text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbe1ff]/70 mb-1.5">
                  אימייל
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="roee@cybersec.co.il"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-sm text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbe1ff]/70 mb-1.5">
                  שם הארגון
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newOrg}
                    onChange={(e) => handleOrgChange(e.target.value)}
                    placeholder="לדוגמה: Acme Cyber Security"
                    required
                    className="w-full h-11 pr-10 pl-4 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-sm text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                  />
                  <Building2 className="w-4 h-4 text-[#7dd3fc]/60 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Financial & Banking Details Section for SOW */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Landmark className="w-4 h-4 text-cyan-400" />
                  <span>פרטי ח.פ ובנק של הארגון (מופיעים במסמכי SOW)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#cbe1ff]/70 mb-1">
                      מספר ח.פ / ע.מ
                    </label>
                    <input
                      type="text"
                      value={newHpNumber}
                      onChange={(e) => setNewHpNumber(e.target.value)}
                      placeholder="מספר ח.פ / ע.מ"
                      className="w-full h-9 px-3 rounded-lg border border-[#7dd3fc]/20 bg-white/[0.04] text-xs text-[#e8f2ff] outline-none focus:border-[#22d3ee] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#cbe1ff]/70 mb-1">
                      מספר חשבון בנק
                    </label>
                    <input
                      type="text"
                      value={newBankAccountNumber}
                      onChange={(e) => setNewBankAccountNumber(e.target.value)}
                      placeholder="מספר חשבון"
                      className="w-full h-9 px-3 rounded-lg border border-[#7dd3fc]/20 bg-white/[0.04] text-xs text-[#e8f2ff] outline-none focus:border-[#22d3ee] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#cbe1ff]/70 mb-1">
                      שם / מספר בנק
                    </label>
                    <input
                      type="text"
                      value={newBankNumber}
                      onChange={(e) => setNewBankNumber(e.target.value)}
                      placeholder="12 (הפועלים)"
                      className="w-full h-9 px-3 rounded-lg border border-[#7dd3fc]/20 bg-white/[0.04] text-xs text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#cbe1ff]/70 mb-1">
                      מספר סניף
                    </label>
                    <input
                      type="text"
                      value={newBranchNumber}
                      onChange={(e) => setNewBranchNumber(e.target.value)}
                      placeholder="680"
                      className="w-full h-9 px-3 rounded-lg border border-[#7dd3fc]/20 bg-white/[0.04] text-xs text-[#e8f2ff] outline-none focus:border-[#22d3ee] font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#cbe1ff]/70 mb-1">
                    שם המוטב בחשבון
                  </label>
                  <input
                    type="text"
                    value={newBeneficiaryName}
                    onChange={(e) => setNewBeneficiaryName(e.target.value)}
                    placeholder="מנביץ׳ סייבר קונסלטינג"
                    className="w-full h-9 px-3 rounded-lg border border-[#7dd3fc]/20 bg-white/[0.04] text-xs text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbe1ff]/70 mb-1.5">
                  תפקיד בארגון
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="לדוגמה: Senior Penetration Tester"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-[#7dd3fc]/20 bg-white/[0.04] text-sm text-[#e8f2ff] outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#cbe1ff]/70 mb-1.5">
                  רמת הרשאה
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCESS_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewAccess(opt.key)}
                      className={`h-10 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newAccess === opt.key
                          ? 'border-[#22d3ee] bg-[#22d3ee]/20 text-white'
                          : 'border-[#7dd3fc]/20 bg-white/[0.03] text-[#cbe1ff]/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Which of my quotes this person may open */}
              <div className="pt-3 border-t border-[#7dd3fc]/15 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-[#7dd3fc]">
                    אילו הצעות מחיר המשתמש יראה?
                  </span>
                  {quotes.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSharedQuotes(quotes.map((q) => ({ quoteId: q.id, canEdit: false })))
                        }
                        className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-[#7dd3fc]/20 text-[#cbe1ff]/80 hover:bg-white/10 cursor-pointer"
                      >
                        הכל
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharedQuotes([])}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white/[0.05] border border-[#7dd3fc]/20 text-[#cbe1ff]/80 hover:bg-white/10 cursor-pointer"
                      >
                        אף אחת
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#cbe1ff]/50 leading-relaxed">
                  המשתמש יראה את ההצעות המסומנות כשייכנס לחשבון שלו. לכל הצעה אפשר
                  לבחור צפייה בלבד או גם עריכה. מחיקה נשארת תמיד רק אצלך.
                </p>

                {quotes.length === 0 ? (
                  <p className="text-[11px] text-amber-300/80">
                    אין עדיין הצעות מחיר לשיתוף.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {quotes.map((q) => {
                      const share = sharedQuotes.find((sh) => sh.quoteId === q.id);
                      const checked = !!share;
                      const setPermission = (canEdit: boolean) =>
                        setSharedQuotes((prev) =>
                          prev.map((sh) => (sh.quoteId === q.id ? { ...sh, canEdit } : sh))
                        );

                      return (
                        <div
                          key={q.id}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                            checked
                              ? 'bg-[#22d3ee]/15 border-[#22d3ee]/40'
                              : 'bg-white/[0.03] border-white/[0.07]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSharedQuotes((prev) =>
                                checked
                                  ? prev.filter((sh) => sh.quoteId !== q.id)
                                  : [...prev, { quoteId: q.id, canEdit: false }]
                              )
                            }
                            className="flex items-center gap-2.5 flex-1 min-w-0 text-right cursor-pointer"
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
                            <span className="flex-none text-[11px] text-[#7dd3fc]/70 font-mono">
                              {q.cost}
                            </span>
                          </button>

                          {checked && (
                            <div className="flex-none flex items-center rounded-lg overflow-hidden border border-[#22d3ee]/30">
                              <button
                                type="button"
                                onClick={() => setPermission(false)}
                                className={`px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                                  !share!.canEdit
                                    ? 'bg-[#22d3ee] text-[#04121f]'
                                    : 'text-[#cbe1ff]/70 hover:bg-white/10'
                                }`}
                              >
                                צפייה
                              </button>
                              <button
                                type="button"
                                onClick={() => setPermission(true)}
                                className={`px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                                  share!.canEdit
                                    ? 'bg-emerald-400 text-[#04121f]'
                                    : 'text-[#cbe1ff]/70 hover:bg-white/10'
                                }`}
                              >
                                עריכה
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 mt-3 pt-3 border-t border-[#7dd3fc]/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 rounded-full text-sm font-semibold text-[#cbe1ff]/70 border border-[#7dd3fc]/20 hover:bg-white/5 cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="cursor-pointer flex-1 h-11 rounded-full text-sm font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] shadow-[0_10px_24px_-10px_rgba(34,211,238,0.75)] hover:brightness-105"
                >
                  {editingUserId !== null ? 'שמור שינויים' : 'הוסף משתמש'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
