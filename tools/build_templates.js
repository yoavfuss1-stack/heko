// Builds the unified quote templates (Word) for Orit Lev Architect.
// Run:  node tools/build_templates.js
// Text markup inside strings:  **bold**   [[placeholder to fill in - yellow]]
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, LevelFormat, Header, Footer,
  PageNumber, VerticalAlign,
} = require("docx");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "תבניות הצעות מחיר");
const LOGO = fs.readFileSync(path.join(ROOT, "assets", "logo.jpeg"));

// ---------- Look & feel ----------
const FONT = "Arial";
const ACCENT = "6E625A";      // warm grey, matches the logo
const MUTED = "8C8C8C";
const LINE = "C9C2BC";
const SHADE = "F3F0ED";
const BODY = 22;              // 11pt
const RATE = "380";           // hourly rate, ₪ + VAT
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - 2 * MARGIN;

// ---------- Helpers ----------
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g; // bold may contain [[...]]
  for (const part of text.split(re)) {
    if (!part) continue;
    const o = { ...base };
    let t = part;
    if (part.startsWith("**")) { out.push(...runs(part.slice(2, -2), { ...base, bold: true })); continue; }
    if (part.startsWith("[[")) { t = part.slice(2, -2); o.highlight = "yellow"; }
    out.push(new TextRun({ text: t, font: FONT, size: o.size || BODY, rightToLeft: true, ...o }));
  }
  return out;
}

const para = (text, opts = {}, runOpts = {}) =>
  new Paragraph({
    bidirectional: true,
    spacing: { after: 100, line: 300 },
    ...opts,
    children: Array.isArray(text) ? text : runs(text, runOpts),
  });

const bullet = (text, level = 0) =>
  para(text, { numbering: { reference: "bul", level }, spacing: { after: 60, line: 290 } });

let numInstance = 0;
const numbered = (items) => {
  numInstance += 1;
  return items.map((t) =>
    para(t, { numbering: { reference: "num", level: 0, instance: numInstance }, spacing: { after: 80, line: 290 } })
  );
};

let sectionNo = 0;
const section = (title) => {
  sectionNo += 1;
  return para(`${sectionNo}. ${title}`, {
    keepNext: true,
    spacing: { before: 360, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 4 } },
  }, { bold: true, size: 26, color: ACCENT });
};

const stage = (title) =>
  para(title, { keepNext: true, spacing: { before: 220, after: 80 } }, { bold: true, size: 23 });

const note = (text) => para(text, { spacing: { after: 80 } }, { italics: true, color: MUTED, size: 20 });

const price = (text) =>
  para(text, { spacing: { before: 60, after: 120 }, indent: { start: 360 } }, { size: BODY });

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };
const noB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB };

function table(widths, rows, { headerRows = 1, totalRow = false } = {}) {
  return new Table({
    visuallyRightToLeft: true,
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((cells, ri) => {
      const isHead = ri < headerRows;
      const isTotal = totalRow && ri === rows.length - 1;
      return new TableRow({
        tableHeader: isHead,
        children: cells.map((c, ci) =>
          new TableCell({
            borders,
            width: { size: widths[ci], type: WidthType.DXA },
            shading: isHead || isTotal ? { fill: SHADE, type: ShadingType.CLEAR, color: "auto" } : undefined,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [para(c, { spacing: { after: 0 }, alignment: ci === 0 ? AlignmentType.CENTER : undefined },
              { bold: isHead || isTotal, size: 21 })],
          })
        ),
      });
    }),
  });
}

// total = sample fee in ₪; amounts are pre-calculated and marked yellow (update if the fee changes)
function paymentTable(rows, total) {
  const widths = [700, 5338, 1300, 2300];
  const fmt = (n) => n.toLocaleString("en-US");
  return table(widths, [
    ["#", "אבן דרך לתשלום", "אחוז", "סכום (₪, לפני מע\"מ)"],
    ...rows.map((r, i) => [String(i + 1), r[1], r[0], `[[${fmt(Math.round(total * parseFloat(r[0]) / 100))}]]`]),
    ["", "סה\"כ", "100%", `[[${fmt(total)}]] ₪`],
  ], { totalRow: true });
}

