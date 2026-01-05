/**
 * Translation Manager
 * Handles static and dynamic text translation for English and Arabic keys.
 */
export const TRANSLATIONS = {
    en: {
        // Auth & General
        appName: "Waking Up",
        welcomeBack: "Welcome Back",
        signInSubtitle: "Sign in to manage your family's routine.",
        parent: "Parent",
        child: "Child",
        username: "Username",
        childName: "Child Name",
        password: "Password",
        enterUsername: "Enter your username",
        enterChildName: "Enter child name",
        enterPassword: "Enter your password",
        forgotPassword: "Forgot password?",
        login: "Log In",
        noAccount: "Don't have an account?",
        signUpNow: "Sign up now",
        createAccount: "Create Account",
        joinSubtitle: "Join the smart routine revolution.",
        parentMode: "Parent Mode",
        childMode: "Child Mode",
        email: "Email Address",
        enterEmail: "Enter your email",
        terms: "By accessing the system, you agree to our",
        helpCenter: "Help Center",
        fullName: "Full Name",
        enterFullName: "Enter your full name",
        chooseUsername: "Choose your username",
        fathersName: "Father's Name",
        forChildrenOnly: "(for children only)",
        createSecureKey: "Create a secure key",
        termsOfService: "Terms of Service",
        privacyProtocols: "Privacy Protocols",
        alreadyHaveAccount: "Already have an account?",

        // Child Dashboard
        scanningBody: "SCANNING BODY",
        standStill: "Stand Still",
        holdFor: "HOLD FOR",
        task: "CURRENT TASK",
        taskInstruction: "Stand straight inside the circle",
        initializingCamera: "Initializing Camera...",
        pleaseWait: "Please wait",
        standing: "Standing",
        keepStanding: "Keep standing still",
        startingTimer: "Starting timer...",
        pleaseStandUp: "Please Stand Up",
        standUpToBegin: "Stand up to begin",
        uniformCheck: "Uniform Check",
        standingComplete: "Standing Complete",
        keepWearingUniform: "Keep wearing uniform",
        putOnBlackTop: "Put on your black top",
        pleaseWearUniform: "Please Wear Uniform",
        allChecksCompleteTitle: "Checks Complete",
        standingCheckmark: "Standing ✓",
        uniformCheckmark: "Uniform ✓",
        detectionStopped: "Alarm Silenced",
        alarmSilenced: "Alarm Silenced!",
        checkPermissions: "Please check camera permissions",
        holdPosition: "Hold your position!",
        scanning: "Scanning...",
        completeStatus: "Complete",
        holdStillUniform: "Hold still for uniform check!",
        putOnUniformInstruction: "Put on your black school uniform",
        missionComplete: "Mission Complete",
        allChecksCompleteMessage: "All checks complete! Great job! 🎉",
        greatJobStanding: "Great job standing up!",

        preparingUniformCheck: "Prepare for uniform check...",

        // Parent Dashboard
        goodMorning: "Good Morning",
        childStatus: "Child Status",
        activeNow: "Active Now",
        currentStatus: "Current Status",
        lastUpdate: "Last Update",
        todaysProgress: "Today's Progress",
        standingCheck: "Standing Check",
        uniformCheckWidget: "Uniform Check",
        liveCamera: "Live Camera Feed",
        cameraSubtitle: "Real-time monitoring",
        parentCenter: "Parent Center v2.0",
        // Landing Page
        features: "Features",
        howItWorks: "How It Works",
        pricing: "Pricing",
        getStarted: "Get Started",
        transformMornings: "Transform Mornings.",
        oneRoutine: "One Routine at a Time.",
        heroSubtitle: "AI-powered standing and uniform detection that helps kids build healthy morning habits while keeping parents informed in real-time.",
        getStartedFree: "Get Started Free",
        watchDemo: "Watch Demo",
        openSourceProject: "Open Source Project • Contributions Welcome",
        readyToTry: "Ready to try it out?",
        readySubtitle: "This project is open source and under active development. Create an account to test the standing and uniform detection system.",
        product: "Product",
        company: "Company",
        legal: "Legal",
        privacyPolicy: "Privacy Policy",
        cookiePolicy: "Cookie Policy",
        aboutUs: "About Us",
        careers: "Careers",
        blog: "Blog",
        contact: "Contact",

        overview: "Overview",
        myChildren: "My Children",
        notifications: "Notifications",
        records: "Records",
        calendar: "Calendar",
        logout: "Log Out",
        totalChildren: "Total Children",
        unreadNotifications: "Unread Notifications", // New key
        totalRecords: "Total Records", // New key
        totalRecordsLabel: "Total Records", // New key
        noNotifications: "No new notifications",
        noChildrenRegistered: "No children registered",
        lastActivity: "Last Activity",
        standingUp: "Standing Up",
        wearingUniform: "Wearing Uniform",
        noRecords: "No records found",
        childStoodUpRecord: "Child stood up",
        childNotStandingRecord: "Child not standing",
        duration: "Duration",
        justNow: "Just now",
        minutesAgo: "m ago",
        hoursAgo: "h ago",
        daysAgo: "d ago",
        woke: "Woke",
        uniform: "Uniform",
        noRecordsCalendar: "No records for this month",
        previous: "Previous",
        next: "Next",

        // Months & Days
        january: "January", february: "February", march: "March", april: "April", may: "May", june: "June",
        july: "July", august: "August", september: "September", october: "October", november: "November", december: "December",
        sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat",

        dailyRecords: "Daily Records",
        settings: "Settings",
        adminAccess: "Admin Access",
        smartRoutine: "Smart Routine",
        monitoringActive: "Monitoring active morning routines",
        systemLive: "System Live",
        refresh: "Refresh",
        dailyPerformance: "Daily Performance",
        standingToday: "Standing Today",
        streak: "Streak",
        avgTime: "Avg Time",
        liveFeed: "Live Feed",
        addTask: "Add Task",
        liveView: "Live View",
        broadcast: "Broadcast",
        logNote: "Log Note",
        inProgress: "In Progress",
        allComplete: "All Complete",
        verified: "Verified",
        pending: "Pending",
        waiting: "Waiting...",
        completed: "Completed",

        // Common
        loading: "Loading..."
    },
    ar: {
        // Auth & General
        appName: "استيقظ",
        welcomeBack: "مرحباً بعودتك",
        signInSubtitle: "سجل الدخول لإدارة روتين عائلتك.",
        parent: "ولي الأمر",
        child: "الطفل",
        username: "اسم المستخدم",
        childName: "اسم الطفل",
        password: "كلمة المرور",
        enterUsername: "أدخل اسم المستخدم",
        enterChildName: "أدخل اسم الطفل",
        enterPassword: "أدخل كلمة المرور",
        forgotPassword: "نسيت كلمة المرور؟",
        login: "تسجيل الدخول",
        noAccount: "ليس لديك حساب؟",
        signUpNow: "سجل الآن",
        createAccount: "إنشاء حساب",
        joinSubtitle: "انضم إلى ثورة الروتين الذكي.",
        parentMode: "وضع الولي",
        childMode: "وضع الطفل",
        email: "البريد الإلكتروني",
        enterEmail: "أدخل بريدك الإلكتروني",
        terms: "بالدخول للنظام، أنت توافق على",
        helpCenter: "مركز المساعدة",
        fullName: "الاسم الكامل",
        enterFullName: "أدخل اسمك الكامل",
        chooseUsername: "اختر اسم المستخدم",
        fathersName: "اسم الأب",
        forChildrenOnly: "(للأطفال فقط)",
        createSecureKey: "أنشئ كلمة مرور آمنة",
        termsOfService: "شروط الخدمة",
        privacyProtocols: "بروتوكولات الخصوصية",
        alreadyHaveAccount: "لديك حساب بالفعل؟",

        // Child Dashboard
        scanningBody: "جاري مسح الجسم",
        standStill: "قف ثابتاً",
        holdFor: "استمر لمدة",
        task: "المهمة الحالية",
        taskInstruction: "قف بشكل مستقيم داخل الدائرة",
        initializingCamera: "جاري تشغيل الكاميرا...",
        pleaseWait: "يرجى الانتظار",
        standing: "واقف",
        keepStanding: "استمر في الوقوف",
        startingTimer: "بدأ المؤقت...",
        pleaseStandUp: "يرجى الوقوف",
        standUpToBegin: "قف للبدء",
        uniformCheck: "فحص الزي",
        standingComplete: "تم الوقوف",
        keepWearingUniform: "استمر بارتداء الزي",
        putOnBlackTop: "ارتدِ القميص الأسود",
        pleaseWearUniform: "يرجى ارتداء الزي",
        allChecksCompleteTitle: "اكتملت الفحوصات",
        standingCheckmark: "الوقوف ✓",
        uniformCheckmark: "الزي ✓",
        detectionStopped: "توقف المنبه",
        alarmSilenced: "تم إيقاف المنبه!",
        checkPermissions: "يرجى التحقق من أذونات الكاميرا",
        holdPosition: "حافظ على وضعيتك!",
        scanning: "جاري المسح...",
        completeStatus: "مكتمل",
        holdStillUniform: "اثبت لفحص الزي!",
        putOnUniformInstruction: "ارتدِ زيك المدرسي الأسود",
        missionComplete: "اكتملت المهمة",
        allChecksCompleteMessage: "اكتملت جميع الفحوصات! عمل رائع! 🎉",
        greatJobStanding: "عمل رائع في الوقوف!",

        preparingUniformCheck: "استعد لفحص الزي...",

        // Parent Dashboard
        goodMorning: "صباح الخير",
        childStatus: "حالة الطفل",
        activeNow: "نشط الآن",
        currentStatus: "الحالة الحالية",
        lastUpdate: "آخر تحديث",
        todaysProgress: "تقدم اليوم",
        standingCheck: "فحص الوقوف",
        uniformCheckWidget: "فحص الزي",
        liveCamera: "بث الكاميرا المباشر",
        cameraSubtitle: "مراقبة في الوقت الفعلي",
        parentCenter: "مركز الآباء 2.0",
        // Landing Page
        features: "المميزات",
        howItWorks: "كيف يعمل",
        pricing: "الأسعار",
        getStarted: "ابدأ الآن",
        transformMornings: "غيّر الصباح.",
        oneRoutine: "روتين واحد في كل مرة.",
        heroSubtitle: "كشف الوقوف والزي المدعوم بالذكاء الاصطناعي لمساعدة الأطفال على بناء عادات صباحية صحية وإبقاء الآباء على اطلاع في الوقت الفعلي.",
        getStartedFree: "ابدأ مجاناً",
        watchDemo: "شاهد العرض",
        openSourceProject: "مشروع مفتوح المصدر • المساهمات مرحب بها",
        readyToTry: "جاهز للتجربة؟",
        readySubtitle: "هذا المشروع مفتوح المصدر وتحت التطوير النشط. أنشئ حساباً لاختبار نظام كشف الوقوف والزي.",
        product: "المنتج",
        company: "الشركة",
        legal: "قانوني",
        privacyPolicy: "سياسة الخصوصية",
        cookiePolicy: "سياسة ملفات تعريف الارتباط",
        aboutUs: "من نحن",
        careers: "الوظائف",
        blog: "المدونة",
        contact: "اتصل بنا",

        overview: "نظرة عامة",
        myChildren: "أطفالي",
        notifications: "الإشعارات",
        records: "السجلات",
        calendar: "التقويم",
        logout: "تسجيل خروج",
        totalChildren: "إجمالي الأطفال",
        unreadNotifications: "إشعارات غير مقروءة",
        totalRecords: "إجمالي السجلات",
        totalRecordsLabel: "إجمالي السجلات",
        noNotifications: "لا توجد إشعارات جديدة",
        noChildrenRegistered: "لا يوجد أطفال مسجلين",
        lastActivity: "آخر نشاط",
        standingUp: "الوقوف",
        wearingUniform: "ارتداء الزي",
        noRecords: "لا توجد سجلات",
        childStoodUpRecord: "وقف الطفل",
        childNotStandingRecord: "الطفل لا يقف",
        duration: "المدة",
        justNow: "الآن",
        minutesAgo: "د",
        hoursAgo: "س",
        daysAgo: "ي",
        woke: "استيقظ",
        uniform: "الزي",
        noRecordsCalendar: "لا توجد سجلات لهذا الشهر",
        previous: "السابق",
        next: "التالي",

        // Months & Days
        january: "يناير", february: "فبراير", march: "مارس", april: "أبريل", may: "مايو", june: "يونيو",
        july: "يوليو", august: "أغسطس", september: "سبتمبر", october: "أكتوبر", november: "نوفمبر", december: "ديسمبر",
        sunday: "أحد", monday: "اثنين", tuesday: "ثلاثاء", wednesday: "أربعاء", thursday: "خميس", friday: "جمعة", saturday: "سبت",

        dailyRecords: "السجلات اليومية",
        settings: "الإعدادات",
        adminAccess: "وصول المشرف",
        smartRoutine: "الروتين الذكي",
        monitoringActive: "مراقبة الروتين الصباحي النشط",
        systemLive: "النظام نشط",
        refresh: "تحديث",
        dailyPerformance: "الأداء اليومي",
        standingToday: "الوقوف اليوم",
        streak: "أيام متتالية",
        avgTime: "متوسط الوقت",
        liveFeed: "بث مباشر",
        addTask: "إضافة مهمة",
        liveView: "عرض مباشر",
        broadcast: "بث",
        logNote: "سجل ملاحظة",
        inProgress: "قيد التنفيذ",
        allComplete: "اكتمل الكل",
        verified: "تم التحقق",
        pending: "قيد الانتظار",
        waiting: "في الانتظار...",
        completed: "مكتمل",

        // Common
        loading: "جاري التحميل..."
    }
};

