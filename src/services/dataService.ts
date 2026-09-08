import { supabase } from '../lib/supabase';
import { Quote, UserItem, ScopeComponent, AccessLevel } from '../types';

/* ------------------------------------------------------------------ *
 * Row shapes (snake_case in Postgres, camelCase in the app)
 * ------------------------------------------------------------------ */

type QuoteRow = Record<string, any>;
type ProfileRow = Record<string, any>;
type TeamRow = Record<string, any>;

/** Builds two-letter initials the same way the UI has always done it. */
export function initialsOf(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return (name || '').trim().slice(0, 2) || 'מש';
}

/* ------------------------------- quotes ------------------------------- */

function rowToQuote(r: QuoteRow): Quote {
  return {
    id: r.id,
    shareToken: r.share_token,
    client: r.client || '',
    initials: r.initials || '',
    date: r.quote_date || '',
    kind: r.kind || '',
    status: r.status,
    cost: r.cost || '',
    rawCost: r.raw_cost == null ? undefined : Number(r.raw_cost),
    mandays: r.mandays == null ? undefined : Number(r.mandays),
    components: (r.components as ScopeComponent[]) || [],
    customRequirements: (r.custom_requirements as string[]) || [],
    summaryText: r.summary_text || undefined,
    templateName: r.template_name || undefined,
    environment: r.environment || undefined,
    testType: r.test_type || undefined,
    complexity: r.complexity || undefined,
    targetSystem: r.target_system || undefined,
    scopeDetails: r.scope_details || undefined,
    organizationName: r.organization_name || undefined,
    authorName: r.author_name || undefined,
    authorEmail: r.author_email || undefined,
    hpNumber: r.hp_number || undefined,
    bankAccountNumber: r.bank_account_number || undefined,
    bankNumber: r.bank_number || undefined,
    branchNumber: r.branch_number || undefined,
    beneficiaryName: r.beneficiary_name || undefined,
    paymentMethod: r.payment_method || undefined,
    quoteNotes: r.quote_notes || undefined,
    createdAt: r.created_at || undefined,
    updatedAt: r.updated_at || undefined,
  };
}

/** Maps a Quote to a row. `id` is deliberately omitted — the DB owns it. */
function quoteToRow(q: Quote, userId: string): QuoteRow {
  return {
    user_id: userId,
    client: q.client || '',
    initials: q.initials || '',
    quote_date: q.date || '',
    kind: q.kind || '',
    status: q.status,
    cost: q.cost || '',
    raw_cost: q.rawCost ?? null,
    mandays: q.mandays ?? null,
    components: q.components || [],
    custom_requirements: q.customRequirements || [],
    summary_text: q.summaryText ?? null,
    template_name: q.templateName ?? null,
    environment: q.environment ?? null,
    test_type: q.testType ?? null,
    complexity: q.complexity ?? null,
    target_system: q.targetSystem ?? null,
    scope_details: q.scopeDetails ?? null,
    organization_name: q.organizationName ?? null,
    author_name: q.authorName ?? null,
    author_email: q.authorEmail ?? null,
    hp_number: q.hpNumber ?? null,
    bank_account_number: q.bankAccountNumber ?? null,
    bank_number: q.bankNumber ?? null,
    branch_number: q.branchNumber ?? null,
    beneficiary_name: q.beneficiaryName ?? null,
    payment_method: q.paymentMethod ?? null,
    quote_notes: q.quoteNotes ?? null,
  };
}

export async function fetchQuotes(userId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToQuote);
}

/**
 * Inserts a new quote, or updates it when `quote.id` is already a row this
 * user owns. The wizard reuses one Quote object for both paths.
 */
export async function saveQuote(quote: Quote, userId: string): Promise<Quote> {
  const row = quoteToRow(quote, userId);
  const looksPersisted = isUuid(quote.id);

  if (looksPersisted) {
    // user_id and share_token are not updatable (column privileges are revoked
    // so a shared editor cannot take ownership), so they are dropped here.
    const { user_id: _ownerId, ...updatable } = row;
    const { data, error } = await supabase
      .from('quotes')
      .update(updatable)
      .eq('id', quote.id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) return rowToQuote(data);
    // Row vanished (deleted elsewhere) — fall through and re-insert it.
  }

  const { data, error } = await supabase.from('quotes').insert(row).select().single();
  if (error) throw error;
  return rowToQuote(data);
}