function signatures() {
  const w = [3212, 3213, 3213];
  const cell = (t) => new TableCell({
    borders: { top: noB, bottom: noB, left: noB, right: noB },
    width: { size: w[0], type: WidthType.DXA },
    children: [
      para("_____________________", { alignment: AlignmentType.CENTER, spacing: { before: 440, after: 40 } }, { color: MUTED }),
      para(t, { alignment: AlignmentType.CENTER }, { size: 20 }),
    ],
  });
  return [
    para("ובזאת באו הצדדים על החתום:", { spacing: { before: 280, after: 0 }, keepNext: true }, { bold: true }),
    new Table({
      visuallyRightToLeft: true, borders: noBorders,
      width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: w,
      rows: [new TableRow({ cantSplit: true, children: [cell("חתימת המזמין/ים"), cell("תאריך"), cell("חתימת המתכננת")] })],
    }),
  ];
}

function closing() {
  return [
    para("אשמח לעמוד לרשותכם בכל שאלה.", { spacing: { before: 240, after: 60 }, keepNext: true }),
    para("בברכה,", { spacing: { after: 40 }, keepNext: true }),
    para("Orit Lev Architect", {}, { bold: true, color: ACCENT }),
  ];
}

function opening({ title, intro }) {
  return [
    para("תאריך: [[__/__/__]]", { spacing: { after: 40 } }),
    para("לכבוד: [[שם הלקוח/ות]]", { spacing: { after: 40 } }),
    para("כתובת הנכס: [[רחוב, עיר]]", { spacing: { after: 300 } }),
    para(title, { alignment: AlignmentType.CENTER, spacing: { after: 300 } }, { bold: true, size: 32, color: ACCENT }),
    para("תודה על פנייתכם."),
    ...intro.map((t) => para(t)),
  ];
}

// ---------- Shared clauses ----------
const MEETINGS_COMMON = [
  "כל פגישת עבודה או ליווי (בזום או פרונטלית, לפי הצורך המקצועי) הינה עד 2.5 שעות, אלא אם צוין אחרת בהצעה.",
  "פגישות הליווי באולמות תצוגה, אצל ספקים, חברות מטבחים ונגרים ייערכו ברדיוס של עד כ-20 ק\"מ ממשרד המתכננת.",
  `בחירת ספקים ואולמות תצוגה מחוץ לאזור זה תתואם מראש בלבד, ותחויב בתוספת של ${RATE} ₪ + מע\"מ לשעה, כולל זמן נסיעה.`,
  "כל פגישה נוספת, או הגעה נוספת לאתר, מעבר למפורט בהצעה – תחויב לפי תעריף שעתי.",
];

const EXCLUSIONS_DESIGN = [
  "ליווי, ייעוץ, בחירה או רכישה של: ריהוט נייד (ספות, מיטות, פינות אוכל), גופי תאורה דקורטיביים, טקסטיל (וילונות, שטיחים), תמונות ואקססוריז (הלבשת הבית / סטיילינג).",
  "הפקת הדמיות תלת-ממדיות פוטו-ריאליסטיות (ניתן להוסיף כשירות נפרד).",
  "שכר יועצים מקצועיים, כגון: מודד, כמאי, מהנדס קונסטרוקציה, יועץ אינסטלציה, יועץ איטום, יועץ מיזוג או כל יועץ נוסף שיידרש – העלות על המזמין.",
  "מדידה מקצועית של הנכס ע\"י מודד מוסמך (במידה ותידרש – העלות על המזמין).",
  "תוכניות קונסטרוקציה, אישורי מהנדסים (למשל בפירוק קיר תומך / עמוד) או הגשות סטטוטוריות לעירייה / לרשויות.",
  "תכנון נגרות מעבר לפריטים שהוגדרו בהצעה – כל פריט נוסף יתומחר בנפרד.",
  "הדפסות ושליחתן – ישולמו ע\"י המזמין ישירות למכון ההעתקות.",
];

