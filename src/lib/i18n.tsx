import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const KEY = "kmclu_lang";

type Dict = Record<string, string>;

const en: Dict = {
  // brand / common
  "brand.kmclu": "KMCLU",
  "brand.portal": "Degree Request Portal",
  "brand.examCell": "KMCLU Examination Cell",
  "nav.staff": "Staff",
  "nav.home": "Home",
  "nav.back": "← Back",
  "common.switchLang": "हिन्दी",
  "common.refresh": "Refresh",
  "common.cancel": "Cancel",
  "common.review": "Review",
  "common.approve": "Approve & forward",
  "common.deny": "Deny with reason",
  "common.stage": "Stage",
  "common.reset": "Reset demo data",

  // home
  "home.title": "Request your degree certificate",
  "home.intro":
    "Submit your details and your request will be verified by each department before your degree is issued. You can track the status anytime using your enrollment number and date of birth.",
  "home.new.title": "New degree request",
  "home.new.desc":
    "Enter your enrollment number, roll number, date of birth and course to start the verification process.",
  "home.track.title": "Track existing request",
  "home.track.desc":
    "Check which department is currently reviewing your request, or see the reason it was denied.",
  "home.flow.heading": "Verification flow",

  // request form
  "request.title": "New degree request",
  "request.intro":
    "Fill in your details exactly as on your student records. Your request will be routed to the Head of your department first.",
  "request.field.fullName": "Full name",
  "request.field.enrollmentNo": "Enrollment number",
  "request.field.rollNo": "Roll number",
  "request.field.dob": "Date of birth",
  "request.field.course": "Course / Programme",
  "request.field.coursePlaceholder": "Select your course…",
  "request.field.email": "Email (optional)",
  "request.field.phone": "Phone (optional)",
  "request.submit": "Submit request",
  "request.err.required": "Please fill all required fields.",
  "request.err.duplicate": "A request with these details is already in progress.",

  // track
  "track.title": "Track your request",
  "track.field.enrollmentNo": "Enrollment number",
  "track.field.rollNo": "Roll number",
  "track.field.dob": "Date of birth",
  "track.check": "Check status",
  "track.err.notFound": "No request found with these details.",
  "track.applicant": "Applicant",
  "track.enrollment": "Enrollment",
  "track.roll": "Roll",
  "track.deniedAt": "Denied at {stage}",
  "track.visitOffice": "Please visit the {stage} office to resolve the issue.",
  "track.ready": "Your degree is ready.",
  "track.download": "Download degree certificate",
  "track.stages": "Verification stages",
  "track.activity": "Activity",
  "track.state.approved": "Approved",
  "track.state.current": "In review",
  "track.state.pending": "Pending",
  "track.state.denied": "Denied",
  "track.status.pending": "PENDING",
  "track.status.approved": "APPROVED",
  "track.status.denied": "DENIED",
  "track.action.approved": "approved",
  "track.action.denied": "denied",

  // staff
  "staff.brand": "KMCLU Staff",
  "staff.selectDept": "Select your department",
  "staff.pickDept.title": "Pick your department",
  "staff.pickDept.desc": "Open this page in different tabs to act as different departments.",
  "staff.pickHodDept.title": "Which department do you head?",
  "staff.pickHodDept.desc": "You will only see requests from students of this department.",
  "staff.switchRole": "Switch role",
  "staff.pending": "Pending verifications",
  "staff.none": "No requests waiting for you right now.",
  "staff.denialLabel": "Denial reason (required only if denying)",
  "staff.denialPlaceholder": "Select a reason…",
  "staff.err.pickReason": "Please select a denial reason.",
  "staff.err.uploadCert": "Please upload the signed degree certificate before approving.",
  "staff.uploadLabel": "Degree certificate (PDF or image)",
  "staff.uploadHint": "This file will be available to the student for download once approved.",
  "staff.hodOf": "HOD — {dept}",

  // stage labels
  "stage.hod": "Head of Department",
  "stage.library": "Library",
  "stage.proctor": "Proctor Office",
  "stage.finance": "Finance",
  "stage.coe": "Controller of Examination",
  "stage.done": "Completed",

  // departments
  "dept.cse": "Computer Science & Engineering",
  "dept.ece": "Electronics & Communication",
  "dept.me": "Mechanical Engineering",
  "dept.ce": "Civil Engineering",
  "dept.ba": "Business Administration",
  "dept.sci": "Sciences",
  "dept.hum": "Humanities",

  // courses
  "course.btech-cse": "B.Tech — Computer Science",
  "course.btech-ece": "B.Tech — Electronics & Comm.",
  "course.btech-me": "B.Tech — Mechanical",
  "course.btech-ce": "B.Tech — Civil",
  "course.mba": "MBA",
  "course.bba": "BBA",
  "course.bsc-phy": "B.Sc — Physics",
  "course.bsc-math": "B.Sc — Mathematics",
  "course.ba-eng": "B.A — English",

  // denial reasons
  "reason.hod.0": "Student records incomplete in department",
  "reason.hod.1": "Pending internal marks not submitted",
  "reason.hod.2": "Course completion not verified by department",
  "reason.hod.3": "Mismatch in enrollment details",
  "reason.library.0": "Library books not returned",
  "reason.library.1": "Outstanding library fine pending",
  "reason.library.2": "Library no-dues form not submitted",
  "reason.proctor.0": "Disciplinary case pending",
  "reason.proctor.1": "Hostel no-dues not cleared",
  "reason.proctor.2": "Identity card not surrendered",
  "reason.finance.0": "Tuition fee balance pending",
  "reason.finance.1": "Examination fee not paid",
  "reason.finance.2": "Refundable caution money form missing",
  "reason.coe.0": "Examination records incomplete",
  "reason.coe.1": "Grade sheet discrepancy — visit COE office",
  "reason.coe.2": "Result withheld pending re-evaluation",
};

