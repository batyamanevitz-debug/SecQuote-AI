import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
} from 'docx';
import { ScopeComponent } from '../types';
import { getOrgFinancialDetails } from '../data/mockData';

export interface WordExportData {
  clientName: string;
  categoryName: string;
  testType: string;
  staging: boolean;
  complexity: string;
  mandays: number;
  totalCost: number;
  dailyRate: number;
  components: ScopeComponent[];
  targetSystem: string;
  customRequirements: string[];
  scopeDetails: {
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
  authorPhone?: string;
  hpNumber?: string;
  bankAccountNumber?: string;
  bankNumber?: string;
  branchNumber?: string;
  beneficiaryName?: string;
}

const PRIMARY_COLOR = '0D6282';
const BG_LIGHT = 'F1F5F9';
const BORDER_COLOR = 'CBD5E1';

const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: BORDER_COLOR,
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

function createRtlParagraph(
  text: string,
  options?: {
    bold?: boolean;
    size?: number; // in half-points, e.g. 24 = 12pt
    color?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingAfter?: number;
    spacingBefore?: number;
    bullet?: boolean;
  }
): Paragraph {
  const {
    bold = false,
    size = 22,
    color = '0F172A',
    alignment = AlignmentType.RIGHT,
    spacingAfter = 120,
    spacingBefore = 0,
  } = options || {};

  return new Paragraph({
    alignment,
    bidirectional: true,
    spacing: { after: spacingAfter, before: spacingBefore, line: 280 },
    children: [
      new TextRun({
        text,
        bold,
        size,
        color,
        font: 'Segoe UI',
      }),
    ],
  });
}

function createBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { after: 80, before: 40 },
    children: [
      new TextRun({
        text: `•  ${text}`,
        size: 20,
        color: '1E293B',
        font: 'Segoe UI',
      }),
    ],
  });
}