export async function updateQuoteFields(
  quoteId: string,
  userId: string,
  patch: Partial<Quote>
): Promise<Quote> {
  const row: QuoteRow = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.client !== undefined) row.client = patch.client;
  if (patch.cost !== undefined) row.cost = patch.cost;
  if (patch.rawCost !== undefined) row.raw_cost = patch.rawCost;
  if (patch.hpNumber !== undefined) row.hp_number = patch.hpNumber;
  if (patch.bankAccountNumber !== undefined) row.bank_account_number = patch.bankAccountNumber;
  if (patch.bankNumber !== undefined) row.bank_number = patch.bankNumber;
  if (patch.branchNumber !== undefined) row.branch_number = patch.branchNumber;
  if (patch.beneficiaryName !== undefined) row.beneficiary_name = patch.beneficiaryName;
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
  if (patch.quoteNotes !== undefined) row.quote_notes = patch.quoteNotes;

  const { data, error } = await supabase
    .from('quotes')
    .update(row)
    .eq('id', quoteId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return rowToQuote(data);
}

export async function deleteQuote(quoteId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('quotes').delete().eq('id', quoteId).eq('user_id', userId);
  if (error) throw error;
}

/** Resolves a client-facing proposal link. Works without being signed in. */
export async function fetchSharedQuote(token: string): Promise<Quote | null> {
  if (!isUuid(token)) return null;
  const { data, error } = await supabase.rpc('get_shared_quote', { token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? rowToQuote(row) : null;
}

/**
 * Approves a proposal from the client-facing link. The visitor has no session,
 * so this goes through a token-scoped function rather than a table write.
 */
export async function approveSharedQuote(token: string): Promise<Quote | null> {
  if (!isUuid(token)) return null;
  const { data, error } = await supabase.rpc('approve_shared_quote', { token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? rowToQuote(row) : null;
}

/* --------------------------- quote sharing --------------------------- */

/** One quote a team member may open, and at what permission. */
export interface QuoteShare {
  quoteId: string;
  canEdit: boolean;
}

/** Shares the owner granted to this team member's email. */
export async function fetchSharesForMember(
  ownerId: string,
  memberEmail: string
): Promise<QuoteShare[]> {
  const { data, error } = await supabase
    .from('quote_shares')
    .select('quote_id, can_edit')
    .eq('owner_id', ownerId)
    .eq('member_email', memberEmail.trim().toLowerCase());
  if (error) throw error;
  return (data || []).map((r: { quote_id: string; can_edit: boolean }) => ({
    quoteId: r.quote_id,
    canEdit: !!r.can_edit,
  }));
}

/** Every share this owner has granted, grouped by member email. */
export async function fetchAllShares(
  ownerId: string
): Promise<Record<string, QuoteShare[]>> {
  const { data, error } = await supabase
    .from('quote_shares')
    .select('quote_id, member_email, can_edit')
    .eq('owner_id', ownerId);
  if (error) throw error;
  const out: Record<string, QuoteShare[]> = {};
  for (const r of (data || []) as {
    quote_id: string;
    member_email: string;
    can_edit: boolean;
  }[]) {
    (out[r.member_email] ||= []).push({ quoteId: r.quote_id, canEdit: !!r.can_edit });
  }
  return out;
}

/**
 * Makes the member's access match `quoteIds` exactly — grants what is new and
 * revokes what was removed, so unchecking a box actually takes access away.
 */
export async function setSharesForMember(
  ownerId: string,
  memberEmail: string,
  shares: QuoteShare[]
): Promise<void> {
  const email = memberEmail.trim().toLowerCase();
  if (!email) return;

  const wanted = shares.filter((sh) => isUuid(sh.quoteId));
  const current = await fetchSharesForMember(ownerId, email);
  const currentIds = current.map((c) => c.quoteId);
  const wantedIds = wanted.map((w) => w.quoteId);

  const toAdd = wanted.filter((w) => !currentIds.includes(w.quoteId));
  const toRemove = currentIds.filter((id) => !wantedIds.includes(id));
  // Same quote, permission flipped between צפייה and עריכה.
  const toFlip = wanted.filter((w) => {
    const existing = current.find((c) => c.quoteId === w.quoteId);
    return existing && existing.canEdit !== w.canEdit;
  });

  if (toAdd.length) {
    const { error } = await supabase.from('quote_shares').insert(
      toAdd.map((sh) => ({
        quote_id: sh.quoteId,
        owner_id: ownerId,
        member_email: email,
        can_edit: sh.canEdit,
      }))
    );
    if (error) throw error;
  }

  for (const sh of toFlip) {
    const { error } = await supabase
      .from('quote_shares')
      .update({ can_edit: sh.canEdit })
      .eq('owner_id', ownerId)
      .eq('member_email', email)
      .eq('quote_id', sh.quoteId);
    if (error) throw error;
  }

  if (toRemove.length) {
    const { error } = await supabase
      .from('quote_shares')
      .delete()
      .eq('owner_id', ownerId)
      .eq('member_email', email)
      .in('quote_id', toRemove);
    if (error) throw error;
  }
}

/**
 * Quotes other people shared with the signed-in user. RLS decides what comes
 * back, so this cannot return anything that was not granted.
 */
export async function fetchQuotesSharedWithMe(myEmail: string): Promise<Quote[]> {
  const email = (myEmail || '').trim().toLowerCase();
  if (!email) return [];

  const { data: shares, error: shareErr } = await supabase
    .from('quote_shares')
    .select('quote_id, can_edit')
    .eq('member_email', email);
  if (shareErr) throw shareErr;

  const rows = (shares || []) as { quote_id: string; can_edit: boolean }[];
  if (!rows.length) return [];

  const editable = new Map(rows.map((r) => [r.quote_id, !!r.can_edit]));
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .in('id', [...editable.keys()]);
  if (error) throw error;
  return (data || []).map(rowToQuote).map((q) => ({
    ...q,
    sharedWithMe: true,
    sharedCanEdit: editable.get(q.id) === true,
  }));
}

/* ------------------------------ profile ------------------------------ */

function rowToUser(r: ProfileRow | TeamRow): UserItem {
  return {
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    organization: r.organization || '',
    role: r.role || '',
    access: (r.access || 'view') as AccessLevel,
    status: (r.status || 'active') as UserItem['status'],
    initials: r.initials || initialsOf(r.name || ''),
    avatar: r.avatar || 'linear-gradient(140deg, #2563eb, #22d3ee)',
    gender: r.gender || undefined,
    joined: r.joined || new Date(r.created_at || Date.now()).toLocaleDateString('he-IL'),
    hpNumber: r.hp_number || undefined,
    bankAccountNumber: r.bank_account_number || undefined,
    bankNumber: r.bank_number || undefined,
    branchNumber: r.branch_number || undefined,
    beneficiaryName: r.beneficiary_name || undefined,
    paymentMethod: r.payment_method || undefined,
    quoteNotes: r.quote_notes || undefined,
    dailyRate: r.daily_rate == null ? undefined : Number(r.daily_rate),
  };
}

export async function fetchProfile(userId: string): Promise<UserItem | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? rowToUser(data) : null;
}

/**
 * Creates the profile row if the signup trigger has not landed yet.
 * Safe to call repeatedly — it only fills in a missing row.
 */
export async function ensureProfile(
  userId: string,
  seed: { email: string; name?: string; organization?: string }
): Promise<UserItem> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const name = seed.name?.trim() || seed.email.split('@')[0];
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name,
      email: seed.email,
      organization: seed.organization || '',
      initials: initialsOf(name),
    })
    .select()
    .single();
  if (error) throw error;
  return rowToUser(data);
}