const TERMS_DESIGN = [
  `**סבבי תיקונים:** המחיר כולל עד 2 סבבי תיקונים לתוכניות בשלב הטיוטה. שינויים ותיקונים שיבקש המזמין לאחר אישור הסט הסופי וחתימתו – יחויבו לפי תעריף שעתי של ${RATE} ₪ + מע\"מ.`,
  "**אחריות ספקים, בדיקות ותיאומים בשטח:** האחריות לבדיקת הגעת המוצרים הנכונים לשטח, נוכחות בזמן לקיחת מידות ע\"י ספקים, בדיקת תקינות המוצרים שהגיעו וטיב ההתקנות והביצוע של הספקים והמבצעים – חלה על הקבלן המבצע בלבד. כנ\"ל לגבי תיאום לוחות הזמנים בין הספקים השונים והפיקוח על טיב עבודתם. הצעה זו **אינה כוללת** תיאומים לאספקת סחורה כלשהי, או נוכחות של האדריכלית באתר בזמן קבלת סחורה (לרבות הגעה לצורך \"פתיחת דלת\").",
  "**פתיחת דלתות:** פתיחת הנכס והדלתות עבור ספקים, מתקינים ואנשי מקצוע תהיה באחריות הקבלן, המזמין או נציג מטעמו.",
  "**גבולות אחריות התכנון:** אחריות האדריכלית הינה על עבודות התכנון והעיצוב בלבד ועל מציאת פתרונות הקשורים בעיצוב הנכס ותשתיותיו. הצעה זו **אינה כוללת** פיקוח בנייה צמוד או אחריות כלשהי על טיב העבודה של הגורם המבצע בשטח. פיקוח עליון אינו פיקוח צמוד, ואינו מחליף מנהל עבודה או מפקח בנייה מוסמך.",
  "**אי-מתן אחריות על צדדים שלישיים:** המלצה על אנשי מקצוע, קבלנים או ספקים נעשית כמחווה מקצועית בלבד, ואינה כוללת אחריות או ערבות כלשהי לטיב עבודתם, לעמידתם בלוחות הזמנים או לאיכות המוצרים שלהם.",
];

const TERMINATION =
  "**סיום התקשרות:** כל צד רשאי לסיים הסכם זה בכל עת, בהודעה בכתב של 14 יום מראש, ובלבד ששכר המתכננת שולם במלואו עד לאותו שלב, לרבות השלב/ים הנמצא/ים בתהליך ההכנה, על פי שלבי העבודה המתוארים לעיל.";

const PAY_TERMS = "התשלום יבוצע ע\"י המזמין תוך 3 ימי עסקים ממועד דרישת התשלום.";

// ---------- Document wrapper ----------
function buildDoc(children) {
  const header = new Header({
    children: [
      new Table({
        visuallyRightToLeft: true, borders: noBorders,
        width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W - 1200, 1200],
        rows: [new TableRow({
          children: [
            new TableCell({
              borders: { top: noB, bottom: noB, left: noB, right: noB },
              width: { size: CONTENT_W - 1200, type: WidthType.DXA }, verticalAlign: VerticalAlign.BOTTOM,
              children: [new Paragraph({ bidirectional: true, children: [new TextRun({ text: "Orit Lev Architect", font: FONT, size: 20, color: ACCENT, characterSpacing: 30 })] })],
            }),
            new TableCell({
              borders: { top: noB, bottom: noB, left: noB, right: noB },
              width: { size: 1200, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new ImageRun({ type: "jpg", data: LOGO, transformation: { width: 46, height: 46 } })] })],
            }),
          ],
        })],
      }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 1 } }, spacing: { after: 0 }, children: [] }),
    ],
  });
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
        children: [new TextRun({ text: "Orit Lev Architect  |  Tel: 03.5100885 / 054.397.2392  |  oritlev.arch@gmail.com", font: FONT, size: 16, color: MUTED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, bidirectional: true,
        children: [
          new TextRun({ text: "עמוד ", font: FONT, size: 16, color: MUTED, rightToLeft: true }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: MUTED }),
          new TextRun({ text: " מתוך ", font: FONT, size: 16, color: MUTED, rightToLeft: true }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: MUTED }),
        ],
      }),
    ],
  });
  const lvl = (level, text, fmt, indent) => ({
    level, format: fmt, text, alignment: AlignmentType.START,
    style: { paragraph: { indent: { start: indent, hanging: 360 } }, run: { color: ACCENT } },
  });
  return new Document({
    creator: "Orit Lev Architect",
    styles: { default: { document: { run: { font: FONT, size: BODY } } } },
    numbering: {
      config: [
        { reference: "bul", levels: [lvl(0, "•", LevelFormat.BULLET, 540), lvl(1, "◦", LevelFormat.BULLET, 1080)] },
        { reference: "num", levels: [lvl(0, "%1.", LevelFormat.DECIMAL, 540)] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1500, bottom: 1300, left: MARGIN, right: MARGIN, header: 500, footer: 450 } } },
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  });
}