export class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('app_language') || 'en';
        this.observers = [];
        this.init();
    }

    init() {
        this.applyLanguage(this.currentLang);
        this.setupDirection();
    }

    /**
     * Switch language and update UI
     * @param {string} lang - 'en' or 'ar'
     */
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('app_language', lang);
        this.applyLanguage(lang);
        this.setupDirection();
        this.notifyObservers();
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyLanguage(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (TRANSLATIONS[lang][key]) {
                // Check if it's an input placeholder or text content
                if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                    element.setAttribute('placeholder', TRANSLATIONS[lang][key]);
                } else {
                    element.textContent = TRANSLATIONS[lang][key];
                }
            }
        });

        // Update font family based on language
        if (lang === 'ar') {
            document.documentElement.style.fontFamily = "'Tajawal', sans-serif";
            document.body.classList.add('font-arabic');
        } else {
            document.documentElement.style.fontFamily = "";
            document.body.classList.remove('font-arabic');
        }
    }

    /**
     * Set specific HTML direction
     */
    setupDirection() {
        document.documentElement.setAttribute('dir', this.currentLang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', this.currentLang);
    }

    /**
     * Get translation for a specific key
     */
    t(key) {
        return TRANSLATIONS[this.currentLang][key] || key;
    }

    /**
     * Subscribe to language changes
     */
    subscribe(callback) {
        this.observers.push(callback);
    }

    notifyObservers() {
        this.observers.forEach(cb => cb(this.currentLang));
    }

    /**
     * Create and append the language toggle button to the target element
     */
    renderLanguageToggle(targetSelector) {
        const target = document.querySelector(targetSelector);
        if (!target) return;

        // Remove existing toggle if present
        const existing = document.getElementById('lang-toggle-btn');
        if (existing) existing.remove();

        const btn = document.createElement('button');
        btn.id = 'lang-toggle-btn';
        btn.className = 'glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer z-50';
        btn.innerHTML = `
            <span class="material-symbols-outlined text-sm">language</span>
            <span class="text-xs font-medium uppercase">${this.currentLang === 'en' ? 'AR' : 'EN'}</span>
        `;

        btn.onclick = () => {
            const newLang = this.currentLang === 'en' ? 'ar' : 'en';
            this.setLanguage(newLang);
            btn.querySelector('span:last-child').textContent = newLang === 'en' ? 'AR' : 'EN';
        };

        target.appendChild(btn);
    }
}

export const translationManager = new TranslationManager();