export async function updateProfile(userId: string, patch: Partial<UserItem>): Promise<UserItem> {
  const row: ProfileRow = {};
  if (patch.name !== undefined) {
    row.name = patch.name;
    row.initials = patch.initials || initialsOf(patch.name);
  }
  if (patch.initials !== undefined) row.initials = patch.initials;
  if (patch.organization !== undefined) row.organization = patch.organization;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.access !== undefined) row.access = patch.access;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.gender !== undefined) row.gender = patch.gender;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.hpNumber !== undefined) row.hp_number = patch.hpNumber;
  if (patch.bankAccountNumber !== undefined) row.bank_account_number = patch.bankAccountNumber;
  if (patch.bankNumber !== undefined) row.bank_number = patch.bankNumber;
  if (patch.branchNumber !== undefined) row.branch_number = patch.branchNumber;
  if (patch.beneficiaryName !== undefined) row.beneficiary_name = patch.beneficiaryName;
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
  if (patch.quoteNotes !== undefined) row.quote_notes = patch.quoteNotes;
  if (patch.dailyRate !== undefined) row.daily_rate = patch.dailyRate;

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return rowToUser(data);
}

/* ---------------------------- team members ---------------------------- */

export async function fetchTeam(ownerId: string): Promise<UserItem[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToUser);
}