// ======================================================================
// 1) Tenant changes in a new apartment (שינויי דיירים)
// ======================================================================
function tenantChanges() {
  sectionNo = 0;
  return [
    ...opening({
      title: "הצעת מחיר – שינויי דיירים לדירת [[116]] מ\"ר בפרויקט [[נווה פארק, פתח תקווה]]",
      intro: [
        "להלן הצעה לליווי אדריכלי ממוקד עבור דירתכם החדשה, תוך שימת דגש על אופטימיזציה של מערכות הבית, התאמת תשתיות הקבלן לצרכים הייחודיים שלכם, ותכנון נגרות ומטבח מותאמים אישית ברמה הגבוהה ביותר.",
      ],
    }),

    section("תכולת העבודה ושלבי הפרויקט"),
    stage("שלב א': תכנון רעיוני ומערך העמדה"),
    bullet("פגישת פרוגרמה (הגדרת צרכים, תקציב וסגנון)."),
    bullet("פגישה עם מחלקת שינויי הדיירים לקבלת קבצים והנחיות (מקרא חשמל, תאורה וכו')."),
    bullet("הכנת עד 3 חלופות להעמדת ריהוט (תוכנית מערך דו-ממדית) על גבי תוכנית המחיצות הקיימת של הקבלן, עד לבחירת הסקיצה המתאימה ביותר עבורכם."),

    stage("שלב ב': הפקת סט תוכניות עבודה לקבלן השינויים"),
    para("לאחר אישור תוכנית ההעמדה, יופק סט תוכניות עבודה מלא, מפורט ומקצועי למתאם שינויי הדיירים של חברת הבנייה:"),
    bullet("תוכנית הריסה ובנייה – על גבי מערך קירות הפנים המקורי של הקבלן (ראו \"תוספות אפשריות\" בהמשך)."),
    bullet("תוכנית אינסטלציה (מיקומי כלים סניטריים, נקודות מים וניקוז)."),
    bullet("תוכנית חשמל ותקשורת."),
    bullet("תוכנית תקרה ותאורה (מיקומי מפסקים, נקודות מאור וסוגי הדלקות)."),
    bullet("תוכנית תקרות גבס, הנמכות ומיזוג אוויר (בהסתמך על התכנון הקיים)."),
    bullet("תוכנית ריצוף – בהתאם לאריחים שייבחרו לחלל הדירה ולמרפסת, כולל אומדן כמויות."),
    bullet("פריסות מפורטות לחדרי הרחצה (מיקומי ברזים, אינטרפוצים ופריסת אריחים), עבור: [[חדר רחצה הורים, חדר רחצה כללי, שירותי אורחים]]."),
    bullet("**ליווי באולמות תצוגה:** עד 2 פגישות לבחירת ריצוף, חיפויים וכלים סניטריים."),

    stage("שלב ג': תכנון נגרות מותאמת אישית ומטבח"),
    para("הפקת תוכניות עבודה מפורטות (תוכנית, חזיתות, חתכים, חומרים עקרוניים ומידות) לצורך קבלת הצעות מחיר מנגרים וחברות מטבחים:"),
    bullet("תוכנית מטבח מלאה ומפורטת (כולל העמדת מכשירי חשמל ואינטגרציה, משטחים וחיפוי קיר)."),
    bullet("פגישת סנכרון ותיאום אחת מול חברת המטבחים / הנגר שנבחר."),
    bullet("תוכניות נגרות עבור: [[2 ארונות כיור, 3 ארונות בגדים וקיר טלוויזיה בסלון]] – עד 2 סקיצות לכל פריט."),
    bullet("עד [[2]] הדמיות גושניות נפחיות למטבח / לפריט נגרות נבחר / לחלל הדירה."),

    stage("שלב ד': פיקוח עליון"),
    bullet("עד [[2]] ביקורים מוגדרים מראש של האדריכלית בדירה בנקודות מפתח: (1) בדיקת סימון קירות ותשתיות בשטח; (2) בדיקה לפני סגירת קירות גבס / ריצוף."),
    bullet("עמידה בקשר מול מחלקת שינויי הדיירים בשלב התכנון, ומול הקבלן המבצע בשלב הביצוע."),

    section("פגישות וליווי הכלולים בהצעה"),
    bullet("**פגישה 1 – פרוגרמה ואפיון צרכים:** הגדרת תקציב, סגנון עיצובי וצרכים פונקציונליים."),
    bullet("**פגישה 2 – הצגת חלופות והעמדת ריהוט:** בחירת הסקיצה הסופית שתהווה בסיס לתוכניות התשתיות."),
    bullet("**פגישה 3 – תכנון תשתיות:** תאורה, מיקומי שקעים, אינסטלציה ומיזוג אוויר."),
    bullet("**פגישה 4 – תכנון נגרות ומטבח:** קביעת פונקציות וחלוקות פנימיות, על בסיס שיעורי בית שיקבל המזמין מראש."),
    bullet("**פגישות ליווי באולמות תצוגה / ספקים:**"),
    bullet("עד 2 פגישות לבחירת ריצוף, חיפויים וכלים סניטריים.", 1),
    bullet("עד 2 פגישות לבחירת תאורה.", 1),
    bullet("עד 2 פגישות עם חברת מטבחים / משטחים למטבח ולחדרי הרחצה.", 1),
    ...MEETINGS_COMMON.map((t) => bullet(t)),

    section("ההצעה אינה כוללת"),
    ...EXCLUSIONS_DESIGN.map((t) => bullet(t)),

    section("הערות ותנאים כלליים"),
    ...numbered([
      ...TERMS_DESIGN,
      "**הגשה אחת לקבלן:** תוכניות השינויים מופקות ומסופקות לקבלן כסט אחד מרוכז וסופי. בקשה לשינויים ולהגשה נוספת / מעודכנת לאחר שהסט נמסר למתאם השינויים – תתומחר לפי תעריף שעתי.",
      TERMINATION,
    ]),

    section("שכר טרחה ותנאי תשלום"),
    para("סך שכר הטרחה עבור הליווי המלא (שלבים א'–ד'): **[[40,000]] ₪ + מע\"מ**."),
    stage("תוספות אפשריות"),
    bullet("הצעה זו מבוססת על תכנון על גבי מערך הקירות הקיים של הקבלן. במידה ויוחלט על הזזה, שבירה או בנייה מחדש של **עד 2 קירות פנים**, תתווסף תוספת גלובלית חד-פעמית של **[[4,000]] ₪ + מע\"מ**, המכסה את התכנון מחדש של אותם אזורים ואת עדכון תוכניות התשתיות (חשמל ואינסטלציה) באותם חללים."),
    stage("חלוקת התשלומים (לפי התקדמות שלבים)"),
    paymentTable([
      ["20%", "במעמד חתימת ההסכם ותחילת העבודה"],
      ["25%", "עם אישור תוכנית ההעמדה הסופית (סיום שלב א')"],
      ["35%", "עם מסירת סט תוכניות העבודה המלא לשינויי הדיירים (סיום שלב ב')"],
      ["15%", "עם מסירת תוכניות הנגרות והמטבח הסופיות (סיום שלב ג')"],
      ["5%", "עם סיום ביקורי הפיקוח העליון בשטח (סיום שלב ד')"],
    ], 40000),
    para(PAY_TERMS, { spacing: { before: 160 } }),

    ...signatures(),
    ...closing(),
  ];
}

