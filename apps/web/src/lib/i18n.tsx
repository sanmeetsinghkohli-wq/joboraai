'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'ar';
const KEY = 'jobora_locale';

/**
 * Arabic for the workspace shell and the main page headings. Keys are the
 * English text, so anything not listed simply stays in English.
 */
const AR: Record<string, string> = {
  // Navigation
  Home: 'الرئيسية',
  'My profile': 'ملفي المهني',
  Find: 'ابحث',
  Jobs: 'الوظائف',
  Applications: 'الطلبات',
  Outbox: 'صندوق الصادر',
  Apply: 'قدّم',
  'CV & documents': 'السيرة الذاتية والمستندات',
  'Career Ops': 'عمليات المسار المهني',
  Grow: 'تطوّر',
  'Interview practice': 'التدرّب على المقابلات',
  'Learning roadmap': 'خطة التعلّم',
  Analytics: 'التحليلات',
  'GCC guide': 'دليل الخليج',
  LinkedIn: 'لينكدإن',
  Copilot: 'المساعد',
  // Shell and menu
  'Account settings': 'إعدادات الحساب',
  Activity: 'النشاط',
  Theme: 'المظهر',
  light: 'فاتح',
  dark: 'داكن',
  system: 'النظام',
  Language: 'اللغة',
  'Log out': 'تسجيل الخروج',
  'Open menu': 'فتح القائمة',
  'Close menu': 'إغلاق القائمة',
  'Open Copilot': 'فتح المساعد',
  'Profile completeness': 'اكتمال الملف',
  'Search jobs, pages and tools': 'ابحث في الوظائف والصفحات والأدوات',
  // Dashboard
  Today: 'اليوم',
  'All reminders': 'كل التذكيرات',
  Pipeline: 'مسار الطلبات',
  'Open board': 'فتح اللوحة',
  'This week': 'هذا الأسبوع',
  'Job alerts': 'تنبيهات الوظائف',
  Manage: 'إدارة',
  'Matched for you': 'مناسبة لك',
  'Latest roles': 'أحدث الوظائف',
  'All jobs': 'كل الوظائف',
  'Recent activity': 'آخر النشاطات',
  All: 'الكل',
  'Applications sent': 'طلبات مُرسلة',
  'Emails sent': 'رسائل مُرسلة',
  'Interview answers practised': 'إجابات مقابلات تدرّبت عليها',
  'Change goals': 'تعديل الأهداف',
  'Save goals': 'حفظ الأهداف',
  Cancel: 'إلغاء',
  // Jobs
  'Save as alert': 'احفظ كتنبيه',
  Alerts: 'التنبيهات',
  new: 'جديدة',
  // GCC guide
  'Working in the Gulf': 'العمل في الخليج',
  'GCC career guide': 'دليل المسار المهني في الخليج',
  'Official sources': 'المصادر الرسمية',
  'Local hiring: ': 'التوظيف المحلي: ',
  'Graduate and early-career roles': 'وظائف الخريجين وبداية المسار',
  'Terms you will hear': 'مصطلحات ستسمعها',
  'This is general guidance, not legal or immigration advice. Rules change often and depend on your nationality, role and employer. Always check the official site linked for each country, or ask your employer’s HR team, before you act.':
    'هذه إرشادات عامة وليست استشارة قانونية أو استشارة هجرة. تتغيّر القواعد كثيراً وتعتمد على جنسيتك ووظيفتك وجهة عملك. راجع دائماً الموقع الرسمي لكل دولة أو قسم الموارد البشرية لدى جهة عملك قبل أي إجراء.',
  // Interview history
  'Your practice history': 'سجلّ تدريبك',
  'Clear history': 'مسح السجلّ',
  'Answers scored': 'إجابات مُقيَّمة',
  'Last 5 average': 'متوسط آخر 5',
  'Versus the 5 before': 'مقارنة بالخمس السابقة',
};

export function translate(locale: Locale, text: string): string {
  return locale === 'ar' ? AR[text] ?? text : text;
}

function readLocale(): Locale {
  try {
    return localStorage.getItem(KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

const I18n = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({ locale: 'en', setLocale: () => {} });

/** Applies the chosen language and direction while the workspace is mounted. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setState] = useState<Locale>('en');

  useEffect(() => {
    const initial = readLocale();
    setState(initial);
    applyLocale(initial);
    return () => applyLocale('en');
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable: applies for this visit only */
    }
    applyLocale(l);
  }, []);

  return <I18n.Provider value={{ locale, setLocale }}>{children}</I18n.Provider>;
}

export function useLocale() {
  return useContext(I18n);
}

/** `t('Home')` returns the Arabic text when Arabic is on, otherwise the English. */
export function useT() {
  const { locale } = useContext(I18n);
  return useCallback((text: string) => translate(locale, text), [locale]);
}
