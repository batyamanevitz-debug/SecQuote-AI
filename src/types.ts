export type ViewMode = 'auth' | 'dashboard' | 'wizard' | 'users' | 'market' | 'sow_doc';

export type QuoteStatus = 'טיוטה' | 'נשלח' | 'אושר';

export interface ScopeComponent {
  name: string;
  md: number;
  desc: string;
  isCustom?: boolean;
}

export interface Quote {
  id: string;
  /** Secret token behind the public client link (?doc=<shareToken>). */
  shareToken?: string;
  client: string;
  initials: string;
  date: string;
  kind: string;
  status: QuoteStatus;
  cost: string;
  rawCost?: number;
  mandays?: number;
  components?: ScopeComponent[];
  customRequirements?: string[];
  summaryText?: string;
  templateName?: string;
  environment?: string;
  testType?: string;
  complexity?: string;
  targetSystem?: string;
  scopeDetails?: {
    environment?: string;
    roles?: string;
    endpointsOrIps?: string;
    attackVectors?: string;
    testingHours?: string;
    criticalSystems?: string;
  };
  organizationName?: string;
  authorName?: string;
  authorEmail?: string;
  hpNumber?: string;
  bankAccountNumber?: string;
  bankNumber?: string;
  branchNumber?: string;
  beneficiaryName?: string;
  paymentMethod?: string;
  /** Free text the user asked to append to this proposal. */
  quoteNotes?: string;
  /** True when this quote belongs to someone else and was shared with me. */
  sharedWithMe?: boolean;
  /** For a shared quote: whether the owner granted edit rights. */
  sharedCanEdit?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp?: string;
  options?: string[];
  isStructuredProposal?: boolean;
  proposalData?: {
    summary: string;
    components: ScopeComponent[];
    totalMd: number;
    totalCost: number;
  };
}

export type AccessLevel = 'view' | 'edit' | 'admin';

export interface UserItem {
  /** uuid — the auth user id for the account owner, or the row id of a team member. */
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  access: AccessLevel;
  joined: string;
  status: 'active' | 'suspended';
  initials: string;
  avatar: string;
  gender?: 'male' | 'female';
  hpNumber?: string;
  bankAccountNumber?: string;
  bankNumber?: string;
  branchNumber?: string;
  beneficiaryName?: string;
  paymentMethod?: string;
  /** Free text appended to proposals this user produces. */
  quoteNotes?: string;
  /** Daily rate (MD) set in market settings; prices every quote. */
  dailyRate?: number;
}

export interface MarketTier {
  name: string;
  years: string;
  avg: number;
  lo: number;
  hi: number;
  rangeText: string;
}

export interface ProjectTemplate {
  key: 'mvp' | 'fintech' | 'core' | 'mobile';
  name: string;
  desc: string;
  md: string;
  q: string;
  bench: string;
  spark: number[];
  includes: string[];
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  // Step 1
  staging: boolean;
  testType: 'Blackbox' | 'Greybox' | 'Whitebox';
  complexity: 'פשוטה' | 'בינונית' | 'מורכבת';
  category: 'infra' | 'app' | 'red' | 'mobile';
  // Step 2
  templateKey: 'mvp' | 'fintech' | 'core' | 'mobile';
  // Step 3
  chatStep: number;
  answers: string[];
  mandays: number;
  // Step 4
  clientName: string;
  sent: boolean;
}