const hi: Dict = {
  "brand.kmclu": "केएमसीएलयू",
  "brand.portal": "डिग्री अनुरोध पोर्टल",
  "brand.examCell": "केएमसीएलयू परीक्षा प्रकोष्ठ",
  "nav.staff": "कर्मचारी",
  "nav.home": "होम",
  "nav.back": "← वापस",
  "common.switchLang": "English",
  "common.refresh": "ताज़ा करें",
  "common.cancel": "रद्द करें",
  "common.review": "समीक्षा करें",
  "common.approve": "स्वीकृत करें और आगे भेजें",
  "common.deny": "कारण सहित अस्वीकार करें",
  "common.stage": "चरण",
  "common.reset": "डेमो डेटा रीसेट करें",

  "home.title": "अपनी डिग्री प्रमाणपत्र के लिए अनुरोध करें",
  "home.intro":
    "अपनी जानकारी जमा करें। आपकी डिग्री जारी होने से पहले प्रत्येक विभाग द्वारा आपके अनुरोध का सत्यापन किया जाएगा। आप अपने नामांकन नंबर और जन्मतिथि से कभी भी स्थिति देख सकते हैं।",
  "home.new.title": "नया डिग्री अनुरोध",
  "home.new.desc":
    "सत्यापन प्रक्रिया शुरू करने के लिए अपना नामांकन नंबर, रोल नंबर, जन्मतिथि और पाठ्यक्रम दर्ज करें।",
  "home.track.title": "मौजूदा अनुरोध ट्रैक करें",
  "home.track.desc":
    "देखें कि कौन सा विभाग अभी आपके अनुरोध की समीक्षा कर रहा है, या अस्वीकृति का कारण देखें।",
  "home.flow.heading": "सत्यापन प्रक्रिया",

  "request.title": "नया डिग्री अनुरोध",
  "request.intro":
    "अपना विवरण ठीक वैसा ही भरें जैसा छात्र रिकॉर्ड में है। आपका अनुरोध पहले आपके विभागाध्यक्ष के पास भेजा जाएगा।",
  "request.field.fullName": "पूरा नाम",
  "request.field.enrollmentNo": "नामांकन संख्या",
  "request.field.rollNo": "रोल नंबर",
  "request.field.dob": "जन्म तिथि",
  "request.field.course": "पाठ्यक्रम",
  "request.field.coursePlaceholder": "अपना पाठ्यक्रम चुनें…",
  "request.field.email": "ईमेल (वैकल्पिक)",
  "request.field.phone": "फ़ोन (वैकल्पिक)",
  "request.submit": "अनुरोध जमा करें",
  "request.err.required": "कृपया सभी आवश्यक फ़ील्ड भरें।",
  "request.err.duplicate": "इन विवरणों के साथ एक अनुरोध पहले से प्रगति में है।",

  "track.title": "अपना अनुरोध ट्रैक करें",
  "track.field.enrollmentNo": "नामांकन संख्या",
  "track.field.rollNo": "रोल नंबर",
  "track.field.dob": "जन्म तिथि",
  "track.check": "स्थिति देखें",
  "track.err.notFound": "इन विवरणों के साथ कोई अनुरोध नहीं मिला।",
  "track.applicant": "आवेदक",
  "track.enrollment": "नामांकन",
  "track.roll": "रोल",
  "track.deniedAt": "{stage} पर अस्वीकृत",
  "track.visitOffice": "समस्या हल करने के लिए कृपया {stage} कार्यालय जाएँ।",
  "track.ready": "आपकी डिग्री तैयार है।",
  "track.download": "डिग्री प्रमाणपत्र डाउनलोड करें",
  "track.stages": "सत्यापन चरण",
  "track.activity": "गतिविधि",
  "track.state.approved": "स्वीकृत",
  "track.state.current": "समीक्षा में",
  "track.state.pending": "लंबित",
  "track.state.denied": "अस्वीकृत",
  "track.status.pending": "लंबित",
  "track.status.approved": "स्वीकृत",
  "track.status.denied": "अस्वीकृत",
  "track.action.approved": "स्वीकृत",
  "track.action.denied": "अस्वीकृत",

  "staff.brand": "केएमसीएलयू कर्मचारी",
  "staff.selectDept": "अपना विभाग चुनें",
  "staff.pickDept.title": "अपना विभाग चुनें",
  "staff.pickDept.desc": "विभिन्न विभागों के रूप में कार्य करने के लिए इस पृष्ठ को अलग-अलग टैब में खोलें।",
  "staff.pickHodDept.title": "आप किस विभाग के प्रमुख हैं?",
  "staff.pickHodDept.desc": "आप केवल इस विभाग के छात्रों के अनुरोध देखेंगे।",
  "staff.switchRole": "भूमिका बदलें",
  "staff.pending": "लंबित सत्यापन",
  "staff.none": "अभी आपके लिए कोई अनुरोध प्रतीक्षारत नहीं है।",
  "staff.denialLabel": "अस्वीकृति कारण (केवल अस्वीकार करने पर आवश्यक)",
  "staff.denialPlaceholder": "कारण चुनें…",
  "staff.err.pickReason": "कृपया एक अस्वीकृति कारण चुनें।",
  "staff.err.uploadCert": "कृपया स्वीकृत करने से पहले हस्ताक्षरित डिग्री प्रमाणपत्र अपलोड करें।",
  "staff.uploadLabel": "डिग्री प्रमाणपत्र (पीडीएफ या छवि)",
  "staff.uploadHint": "स्वीकृत होने के बाद यह फ़ाइल छात्र को डाउनलोड के लिए उपलब्ध होगी।",
  "staff.hodOf": "विभागाध्यक्ष — {dept}",

  "stage.hod": "विभागाध्यक्ष",
  "stage.library": "पुस्तकालय",
  "stage.proctor": "प्रॉक्टर कार्यालय",
  "stage.finance": "वित्त",
  "stage.coe": "परीक्षा नियंत्रक",
  "stage.done": "पूर्ण",

  "dept.cse": "कंप्यूटर विज्ञान एवं अभियांत्रिकी",
  "dept.ece": "इलेक्ट्रॉनिक्स एवं संचार",
  "dept.me": "यांत्रिक अभियांत्रिकी",
  "dept.ce": "सिविल अभियांत्रिकी",
  "dept.ba": "व्यवसाय प्रशासन",
  "dept.sci": "विज्ञान",
  "dept.hum": "मानविकी",

  "course.btech-cse": "बी.टेक — कंप्यूटर विज्ञान",
  "course.btech-ece": "बी.टेक — इलेक्ट्रॉनिक्स एवं संचार",
  "course.btech-me": "बी.टेक — यांत्रिक",
  "course.btech-ce": "बी.टेक — सिविल",
  "course.mba": "एमबीए",
  "course.bba": "बीबीए",
  "course.bsc-phy": "बी.एससी — भौतिकी",
  "course.bsc-math": "बी.एससी — गणित",
  "course.ba-eng": "बी.ए — अंग्रेज़ी",

  "reason.hod.0": "विभाग में छात्र रिकॉर्ड अधूरे हैं",
  "reason.hod.1": "आंतरिक अंक जमा नहीं किए गए",
  "reason.hod.2": "विभाग द्वारा पाठ्यक्रम पूर्णता सत्यापित नहीं",
  "reason.hod.3": "नामांकन विवरण में असंगति",
  "reason.library.0": "पुस्तकालय की पुस्तकें वापस नहीं की गईं",
  "reason.library.1": "पुस्तकालय का बकाया जुर्माना शेष है",
  "reason.library.2": "पुस्तकालय अदेय प्रमाणपत्र जमा नहीं किया",
  "reason.proctor.0": "अनुशासनात्मक मामला लंबित",
  "reason.proctor.1": "हॉस्टल अदेय प्रमाणपत्र नहीं मिला",
  "reason.proctor.2": "पहचान पत्र जमा नहीं किया गया",
  "reason.finance.0": "ट्यूशन फीस शेष है",
  "reason.finance.1": "परीक्षा शुल्क का भुगतान नहीं किया गया",
  "reason.finance.2": "वापसी योग्य कॉशन मनी फ़ॉर्म गायब है",
  "reason.coe.0": "परीक्षा रिकॉर्ड अधूरे हैं",
  "reason.coe.1": "ग्रेड शीट में असंगति — सीओई कार्यालय जाएँ",
  "reason.coe.2": "पुनर्मूल्यांकन के लिए परिणाम रोका गया",
};

const DICTS: Record<Lang, Dict> = { en, hi };

// Map English strings that get stored in data (denial reasons, stored labels)
// to translation keys so we can display them in either language.
export const REASON_KEY_BY_EN: Record<string, string> = {};
[
  "hod.0","hod.1","hod.2","hod.3",
  "library.0","library.1","library.2",
  "proctor.0","proctor.1","proctor.2",
  "finance.0","finance.1","finance.2",
  "coe.0","coe.1","coe.2",
].forEach((k) => {
  REASON_KEY_BY_EN[en[`reason.${k}`]] = `reason.${k}`;
});

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(KEY)) as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(KEY, l);
  }

  function t(key: string, vars?: Record<string, string>) {
    const dict = DICTS[lang];
    let s = dict[key] ?? en[key] ?? key;
    if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
    return s;
  }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}

export function useT() {
  return useI18n().t;
}

// Helper: translate a stored English denial reason.
export function tReason(t: (k: string) => string, en: string | null | undefined) {
  if (!en) return "";
  const key = REASON_KEY_BY_EN[en];
  return key ? t(key) : en;
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className={`rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-accent ${className}`}
      aria-label="Toggle language"
    >
      {t("common.switchLang")}
    </button>
  );
}
