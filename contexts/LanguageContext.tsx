import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Lang = "en" | "ar";

const translations = {
  en: {
    appTitle: "SafeGuard AI",
    newChat: "New Analysis",
    noChats: "No conversations yet",
    noChatsDesc: "Start a new safety analysis",
    typeMessage: "Ask about safety...",
    send: "Send",
    delete: "Delete",
    settings: "Settings",
    language: "Language",
    camera: "Camera",
    gallery: "Gallery",
    cancel: "Cancel",
    analyzeImage: "Analyze Image",
    safetyExpert: "Safety Expert AI",
    welcomeTitle: "Safety Inspection Assistant",
    welcomeDesc:
      "Upload workplace photos for PPE compliance analysis or ask safety questions",
    feature1: "PPE Detection",
    feature1Desc: "Helmets, vests, gloves & more",
    feature2: "Hazard Analysis",
    feature2Desc: "Identify workplace risks",
    feature3: "Safety Reports",
    feature3Desc: "Detailed compliance reports",
    today: "Today",
    yesterday: "Yesterday",
    deleteChat: "Delete conversation?",
    deleteChatDesc: "This action cannot be undone",
    confirm: "Delete",
    chatDeleted: "Conversation deleted",
    attachFile: "Attach File",
    file: "File",
    fileAnalysis: "File Analysis",
    profile: "Profile",
    editProfile: "Edit Profile",
    name: "Name",
    jobTitle: "Job Title",
    company: "Company",
    department: "Department",
    industry: "Industry",
    certifications: "Certifications",
    experience: "Experience",
    save: "Save",
    profileSaved: "Profile saved",
    profileHint: "Your profile helps the AI give personalized safety advice",
    namePlaceholder: "e.g. Ahmed, John",
    jobTitlePlaceholder: "e.g. Safety Engineer, HSE Manager",
    companyPlaceholder: "e.g. Aramco, SABIC",
    departmentPlaceholder: "e.g. HSE, Operations",
    industryPlaceholder: "e.g. Oil & Gas, Construction",
    certificationsPlaceholder: "e.g. NEBOSH, CSP, OSHA 30",
    experiencePlaceholder: "e.g. 5 years in safety",
  },
  ar: {
    appTitle: "SafeGuard AI",
    newChat: "تحليل جديد",
    noChats: "لا توجد محادثات",
    noChatsDesc: "ابدأ تحليل سلامة جديد",
    typeMessage: "اسأل عن السلامة...",
    send: "إرسال",
    delete: "حذف",
    settings: "الإعدادات",
    language: "اللغة",
    camera: "الكاميرا",
    gallery: "المعرض",
    cancel: "إلغاء",
    analyzeImage: "تحليل الصورة",
    safetyExpert: "خبير السلامة الذكي",
    welcomeTitle: "مساعد فحص السلامة",
    welcomeDesc:
      "ارفع صور مواقع العمل لتحليل التزام معدات الحماية أو اسأل أسئلة السلامة",
    feature1: "كشف معدات الحماية",
    feature1Desc: "خوذ، سترات، قفازات والمزيد",
    feature2: "تحليل المخاطر",
    feature2Desc: "تحديد مخاطر بيئة العمل",
    feature3: "تقارير السلامة",
    feature3Desc: "تقارير امتثال مفصلة",
    today: "اليوم",
    yesterday: "أمس",
    deleteChat: "حذف المحادثة؟",
    deleteChatDesc: "لا يمكن التراجع عن هذا الإجراء",
    confirm: "حذف",
    chatDeleted: "تم حذف المحادثة",
    attachFile: "إرفاق ملف",
    file: "ملف",
    fileAnalysis: "تحليل ملف",
    profile: "الملف الشخصي",
    editProfile: "تعديل الملف الشخصي",
    name: "الاسم",
    jobTitle: "المسمى الوظيفي",
    company: "الشركة",
    department: "القسم",
    industry: "القطاع",
    certifications: "الشهادات",
    experience: "الخبرة",
    save: "حفظ",
    profileSaved: "تم حفظ الملف الشخصي",
    profileHint: "ملفك الشخصي يساعد الذكاء الاصطناعي على تقديم نصائح سلامة مخصصة",
    namePlaceholder: "مثال: أحمد، محمد",
    jobTitlePlaceholder: "مثال: مهندس سلامة، مدير HSE",
    companyPlaceholder: "مثال: أرامكو، سابك",
    departmentPlaceholder: "مثال: السلامة، العمليات",
    industryPlaceholder: "مثال: نفط وغاز، إنشاءات",
    certificationsPlaceholder: "مثال: NEBOSH, CSP, OSHA 30",
    experiencePlaceholder: "مثال: 5 سنوات في السلامة",
  },
} as const;

type Translations = { [K in keyof typeof translations.en]: string };

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((saved) => {
      if (saved === "ar" || saved === "en") {
        setLangState(saved);
      }
    });
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    AsyncStorage.setItem("app_language", newLang);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: translations[lang],
      isRTL: lang === "ar",
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