// ======================================================================
// 2) Renovation (שיפוץ) – price per stage
// ======================================================================
function renovation() {
  sectionNo = 0;
  return [
    ...opening({
      title: "הצעת מחיר – שיפוץ [[חדרי רחצה ומטבח]] בבית מגורים ב[[רחוב מוריה, רמת גן]]",
      intro: ["להלן הצעה לליווי אדריכלי לשיפוץ [[חדרי הרחצה והמטבח]], משלב המדידות והחלופות ועד לפיקוח העליון."],
    }),

    section("תכולת העבודה ושלבי הפרויקט"),
    stage("שלב א': מדידות וחלופות תכנוניות"),
    bullet("פגישת פרוגרמה מעמיקה להגדרת הצרכים, התקציב והסגנון העיצובי."),
    bullet("מדידה ושרטוט ראשוני של [[חדרי הרחצה והמטבח]]."),
    bullet("הכנת 2–3 חלופות רעיוניות לסידור המטבח מחדש (העמדת ריהוט ומכשירים)."),
    bullet("הכנת חלופות לחלוקת חללי הרחצה והשירותים לניצול מקסימלי של המרחב."),
    bullet("סימון נקודות התאורה הדורשות בחירת גופי תאורה חדשים / ביטול / תוספת."),
    price("**מחיר שלב א':** [[6,000]] ₪ + מע\"מ"),

    stage("שלב ב': תוכניות עבודה מפורטות לביצוע (סט קבלן)"),
    para("הפקת סט שרטוטים מלא ומדויק הכולל:"),
    bullet("תוכנית אינסטלציה (מיקומי נקודות מים, ניקוזים, אסלות תלויות ואינטרפוצים), כולל נקודות חשמל ותאורה."),
    bullet("תוכנית חשמל למטבח – מיקומי שקעים, נקודות כוח למכשירים, הכנה לתאורה במידת הצורך."),
    bullet("תוכנית פריסת קירות מפורטת עבור [[2 חדרי הרחצה ושירותי האורחים]] (מיקומי אריחים וסניטריה)."),
    price("**מחיר שלב ב':** [[7,000]] ₪ + מע\"מ"),

    stage("שלב ג': תוכניות נגרות מפורטות (מטבח וחדרי רחצה)"),
    bullet("תכנון מפורט של ארונות המטבח, כולל פרטי נגרות והפקת תוכניות להגשה לחברות מטבחים או לנגר פרטי."),
    bullet("תכנון ארונות כיור ומראות ייעודיות לחדרי הרחצה והשירותים."),
    price("**מחיר שלב ג':** [[5,500]] ₪ + מע\"מ"),

    stage("שלב ד': פגישות לבחירת חומרי גמר"),
    bullet("**[[6]] פגישות** (עד [[3]] שעות לפגישה) בבתי עסק במרכז הארץ:"),
    bullet("2 פגישות לבחירת קרמיקה, חיפויים, ריצוף וכלים סניטריים.", 1),
    bullet("2 פגישות לסגירת מפרט המטבח (חברת מטבחים / נגר) ובחירת משטח.", 1),
    bullet("2 פגישות לבחירת גופי תאורה.", 1),
    price("**מחיר שלב ד':** [[6,000]] ₪ + מע\"מ"),

    stage("שלב ה': פיקוח עליון"),
    bullet("עמידה בקשר מול הקבלן המבצע שנבחר, ו-[[5]] הגעות לנכס בנקודות מפתח:"),
    bullet("לאחר ההריסה ולפני תחילת עבודות אינסטלציה / חשמל.", 1),
    bullet("בדיקת הכנות האינסטלציה והחשמל לפני סגירת קירות / ריצוף.", 1),
    bullet("בדיקת פריסת האריחים בתחילת עבודת החיפוי.", 1),
    bullet("במהלך התקנת הנגרות והמטבח.", 1),
    bullet("בגמר השיפוץ.", 1),
    price("**מחיר שלב ה':** [[5,000]] ₪ + מע\"מ"),

    section("סיכום עלויות"),
    table([700, 6138, 2800], [
      ["שלב", "תיאור השלב", "עלות (₪, לפני מע\"מ)"],
      ["א'", "מדידות וחלופות תכנוניות", "[[6,000]]"],
      ["ב'", "תוכניות עבודה לקבלן", "[[7,000]]"],
      ["ג'", "תוכניות נגרות מפורטות", "[[5,500]]"],
      ["ד'", "פגישות לבחירת חומרי גמר", "[[6,000]]"],
      ["ה'", "פיקוח עליון", "[[5,000]]"],
      ["", "שכר טרחה גלובלי לפרויקט", "[[29,500]] ₪ + מע\"מ"],
    ], { totalRow: true }),

    section("פגישות וליווי"),
    ...MEETINGS_COMMON.map((t) => bullet(t)),

    section("ההצעה אינה כוללת"),
    ...EXCLUSIONS_DESIGN.map((t) => bullet(t)),

    section("הערות ותנאים כלליים"),
    ...numbered([...TERMS_DESIGN, TERMINATION]),

    section("תנאי תשלום"),
    paymentTable([
      ["15%", "מקדמה – עם חתימת ההסכם"],
      ["25%", "גמר שלב א' – עם אישור חלופת התכנון הנבחרת"],
      ["35%", "גמר שלב ב' – עם מסירת סט תוכניות העבודה לקבלן"],
      ["15%", "גמר שלבים ג'+ד' – עם מסירת תוכניות הנגרות וסיום פגישות הבחירה"],
      ["10%", "גמר שלב ה' – עם סיום התקנות הנגרות והפיקוח האחרון"],
    ], 29500),
    para(PAY_TERMS, { spacing: { before: 160 } }),

    ...signatures(),
    ...closing(),
  ];
}

