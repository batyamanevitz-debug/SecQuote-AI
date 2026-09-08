import React, { useState, useRef, useEffect } from 'react';
import {
  Server,
  Globe,
  Flame,
  Smartphone,
  Check,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Send,
  Copy,
  MessageCircle,
  Mail,
  Download,
  FileText,
  Clock,
  Sparkles,
  Rocket,
  ShieldAlert,
  Building2,
  Loader2,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Quote, ProjectTemplate, ScopeComponent, ChatMessage, UserItem } from '../types';
import {
  CATEGORIES_DATA,
  TEST_TYPES,
  COMPLEXITY_LEVELS,
  PROJECT_TEMPLATES,
  getOrgFinancialDetails,
} from '../data/mockData';
import {
  getInitialAiGreeting,
  sendScopingMessage,
} from '../services/aiScopingService';
import { exportElementToPdf } from '../utils/pdfExport';
import { exportToWord } from '../utils/exportWord';
import { ElixSowDocument } from '../components/ElixSowDocument';

interface WizardViewProps {
  initialQuote?: Quote | null;
  onFinishWizard: (newQuote: Quote) => void;
  /** Saves without leaving the wizard; resolves to the persisted quote. */
  onSaveQuote?: (quote: Quote) => Promise<Quote | null>;
  /** Only used to populate the notification bell in the header. */
  quotes?: Quote[];
  onViewSowDocument: (quote: Quote) => void;
  onCancel: () => void;
  currentUser?: UserItem | null;
}

