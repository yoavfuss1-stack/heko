// Quote builder shared by the web form (preview + Word download) and local tests.
// Markup in strings:  **bold**   [[missing value – shown in yellow]]
(function (root) {
  const fmt = (n) => (Number(n) || 0).toLocaleString("en-US");
  const num = (x) => Number(String(x).replace(/[^\d.]/g, "")) || 0;
  const has = (x) => String(x ?? "").trim() !== "";
  // value or a yellow "missing" marker
  const v = (x, label) => (has(x) ? String(x).trim() : `[[${label}]]`);
  const money = (x, label) => (has(x) && num(x) ? fmt(num(x)) : `[[${label}]]`);

  const TYPES = {
    tenant: "שינויי דיירים",
    reno: "שיפוץ",
    permit: "רישוי היתר",
  };

  const PAYMENTS = {
    tenant: [
      [20, "במעמד חתימת ההסכם ותחילת העבודה"],
      [25, "עם אישור תוכנית ההעמדה הסופית (סיום שלב א')"],
      [35, "עם מסירת סט תוכניות העבודה המלא לשינויי הדיירים (סיום שלב ב')"],
      [15, "עם מסירת תוכניות הנגרות והמטבח הסופיות (סיום שלב ג')"],
      [5, "עם סיום ביקורי הפיקוח העליון בשטח (סיום שלב ד')"],
    ],
    reno: [
      [15, "מקדמה – עם חתימת ההסכם"],
      [25, "גמר שלב א' – עם אישור חלופת התכנון הנבחרת"],
      [35, "גמר שלב ב' – עם מסירת סט תוכניות העבודה לקבלן"],
      [15, "גמר שלבים ג'+ד' – עם מסירת תוכניות הנגרות וסיום פגישות הבחירה"],
      [10, "גמר שלב ה' – עם סיום התקנות הנגרות והפיקוח האחרון"],
    ],
    permit: [
      [25, "בחתימת החוזה"],
      [15, "לאחר קבלת תיק המידע ופתיחת הבקשה במערכת"],
      [35, "בסיום דרישות בקרת התכן (הבקשה ממתינה לדיון בוועדה)"],
      [20, "בסיום הגשת כל הנדרש לפי דרישות הוועדה"],
      [5, "בקבלת היתר הבנייה"],
    ],
  };

  function today() {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
  }

  // Example values come from real past quotes; the form marks them as examples.
  function defaults(type) {
    const common = {
      type, date: today(), client: "", address: "", rate: "380", extraNotes: "",
      payments: PAYMENTS[type].map(([pct, label]) => ({ pct: String(pct), label })),
    };
    if (type === "tenant") return {
      ...common, sqm: "116", project: "נווה פארק, פתח תקווה",
      baths: "חדר רחצה הורים, חדר רחצה כללי, שירותי אורחים",
      carpentry: "2 ארונות כיור, 3 ארונות בגדים וקיר טלוויזיה בסלון",
      renders: "2", visits: "2", mTiles: "2", mLight: "2", mKitchen: "2",
      fee: "40000", walls: true, wallsFee: "4000",
    };
    if (type === "reno") return {
      ...common, scope: "חדרי רחצה ומטבח", property: "בית מגורים",
      measure: "חדרי הרחצה והמטבח", elev: "2 חדרי הרחצה ושירותי האורחים",
      mTiles: "2", mKitchen: "2", mLight: "2", hours: "3", visits: "5",
      p1: "6000", p2: "7000", p3: "5500", p4: "6000", p5: "5000",
    };
    return {
      ...common, permitKind: "שינויים", building: "בית צמוד קרקע",
      work: "תוספת מחסן וסגירת 2 פתחים בתקרת מפלס הקרקע",
      gramOther: true, gramBy: "אדריכל עמוס טלמור",
      existing: true, existingWhat: "תוספת המחסן", fee: "6000",
    };
  }

  function total(s) {
    if (s.type === "reno") return ["p1", "p2", "p3", "p4", "p5"].reduce((a, k) => a + num(s[k]), 0);
    return num(s.fee);
  }
  const pctSum = (s) => s.payments.reduce((a, p) => a + num(p.pct), 0);

  // ---------- Shared clauses ----------
  const meetingsCommon = (rate) => [
    "כל פגישת עבודה או ליווי (בזום או פרונטלית, לפי הצורך המקצועי) הינה עד 2.5 שעות, אלא אם צוין אחרת בהצעה.",
    "פגישות הליווי באולמות תצוגה, אצל ספקים, חברות מטבחים ונגרים ייערכו ברדיוס של עד כ-20 ק\"מ ממשרד המתכננת.",
    `בחירת ספקים ואולמות תצוגה מחוץ לאזור זה תתואם מראש בלבד, ותחויב בתוספת של ${rate} ₪ + מע\"מ לשעה, כולל זמן נסיעה.`,
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
  const termsDesign = (rate) => [
    `**סבבי תיקונים:** המחיר כולל עד 2 סבבי תיקונים לתוכניות בשלב הטיוטה. שינויים ותיקונים שיבקש המזמין לאחר אישור הסט הסופי וחתימתו – יחויבו לפי תעריף שעתי של ${rate} ₪ + מע\"מ.`,
    "**אחריות ספקים, בדיקות ותיאומים בשטח:** האחריות לבדיקת הגעת המוצרים הנכונים לשטח, נוכחות בזמן לקיחת מידות ע\"י ספקים, בדיקת תקינות המוצרים שהגיעו וטיב ההתקנות והביצוע של הספקים והמבצעים – חלה על הקבלן המבצע בלבד. כנ\"ל לגבי תיאום לוחות הזמנים בין הספקים השונים והפיקוח על טיב עבודתם. הצעה זו **אינה כוללת** תיאומים לאספקת סחורה כלשהי, או נוכחות של האדריכלית באתר בזמן קבלת סחורה (לרבות הגעה לצורך \"פתיחת דלת\").",
    "**פתיחת דלתות:** פתיחת הנכס והדלתות עבור ספקים, מתקינים ואנשי מקצוע תהיה באחריות הקבלן, המזמין או נציג מטעמו.",
    "**גבולות אחריות התכנון:** אחריות האדריכלית הינה על עבודות התכנון והעיצוב בלבד ועל מציאת פתרונות הקשורים בעיצוב הנכס ותשתיותיו. הצעה זו **אינה כוללת** פיקוח בנייה צמוד או אחריות כלשהי על טיב העבודה של הגורם המבצע בשטח. פיקוח עליון אינו פיקוח צמוד, ואינו מחליף מנהל עבודה או מפקח בנייה מוסמך.",
    "**אי-מתן אחריות על צדדים שלישיים:** המלצה על אנשי מקצוע, קבלנים או ספקים נעשית כמחווה מקצועית בלבד, ואינה כוללת אחריות או ערבות כלשהי לטיב עבודתם, לעמידתם בלוחות הזמנים או לאיכות המוצרים שלהם.",
  ];
  const TERMINATION = "**סיום התקשרות:** כל צד רשאי לסיים הסכם זה בכל עת, בהודעה בכתב של 14 יום מראש, ובלבד ששכר המתכננת שולם במלואו עד לאותו שלב, לרבות השלב/ים הנמצא/ים בתהליך ההכנה, על פי שלבי העבודה המתוארים לעיל.";
  const PAY_TERMS = "התשלום יבוצע ע\"י המזמין תוך 3 ימי עסקים ממועד דרישת התשלום.";

  const extraLines = (s) => String(s.extraNotes || "").split("\n").map((t) => t.trim()).filter(Boolean);

  // ---------- Model: a flat list of blocks ----------
  function model(s) {
    const B = [];
    let sec = 0;
    const p = (text, o = {}) => B.push({ k: "p", text, ...o });
    const section = (text) => B.push({ k: "section", text: `${++sec}. ${text}` });
    const stage = (text) => B.push({ k: "stage", text });
    const bullet = (text, level = 0) => B.push({ k: "bullet", text, level });
    const numbered = (items) => B.push({ k: "num", items });
    const note = (text) => B.push({ k: "note", text });
    const price = (text) => B.push({ k: "price", text });
    const rate = v(s.rate, "תעריף");
    const T = total(s);

    const payTable = () => {
      const rows = s.payments.filter((r) => has(r.label) || has(r.pct));
      const sum = pctSum(s);
      B.push({
        k: "table", widths: [700, 5338, 1300, 2300], totalRow: true,
        rows: [
          ["#", "אבן דרך לתשלום", "אחוז", "סכום (₪, לפני מע\"מ)"],
          ...rows.map((r, i) => [String(i + 1), v(r.label, "אבן דרך"), `${num(r.pct)}%`,
            T ? fmt(Math.round((T * num(r.pct)) / 100)) : "[[—]]"]),
          ["", "סה\"כ", sum === 100 ? "100%" : `[[${sum}%]]`, T ? `${fmt(T)} ₪` : "[[סכום]]"],
        ],
      });
      p(PAY_TERMS, { before: 160 });
    };

    B.push({ k: "meta", text: `תאריך: ${v(s.date, "תאריך")}` });
    B.push({ k: "meta", text: `לכבוד: ${v(s.client, "שם הלקוח/ות")}` });
    B.push({ k: "meta", text: `כתובת הנכס: ${v(s.address, "כתובת")}`, last: true });

    if (s.type === "tenant") {
      B.push({ k: "title", text: `הצעת מחיר – שינויי דיירים לדירת ${v(s.sqm, "גודל")} מ"ר בפרויקט ${v(s.project, "שם הפרויקט")}` });
      p("תודה על פנייתכם.");
      p("להלן הצעה לליווי אדריכלי ממוקד עבור דירתכם החדשה, תוך שימת דגש על אופטימיזציה של מערכות הבית, התאמת תשתיות הקבלן לצרכים הייחודיים שלכם, ותכנון נגרות ומטבח מותאמים אישית ברמה הגבוהה ביותר.");
      section("תכולת העבודה ושלבי הפרויקט");
      stage("שלב א': תכנון רעיוני ומערך העמדה");
      bullet("פגישת פרוגרמה (הגדרת צרכים, תקציב וסגנון).");
      bullet("פגישה עם מחלקת שינויי הדיירים לקבלת קבצים והנחיות (מקרא חשמל, תאורה וכו').");
      bullet("הכנת עד 3 חלופות להעמדת ריהוט (תוכנית מערך דו-ממדית) על גבי תוכנית המחיצות הקיימת של הקבלן, עד לבחירת הסקיצה המתאימה ביותר עבורכם.");
      stage("שלב ב': הפקת סט תוכניות עבודה לקבלן השינויים");
      p("לאחר אישור תוכנית ההעמדה, יופק סט תוכניות עבודה מלא, מפורט ומקצועי למתאם שינויי הדיירים של חברת הבנייה:");
      bullet(s.walls
        ? "תוכנית הריסה ובנייה – על גבי מערך קירות הפנים המקורי של הקבלן (ראו \"תוספות אפשריות\" בהמשך)."
        : "תוכנית הריסה ובנייה – על גבי מערך קירות הפנים המקורי של הקבלן.");
      bullet("תוכנית אינסטלציה (מיקומי כלים סניטריים, נקודות מים וניקוז).");
      bullet("תוכנית חשמל ותקשורת.");
      bullet("תוכנית תקרה ותאורה (מיקומי מפסקים, נקודות מאור וסוגי הדלקות).");
      bullet("תוכנית תקרות גבס, הנמכות ומיזוג אוויר (בהסתמך על התכנון הקיים).");
      bullet("תוכנית ריצוף – בהתאם לאריחים שייבחרו לחלל הדירה ולמרפסת, כולל אומדן כמויות.");
      bullet(`פריסות מפורטות לחדרי הרחצה (מיקומי ברזים, אינטרפוצים ופריסת אריחים), עבור: ${v(s.baths, "חדרי רחצה")}.`);
      bullet(`**ליווי באולמות תצוגה:** עד ${v(s.mTiles, "מס'")} פגישות לבחירת ריצוף, חיפויים וכלים סניטריים.`);
      stage("שלב ג': תכנון נגרות מותאמת אישית ומטבח");
      p("הפקת תוכניות עבודה מפורטות (תוכנית, חזיתות, חתכים, חומרים עקרוניים ומידות) לצורך קבלת הצעות מחיר מנגרים וחברות מטבחים:");
      bullet("תוכנית מטבח מלאה ומפורטת (כולל העמדת מכשירי חשמל ואינטגרציה, משטחים וחיפוי קיר).");
      bullet("פגישת סנכרון ותיאום אחת מול חברת המטבחים / הנגר שנבחר.");
      bullet(`תוכניות נגרות עבור: ${v(s.carpentry, "פריטי נגרות")} – עד 2 סקיצות לכל פריט.`);
      if (num(s.renders)) bullet(`עד ${num(s.renders)} הדמיות גושניות נפחיות למטבח / לפריט נגרות נבחר / לחלל הדירה.`);
      stage("שלב ד': פיקוח עליון");
      bullet(`עד ${v(s.visits, "מס'")} ביקורים מוגדרים מראש של האדריכלית בדירה בנקודות מפתח, כגון: בדיקת סימון קירות ותשתיות בשטח, ובדיקה לפני סגירת קירות גבס / ריצוף.`);
      bullet("עמידה בקשר מול מחלקת שינויי הדיירים בשלב התכנון, ומול הקבלן המבצע בשלב הביצוע.");

      section("פגישות וליווי הכלולים בהצעה");
      bullet("**פגישה 1 – פרוגרמה ואפיון צרכים:** הגדרת תקציב, סגנון עיצובי וצרכים פונקציונליים.");
      bullet("**פגישה 2 – הצגת חלופות והעמדת ריהוט:** בחירת הסקיצה הסופית שתהווה בסיס לתוכניות התשתיות.");
      bullet("**פגישה 3 – תכנון תשתיות:** תאורה, מיקומי שקעים, אינסטלציה ומיזוג אוויר.");
      bullet("**פגישה 4 – תכנון נגרות ומטבח:** קביעת פונקציות וחלוקות פנימיות, על בסיס שיעורי בית שיקבל המזמין מראש.");
      bullet("**פגישות ליווי באולמות תצוגה / ספקים:**");
      bullet(`עד ${v(s.mTiles, "מס'")} פגישות לבחירת ריצוף, חיפויים וכלים סניטריים.`, 1);
      bullet(`עד ${v(s.mLight, "מס'")} פגישות לבחירת תאורה.`, 1);
      bullet(`עד ${v(s.mKitchen, "מס'")} פגישות עם חברת מטבחים / משטחים למטבח ולחדרי הרחצה.`, 1);
      meetingsCommon(rate).forEach((t) => bullet(t));

      section("ההצעה אינה כוללת");
      EXCLUSIONS_DESIGN.forEach((t) => bullet(t));
      section("הערות ותנאים כלליים");
      numbered([...termsDesign(rate),
        "**הגשה אחת לקבלן:** תוכניות השינויים מופקות ומסופקות לקבלן כסט אחד מרוכז וסופי. בקשה לשינויים ולהגשה נוספת / מעודכנת לאחר שהסט נמסר למתאם השינויים – תתומחר לפי תעריף שעתי.",
        ...extraLines(s), TERMINATION]);

      section("שכר טרחה ותנאי תשלום");
      p(`סך שכר הטרחה עבור הליווי המלא (שלבים א'–ד'): **${money(s.fee, "סכום")} ₪ + מע"מ**.`);
      if (s.walls) {
        stage("תוספות אפשריות");
        bullet(`הצעה זו מבוססת על תכנון על גבי מערך הקירות הקיים של הקבלן. במידה ויוחלט על הזזה, שבירה או בנייה מחדש של **עד 2 קירות פנים**, תתווסף תוספת גלובלית חד-פעמית של **${money(s.wallsFee, "סכום")} ₪ + מע"מ**, המכסה את התכנון מחדש של אותם אזורים ואת עדכון תוכניות התשתיות (חשמל ואינסטלציה) באותם חללים.`);
      }
      stage("חלוקת התשלומים (לפי התקדמות שלבים)");
      payTable();
    }

    if (s.type === "reno") {
      const scope = v(s.scope, "מה משפצים");
      B.push({ k: "title", text: `הצעת מחיר – שיפוץ ${scope} ב${v(s.property, "סוג הנכס")} ב${v(s.address, "כתובת")}` });
      p("תודה על פנייתכם.");
      p(`להלן הצעה לליווי אדריכלי לשיפוץ ${scope}, משלב המדידות והחלופות ועד לפיקוח העליון.`);
      section("תכולת העבודה ושלבי הפרויקט");
      stage("שלב א': מדידות וחלופות תכנוניות");
      bullet("פגישת פרוגרמה מעמיקה להגדרת הצרכים, התקציב והסגנון העיצובי.");
      bullet(`מדידה ושרטוט ראשוני של ${v(s.measure, "מה מודדים")}.`);
      bullet("הכנת 2–3 חלופות רעיוניות לסידור המטבח מחדש (העמדת ריהוט ומכשירים).");
      bullet("הכנת חלופות לחלוקת חללי הרחצה והשירותים לניצול מקסימלי של המרחב.");
      bullet("סימון נקודות התאורה הדורשות בחירת גופי תאורה חדשים / ביטול / תוספת.");
      price(`**מחיר שלב א':** ${money(s.p1, "מחיר")} ₪ + מע"מ`);
      stage("שלב ב': תוכניות עבודה מפורטות לביצוע (סט קבלן)");
      p("הפקת סט שרטוטים מלא ומדויק הכולל:");
      bullet("תוכנית אינסטלציה (מיקומי נקודות מים, ניקוזים, אסלות תלויות ואינטרפוצים), כולל נקודות חשמל ותאורה.");
      bullet("תוכנית חשמל למטבח – מיקומי שקעים, נקודות כוח למכשירים, הכנה לתאורה במידת הצורך.");
      bullet(`תוכנית פריסת קירות מפורטת עבור ${v(s.elev, "חדרי רחצה")} (מיקומי אריחים וסניטריה).`);
      price(`**מחיר שלב ב':** ${money(s.p2, "מחיר")} ₪ + מע"מ`);
      stage("שלב ג': תוכניות נגרות מפורטות (מטבח וחדרי רחצה)");
      bullet("תכנון מפורט של ארונות המטבח, כולל פרטי נגרות והפקת תוכניות להגשה לחברות מטבחים או לנגר פרטי.");
      bullet("תכנון ארונות כיור ומראות ייעודיות לחדרי הרחצה והשירותים.");
      price(`**מחיר שלב ג':** ${money(s.p3, "מחיר")} ₪ + מע"מ`);
      stage("שלב ד': פגישות לבחירת חומרי גמר");
      const mt = num(s.mTiles) + num(s.mKitchen) + num(s.mLight);
      bullet(`**${mt} פגישות** (עד ${v(s.hours, "שעות")} שעות לפגישה) בבתי עסק במרכז הארץ:`);
      if (num(s.mTiles)) bullet(`${num(s.mTiles)} פגישות לבחירת קרמיקה, חיפויים, ריצוף וכלים סניטריים.`, 1);
      if (num(s.mKitchen)) bullet(`${num(s.mKitchen)} פגישות לסגירת מפרט המטבח (חברת מטבחים / נגר) ובחירת משטח.`, 1);
      if (num(s.mLight)) bullet(`${num(s.mLight)} פגישות לבחירת גופי תאורה.`, 1);
      price(`**מחיר שלב ד':** ${money(s.p4, "מחיר")} ₪ + מע"מ`);
      stage("שלב ה': פיקוח עליון");
      bullet(`עמידה בקשר מול הקבלן המבצע שנבחר, ו-${v(s.visits, "מס'")} הגעות לנכס בנקודות מפתח, כגון:`);
      ["לאחר ההריסה ולפני תחילת עבודות אינסטלציה / חשמל.", "בדיקת הכנות האינסטלציה והחשמל לפני סגירת קירות / ריצוף.",
        "בדיקת פריסת האריחים בתחילת עבודת החיפוי.", "במהלך התקנת הנגרות והמטבח.", "בגמר השיפוץ."].forEach((t) => bullet(t, 1));
      price(`**מחיר שלב ה':** ${money(s.p5, "מחיר")} ₪ + מע"מ`);

      section("סיכום עלויות");
      B.push({
        k: "table", widths: [700, 6138, 2800], totalRow: true,
        rows: [
          ["שלב", "תיאור השלב", "עלות (₪, לפני מע\"מ)"],
          ["א'", "מדידות וחלופות תכנוניות", money(s.p1, "מחיר")],
          ["ב'", "תוכניות עבודה לקבלן", money(s.p2, "מחיר")],
          ["ג'", "תוכניות נגרות מפורטות", money(s.p3, "מחיר")],
          ["ד'", "פגישות לבחירת חומרי גמר", money(s.p4, "מחיר")],
          ["ה'", "פיקוח עליון", money(s.p5, "מחיר")],
          ["", "שכר טרחה גלובלי לפרויקט", `${fmt(T)} ₪ + מע"מ`],
        ],
      });
      section("פגישות וליווי");
      meetingsCommon(rate).forEach((t) => bullet(t));
      section("ההצעה אינה כוללת");
      EXCLUSIONS_DESIGN.forEach((t) => bullet(t));
      section("הערות ותנאים כלליים");
      numbered([...termsDesign(rate), ...extraLines(s), TERMINATION]);
      section("תנאי תשלום");
      payTable();
    }

    if (s.type === "permit") {
      B.push({ k: "title", text: `הצעת מחיר – רישוי היתר ${v(s.permitKind, "סוג")} ל${v(s.building, "סוג המבנה")}` });
      p("תודה על פנייתכם.");
      p("להלן הצעה לטיפול בהליך הרישוי, עד לקבלת היתר הבנייה.");
      section("תכולת העבודה");
      bullet(`טיפול בכל שלבי הרישוי עד לקבלת היתר הבנייה, עבור ${v(s.work, "תיאור העבודה")}, ב${v(s.building, "סוג המבנה")} שנבנה לפי היתר בנייה קיים.`);
      bullet("הליך קבלת תיק מידע ופתיחת בקשה, במסגרת הליך רישוי מלא במערכת \"רישוי זמין\".");
      bullet("הזנת כלל הנתונים והקבצים שיתבקשו במערכת, ותיאום מול היועצים השונים ומול מחלקת הרישוי.");
      bullet("עדכון הבקשה לפי הערות הרישוי – עבור הערות ללא שינוי מהותי בלבד.");
      bullet(`הבקשה להיתר (גרמושקה) בקנה מידה 1:100, הכוללת מבטי על, חזיתות וחתכי המבנה, וכן קובץ חישובי שטחים וממ"ד${s.gramOther ? ` – תוגש כפי שהוכנה ע"י ${v(s.gramBy, "שם האדריכל")}` : ""}.`);
      note("* במידה וידרשו שינויים מהותיים כתוצאה מדרישות מחלקת הרישוי / הג\"א / המִנהל או כל גורם אחר – התשלום על שינויים / עדכונים אלה אינו כלול בהצעה זו, ויתומחר לפי שעה.");
      note("* הכל בכפוף לשיתוף פעולה מלא של המזמין בכל שלבי הטיפול, עד לקבלת היתר הבנייה.");
      section("ההצעה אינה כוללת");
      ["פגישות מחוץ למשרד. באם יידרשו פגישות כלשהן מחוץ למשרד – יתומחרו לפי שעה.",
        "טיפול בחתימות שכנים ו/או שליחת הודעות בדואר רשום (במידה ויידרש).",
        "טיפול מול רמ\"י (מ.מ.י) – **באחריות המזמין**.",
        "השירותים והיועצים שיידרשו לצורך קבלת ההיתר, לרבות: מודד, יועץ קרקע, מהנדס קונסטרוקציה, מהנדס אינסטלציה, מהנדס חשמל, אדריכל נוף, מכון התקנים, סקר עצים, אישור פקיד היערות וכיוצ\"ב.",
        "הפקת נסח טאבו, תשלום אגרות, היטלים, מיסים וכו' – על חשבון המזמין.",
        "הדפסות ושליחתן – ישולמו ע\"י המזמין ישירות למכון ההעתקות."].forEach((t) => bullet(t));
      section("הערות ותנאים כלליים");
      const ex = s.existing ? [
        `מאחר ו${v(s.existingWhat, "מה כבר נבנה")} כבר קיימת בפועל – הלקוח מצהיר ומאשר כי התוספת נבנתה על ידו (או מטעמו) טרם התקשרותו עמי, ללא מעורבות, תכנון, פיקוח או ידיעה מצדי בזמן הביצוע, ואין לי אחריות כלשהי לגבי התאמה מכל סוג של הבית הקיים להיתר הבנייה הקיים.`,
        "הלקוח ייקח על עצמו אחריות מלאה ובלעדית לכל הליך מנהלי, פלילי או אזרחי (כגון תביעות, צווי הריסה או קנסות מהוועדה) הנובעים מקיום בנייה שטרם התקבל עבורה היתר.",
        "אין לי כל אחריות, הנדסית או בטיחותית, לגבי הבנייה הקיימת או המבוקשת במהות הבקשה (מאחר והיא כבר נבנתה).",
        "ההצעה מסתמכת על ההגשה הקיימת, ועל כך שאין חריגה כלשהי מהשטחים המותרים, מאחוזי הבנייה המותרים או מזכויות בנייה כלשהן, ושכל השטחים הקיימים והמבוקשים נכללו ואושרו ע\"י מחלקת הרישוי.",
        "אין לי אחריות כלשהי לגבי הבית / ההיתר הקיים, או לבדיקת התאמת הקיים בפועל להיתר הקיים / למוצג בבקשה זו כמבנה קיים.",
      ] : [];
      numbered([...ex, ...extraLines(s), TERMINATION]);
      section("שכר טרחה ותנאי תשלום");
      p(`שכר הטרחה עבור הסעיפים המפורטים לעיל: **${money(s.fee, "סכום")} ₪ + מע"מ**.`);
      p(`עבודה מעבר למפורט תתומחר לפי שעות עבודה – ${rate} ₪ + מע"מ לשעת עבודה.`);
      stage("שלבי תשלום");
      payTable();
      note("* גמר התשלום לא יידחה באם המזמין החליט שלא למלא אחר דרישות הוועדה – תשלום אגרה / היטל / תשלום ליועץ כלשהו, או באם המזמין לא ידרוש את היתר הבנייה בפועל מרשות הרישוי וכו'.");
    }

    B.push({ k: "sign" });
    B.push({ k: "closing" });
    return B;
  }

  // ---------- Markup ----------
  function parse(text, base = {}) {
    const out = [];
    for (const part of String(text).split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g)) {
      if (!part) continue;
      if (part.startsWith("**")) { out.push(...parse(part.slice(2, -2), { ...base, bold: true })); continue; }
      if (part.startsWith("[[")) { out.push({ ...base, text: part.slice(2, -2), missing: true }); continue; }
      out.push({ ...base, text: part });
    }
    return out;
  }
  const missingCount = (blocks) => {
    const texts = [];
    blocks.forEach((b) => { if (b.text) texts.push(b.text); (b.items || []).forEach((t) => texts.push(t)); (b.rows || []).forEach((r) => texts.push(...r)); });
    return texts.reduce((n, t) => n + parse(t).filter((r) => r.missing).length, 0);
  };

  // ---------- HTML preview ----------
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const html = (text) => parse(text).map((r) => {
    let h = esc(r.text);
    if (r.bold) h = `<b>${h}</b>`;
    if (r.missing) h = `<mark>${h}</mark>`;
    return h;
  }).join("");

  function toHTML(blocks) {
    const out = [];
    let list = null;
    const close = () => { if (list) { out.push(`</ul>`); list = null; } };
    for (const b of blocks) {
      if (b.k !== "bullet") close();
      switch (b.k) {
        case "meta": out.push(`<p class="q-meta${b.last ? " last" : ""}">${html(b.text)}</p>`); break;
        case "title": out.push(`<h1 class="q-title">${html(b.text)}</h1>`); break;
        case "section": out.push(`<h2 class="q-sec">${html(b.text)}</h2>`); break;
        case "stage": out.push(`<h3 class="q-stage">${html(b.text)}</h3>`); break;
        case "p": out.push(`<p>${html(b.text)}</p>`); break;
        case "note": out.push(`<p class="q-note">${html(b.text)}</p>`); break;
        case "price": out.push(`<p class="q-price">${html(b.text)}</p>`); break;
        case "bullet":
          if (!list) { out.push(`<ul class="q-list">`); list = true; }
          out.push(`<li class="lvl${b.level}">${html(b.text)}</li>`); break;
        case "num": out.push(`<ol class="q-num">${b.items.map((t) => `<li>${html(t)}</li>`).join("")}</ol>`); break;
        case "table":
          out.push(`<div class="q-table-wrap"><table class="q-table">${b.rows.map((r, i) => {
            const tag = i === 0 ? "th" : "td";
            const cls = b.totalRow && i === b.rows.length - 1 ? ` class="total"` : "";
            return `<tr${cls}>${r.map((c) => `<${tag}>${html(c)}</${tag}>`).join("")}</tr>`;
          }).join("")}</table></div>`); break;
        case "sign":
          out.push(`<p class="q-sign-h"><b>ובזאת באו הצדדים על החתום:</b></p><div class="q-sign">${["חתימת המזמין/ים", "תאריך", "חתימת המתכננת"].map((t) => `<div><span></span>${t}</div>`).join("")}</div>`); break;
        case "closing":
          out.push(`<p class="q-close">אשמח לעמוד לרשותכם בכל שאלה.<br>בברכה,<br><b>Orit Lev Architect</b></p>`); break;
      }
    }
    close();
    return out.join("\n");
  }

  // ---------- Word (.docx) ----------
  function toDocx(blocks, D, logo) {
    const FONT = "Arial", ACCENT = "6E625A", MUTED = "8C8C8C", LINE = "C9C2BC", SHADE = "F3F0ED", BODY = 22;
    const PAGE_W = 11906, MARGIN = 1134, CW = PAGE_W - 2 * MARGIN;
    const runs = (text, o = {}) => parse(text).map((r) => new D.TextRun({
      text: r.text, font: FONT, size: o.size || BODY, rightToLeft: true, ...o,
      bold: r.bold || o.bold, highlight: r.missing ? "yellow" : undefined,
    }));
    const para = (text, opts = {}, ro = {}) => new D.Paragraph({
      bidirectional: true, spacing: { after: 100, line: 300 }, ...opts, children: runs(text, ro),
    });
    const border = { style: D.BorderStyle.SINGLE, size: 4, color: LINE };
    const noB = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const noBorders = { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB };
    const cellNoB = { top: noB, bottom: noB, left: noB, right: noB };
    let inst = 0;
    const kids = [];
    for (const b of blocks) {
      switch (b.k) {
        case "meta": kids.push(para(b.text, { spacing: { after: b.last ? 300 : 40 } })); break;
        case "title": kids.push(para(b.text, { alignment: D.AlignmentType.CENTER, spacing: { after: 300 } }, { bold: true, size: 32, color: ACCENT })); break;
        case "section": kids.push(para(b.text, { keepNext: true, spacing: { before: 360, after: 140 },
          border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: LINE, space: 4 } } }, { bold: true, size: 26, color: ACCENT })); break;
        case "stage": kids.push(para(b.text, { keepNext: true, spacing: { before: 220, after: 80 } }, { bold: true, size: 23 })); break;
        case "p": kids.push(para(b.text, b.before ? { spacing: { before: b.before, after: 100 } } : {})); break;
        case "note": kids.push(para(b.text, { spacing: { after: 80 } }, { italics: true, color: MUTED, size: 20 })); break;
        case "price": kids.push(para(b.text, { spacing: { before: 60, after: 120 }, indent: { start: 360 } })); break;
        case "bullet": kids.push(para(b.text, { numbering: { reference: "bul", level: b.level }, spacing: { after: 60, line: 290 } })); break;
        case "num": inst += 1; b.items.forEach((t) => kids.push(para(t, { numbering: { reference: "num", level: 0, instance: inst }, spacing: { after: 80, line: 290 } }))); break;
        case "table":
          kids.push(new D.Table({
            visuallyRightToLeft: true, width: { size: CW, type: D.WidthType.DXA }, columnWidths: b.widths,
            rows: b.rows.map((cells, ri) => {
              const shade = ri === 0 || (b.totalRow && ri === b.rows.length - 1);
              return new D.TableRow({
                tableHeader: ri === 0, cantSplit: true,
                children: cells.map((c, ci) => new D.TableCell({
                  borders: { top: border, bottom: border, left: border, right: border },
                  width: { size: b.widths[ci], type: D.WidthType.DXA },
                  shading: shade ? { fill: SHADE, type: D.ShadingType.CLEAR, color: "auto" } : undefined,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 }, verticalAlign: D.VerticalAlign.CENTER,
                  children: [para(c, { spacing: { after: 0 }, keepNext: ri < b.rows.length - 1, alignment: ci === 0 ? D.AlignmentType.CENTER : undefined }, { bold: shade, size: 21 })], // keepNext: table stays on one page
                })),
              });
            }),
          })); break;
        case "sign": {
          const w = [3212, 3213, 3213];
          const cell = (t) => new D.TableCell({
            borders: cellNoB, width: { size: w[0], type: D.WidthType.DXA },
            children: [para("_____________________", { alignment: D.AlignmentType.CENTER, spacing: { before: 440, after: 40 } }, { color: MUTED }),
              para(t, { alignment: D.AlignmentType.CENTER }, { size: 20 })],
          });
          kids.push(para("ובזאת באו הצדדים על החתום:", { spacing: { before: 280, after: 0 }, keepNext: true }, { bold: true }));
          kids.push(new D.Table({ visuallyRightToLeft: true, borders: noBorders, width: { size: CW, type: D.WidthType.DXA }, columnWidths: w,
            rows: [new D.TableRow({ cantSplit: true, children: [cell("חתימת המזמין/ים"), cell("תאריך"), cell("חתימת המתכננת")] })] }));
          break;
        }
        case "closing":
          kids.push(para("אשמח לעמוד לרשותכם בכל שאלה.", { spacing: { before: 240, after: 60 }, keepNext: true }));
          kids.push(para("בברכה,", { spacing: { after: 40 }, keepNext: true }));
          kids.push(para("Orit Lev Architect", {}, { bold: true, color: ACCENT }));
          break;
      }
    }
    const header = new D.Header({ children: [
      new D.Table({ visuallyRightToLeft: true, borders: noBorders, width: { size: CW, type: D.WidthType.DXA }, columnWidths: [CW - 1200, 1200],
        rows: [new D.TableRow({ children: [
          new D.TableCell({ borders: cellNoB, width: { size: CW - 1200, type: D.WidthType.DXA }, verticalAlign: D.VerticalAlign.BOTTOM,
            children: [new D.Paragraph({ bidirectional: true, children: [new D.TextRun({ text: "Orit Lev Architect", font: FONT, size: 20, color: ACCENT, characterSpacing: 30 })] })] }),
          new D.TableCell({ borders: cellNoB, width: { size: 1200, type: D.WidthType.DXA },
            children: [new D.Paragraph({ alignment: D.AlignmentType.LEFT, children: [new D.ImageRun({ type: "jpg", data: logo, transformation: { width: 46, height: 46 } })] })] }),
        ] })] }),
      new D.Paragraph({ border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: LINE, space: 1 } }, spacing: { after: 0 }, children: [] }),
    ] });
    const small = { font: FONT, size: 16, color: MUTED };
    const footer = new D.Footer({ children: [
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, border: { top: { style: D.BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
        children: [new D.TextRun({ text: "Orit Lev Architect  |  Tel: 03.5100885 / 054.397.2392  |  oritlev.arch@gmail.com", ...small })] }),
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, bidirectional: true, children: [
        new D.TextRun({ text: "עמוד ", ...small, rightToLeft: true }), new D.TextRun({ children: [D.PageNumber.CURRENT], ...small }),
        new D.TextRun({ text: " מתוך ", ...small, rightToLeft: true }), new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], ...small }),
      ] }),
    ] });
    const lvl = (level, text, fmt, indent) => ({ level, format: fmt, text, alignment: D.AlignmentType.START,
      style: { paragraph: { indent: { start: indent, hanging: 360 } }, run: { color: ACCENT } } });
    return new D.Document({
      creator: "Orit Lev Architect",
      styles: { default: { document: { run: { font: FONT, size: BODY } } } },
      numbering: { config: [
        { reference: "bul", levels: [lvl(0, "•", D.LevelFormat.BULLET, 540), lvl(1, "◦", D.LevelFormat.BULLET, 1080)] },
        { reference: "num", levels: [lvl(0, "%1.", D.LevelFormat.DECIMAL, 540)] },
      ] },
      sections: [{
        properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1500, bottom: 1300, left: MARGIN, right: MARGIN, header: 500, footer: 450 } } },
        headers: { default: header }, footers: { default: footer }, children: kids,
      }],
    });
  }

  function filename(s) {
    const clean = (x) => String(x || "").replace(/[\\/:*?"<>|]+/g, "-").trim();
    const parts = ["הצעת מחיר", TYPES[s.type], clean(s.client), clean(s.date).replace(/\//g, "-")].filter(Boolean);
    return parts.join(" - ") + ".docx";
  }

  root.QuoteCore = { TYPES, defaults, model, toHTML, toDocx, total, pctSum, missingCount, filename, fmt, num };
})(typeof window !== "undefined" ? window : globalThis);