export async function addTeamMember(
  ownerId: string,
  member: Omit<UserItem, 'id' | 'initials' | 'avatar' | 'joined'>
): Promise<UserItem> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      owner_id: ownerId,
      name: member.name,
      email: member.email,
      organization: member.organization,
      role: member.role,
      access: member.access,
      status: member.status,
      gender: member.gender ?? null,
      initials: initialsOf(member.name),
      joined: new Date().toLocaleDateString('he-IL'),
      hp_number: member.hpNumber ?? null,
      bank_account_number: member.bankAccountNumber ?? null,
      bank_number: member.bankNumber ?? null,
      branch_number: member.branchNumber ?? null,
      beneficiary_name: member.beneficiaryName ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToUser(data);
}

export async function updateTeamMember(
  ownerId: string,
  id: string,
  patch: Partial<UserItem>
): Promise<UserItem> {
  const row: TeamRow = {};
  if (patch.name !== undefined) {
    row.name = patch.name;
    row.initials = patch.initials || initialsOf(patch.name);
  }
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.organization !== undefined) row.organization = patch.organization;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.access !== undefined) row.access = patch.access;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.gender !== undefined) row.gender = patch.gender;
  if (patch.hpNumber !== undefined) row.hp_number = patch.hpNumber;
  if (patch.bankAccountNumber !== undefined) row.bank_account_number = patch.bankAccountNumber;
  if (patch.bankNumber !== undefined) row.bank_number = patch.bankNumber;
  if (patch.branchNumber !== undefined) row.branch_number = patch.branchNumber;
  if (patch.beneficiaryName !== undefined) row.beneficiary_name = patch.beneficiaryName;

  const { data, error } = await supabase
    .from('team_members')
    .update(row)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select()
    .single();
  if (error) throw error;
  return rowToUser(data);
}

export async function deleteTeamMember(ownerId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);
  if (error) throw error;
}

/* ------------------------------- helpers ------------------------------ */

export function isUuid(value: string | undefined | null): boolean {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Copies the account's billing details onto quotes the user picked, so a
 * corrected bank number can be pushed onto proposals already drafted.
 */
export async function applyBillingToQuotes(
  userId: string,
  quoteIds: string[],
  billing: Partial<UserItem>
): Promise<Quote[]> {
  if (quoteIds.length === 0) return [];

  const { data, error } = await supabase
    .from('quotes')
    .update({
      hp_number: billing.hpNumber ?? null,
      bank_account_number: billing.bankAccountNumber ?? null,
      bank_number: billing.bankNumber ?? null,
      branch_number: billing.branchNumber ?? null,
      beneficiary_name: billing.beneficiaryName ?? null,
      payment_method: billing.paymentMethod ?? null,
      quote_notes: billing.quoteNotes ?? null,
    })
    .in('id', quoteIds)
    .eq('user_id', userId)
    .select();
  if (error) throw error;
  return (data || []).map(rowToQuote);
}
