/**
 * Translation Module
 * Handles Arabic and English translations
 */

export const translations = {
    en: {
        // Navigation
        overview: 'Overview',
        myChildren: 'My Children',
        notifications: 'Notifications',
        records: 'Records',
        calendar: 'Calendar',
        logout: 'Logout',
        
        // Overview
        totalChildren: 'Total Children',
        unreadNotifications: 'Unread Notifications',
        totalRecords: 'Total Records',
        standingToday: 'Standing Today',
        quickActions: 'Quick Actions',
        viewChildren: 'View Children',
        checkNotifications: 'Check Notifications',
        viewRecords: 'View Records',
        
        // Children
        noChildrenRegistered: 'No children registered yet',
        lastActivity: 'Last activity',
        standingUp: 'Standing Up',
        wearingUniform: 'Wearing Uniform',
        totalRecordsLabel: 'Total Records',
        
        // Notifications
        markAllRead: 'Mark all read',
        noNotifications: 'No notifications yet',
        childStoodUp: 'Child stood up!',
        childNotStanding: 'Child is not standing',
        childHasWakedUp: 'Child has waked up! (Standing check complete)',
        childWearingUniform: 'Child is wearing uniform! (Clothing check complete)',
        allChecksComplete: 'All checks complete! Child has waked up and is wearing uniform.',
        
        // Records
        recentRecords: 'Recent Records',
        noRecords: 'No records yet',
        childStoodUpRecord: 'Child Stood Up',
        childNotStandingRecord: 'Child Not Standing',
        duration: 'Duration',
        
        // Calendar
        wakingTimesCalendar: 'Waking Times Calendar',
        previous: 'Previous',
        next: 'Next',
        woke: 'Woke',
        uniform: 'Uniform',
        noRecordsCalendar: 'No records yet. Complete checks will appear here.',
        
        // Child Dashboard
        childDashboard: 'Child Dashboard',
        pleaseStandUp: 'Please Stand Up',
        standUpToBegin: 'Stand up to begin check',
        standingDetected: 'Standing Detected',
        startingTimer: 'Starting timer...',
        standing: 'Standing',
        keepStanding: 'Keep standing...',
        standingComplete: 'Standing: Complete',
        uniformCheck: 'Uniform Check',
        pleaseWearUniform: 'Please Wear Uniform',
        putOnBlackTop: 'Put on black top',
        uniformDetected: 'Uniform Detected',
        keepWearingUniform: 'Keep wearing uniform...',
        uniformComplete: 'Uniform: Complete',
        allChecksCompleteTitle: 'All Checks Complete!',
        standingCheckmark: 'Standing ✓',
        uniformCheckmark: 'Uniform ✓',
        detectionStopped: 'Detection Stopped',
        initializingCamera: 'Initializing camera...',
        pleaseWait: 'Please wait',
        
        // Login/Register
        standingDetection: 'Standing Detection',
        chooseDashboard: 'Choose your dashboard',
        parentDashboard: 'Parent Dashboard',
        monitorActivity: 'Monitor your children\'s activity',
        loginAsParent: 'Login as Parent',
        childDashboardTitle: 'Child Dashboard',
        standingDetectionForChildren: 'Standing detection for children',
        loginAsChild: 'Login as Child',
        login: 'Login',
        register: 'Register',
        username: 'Username',
        password: 'Password',
        name: 'Name',
        fathersName: 'Father\'s Name',
        accountType: 'Account Type',
        parent: 'Parent',
        child: 'Child',
        dontHaveAccount: 'Don\'t have an account?',
        alreadyHaveAccount: 'Already have an account?',
        
        // Common
        refresh: 'Refresh',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        back: 'Back',
        today: 'Today',
        yesterday: 'Yesterday',
        justNow: 'Just now',
        minutesAgo: 'm ago',
        hoursAgo: 'h ago',
        daysAgo: 'd ago',
        
        // Months
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
        
        // Days
        sunday: 'Sun',
        monday: 'Mon',
        tuesday: 'Tue',
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat'
    },
    ar: {
        // Navigation
        overview: 'نظرة عامة',
        myChildren: 'أطفالي',
        notifications: 'الإشعارات',
        records: 'السجلات',
        calendar: 'التقويم',
        logout: 'تسجيل الخروج',
        
        // Overview
        totalChildren: 'إجمالي الأطفال',
        unreadNotifications: 'إشعارات غير مقروءة',
        totalRecords: 'إجمالي السجلات',
        standingToday: 'الوقوف اليوم',
        quickActions: 'إجراءات سريعة',
        viewChildren: 'عرض الأطفال',
        checkNotifications: 'التحقق من الإشعارات',
        viewRecords: 'عرض السجلات',
        
        // Children
        noChildrenRegistered: 'لا يوجد أطفال مسجلون بعد',
        lastActivity: 'آخر نشاط',
        standingUp: 'الوقوف',
        wearingUniform: 'ارتداء الزي',
        totalRecordsLabel: 'إجمالي السجلات',
        
        // Notifications
        markAllRead: 'تعليم الكل كمقروء',
        noNotifications: 'لا توجد إشعارات بعد',
        childStoodUp: 'وقف الطفل!',
        childNotStanding: 'الطفل لا يقف',
        childHasWakedUp: 'استيقظ الطفل! (اكتمل فحص الوقوف)',
        childWearingUniform: 'الطفل يرتدي الزي! (اكتمل فحص الزي)',
        allChecksComplete: 'اكتملت جميع الفحوصات! استيقظ الطفل ويرتدي الزي.',
        
        // Records
        recentRecords: 'السجلات الأخيرة',
        noRecords: 'لا توجد سجلات بعد',
        childStoodUpRecord: 'وقف الطفل',
        childNotStandingRecord: 'الطفل لا يقف',
        duration: 'المدة',
        
        // Calendar
        wakingTimesCalendar: 'تقويم أوقات الاستيقاظ',
        previous: 'السابق',
        next: 'التالي',
        woke: 'استيقظ',
        uniform: 'الزي',
        noRecordsCalendar: 'لا توجد سجلات بعد. ستظهر الفحوصات المكتملة هنا.',
        
        // Child Dashboard
        childDashboard: 'لوحة تحكم الطفل',
        pleaseStandUp: 'يرجى الوقوف',
        standUpToBegin: 'قف لبدء الفحص',
        standingDetected: 'تم اكتشاف الوقوف',
        startingTimer: 'بدء المؤقت...',
        standing: 'الوقوف',
        keepStanding: 'استمر في الوقوف...',
        standingComplete: 'الوقوف: مكتمل',
        uniformCheck: 'فحص الزي',
        pleaseWearUniform: 'يرجى ارتداء الزي',
        putOnBlackTop: 'ارتدِ قميصاً أسود',
        uniformDetected: 'تم اكتشاف الزي',
        keepWearingUniform: 'استمر في ارتداء الزي...',
        uniformComplete: 'الزي: مكتمل',
        allChecksCompleteTitle: 'اكتملت جميع الفحوصات!',
        standingCheckmark: 'الوقوف ✓',
        uniformCheckmark: 'الزي ✓',
        detectionStopped: 'توقف الكشف',
        initializingCamera: 'تهيئة الكاميرا...',
        pleaseWait: 'يرجى الانتظار',
        
        // Login/Register
        standingDetection: 'كشف الوقوف',
        chooseDashboard: 'اختر لوحة التحكم',
        parentDashboard: 'لوحة تحكم الوالد',
        monitorActivity: 'مراقبة نشاط أطفالك',
        loginAsParent: 'تسجيل الدخول كوالد',
        childDashboardTitle: 'لوحة تحكم الطفل',
        standingDetectionForChildren: 'كشف الوقوف للأطفال',
        loginAsChild: 'تسجيل الدخول كطفل',
        login: 'تسجيل الدخول',
        register: 'التسجيل',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        name: 'الاسم',
        fathersName: 'اسم الأب',
        accountType: 'نوع الحساب',
        parent: 'والد',
        child: 'طفل',
        dontHaveAccount: 'ليس لديك حساب؟',
        alreadyHaveAccount: 'لديك حساب بالفعل؟',
        
        // Common
        refresh: 'تحديث',
        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجح',
        cancel: 'إلغاء',
        save: 'حفظ',
        delete: 'حذف',
        edit: 'تعديل',
        close: 'إغلاق',
        back: 'رجوع',
        today: 'اليوم',
        yesterday: 'أمس',
        justNow: 'الآن',
        minutesAgo: 'دقيقة مضت',
        hoursAgo: 'ساعة مضت',
        daysAgo: 'يوم مضت',
        
        // Months
        january: 'يناير',
        february: 'فبراير',
        march: 'مارس',
        april: 'أبريل',
        may: 'مايو',
        june: 'يونيو',
        july: 'يوليو',
        august: 'أغسطس',
        september: 'سبتمبر',
        october: 'أكتوبر',
        november: 'نوفمبر',
        december: 'ديسمبر',
        
        // Days
        sunday: 'أحد',
        monday: 'إثنين',
        tuesday: 'ثلاثاء',
        wednesday: 'أربعاء',
        thursday: 'خميس',
        friday: 'جمعة',
        saturday: 'سبت'
    }
};

export class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('app_language') || 'en';
        this.translations = translations;
    }

    /**
     * Get translation for a key
     */
    t(key, lang = null) {
        const language = lang || this.currentLang;
        return this.translations[language]?.[key] || key;
    }

    /**
     * Set current language
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('app_language', lang);
            return true;
        }
        return false;
    }

    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLang;
    }

    /**
     * Check if current language is RTL
     */
    isRTL() {
        return this.currentLang === 'ar';
    }

    /**
     * Apply language to document
     */
    applyLanguage() {
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
    }
}

// Create global instance
export const translationManager = new TranslationManager();