// ======================================================================
// 3) Building permit (רישוי / היתר בנייה)
// ======================================================================
function permit() {
  sectionNo = 0;
  return [
    ...opening({
      title: "הצעת מחיר – רישוי היתר [[שינויים]] ל[[בית צמוד קרקע]]",
      intro: ["להלן הצעה לטיפול בהליך הרישוי, עד לקבלת היתר הבנייה."],
    }),

    section("תכולת העבודה"),
    bullet("טיפול בכל שלבי הרישוי עד לקבלת היתר הבנייה, עבור [[תוספת מחסן וסגירת 2 פתחים בתקרת מפלס הקרקע]], בבית פרטי שנבנה לפי היתר בנייה קיים."),
    bullet("הליך קבלת תיק מידע ופתיחת בקשה, במסגרת הליך רישוי מלא במערכת \"רישוי זמין\"."),
    bullet("הזנת כלל הנתונים והקבצים שיתבקשו במערכת, ותיאום מול היועצים השונים ומול מחלקת הרישוי."),
    bullet("עדכון הבקשה לפי הערות הרישוי – עבור הערות ללא שינוי מהותי בלבד."),
    bullet("הבקשה להיתר (גרמושקה) בקנה מידה 1:100, הכוללת מבטי על, חזיתות וחתכי המבנה, וכן קובץ חישובי שטחים וממ\"ד – [[תוגש כפי שהוכנה ע\"י אדריכל עמוס טלמור]]."),
    note("* במידה וידרשו שינויים מהותיים כתוצאה מדרישות מחלקת הרישוי / הג\"א / המִנהל או כל גורם אחר – התשלום על שינויים / עדכונים אלה אינו כלול בהצעה זו, ויתומחר לפי שעה."),
    note("* הכל בכפוף לשיתוף פעולה מלא של המזמין בכל שלבי הטיפול, עד לקבלת היתר הבנייה."),

    section("ההצעה אינה כוללת"),
    bullet("פגישות מחוץ למשרד. באם יידרשו פגישות כלשהן מחוץ למשרד – יתומחרו לפי שעה."),
    bullet("טיפול בחתימות שכנים ו/או שליחת הודעות בדואר רשום (במידה ויידרש)."),
    bullet("טיפול מול רמ\"י (מ.מ.י) – **באחריות המזמין**."),
    bullet("השירותים והיועצים שיידרשו לצורך קבלת ההיתר, לרבות: מודד, יועץ קרקע, מהנדס קונסטרוקציה, מהנדס אינסטלציה, מהנדס חשמל, אדריכל נוף, מכון התקנים, סקר עצים, אישור פקיד היערות וכיוצ\"ב."),
    bullet("הפקת נסח טאבו, תשלום אגרות, היטלים, מיסים וכו' – על חשבון המזמין."),
    bullet("הדפסות ושליחתן – ישולמו ע\"י המזמין ישירות למכון ההעתקות."),

    section("הערות ותנאים כלליים"),
    note("[[סעיפים 1–5 – רק כשהבנייה כבר בוצעה בפועל. אם לא רלוונטי – למחוק.]]"),
    ...numbered([
      "מאחר ו[[תוספת המחסן]] כבר קיימת בפועל – הלקוח מצהיר ומאשר כי התוספת נבנתה על ידו (או מטעמו) טרם התקשרותו עמי, ללא מעורבות, תכנון, פיקוח או ידיעה מצדי בזמן הביצוע, ואין לי אחריות כלשהי לגבי התאמה מכל סוג של הבית הקיים להיתר הבנייה הקיים.",
      "הלקוח ייקח על עצמו אחריות מלאה ובלעדית לכל הליך מנהלי, פלילי או אזרחי (כגון תביעות, צווי הריסה או קנסות מהוועדה) הנובעים מקיום בנייה שטרם התקבל עבורה היתר.",
      "אין לי כל אחריות, הנדסית או בטיחותית, לגבי הבנייה הקיימת או המבוקשת במהות הבקשה (מאחר והיא כבר נבנתה).",
      "ההצעה מסתמכת על ההגשה הקיימת, ועל כך שאין חריגה כלשהי מהשטחים המותרים, מאחוזי הבנייה המותרים או מזכויות בנייה כלשהן, ושכל השטחים הקיימים והמבוקשים נכללו ואושרו ע\"י מחלקת הרישוי.",
      "אין לי אחריות כלשהי לגבי הבית / ההיתר הקיים, או לבדיקת התאמת הקיים בפועל להיתר הקיים / למוצג בבקשה זו כמבנה קיים.",
      TERMINATION,
    ]),

    section("שכר טרחה ותנאי תשלום"),
    para("שכר הטרחה עבור הסעיפים המפורטים לעיל: **[[6,000]] ₪ + מע\"מ**."),
    para(`עבודה מעבר למפורט תתומחר לפי שעות עבודה – ${RATE} ₪ + מע\"מ לשעת עבודה.`),
    stage("שלבי תשלום"),
    paymentTable([
      ["25%", "בחתימת החוזה"],
      ["15%", "לאחר קבלת תיק המידע ופתיחת הבקשה במערכת"],
      ["35%", "בסיום דרישות בקרת התכן (הבקשה ממתינה לדיון בוועדה)"],
      ["20%", "בסיום הגשת כל הנדרש לפי דרישות הוועדה"],
      ["5%", "בקבלת היתר הבנייה"],
    ], 6000),
    para(PAY_TERMS, { spacing: { before: 160 } }),
    note("* גמר התשלום לא יידחה באם המזמין החליט שלא למלא אחר דרישות הוועדה – תשלום אגרה / היטל / תשלום ליועץ כלשהו, או באם המזמין לא ידרוש את היתר הבנייה בפועל מרשות הרישוי וכו'."),

    ...signatures(),
    ...closing(),
  ];
}

// ---------- Build ----------
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const docs = [
    ["תבנית 1 - שינויי דיירים.docx", tenantChanges],
    ["תבנית 2 - שיפוץ.docx", renovation],
    ["תבנית 3 - רישוי היתר.docx", permit],
  ];
  for (const [name, fn] of docs) {
    const buf = await Packer.toBuffer(buildDoc(fn()));
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log("wrote", name);
  }
})();