export const WizardView: React.FC<WizardViewProps> = ({
  initialQuote,
  onFinishWizard,
  onSaveQuote,
  quotes = [],
  onViewSowDocument,
  onCancel,
  currentUser,
}) => {
  // Resolve dynamic organization & financial details
  const rawOrg = initialQuote?.organizationName || currentUser?.organization || 'ELIX SYSTEMS';
  const fin = getOrgFinancialDetails(rawOrg, currentUser);
  const displayOrgName = fin.organization;

  const authorName = initialQuote?.authorName || fin.authorName;
  const authorEmail = initialQuote?.authorEmail || fin.authorEmail;
  const authorPhone = fin.authorPhone;
  const hpNumber = initialQuote?.hpNumber || fin.hpNumber;
  const bankAccountNumber = initialQuote?.bankAccountNumber || fin.bankAccountNumber;
  const bankNumber = initialQuote?.bankNumber || fin.bankNumber;
  const branchNumber = initialQuote?.branchNumber || fin.branchNumber;
  const beneficiaryName = initialQuote?.beneficiaryName || fin.beneficiaryName;
  // Set once in the personal area, copied onto every quote produced here.
  const paymentMethod = initialQuote?.paymentMethod || currentUser?.paymentMethod || 'העברה בנקאית';
  const quoteNotes = initialQuote?.quoteNotes ?? currentUser?.quoteNotes ?? '';

  // Derive initials and avatar for user chat bubble matching logged-in user
  const chatUserInitials =
    currentUser?.initials ||
    (currentUser?.name
      ? (() => {
          const parts = currentUser.name.trim().split(/\s+/);
          return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
        })()
      : 'דכ');
  const chatUserAvatar = currentUser?.avatar || 'linear-gradient(135deg, #1d4ed8, #22d3ee)';
  // Helper to map quote category string to key
  const getInitialCategoryKey = (kind?: string): 'infra' | 'app' | 'red' | 'mobile' => {
    if (!kind) return 'infra';
    if (kind.includes('תשתית') || kind.includes('רשת')) return 'infra';
    if (kind.includes('אפליקצי') || kind.includes('Web') || kind.includes('יישום')) return 'app';
    if (kind.includes('אדום') || kind.includes('Red Team') || kind.includes('תקיפה')) return 'red';
    if (kind.includes('מובייל') || kind.includes('Mobile') || kind.includes('טלפון')) return 'mobile';
    return 'infra';
  };

  const isEditing = !!initialQuote;

  // Wizard Steps - if editing, start at step 1 with all filled values and a notice
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State
  const [staging, setStaging] = useState<boolean>(
    initialQuote ? initialQuote.environment === 'Staging' : true
  );
  const [testType, setTestType] = useState<'Blackbox' | 'Greybox' | 'Whitebox'>(
    initialQuote?.testType || 'Blackbox'
  );
  const [testDropdownOpen, setTestDropdownOpen] = useState<boolean>(false);
  const [complexity, setComplexity] = useState<'פשוטה' | 'בינונית' | 'מורכבת'>(
    initialQuote?.complexity || 'בינונית'
  );
  const [selectedCategory, setSelectedCategory] = useState<'infra' | 'app' | 'red' | 'mobile'>(() =>
    getInitialCategoryKey(initialQuote?.kind)
  );
  const [draftToast, setDraftToast] = useState(false);

  // Step 2 State
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'mvp' | 'fintech' | 'core' | 'mobile'>(() => {
    if (initialQuote?.templateName) {
      const match = PROJECT_TEMPLATES.find((t) => t.name.includes(initialQuote.templateName!));
      if (match) return match.key;
    }
    return getInitialCategoryKey(initialQuote?.kind) === 'mobile' ? 'mobile' : 'mvp';
  });

  // Step 3 State (AI Scoping Engine)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isScopingComplete, setIsScopingComplete] = useState<boolean>(false);
  const [customRequirements, setCustomRequirements] = useState<string[]>(
    initialQuote?.customRequirements || []
  );
  const [scopeComponents, setScopeComponents] = useState<ScopeComponent[]>(
    initialQuote?.components || []
  );
  const [currentMandays, setCurrentMandays] = useState<number>(
    initialQuote?.mandays || 5
  );
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Step 4 State
  // Filled from the chat: question 1 asks who the quote is for.
  // Once saved, the row's real id/token replace the draft ones so a second
  // save updates the same quote instead of inserting a duplicate.
  const [persistedId, setPersistedId] = useState<string | null>(initialQuote?.id || null);
  const [persistedToken, setPersistedToken] = useState<string | null>(
    initialQuote?.shareToken || null
  );
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [clientName, setClientName] = useState<string>(initialQuote?.client || '');
  const [targetSystem, setTargetSystem] = useState<string>(initialQuote?.targetSystem || '');
  const [scopeDetails, setScopeDetails] = useState<{
    environment?: string;
    roles?: string;
    endpointsOrIps?: string;
    attackVectors?: string;
    testingHours?: string;
    criticalSystems?: string;
  }>(initialQuote?.scopeDetails || {});
  const [isSent, setIsSent] = useState<boolean>(
    initialQuote?.status === 'נשלח' || initialQuote?.status === 'אושר'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewPage, setPreviewPage] = useState<number>(0); // 0 = all pages, 1..5 = specific page
  const documentPreviewRef = useRef<HTMLDivElement | null>(null);
  const fullDocumentExportRef = useRef<HTMLDivElement | null>(null);

  // Set by the user in market settings; no longer a constant.
  const dailyRate = currentUser?.dailyRate ?? 4500;

  const selectedTemplate =
    PROJECT_TEMPLATES.find((t) => t.key === selectedTemplateKey) ||
    PROJECT_TEMPLATES[0];

  const currentTotalCost = currentMandays * dailyRate;
  const nis = (n: number) => '₪' + n.toLocaleString('en-US');

  // Initialize or re-initialize AI conversation when entering Step 3
  useEffect(() => {
    if (step === 3 && chatMessages.length === 0) {
      const greeting = getInitialAiGreeting(
        {
          categoryKey: selectedCategory,
          categoryName: CATEGORIES_DATA.find((c) => c.key === selectedCategory)?.name || 'מבדק חוסן',
          staging,
          testType,
          complexity,
        },
        selectedTemplate,
        dailyRate
      );
      setScopeComponents(greeting.components);
      setCurrentMandays(greeting.baseMd);
      setChatMessages([
        {
          id: 'm-init',
          role: 'ai',
          text: greeting.message,
          options: greeting.options,
        },
      ]);
    }
  }, [step, selectedCategory, staging, testType, complexity, selectedTemplateKey]);

  // Auto-scroll chat without displacing the outer page
  useEffect(() => {
    if (step === 3 && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isAiThinking, step]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isAiThinking) return;
    const userText = textToSend.trim();
    const userMsgId = `m-user-${Date.now()}`;
    const updatedMessages: ChatMessage[] = [
      ...chatMessages,
      { id: userMsgId, role: 'user', text: userText },
    ];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAiThinking(true);

    const history = updatedMessages.map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await sendScopingMessage({
        config: {
          categoryKey: selectedCategory,
          categoryName: CATEGORIES_DATA.find((c) => c.key === selectedCategory)?.name || 'מבדק חוסן',
          staging,
          testType,
          complexity,
        },
        template: selectedTemplate,
        chatHistory: history,
        userMessage: userText,
        currentMandays,
        currentComponents: scopeComponents,
        customRequirements,
        dailyRate,
      });

      if (res.detectedClientName) {
        setClientName(res.detectedClientName);
      }
      if (res.detectedTargetSystem) {
        setTargetSystem(res.detectedTargetSystem);
      }
      if (res.scopeDetails) {
        setScopeDetails((prev) => ({ ...prev, ...res.scopeDetails }));
      }
      if (res.newCustomRequirement && !customRequirements.includes(res.newCustomRequirement)) {
        setCustomRequirements((prev) => [...prev, res.newCustomRequirement!]);
      }
      if (res.totalMandays) {
        setCurrentMandays(res.totalMandays);
      }
      if (res.proposal?.components && res.proposal.components.length > 0) {
        setScopeComponents(res.proposal.components);
      }
      if (res.isComplete) {
        setIsScopingComplete(true);
      }

      const aiMsgText = res.nextQuestion
        ? `${res.aiMessage}\n\n${res.nextQuestion}`
        : res.aiMessage;

      setChatMessages((prev) => [
        ...prev,
        {
          id: `m-ai-${Date.now()}`,
          role: 'ai',
          text: aiMsgText,
          options: res.options,
          isStructuredProposal: res.isComplete,
          proposalData: res.proposal,
        },
      ]);
    } catch (err) {
      console.error('Failed to process scoping message:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  /**
   * Saves the work-in-progress as a real draft. Until the client is named in
   * step 4 the quote is stored under a placeholder name the user can edit.
   */
  const handleSaveDraft = () => {
    setDraftToast(true);
    setTimeout(() => setDraftToast(false), 2200);
    onFinishWizard(buildQuote({ asDraft: true }));
  };

  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  const handleDownloadWord = async () => {
    setIsGeneratingWord(true);
    try {
      await exportToWord({
        clientName,
        categoryName: selectedCategoryName,
        testType,
        staging,
        complexity,
        mandays: currentMandays,
        totalCost: currentTotalCost,
        dailyRate,
        components: scopeComponents,
        targetSystem,
        customRequirements,
        scopeDetails,
        organizationName: displayOrgName,
        authorName,
        authorEmail,
        authorPhone,
        hpNumber,
        bankAccountNumber,
        bankNumber,
        branchNumber,
        beneficiaryName,
      });
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleDownloadPdf = async () => {
    const target = fullDocumentExportRef.current || documentPreviewRef.current;
    if (!target) return;
    setIsGeneratingPdf(true);
    try {
      await exportElementToPdf(
        target,
        `SOW_${clientName.replace(/\s+/g, '_')}_${displayOrgName.replace(/\s+/g, '')}.pdf`,
        {
          scale: 2.5,
          backgroundColor: '#ffffff',
        }
      );
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const selectedCategoryName =
    CATEGORIES_DATA.find((c) => c.key === selectedCategory)?.name || 'מבדק חוסן';

  const buildQuote = ({ asDraft = false }: { asDraft?: boolean } = {}): Quote => {
    const quoteId = persistedId || initialQuote?.id || `new-${Date.now()}`;
    const quoteDate = initialQuote?.date || new Date().toLocaleDateString('he-IL');
    const resolvedClient = clientName.trim() || 'טיוטה ללא שם לקוח';
    return {
      id: quoteId,
      shareToken: persistedToken || initialQuote?.shareToken,
      client: resolvedClient,
      initials: resolvedClient.slice(0, 2),
      date: quoteDate,
      kind: selectedCategoryName,
      status: asDraft ? 'טיוטה' : isSent ? 'נשלח' : (initialQuote?.status || 'טיוטה'),
      cost: nis(currentTotalCost),
      rawCost: currentTotalCost,
      mandays: currentMandays,
      components: scopeComponents,
      customRequirements: customRequirements,
      summaryText: `מבדק ${selectedCategoryName} במודל ${testType} על גבי ${
        staging ? 'סביבת Staging' : 'סביבת Production'
      }, ברמת מורכבות ${complexity}, מותאם לתבנית ${selectedTemplate.name}.`,
      templateName: selectedTemplate.name,
      environment: staging ? 'Staging' : 'Production',
      testType: testType,
      complexity: complexity,
      targetSystem: targetSystem,
      scopeDetails: scopeDetails,
      organizationName: displayOrgName,
      authorName: authorName,
      authorEmail: authorEmail,
      hpNumber: hpNumber,
      bankAccountNumber: bankAccountNumber,
      bankNumber: bankNumber,
      branchNumber: branchNumber,
      beneficiaryName: beneficiaryName,
      paymentMethod: paymentMethod,
      quoteNotes: quoteNotes,
    };
  };

  const handleFinish = () => {
    onFinishWizard(buildQuote());
  };

  /** Persists the quote and keeps the user on the summary step. */
  const saveQuoteNow = async (): Promise<Quote | null> => {
    if (!onSaveQuote) return null;
    setIsSavingQuote(true);
    try {
      const saved = await onSaveQuote(buildQuote());
      if (saved) {
        setPersistedId(saved.id);
        if (saved.shareToken) setPersistedToken(saved.shareToken);
      }
      return saved;
    } finally {
      setIsSavingQuote(false);
    }
  };

  /** The quote must exist before it can be shared — it needs a share token. */
  const buildClientLink = (q: Quote | null): string | null => {
    const token = q?.shareToken || persistedToken;
    if (!token) return null;
    return `${window.location.origin}${window.location.pathname}?doc=${encodeURIComponent(token)}&public=true`;
  };

  const clientMessage = (link: string) =>
    `שלום ${clientName || 'לקוח יקר'},\nמצורפת הצעת המחיר ומפרט העבודה (SOW) מאת ${displayOrgName} עבור ${selectedCategoryName}:\n• היקף: ${currentMandays} ימי עבודה\n• עלות כוללת: ${nis(currentTotalCost)}\n• איש קשר: ${authorName}\n\nלצפייה במסמך המלא ובאישור דיגיטלי:\n${link}`;

  const handleOpenShare = async () => {
    const saved = await saveQuoteNow();
    if (!saved && !persistedToken) return;
    setShareMenuOpen(true);
  };

  const withLink = async (use: (link: string) => void) => {
    const saved = persistedToken ? null : await saveQuoteNow();
    const link = buildClientLink(saved);
    if (!link) return;
    use(link);
  };

  const stepsHeader = [
    { n: '1', label: 'סוג ותצורה' },
    { n: '2', label: 'תבנית אפיון' },
    { n: '3', label: "צ'אט אפיון" },
    { n: '4', label: 'סיכום ושליחה' },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
      {/* Pinned Top Header */}
      <div className="flex-none px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-[#080d1c]/90 backdrop-blur-xl border-b border-[#7dd3fc]/15 z-20">
        <Header
          title={isEditing ? `עריכת הצעת מחיר - ${initialQuote.client}` : 'אשף יצירת הצעת מחיר'}
          subtitle={`שלב ${step} מתוך 4 · ${stepsHeader[step - 1].label}${isEditing ? ' · במצב עריכה' : ''}`}
          currentUser={currentUser}
          quotes={quotes}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto pb-28 lg:pb-8">
        {/* Stepper Navigation */}
      <div className="flex items-start my-4 sm:my-6 px-1 max-w-2xl mx-auto w-full">
        {stepsHeader.map((s, i) => {
          const stepNumber = i + 1;
          const isActive = step === stepNumber;
          const isDone = step > stepNumber;
          const isLast = i === stepsHeader.length - 1;

          return (
            <div
              key={s.n}
              className={`flex items-start ${isLast ? 'flex-none' : 'flex-1'} min-w-0`}
            >
              <div
                onClick={() => setStep(stepNumber as any)}
                className="flex flex-col items-center gap-1.5 sm:gap-2 flex-1 max-w-[80px] sm:max-w-[100px] cursor-pointer hover:opacity-90 transition-opacity"
              >
                <span
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold border transition-all duration-300 ${
                    isActive
                      ? 'text-[#04121f] bg-gradient-to-br from-[#2563eb] to-[#22d3ee] border-[#22d3ee] shadow-[0_0_22px_-2px_#22d3ee]'
                      : isDone
                      ? 'text-[#67e8f9] bg-[#22d3ee]/15 border-[#22d3ee]/40'
                      : 'text-[#cbe1ff]/60 bg-white/[0.04] border-[#7dd3fc]/20'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : s.n}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-semibold text-center leading-tight transition-colors truncate w-full ${
                    isActive
                      ? 'text-[#eaf9ff]'
                      : isDone
                      ? 'text-[#cbe1ff]/80'
                      : 'text-[#cbe1ff]/45'
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {!isLast && (
                <span
                  className={`flex-1 min-w-1.5 sm:min-w-3 h-[2.5px] sm:h-[3px] rounded-full mt-3 sm:mt-4 transition-all duration-300 ${
                    isDone
                      ? 'bg-gradient-to-l from-[#22d3ee] to-[#2563eb]'
                      : 'bg-[#7dd3fc]/15'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Mode Notice Banner */}
      {isEditing && (
        <div className="mb-4 p-3 sm:p-4 rounded-2xl bg-[#09152b] border border-[#38bdf8]/40 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_20px_rgba(2,132,199,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] flex-none">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#f2f8ff] flex items-center gap-2 flex-wrap">
                <span>עריכת הצעת מחיר עבור {initialQuote.client}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#7dd3fc] border border-[#38bdf8]/30">
                  {initialQuote.id}
                </span>
              </div>
              <p className="text-[11px] text-[#cbe1ff]/65 mt-0.5">
                כל הנתונים הקיימים נטענו. באפשרותך לעדכן את התצורה, היקף הימים, הפירוט או לקפוץ ישירות לסיכום.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] hover:brightness-110 transition-all active:scale-95 shadow-sm"
            >
              קפוץ ישירות לסיכום (שלב 4)
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold text-[#cbe1ff]/70 hover:text-white hover:bg-white/10 transition-all"
            >
              ביטול עריכה
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: סוג ותצורה */}
      {step === 1 && (
        <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-4 mt-2">
          {/* Base Configuration Card */}
          <section className="flex-1 min-w-0 w-full flex flex-col p-4 sm:p-6 rounded-3xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#172a48]/90 to-[#0a1224]/90 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95),0_0_44px_-26px_rgba(34,211,238,0.45)]">
            <h2 className="text-xl font-bold tracking-tight text-[#f2f8ff]">
              תצורת הבסיס
            </h2>
            <p className="mt-1.5 mb-4 text-xs text-[#cbe1ff]/55">
              הגדרות תצורה בסיסיות למבדק החוסן.
            </p>

            {/* Staging Switch */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#7dd3fc]/15 bg-white/[0.035]">
              <div>
                <div className="text-sm font-semibold text-[#eaf4ff]">
                  סביבת Staging
                </div>
                <div className="text-xs text-[#cbe1ff]/50">
                  בדיקה בסביבה מקבילה לייצור
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStaging(!staging)}
                className={`relative w-15 h-8 rounded-full p-1 transition-all duration-200 cursor-pointer ${
                  staging
                    ? 'bg-gradient-to-r from-[#2563eb] to-[#22d3ee] shadow-[0_0_18px_-4px_#22d3ee]'
                    : 'bg-slate-500/30'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${
                    staging ? 'right-8' : 'right-1'
                  }`}
                />
                <span
                  className={`text-[10px] font-black uppercase tracking-wider absolute top-2 ${
                    staging ? 'left-2 text-white' : 'right-2 text-slate-400'
                  }`}
                >
                  {staging ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Test Type Dropdown */}
            <div className="mt-3.5">
              <label className="block text-sm font-semibold text-[#eaf4ff] mb-2">
                סוג בדיקה
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTestDropdownOpen(!testDropdownOpen)}
                  className="w-full h-11.5 px-4 rounded-2xl flex items-center justify-between border border-[#7dd3fc]/25 bg-[#060c1a]/60 text-sm font-semibold text-[#eaf4ff] cursor-pointer hover:border-[#22d3ee] transition-all"
                >
                  <span>{testType}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#7dd3fc] transition-transform duration-200 ${
                      testDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {testDropdownOpen && (
                  <div className="absolute z-20 top-[calc(100%+6px)] inset-x-0 p-1.5 rounded-2xl border border-[#22d3ee]/35 bg-[#091020]/95 backdrop-blur-xl shadow-2xl">
                    {TEST_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTestType(t);
                          setTestDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
                          testType === t
                            ? 'bg-[#22d3ee]/15 text-[#eaf9ff]'
                            : 'text-[#d8eeff]/80 hover:bg-[#7dd3fc]/10'
                        }`}
                      >
                        <span>{t}</span>
                        {testType === t && (
                          <Check className="w-4 h-4 text-[#22d3ee] stroke-[2.5]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Network Complexity */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#eaf4ff] mb-2">
                מורכבות הרשת
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPLEXITY_LEVELS.map((c) => {
                  const isSelected = complexity === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setComplexity(c)}
                      className={`h-9 px-4 rounded-full text-xs font-bold inline-flex items-center gap-2 border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#f2fbff]'
                          : 'border-[#7dd3fc]/20 bg-white/[0.03] text-[#d8eeff]/75 hover:bg-[#7dd3fc]/10'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#22d3ee]' : 'border-[#7dd3fc]/40'
                        }`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
                        )}
                      </span>
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 w-full h-12 rounded-full font-bold text-base text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_16px_36px_-14px_rgba(34,211,238,0.8)] hover:brightness-105 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>המשך לשלב הבא</span>
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </section>

          {/* Test Category Card */}
          <section className="flex-1 min-w-0 w-full flex flex-col p-4 sm:p-6 rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/85 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95)]">
            <h2 className="text-xl font-bold tracking-tight text-[#f2f8ff]">
              קטגוריית המבדק
            </h2>
            <p className="mt-1.5 mb-4 text-xs text-[#cbe1ff]/55">
              בחר את סוג הבדיקה הנדרש.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIES_DATA.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`p-3.5 sm:p-4 rounded-2xl flex flex-col items-center gap-2 text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#22d3ee]/60 bg-[#22d3ee]/10 shadow-[0_0_30px_-12px_rgba(34,211,238,0.5)]'
                        : 'border-[#7dd3fc]/15 bg-white/[0.03] hover:bg-[#7dd3fc]/8'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#22d3ee]/20 text-[#67e8f9]'
                          : cat.key === 'red'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-[#7dd3fc]/10 text-[#9fd4ff]'
                      }`}
                    >
                      {cat.key === 'infra' && <Server className="w-5 h-5" />}
                      {cat.key === 'app' && <Globe className="w-5 h-5" />}
                      {cat.key === 'red' && <Flame className="w-5 h-5" />}
                      {cat.key === 'mobile' && <Smartphone className="w-5 h-5" />}
                    </span>
                    <span className="text-sm font-bold text-[#f2fbff] leading-snug">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-[#cbe1ff]/50 font-medium">
                      {cat.note}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="mt-auto pt-4 self-start text-xs font-semibold text-[#cbe1ff]/70 hover:text-[#bae6fd] inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{draftToast ? '✓ נשמר כטיוטה' : 'שמור כטיוטה'}</span>
            </button>
          </section>
        </div>
      )}

      {/* STEP 2: תבנית אפיון */}
      {step === 2 && (
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#f2f8ff]">
              בחר תבנית פרויקט מהירה
            </h2>
            <p className="mt-1 text-xs text-[#cbe1ff]/55">
              התבנית מגדירה אוטומטית את שאלות ה-AI, היקף ימי העבודה ומדדי השוק להשוואה.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {/* 4 Templates 2x2 */}
            <div className="flex-1 min-w-0 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECT_TEMPLATES.map((t) => {
                const isSelected = selectedTemplateKey === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTemplateKey(t.key)}
                    className={`p-4.5 rounded-2xl flex flex-col gap-2.5 text-right border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#22d3ee]/60 bg-[#22d3ee]/10 shadow-[0_0_32px_-12px_rgba(34,211,238,0.5)] -translate-y-0.5'
                        : 'border-[#7dd3fc]/15 bg-white/[0.03] hover:bg-[#7dd3fc]/8'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#22d3ee]/15 text-[#67e8f9]">
                        {t.key === 'mvp' && <Rocket className="w-4.5 h-4.5" />}
                        {t.key === 'fintech' && <ShieldAlert className="w-4.5 h-4.5" />}
                        {t.key === 'core' && <Building2 className="w-4.5 h-4.5" />}
                        {t.key === 'mobile' && <Smartphone className="w-4.5 h-4.5" />}
                      </span>
                      {isSelected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22d3ee]/20 text-[#67e8f9]">
                          נבחר
                        </span>
                      )}
                    </div>
                    <div className="text-base font-extrabold text-[#f2fbff]">
                      {t.name}
                    </div>
                    <div className="text-xs text-[#cbe1ff]/60 leading-relaxed">
                      {t.desc}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#7dd3fc]/10 border border-[#7dd3fc]/15 text-[#d8eeff]">
                        {t.md}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#7dd3fc]/10 border border-[#7dd3fc]/15 text-[#d8eeff]">
                        {t.q}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Template Breakdown Side Card */}
            <aside className="w-full lg:w-80 flex-none flex flex-col gap-3 p-4 sm:p-5 rounded-3xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#172a48]/90 to-[#0a1224]/90 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95),0_0_44px_-26px_rgba(34,211,238,0.45)]">
              <div>
                <h3 className="text-base font-extrabold text-[#f2f8ff]">
                  מה התבנית כוללת?
                </h3>
                <p className="mt-0.5 text-xs text-[#cbe1ff]/55">
                  {selectedTemplate.name}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {selectedTemplate.includes.map((inc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs leading-relaxed text-[#d8eeff]/85"
                  >
                    <Check className="w-3.5 h-3.5 text-[#22d3ee] flex-none mt-0.5" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2.5 rounded-xl border border-[#7dd3fc]/15 bg-[#060c1a]/50 text-center">
                  <div className="text-[11px] text-[#cbe1ff]/55">היקף מוערך</div>
                  <div className="text-base font-extrabold text-[#f6fbff] font-mono">
                    {selectedTemplate.md}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-[#7dd3fc]/15 bg-[#060c1a]/50 text-center">
                  <div className="text-[11px] text-[#cbe1ff]/55">שאלות AI</div>
                  <div className="text-base font-extrabold text-[#f6fbff] font-mono">
                    {selectedTemplate.q}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#7dd3fc]/15 bg-[#060c1a]/50">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[#cbe1ff]/60">מדדי שוק נלווים</span>
                  <span className="font-bold text-[#67e8f9] font-mono">
                    {selectedTemplate.bench}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 px-5 rounded-full text-sm font-semibold text-[#d6e6f7] border border-slate-400/35 bg-slate-400/15 hover:bg-slate-400/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>הקודם</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="h-12 px-6 rounded-full font-bold text-sm text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_16px_36px_-14px_rgba(34,211,238,0.8)] hover:brightness-105 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>המשך לשלב הבא</span>
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: צ'אט אפיון AI */}
      {step === 3 && (
        <div className="flex-1 flex flex-col gap-4 pb-8">
          {/* Active Config Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-[#7dd3fc]/15">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#cbe1ff]/60">הגדרות שנבחרו:</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#22d3ee]/15 text-[#7dd3fc] border border-[#22d3ee]/30">
                {selectedCategoryName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {staging ? 'Staging' : 'Production'} · {testType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                תבנית: {selectedTemplate.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                מורכבות: {complexity}
              </span>
            </div>
            {customRequirements.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <span>דגשים אישיים:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[11px] font-bold">
                  {customRequirements.length} נוספו
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-4 min-h-[540px]">
            {/* Live Chat Area */}
            <section className="flex-1 lg:flex-[1.6] min-w-0 w-full min-h-[480px] lg:h-[620px] flex flex-col rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/90 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95)] overflow-hidden">
              <div className="flex-none flex items-center gap-2.5 p-4 border-b border-[#7dd3fc]/12">
                <span className="w-8 h-8 rounded-xl bg-[#22d3ee]/15 flex items-center justify-center text-[#67e8f9]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-base font-bold text-[#f2f8ff] flex items-center gap-2">
                    <span>עוזר סקופינג SecQuote AI</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22d3ee]/20 text-[#67e8f9] font-mono font-bold">
                      v2.4 Cyber Engine
                    </span>
                  </div>
                  <div className="text-xs text-[#cbe1ff]/60">
                    שאלות טכניות דינמיות, התאמת ימי עבודה (MD) וקליטת דרישות אישיות
                  </div>
                </div>
                <span className="mr-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/15 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live AI
                </span>
              </div>

              {/* Messages container */}
              <div ref={chatContainerRef} className="flex-1 p-4 md:p-5 overflow-y-auto flex flex-col gap-3.5">
                {chatMessages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div
                        key={msg.id}
                        className="flex items-start gap-2.5 max-w-[85%] self-end flex-row-reverse"
                      >
                        <span
                          className="w-7 h-7 rounded-full text-[#04121f] flex items-center justify-center text-xs font-black flex-none shadow-sm"
                          style={{ background: chatUserAvatar }}
                          title={currentUser?.name || 'משתמש'}
                        >
                          {chatUserInitials}
                        </span>
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#22d3ee] text-[#04121f] font-semibold text-sm shadow-md">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  // AI message
                  return (
                    <div key={msg.id} className="flex items-start gap-2.5 max-w-[92%]">
                      <span className="w-7 h-7 rounded-full bg-[#22d3ee]/20 text-[#67e8f9] flex items-center justify-center text-xs font-black flex-none">
                        AI
                      </span>
                      <div className="flex-1 flex flex-col gap-2.5">
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-[#7dd3fc]/15 text-sm text-[#e8f2ff] leading-relaxed whitespace-pre-line">
                          {msg.text}
                        </div>

                        {/* Structured Proposal Card inside chat bubble if complete */}
                        {msg.isStructuredProposal && msg.proposalData && (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#111f38] to-[#0a1324] border-2 border-[#22d3ee]/40 shadow-[0_10px_30px_-10px_rgba(34,211,238,0.3)]">
                            <div className="flex items-center justify-between pb-2.5 border-b border-[#7dd3fc]/20 mb-3">
                              <span className="text-xs font-extrabold text-[#67e8f9] flex items-center gap-1.5 uppercase tracking-wider">
                                ✦ הצעת מחיר וסקופינג סופיים
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold">
                                מוכן לחתימה
                              </span>
                            </div>

                            {/* Scoping Summary */}
                            <div className="mb-3 text-xs text-[#cbe1ff]/80 leading-relaxed">
                              {msg.proposalData.summary}
                            </div>

                            {/* Components Breakdown */}
                            <div className="mb-3">
                              <div className="text-[11px] font-bold text-[#7dd3fc] uppercase mb-1.5">
                                רכיבי הבדיקה (פירוט היקף):
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {msg.proposalData.components.map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-[#7dd3fc]/10 text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-[#f2f8ff]">
                                        {c.name}
                                      </span>
                                      {c.isCustom && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/35">
                                          דגש מיוחד
                                        </span>
                                      )}
                                      <span className="text-[11px] text-[#cbe1ff]/50 hidden sm:inline">
                                        ({c.desc})
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-[#67e8f9]">
                                      {c.md} ימי עבודה (MD)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pricing & MD Summary */}
                            <div className="pt-2.5 border-t border-[#7dd3fc]/20 flex items-center justify-between">
                              <div>
                                <div className="text-[11px] text-[#cbe1ff]/60">
                                  סה"כ ימי עבודה
                                </div>
                                <div className="text-lg font-black text-white font-mono">
                                  {msg.proposalData.totalMandays} ימי אדם (MD)
                                </div>
                              </div>
                              <div className="text-left" dir="ltr">
                                <div className="text-[11px] text-[#cbe1ff]/60 text-right" dir="rtl">
                                  עלות כוללת לפני מע"מ
                                </div>
                                <div className="text-xl font-black text-[#67e8f9] font-mono">
                                  {nis(msg.proposalData.totalCost)}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setStep(4)}
                              className="mt-3.5 w-full h-10 rounded-xl font-bold text-xs text-[#04121f] bg-gradient-to-r from-[#2563eb] to-[#22d3ee] hover:brightness-105 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <span>מעבר לסיכום והפקת הצעת מחיר רשמית (SOW)</span>
                              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* AI Thinking indicator */}
                {isAiThinking && (
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <span className="w-7 h-7 rounded-full bg-[#22d3ee]/20 text-[#67e8f9] flex items-center justify-center text-xs font-black flex-none animate-pulse">
                      AI
                    </span>
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#7dd3fc]/20 flex items-center gap-2 text-xs text-[#67e8f9]">
                      <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-ping" />
                      <span>SecQuote AI מנתח את הדרישות ומעדכן את מודל התמחור וה-MD...</span>
                    </div>
                  </div>
                )}

                {/* Active Question Options Pills */}
                {!isAiThinking &&
                  !isScopingComplete &&
                  chatMessages.length > 0 &&
                  chatMessages[chatMessages.length - 1].role === 'ai' &&
                  chatMessages[chatMessages.length - 1].options &&
                  chatMessages[chatMessages.length - 1].options!.length > 0 && (
                    <div className="flex flex-wrap gap-2 pr-9 mt-1">
                      {chatMessages[chatMessages.length - 1].options!.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSendMessage(opt)}
                          className="h-9 px-4 rounded-full text-xs font-bold text-[#9fd4ff] border border-[#38bdf8]/35 bg-[#38bdf8]/10 hover:bg-[#22d3ee]/20 hover:text-white hover:border-[#22d3ee]/60 transition-all cursor-pointer shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
              </div>

              {/* Chat Input Bar */}
              <div className="flex-none p-3 border-t border-[#7dd3fc]/12 flex flex-col gap-2">
                {!isScopingComplete && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-[#cbe1ff]/50">
                      באפשרותך להקליד כל דרישה מותאמת אישית (למשל: "להוסיף בדיקה מיוחדת לשרת ספציפי")
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('סיים אפיון והפק הצעת מחיר')}
                      className="text-[11px] font-bold text-[#67e8f9] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      הפק הצעת מחיר עכשיו
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatInput.trim() || isAiThinking) return;
                    handleSendMessage(chatInput.trim());
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isAiThinking}
                    placeholder="הקלד תשובה או הוסף דרישות מיוחדות (למשל: 'להוסיף בדיקה מיוחדת לשרת ספציפי')..."
                    className="flex-1 h-11 px-4 rounded-full border border-[#7dd3fc]/20 bg-white/[0.035] text-sm text-[#e8f2ff] outline-none focus:border-[#22d3ee] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isAiThinking || !chatInput.trim()}
                    aria-label="שלח"
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#22d3ee] text-[#04121f] cursor-pointer hover:brightness-105 flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 -scale-x-100" />
                  </button>
                </form>
              </div>
            </section>

            {/* Live Calculator Card */}
            <aside className="w-full lg:w-80 flex-none min-h-[480px] lg:h-[620px] flex flex-col gap-3.5 p-4 sm:p-5 rounded-3xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#172a48]/90 to-[#0a1224]/90 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95),0_0_44px_-26px_rgba(34,211,238,0.45)] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#f2f8ff]">
                    מחשבון חי (Live MD)
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="mt-0.5 text-xs text-[#cbe1ff]/55">
                  מתעדכן בזמן אמת לפי האפיון והצ'אט
                </p>
              </div>

              {/* Main MD Gauge */}
              <div className="p-4 rounded-2xl border border-[#7dd3fc]/20 bg-[#060c1a]/55 text-center">
                <div className="text-xs text-[#cbe1ff]/55">סך ימי אדם (MD) מחושב</div>
                <div className="mt-1 text-4xl font-black text-[#f6fbff] font-mono tracking-tight drop-shadow-[0_0_24px_rgba(34,211,238,0.4)]">
                  {currentMandays}
                </div>
                <div className="text-[11px] text-[#67e8f9] font-medium mt-0.5">
                  ימי עבודה מקצועיים
                </div>
              </div>

              {/* Dynamic Components Breakdown */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-[#cbe1ff]/70">
                  רכיבי היקף בבדיקה:
                </div>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                  {scopeComponents.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-[#7dd3fc]/10 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#e8f2ff] font-medium truncate">
                          {comp.name}
                        </span>
                        {comp.isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300">
                            מיוחד
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-[#67e8f9] flex-none">
                        {comp.md} MD
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Requirements tags if any */}
              {customRequirements.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-400/[0.08] border border-amber-400/25">
                  <div className="text-[11px] font-bold text-amber-300 mb-1">
                    דגשים והתאמות אישיות שנקלטו:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {customRequirements.map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 font-medium"
                      >
                        ✦ {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="pt-2 border-t border-[#7dd3fc]/15 flex flex-col gap-1.5 mt-auto">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-[#cbe1ff]/60">תעריף יומי (MD Rate)</span>
                  <span className="font-bold text-[#eaf4ff] font-mono">
                    {nis(dailyRate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#eaf4ff]">
                    עלות כוללת (לפני מע"מ)
                  </span>
                  <span className="text-2xl font-black text-[#67e8f9] font-mono drop-shadow-[0_0_16px_rgba(34,211,238,0.4)]">
                    {nis(currentTotalCost)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="h-12 rounded-full font-bold text-sm text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_16px_36px_-14px_rgba(34,211,238,0.8)] hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>המשך להפקת הצעת מחיר (SOW)</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            </aside>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-10 px-4 rounded-full text-xs font-semibold text-[#d6e6f7] border border-slate-400/35 bg-slate-400/15 hover:bg-slate-400/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>הקודם</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: סיכום ושליחה */}
      {step === 4 && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-4">
            {/* SOW Document Preview Container */}
            <section className="flex-1 lg:flex-[1.8] min-w-0 w-full flex flex-col p-4 sm:p-6 rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/85 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#f2f8ff] flex items-center gap-2">
                    <span>הצעת מחיר רשמית (SOW) — {displayOrgName}</span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#0d6282]/30 text-sky-300 border border-[#0d6282]/50">
                      1:1 למסמך המקורי
                    </span>
                  </h2>
                  <p className="text-xs text-[#cbe1ff]/60 mt-0.5">
                    מסמך מבדק חוסן מלא ומותאם ב-5 עמודים רשמיים, תואם מתודולוגיית {displayOrgName}
                  </p>
                </div>

                {/* Quick Client Name input */}
                <div className="flex items-center gap-2 bg-[#061022] border border-[#7dd3fc]/20 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                  <span className="text-xs font-bold text-[#7dd3fc]">עבור:</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="שם הלקוח"
                    className="bg-transparent text-xs font-black text-white outline-none w-36 sm:w-44 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Page Navigator Segmented Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
                {[
                  { id: 0, label: 'כל 5 העמודים ברצף' },
                  { id: 1, label: 'עמוד 1: שער' },
                  { id: 2, label: 'עמוד 2: סיכום מנהלים' },
                  { id: 3, label: 'עמוד 3: שלבי הבדיקה' },
                  { id: 4, label: 'עמוד 4: עלויות ותמחור' },
                  { id: 5, label: 'עמוד 5: תנאים וחתימות' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewPage(tab.id)}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      previewPage === tab.id
                        ? 'bg-[#0d6282] text-white shadow-md shadow-[#0d6282]/40'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Preview Viewport Container */}
              <div className="relative flex-1 rounded-2xl p-3 sm:p-5 bg-gradient-to-br from-[#0c245c] via-[#081a44] to-[#040e28] border-2 border-[#2563eb]/70 shadow-[0_24px_50px_-15px_rgba(2,12,38,0.95),0_0_35px_-8px_rgba(37,99,235,0.45)]">
                <div
                  ref={documentPreviewRef}
                  dir="rtl"
                  className="max-h-[750px] overflow-y-auto p-3 sm:p-6 bg-slate-900/60 rounded-xl flex flex-col items-center gap-8 shadow-inner border border-white/5"
                >
                  <ElixSowDocument
                    clientName={clientName}
                    categoryName={selectedCategoryName}
                    testType={testType}
                    staging={staging}
                    complexity={complexity}
                    mandays={currentMandays}
                    totalCost={currentTotalCost}
                    dailyRate={dailyRate}
                    components={scopeComponents}
                    targetSystem={targetSystem}
                    customRequirements={customRequirements}
                    scopeDetails={scopeDetails}
                    activePage={previewPage}
                    editableClientName={true}
                    onClientNameChange={setClientName}
                    organizationName={displayOrgName}
                    authorName={authorName}
                    authorEmail={authorEmail}
                    authorPhone={authorPhone}
                    hpNumber={hpNumber}
                    bankAccountNumber={bankAccountNumber}
                    bankNumber={bankNumber}
                    branchNumber={branchNumber}
                    beneficiaryName={beneficiaryName}
                  />
                </div>
              </div>

              {/* Hidden 5-Page Full Export Container (Always exports all 5 pages) */}
              <div style={{ position: 'fixed', left: '-99999px', top: 0, opacity: 0, pointerEvents: 'none', width: 794 }}>
                <div ref={fullDocumentExportRef}>
                  <ElixSowDocument
                    clientName={clientName}
                    categoryName={selectedCategoryName}
                    testType={testType}
                    staging={staging}
                    complexity={complexity}
                    mandays={currentMandays}
                    totalCost={currentTotalCost}
                    dailyRate={dailyRate}
                    components={scopeComponents}
                    targetSystem={targetSystem}
                    customRequirements={customRequirements}
                    scopeDetails={scopeDetails}
                    activePage={0}
                    editableClientName={false}
                    organizationName={displayOrgName}
                    authorName={authorName}
                    authorEmail={authorEmail}
                    authorPhone={authorPhone}
                    hpNumber={hpNumber}
                    bankAccountNumber={bankAccountNumber}
                    bankNumber={bankNumber}
                    branchNumber={branchNumber}
                    beneficiaryName={beneficiaryName}
                  />
                </div>
              </div>
            </section>

            {/* Actions Sidebar */}
            <aside className="w-full lg:w-80 flex-none flex flex-col gap-3 p-5 rounded-3xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#172a48]/90 to-[#0a1224]/90 shadow-[0_26px_56px_-34px_rgba(2,8,23,0.95),0_0_44px_-26px_rgba(34,211,238,0.45)]">
              <h3 className="text-base font-extrabold text-[#f2f8ff] mb-0.5">
                אפשרויות הפקה
              </h3>

              {/* Download PDF button (1:1 identical to preview) */}
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="w-full h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-extrabold text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_6px_20px_rgba(34,211,238,0.55)] hover:brightness-105 active:scale-98 transition-all cursor-pointer disabled:opacity-75"
              >
                <span className="w-8 h-8 rounded-lg bg-black/15 text-[#04121f] flex items-center justify-center flex-none font-bold">
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </span>
                <span className="flex-1 text-right">
                  {isGeneratingPdf ? 'מייצר קובץ PDF...' : 'הורד מסמך PDF'}
                </span>
                <ArrowLeft className="w-4 h-4 text-[#04121f]" />
              </button>

              {/* Download Word button */}
              <button
                type="button"
                disabled={isGeneratingWord}
                onClick={handleDownloadWord}
                className="w-full h-11 px-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-bold text-sky-200 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-75"
              >
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center flex-none font-bold">
                  {isGeneratingWord ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="flex-1 text-right">
                  {isGeneratingWord ? 'מייצר קובץ Word...' : 'הורד מסמך Word (DOCX)'}
                </span>
                <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              </button>

              {/* Save without leaving the wizard */}
              <button
                type="button"
                disabled={isSavingQuote}
                onClick={saveQuoteNow}
                className="w-full h-11 px-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-bold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-75"
              >
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-none font-bold">
                  {isSavingQuote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="flex-1 text-right">
                  {isSavingQuote ? 'שומר...' : 'שמור הצעת מחיר'}
                </span>
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              {/* Send the client link. Saves first so the link has a token. */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isSavingQuote}
                  onClick={handleOpenShare}
                  className="w-full h-11 px-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-bold text-[#a5f3fc] bg-[#22d3ee]/12 hover:bg-[#22d3ee]/20 border border-[#22d3ee]/40 shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-75"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#22d3ee]/20 text-[#67e8f9] flex items-center justify-center flex-none font-bold">
                    <Send className="w-3.5 h-3.5" />
                  </span>
                  <span className="flex-1 text-right">שלח לינק ללקוח</span>
                  <ArrowLeft className="w-3.5 h-3.5 text-[#22d3ee]" />
                </button>

                {shareMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShareMenuOpen(false)} />
                    <div className="absolute z-50 mt-2 inset-x-0 p-2 rounded-2xl bg-[#0b1329] border border-[#22d3ee]/30 shadow-[0_20px_45px_rgba(2,8,23,0.9)] flex flex-col gap-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-[#7dd3fc] border-b border-white/10 mb-1">
                        שליחת קישור ל{clientName || 'לקוח'}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          withLink((link) => {
                            if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                          })
                        }
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#cbe1ff] hover:bg-white/8 cursor-pointer text-right"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#7dd3fc]" />
                        <span className="flex-1 text-right">{linkCopied ? 'הקישור הועתק ✓' : 'העתק קישור'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          withLink((link) => {
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(clientMessage(link))}`,
                              '_blank',
                              'noopener,noreferrer'
                            );
                            setShareMenuOpen(false);
                          })
                        }
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#cbe1ff] hover:bg-white/8 cursor-pointer text-right"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="flex-1 text-right">שלח בוואטסאפ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          withLink((link) => {
                            const subject = `הצעת מחיר ומפרט עבודה (SOW) עבור ${clientName} - ${displayOrgName}`;
                            window.open(
                              `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(clientMessage(link))}`,
                              '_self'
                            );
                            setShareMenuOpen(false);
                          })
                        }
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-[#cbe1ff] hover:bg-white/8 cursor-pointer text-right"
                      >
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        <span className="flex-1 text-right">שלח במייל</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Summary details card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-[#7dd3fc]/15 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between text-[#cbe1ff]">
                  <span>לקוח:</span>
                  <span className="font-bold text-white">{clientName}</span>
                </div>
                <div className="flex items-center justify-between text-[#cbe1ff]">
                  <span>סביבה ומערכת:</span>
                  <span className="font-bold text-white truncate max-w-[140px] text-left" title={targetSystem}>{targetSystem}</span>
                </div>
                <div className="flex items-center justify-between text-[#cbe1ff]">
                  <span>היקף ימי עבודה:</span>
                  <span className="font-bold text-[#67e8f9] font-mono">{currentMandays} MD</span>
                </div>
                <div className="flex items-center justify-between text-[#cbe1ff] pt-1.5 border-t border-white/10 font-bold">
                  <span>סה"כ כולל מע"מ:</span>
                  <span className="text-emerald-400 font-mono">₪{Math.round(currentTotalCost * 1.18).toLocaleString('he-IL')}</span>
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom Action bar */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="h-10 px-4 rounded-full text-xs font-semibold text-[#d6e6f7] border border-slate-400/35 bg-slate-400/15 hover:bg-slate-400/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>הקודם</span>
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="h-12 px-7 rounded-full font-bold text-sm text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_16px_36px_-14px_rgba(34,211,238,0.8)] hover:brightness-105 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>
                {isEditing
                  ? 'עדכן הצעת מחיר וחזור ללוח הבקרה'
                  : isSent
                  ? 'סיים וחזור ללוח הבקרה'
                  : 'שמור וחזור ללוח הבקרה'}
              </span>
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