export async function generateWordDocument(data: WordExportData): Promise<Blob> {
  const {
    clientName,
    categoryName,
    testType,
    staging,
    complexity,
    mandays,
    totalCost,
    components,
    targetSystem,
    customRequirements,
    scopeDetails,
    organizationName: propOrgName,
    authorName: propAuthorName,
    authorEmail: propAuthorEmail,
    authorPhone: propAuthorPhone,
    hpNumber: propHpNumber,
    bankAccountNumber: propBankAccountNumber,
    bankNumber: propBankNumber,
    branchNumber: propBranchNumber,
    beneficiaryName: propBeneficiaryName,
  } = data;

  const rawOrg = propOrgName || 'ELIX SYSTEMS';
  const fin = getOrgFinancialDetails(rawOrg, {
    organization: rawOrg,
    hpNumber: propHpNumber,
    bankAccountNumber: propBankAccountNumber,
    bankNumber: propBankNumber,
    branchNumber: propBranchNumber,
    beneficiaryName: propBeneficiaryName,
    name: propAuthorName,
    email: propAuthorEmail,
  });

  const orgName = fin.organization;
  const authorName = propAuthorName || fin.authorName;
  const authorEmail = propAuthorEmail || fin.authorEmail;
  const authorPhone = propAuthorPhone || fin.authorPhone;
  const hpNumber = propHpNumber || fin.hpNumber;
  const bankAccountNumber = propBankAccountNumber || fin.bankAccountNumber;
  const bankNumber = propBankNumber || fin.bankNumber;
  const branchNumber = propBranchNumber || fin.branchNumber;
  const beneficiaryName = propBeneficiaryName || fin.beneficiaryName;

  const baseCost = totalCost || 11000;
  const vatAmount = Math.round(baseCost * 0.18);
  const totalWithVat = baseCost + vatAmount;
  const dateFormatted = new Date().toLocaleDateString('he-IL');
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL');

  const children: (Paragraph | Table)[] = [];

  // ===================== PAGE 1: שער =====================
  // Header Banner
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
              margins: { top: 200, bottom: 200, left: 240, right: 240 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  bidirectional: true,
                  children: [
                    new TextRun({
                      text: `${orgName} - Cyber Security & Digital Solutions`,
                      color: 'FFFFFF',
                      bold: true,
                      size: 28,
                      font: 'Segoe UI',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(createRtlParagraph('', { spacingAfter: 800 }));
  children.push(createRtlParagraph('הצעת מחיר', { bold: true, size: 54, color: PRIMARY_COLOR, alignment: AlignmentType.CENTER }));
  children.push(createRtlParagraph('לביצוע מבדק חוסן אפליקטיבי ותשתיות', { bold: true, size: 32, color: '334155', alignment: AlignmentType.CENTER }));
  children.push(createRtlParagraph(categoryName, { bold: true, size: 28, color: '0F172A', alignment: AlignmentType.CENTER, spacingAfter: 100 }));
  if (targetSystem) {
    children.push(createRtlParagraph(targetSystem, { bold: true, size: 24, color: PRIMARY_COLOR, alignment: AlignmentType.CENTER }));
  }

  children.push(createRtlParagraph('', { spacingAfter: 1000 }));

  // Cover Page Details Table (RTL: Label right, Value left)
  const coverTableRows = [
    { label: 'לכבוד', val: clientName },
    { label: 'תאריך', val: dateFormatted },
    { label: 'גרסה', val: 'V1.0' },
    { label: 'תוקף ההצעה', val: validUntil },
    { label: 'אנשי קשר', val: `${authorName} – ${authorPhone} | ${authorEmail}` },
  ].map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [createRtlParagraph(row.label, { bold: true, size: 20, color: '334155' })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [createRtlParagraph(row.val, { bold: true, size: 20, color: '0F172A' })],
          }),
        ],
      })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: coverTableRows,
    })
  );

  // Page Break to Page 2
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===================== PAGE 2: סיכום מנהלים ותמצית =====================
  children.push(createRtlParagraph('סיכום מנהלים', { bold: true, size: 32, color: PRIMARY_COLOR, spacingAfter: 200 }));
  children.push(
    createRtlParagraph(
      `${orgName} הינה חברת בוטיק מתמחה בדיגיטל, אבטחת מידע וסייבר, המספקת שירותי ייעוץ מתקדמים וליווי מקצועי לארגונים מובילים.`
    )
  );
  children.push(
    createRtlParagraph(
      'חברתינו מתמחה בהקטנת סיכונים תפעוליים, בניית תוכניות הגנה מקיפות, עמידה בדרישות רגולציה ותקינה בארץ ובעולם, ביצוע סקרי סיכונים ובדיקות חדירה תוך ליווי שוטף של פונקציית אבטחת המידע בארגון.'
    )
  );
  children.push(
    createRtlParagraph(
      'הגישה שלנו משלבת ידע טכני עמוק עם הבנה עסקית, במטרה לתמוך בהשגת היעדים האסטרטגיים שלכם עם דגש על שירות אישי, אמינות ומחויבות מלאה להצלחתכם.'
    )
  );
  children.push(
    createRtlParagraph(
      `בהתאם לתהליך האפיון שבוצע, אנו מציעים לבצע בדיקת חדירות מקיפה למערכת - ${clientName} (${targetSystem}) בהיקף של ${mandays} ימי עבודה.`,
      { bold: true, color: PRIMARY_COLOR, spacingAfter: 240 }
    )
  );

  if (customRequirements.length > 0) {
    children.push(createRtlParagraph('דרישות מיוחדות שסוכמו באפיון:', { bold: true, size: 22, color: '92400E' }));
    customRequirements.forEach((req) => children.push(createBulletParagraph(req)));
    children.push(createRtlParagraph('', { spacingAfter: 180 }));
  }

  // Scope Summary Table
  children.push(createRtlParagraph('תמצית תכולת הבדיקה', { bold: true, size: 28, color: PRIMARY_COLOR, spacingAfter: 160 }));

  const scopeRows = [
    { label: 'סביבה נבדקת', val: `${targetSystem} (${staging ? 'סביבת Staging / מעבדה' : 'סביבת Production / ייצור'})` },
    { label: 'סוג הבדיקה', val: `${categoryName} (${testType})` },
    {
      label: 'רמות הרשאה',
      val:
        scopeDetails?.roles ||
        (testType === 'Blackbox'
          ? 'Blackbox (אורח חיצוני ללא הרשאות)'
          : 'Blackbox (אורח) + Greybox (משתמש רגיל, מנהל/Admin, תפקידים שונים)'),
    },
    {
      label: 'היקף / Endpoints',
      val:
        scopeDetails?.endpointsOrIps ||
        (components.length > 0 ? `${components.length} מודולי בדיקה (${mandays} ימי עבודה)` : 'OWASP Top 10 / PTES / NIST'),
    },
    { label: 'גישת בדיקה', val: `${testType} (${staging ? 'Staging' : 'Production'}) – רמת מורכבות: ${complexity}` },
    { label: 'דוח מסירה', val: 'דוח מפורט + תקציר מנהלים + מבדק חוזר (Retest)' },
  ].map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [createRtlParagraph(row.label, { bold: true, size: 20, color: '334155' })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [createRtlParagraph(row.val, { size: 20, color: '0F172A' })],
          }),
        ],
      })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: scopeRows,
    })
  );

  children.push(createRtlParagraph('', { spacingAfter: 200 }));
  children.push(createRtlParagraph('מסגרת עבודה ותקנים', { bold: true, size: 24, color: PRIMARY_COLOR, spacingAfter: 100 }));
  children.push(createBulletParagraph('PTES (Penetration Testing Execution Standard) - מתודולוגיית בדיקות כוללת.'));
  children.push(createBulletParagraph('CVSS - לדירוג חומרת ממצאים.'));
  children.push(createBulletParagraph('CWE - סיווג חולשות.'));
  children.push(createBulletParagraph('OWASP Top 10 - בדיקות אפליקציה ממוקדות.'));

  // Page Break to Page 3
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===================== PAGE 3: שלבי הבדיקה =====================
  children.push(createRtlParagraph('שלבי הבדיקה', { bold: true, size: 32, color: PRIMARY_COLOR, spacingAfter: 100 }));
  children.push(
    createRtlParagraph(`שלבי הבדיקה על סביבת ה-${targetSystem || categoryName} כוללים:`, { spacingAfter: 160 })
  );

  const stagesData = [
    {
      num: '1',
      title: 'Reconnaissance & Scoping',
      desc: 'מיפוי ארכיטקטורת האפליקציה, טכנולוגיות Server/Client ו-APIs. זיהוי נקודות קלט (Forms, Parameters, Headers). מיפוי מנגנוני הזדהות וניהול סשן.',
    },
    {
      num: '2',
      title: 'Threat Modeling',
      desc: 'זיהוי נכסים קריטיים (מידע אישי, נתוני תשלום, סודות וגישות). בניית תרחישי תקיפה: Account Takeover, Privilege Escalation, Data Exposure.',
    },
    {
      num: '3',
      title: 'Vulnerability Assessment',
      desc: 'בדיקת הרשאות ועקיפת בקרות גישה ברמת ה-Plugins וה-API. בדיקת חולשות הזרקה וסקריפטים (SQLi, XSS, CSRF). בדיקת מנגנוני BruteForce.',
    },
    {
      num: '4',
      title: 'Business Logic Validation',
      desc: 'ניסיון ניצול מבוקר של חולשות להעלאת הרשאות ממשתמש פשוט ל-Admin. ניסיונות לקבלת גישה ישירה למאגרי מידע ובסיסי נתונים.',
    },
    {
      num: '5',
      title: 'Impact Assessment',
      desc: 'ניתוח פוטנציאל הנזק העסקי והרחבת הגישה הבלתי מורשת במערכת. זיהוי Attack Paths מלאים באפליקציה.',
    },
    {
      num: '6',
      title: 'Reporting & Remediation',
      desc: 'דוח טכני מפורט לצוות הפיתוח, תקציר מנהלים לדרג הניהולי, Excel לניהול ותיעדוף ממצאים, והמלצות תיקון מעשיות.',
    },
  ];

  const stageRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [createRtlParagraph('#', { bold: true, color: 'FFFFFF', alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [createRtlParagraph('שלב', { bold: true, color: 'FFFFFF' })],
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [createRtlParagraph('תיאור הפעילות', { bold: true, color: 'FFFFFF' })],
        }),
      ],
    }),
    ...stagesData.map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [createRtlParagraph(s.num, { bold: true, alignment: AlignmentType.CENTER, color: PRIMARY_COLOR })],
            }),
            new TableCell({
              borders: cellBorders,
              shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [createRtlParagraph(s.title, { bold: true, color: PRIMARY_COLOR, size: 20 })],
            }),
            new TableCell({
              borders: cellBorders,
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [createRtlParagraph(s.desc, { size: 20, color: '1E293B' })],
            }),
          ],
        })
    ),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: stageRows,
    })
  );

  // Components breakdown if exists
  if (components.length > 0) {
    children.push(createRtlParagraph('', { spacingAfter: 180 }));
    children.push(createRtlParagraph('פירוט רכיבי האפיון והדרישות מהשיחה:', { bold: true, size: 24, color: PRIMARY_COLOR }));

    const compRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [createRtlParagraph('שם רכיב / בדיקה', { bold: true, size: 20 })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [createRtlParagraph('ימי עבודה', { bold: true, size: 20, alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      ...components.map(
        (c) =>
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  createRtlParagraph(`${c.name} ${c.isCustom ? '(דרישת שיחה)' : ''}`, { bold: true, size: 20 }),
                  ...(c.desc ? [createRtlParagraph(c.desc, { size: 18, color: '64748B' })] : []),
                ],
              }),
              new TableCell({
                borders: cellBorders,
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [createRtlParagraph(`${c.md} MD`, { bold: true, alignment: AlignmentType.CENTER, color: PRIMARY_COLOR })],
              }),
            ],
          })
      ),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            children: [createRtlParagraph('סך ימי עבודה מחושבים:', { bold: true, size: 20 })],
          }),
          new TableCell({
            borders: cellBorders,
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            children: [createRtlParagraph(`${mandays} MD`, { bold: true, alignment: AlignmentType.CENTER, color: PRIMARY_COLOR, size: 22 })],
          }),
        ],
      }),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: compRows,
      })
    );
  }

  // Page Break to Page 4
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===================== PAGE 4: תמחור וזמנים =====================
  children.push(createRtlParagraph('עלויות הצעה, קבלה ותנאים', { bold: true, size: 32, color: PRIMARY_COLOR, spacingAfter: 140 }));
  children.push(createRtlParagraph('תמחור שירותים:', { bold: true, size: 24, spacingAfter: 120 }));

  const pricingRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [createRtlParagraph('שם השירות', { bold: true, color: 'FFFFFF' })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          borders: cellBorders,
          children: [createRtlParagraph('מחיר', { bold: true, color: 'FFFFFF', alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            createRtlParagraph(
              `מבדק חדירות ל-${targetSystem} (${mandays} ימי עבודה במודל ${testType}) כולל דו"ח מפורט והמלצות תיקון.`,
              { size: 20 }
            ),
          ],
        }),
        new TableCell({
          borders: cellBorders,
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          children: [createRtlParagraph(`${baseCost.toLocaleString('he-IL')} ₪`, { bold: true, alignment: AlignmentType.CENTER, size: 20 })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [createRtlParagraph('עלות ליווי ניהול טיפול בפערים שימצאו כחלק מהבדיקה.', { size: 20 })],
        }),
        new TableCell({
          borders: cellBorders,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [createRtlParagraph('0 ₪ (כלול)', { bold: true, alignment: AlignmentType.CENTER, size: 20 })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [createRtlParagraph('בדיקה אחת חוזרת (Retest) עד 3 חודשים ממועד שליחת הדו"ח.', { size: 20 })],
        }),
        new TableCell({
          borders: cellBorders,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [createRtlParagraph('כלול', { bold: true, alignment: AlignmentType.CENTER, size: 20 })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [createRtlParagraph('מע"מ (18%)', { bold: true, size: 20, color: '475569' })],
        }),
        new TableCell({
          borders: cellBorders,
          shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [createRtlParagraph(`${vatAmount.toLocaleString('he-IL')} ₪`, { bold: true, alignment: AlignmentType.CENTER, size: 20, color: '475569' })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [createRtlParagraph('סה"כ כולל מע"מ', { bold: true, color: 'FFFFFF', size: 22 })],
        }),
        new TableCell({
          borders: cellBorders,
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          children: [createRtlParagraph(`${totalWithVat.toLocaleString('he-IL')} ₪`, { bold: true, color: 'FFFFFF', alignment: AlignmentType.CENTER, size: 24 })],
        }),
      ],
    }),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: pricingRows,
    })
  );

  children.push(createRtlParagraph('', { spacingAfter: 200 }));
  children.push(createRtlParagraph('מסגרת זמן הפרויקט ותהליך העבודה', { bold: true, size: 24, color: PRIMARY_COLOR, spacingAfter: 100 }));
  children.push(createRtlParagraph('תאריך תחילת הפעילות – בתוך 7-10 ימי עסקים מחתימת הסכם ההתקשרות.'));
  children.push(createRtlParagraph(`משך ביצוע משוער – כ-${Math.max(1, Math.ceil(mandays / 3))} שבועות עבודה (סך ${mandays} ימי עבודה מוגדרים).`));
  if (scopeDetails?.testingHours) {
    children.push(createRtlParagraph(`שעות בדיקה: ${scopeDetails.testingHours}`, { bold: true, color: PRIMARY_COLOR }));
  }

  children.push(createRtlParagraph('', { spacingAfter: 160 }));
  children.push(createRtlParagraph('צוות הפרויקט', { bold: true, size: 24, color: PRIMARY_COLOR, spacingAfter: 100 }));
  children.push(createBulletParagraph('צוות זה כולל מנהל פרויקט והובלה טכנית מוסמכת (OSCP / CISSP / CEH), ויישמר לאורך כל משך הפרויקט להבטחת עקביות ומקצועיות ללא פשרות.'));

  // Page Break to Page 5
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ===================== PAGE 5: תנאים, בנק וחתימות =====================
  children.push(createRtlParagraph('תנאים לתשלום', { bold: true, size: 32, color: PRIMARY_COLOR, spacingAfter: 140 }));
  children.push(createBulletParagraph('כלולה בהצעה זו בדיקה חוזרת אחת (Retest) לכל ממצא, עד 3 חודשים ממועד שליחת הדוח הסופי.'));
  children.push(createBulletParagraph('בחתימה על הצעה זו, הלקוח מאשר את הסכמתו להצעה לעיל, לרבות תנאי השירות, היקף העבודה, לוחות הזמנים ומדיניות התשלומים כפי שמופיעים במסמך זה.'));

  children.push(createRtlParagraph('', { spacingAfter: 180 }));
  children.push(createRtlParagraph('פרטי חשבון בנק להעברה:', { bold: true, size: 24, color: PRIMARY_COLOR, spacingAfter: 120 }));

  const bankRows = [
    { label: 'ח.פ', val: hpNumber },
    { label: 'אמצעי תשלום', val: 'העברה בנקאית' },
    { label: 'שם המוטב', val: beneficiaryName },
    { label: "מס' חשבון בנק", val: bankAccountNumber },
    { label: "מס' סניף", val: branchNumber },
    { label: "מס' בנק", val: `${bankNumber} (${fin.bankName})` },
  ].map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: BG_LIGHT, type: ShadingType.CLEAR },
            borders: cellBorders,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [createRtlParagraph(row.label, { bold: true, size: 20, color: '334155' })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [createRtlParagraph(row.val, { bold: true, size: 20, alignment: AlignmentType.CENTER })],
          }),
        ],
      })
  );

  children.push(
    new Table({
      width: { size: 80, type: WidthType.PERCENTAGE },
      rows: bankRows,
    })
  );

  children.push(createRtlParagraph('', { spacingAfter: 200 }));
  children.push(createRtlParagraph('פרטי הלקוח המאשר:', { bold: true, size: 24, spacingAfter: 120 }));
  children.push(createRtlParagraph(`שם החברה:  ${clientName}`, { bold: true, size: 20 }));
  children.push(createRtlParagraph('ח.פ:  ________________________', { size: 20 }));
  children.push(createRtlParagraph('שם פרטי ומורשה חתימה:  ________________________', { size: 20 }));
  children.push(createRtlParagraph('תפקיד:  ________________________', { size: 20 }));
  children.push(createRtlParagraph('תאריך:  ________________________', { size: 20 }));
  children.push(createRtlParagraph('כתובת:  ________________________', { size: 20 }));

  children.push(createRtlParagraph('', { spacingAfter: 300 }));

  // Signatures Table
  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [
              createRtlParagraph('איש קשר מהרכש:', { bold: true, size: 20 }),
              createRtlParagraph('', { spacingAfter: 400 }),
              createRtlParagraph('חתימה וחותמת: ____________________', { size: 18 }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            children: [
              createRtlParagraph('חתום כאן (ספק):', { bold: true, size: 20 }),
              createRtlParagraph('', { spacingAfter: 400 }),
              createRtlParagraph('חתימה וחותמת: ____________________', { size: 18 }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(signTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function exportToWord(data: WordExportData, fileName?: string): Promise<void> {
  const blob = await generateWordDocument(data);
  const name =
    fileName ||
    `SOW_${(data.clientName || 'Proposal').replace(/\s+/g, '_')}_${(data.organizationName || 'ORG').replace(/\s+/g, '')}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
