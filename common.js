// Common Utilities for Health Station Project

// --- Theme Management ---
function initTheme() {
    if (localStorage.getItem('darkMode') === 'enabled' || (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeToggleUI();
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    updateThemeToggleUI();

    // Update Chart Theme if chart exists (for Dashboard)
    if (typeof chart !== 'undefined' && chart) {
        chart.updateOptions({
            theme: {
                mode: isDark ? 'dark' : 'light'
            }
        });
    }
}

function updateThemeToggleUI() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    // Support both SVG icon styles (index.html vs dashboard/users.html)
    const sunIcon = themeToggleBtn.querySelector('svg:first-child'); // index.html style or dashboard light icon
    const moonIcon = themeToggleBtn.querySelector('svg:last-child'); // index.html style or dashboard dark icon

    // Check if we are using the ID-based icons (dashboard/users)
    const darkIconId = document.getElementById('theme-toggle-dark-icon');
    const lightIconId = document.getElementById('theme-toggle-light-icon');

    const isDark = document.documentElement.classList.contains('dark');

    if (darkIconId && lightIconId) {
        // Dashboard/Users style
        if (isDark) {
            lightIconId.classList.remove('hidden');
            darkIconId.classList.add('hidden');
        } else {
            lightIconId.classList.add('hidden');
            darkIconId.classList.remove('hidden');
        }
    } else if (sunIcon && moonIcon) {
        // Index style (based on child order)
        if (isDark) {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }
}

// --- Language Management ---
var currentLang = localStorage.getItem('language') || 'th';

function initLanguage() {
    // Set initial state for buttons
    updateLanguageButtons(currentLang);
    // Apply translations
    updateUIText();
}

function setLanguage(lang) {
    if (lang !== currentLang) {
        currentLang = lang;
        localStorage.setItem('language', lang);
        updateLanguageButtons(lang);
        updateUIText();

        // Call page-specific updates if they exist
        if (typeof updateTableDisplay === 'function') updateTableDisplay();
        if (typeof populateDistricts === 'function') populateDistricts();
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateChartLocale === 'function') updateChartLocale(lang);
    }
}

// Alias for dashboard/users compatibility
const switchLanguage = setLanguage;

function updateLanguageButtons(lang) {
    // Support both class-based (index) and ID-based (dashboard/users) buttons

    // 1. ID-based (Dashboard/Users)
    const thBtnId = document.getElementById('lang-th');
    const enBtnId = document.getElementById('lang-en');

    if (thBtnId && enBtnId) {
        const activeClass = 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600';
        const inactiveClass = 'hover:bg-white dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400';

        // Reset classes
        thBtnId.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200';
        enBtnId.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200';

        if (lang === 'th') {
            thBtnId.classList.add(...activeClass.split(' '));
            enBtnId.classList.add(...inactiveClass.split(' '));
        } else {
            enBtnId.classList.add(...activeClass.split(' '));
            thBtnId.classList.add(...inactiveClass.split(' '));
        }
    }

    // 2. Class-based (Index)
    const langBtns = document.querySelectorAll('.lang-switch button');
    if (langBtns.length > 0) {
        langBtns.forEach(btn => {
            const btnLang = btn.textContent.trim().toLowerCase();
            if (btnLang === lang) {
                btn.className = 'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400';
            } else {
                btn.className = 'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400';
            }
        });
    }
}

function updateUIText() {
    // Try to get translations from global scope or window
    const tData = (typeof translations !== 'undefined') ? translations : window.translations;
    if (!tData) return;

    const t = tData[currentLang];
    if (!t) return;

    // Update data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });

    // Special handling for index.html specific elements if needed
    // (Most are covered by data-i18n now, but some dynamic ones might need specific handling in the page script)
}

function getTrans(key) {
    const tData = (typeof translations !== 'undefined') ? translations : window.translations;
    if (!tData) return key;
    const t = tData[currentLang];
    return t && t[key] ? t[key] : key;
}

// --- Authentication ---

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return null;
    }
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Error parsing user data', e);
        window.location.href = 'login.html';
        return null;
    }
}

function checkPermission(requiredPermission) {
    const user = checkAuth();
    if (!user) return;

    // Safety check: Allow index.html and dashboard.html even if this function is called
    // BUT only if we are not strictly checking permissions for those specific pages
    // For now, we will rely on the page calling checkPermission('dashboard') etc.

    let permissions = [];
    const userRole = user.role || '';

    // Primary check: permissions array
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
        permissions = user.permissions;
    } else {
        // Fallback 1: Reconstruct from boolean flags (Robust check)
        // Check all possible key variations (snake_case, camelCase, Title Case)
        if (user.dashboard || user.Dashboard) permissions.push('dashboard');
        if (user.health_station || user.healthStation || user['Health Station']) permissions.push('health-station');
        if (user.service_requests || user.serviceRequests || user['Service Requests']) permissions.push('service-requests');
        if (user.analytics || user.Analytics) permissions.push('analytics');
        if (user.settings || user.Settings) permissions.push('settings');
        if (user.users || user.userManagement || user['User Management']) permissions.push('users');

        // Fallback 2: Role-based defaults (Only if reconstruction failed/empty)
        if (permissions.length === 0) {
            if (userRole === 'Super Admin' || userRole === 'Admin') {
                permissions = ['dashboard', 'health-station', 'service-requests', 'analytics', 'settings', 'users'];
            } else {
                permissions = ['health-station', 'settings']; // Basic user defaults
            }
        }
    }

    // Map page/permission names if needed (e.g. 'health-station' vs 'hospitals')
    // Here we use consistent names: dashboard, health-station, users, settings, etc.

    if (requiredPermission && !permissions.includes(requiredPermission)) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to access this page.',
            confirmButtonText: 'Go Back'
        }).then(() => {
            // Try to find a safe page to redirect to
            if (permissions.includes('dashboard')) {
                window.location.href = 'dashboard.html';
            } else if (permissions.includes('health-station')) {
                window.location.href = 'health-station.html';
            } else {
                window.history.back();
            }
        });
    }
}

// Deprecated: Use checkPermission('users') instead, but kept for backward compatibility if needed
function checkAdminAccess() {
    checkPermission('users');
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const isThai = currentLang === 'th';
            Swal.fire({
                title: isThai ? 'ยืนยันการออกจากระบบ?' : 'Logout Confirmation',
                text: isThai ? 'คุณต้องการออกจากระบบใช่หรือไม่?' : 'Are you sure you want to logout?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3b82f6',
                cancelButtonColor: '#ef4444',
                confirmButtonText: isThai ? 'ใช่, ออกจากระบบ' : 'Yes, Logout',
                cancelButtonText: isThai ? 'ยกเลิก' : 'Cancel',
                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#1e293b'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Firebase SignOut
                    if (window.firebase && window.firebase.signOut) {
                        window.firebase.signOut(window.firebase.auth).then(() => {
                            console.log('Signed out from Firebase');
                        }).catch((error) => {
                            console.error('Sign out error', error);
                        });
                    }

                    localStorage.removeItem('user');
                    localStorage.removeItem('isLoggedIn');
                    window.location.href = 'login.html';
                }
            });
        });
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Theme and Language are initialized here to ensure they run on all pages
    initTheme();

    // Wait a tick for translations to be defined in the main script
    setTimeout(() => {
        if (!window.skipThemeCheck) {
            initLanguage();
        }
        // Remove preload class to fade in content
        document.body.classList.remove('preload');
    }, 50);

    // Setup Theme Toggle Listener
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Setup Logout - Called manually in page scripts after sidebar render
    // setupLogout();

    // --- System-wide Sync ---

    // Listen for storage changes (other tabs)
    // Listen for storage changes (other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'darkMode') {
            initTheme();
        }
        if (e.key === 'language') {
            // Ignore language sync if on a page that manages its own language (like Login)
            if (window.skipThemeCheck) return;

            currentLang = e.newValue;
            initLanguage();
        }
    });

    // Listen for page show (back/forward navigation) to ensure fresh state
    window.addEventListener('pageshow', (e) => {
        checkAndReload();
    });

    // Also check on visibility change (tab switching/app switching)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkAndReload();
        }
    });

    function checkAndReload() {
        if (window.skipThemeCheck) return;

        // Check if we need to reload due to stale settings
        const storedLang = localStorage.getItem('language') || 'th';
        const storedTheme = localStorage.getItem('darkMode') === 'enabled' ? 'dark' : 'light';

        // Check Theme mismatch
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const themeMismatch = currentTheme !== storedTheme;

        // Check Language mismatch
        const langMismatch = currentLang !== storedLang;

        if (themeMismatch || langMismatch) {
            // Force reload to apply changes cleanly
            window.location.reload();
        }
    }
});

// --- UI Helpers ---
function showThemeAlert(options, text, icon) {
    const isDark = document.documentElement.classList.contains('dark');
    const themeOptions = {
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#f8fafc' : '#1e293b'
    };

    // Handle shorthand call: showThemeAlert('Title', 'Text', 'icon')
    if (typeof options === 'string') {
        return Swal.fire({
            title: options,
            text: text,
            icon: icon,
            ...themeOptions
        });
    }

    // Handle object call: showThemeAlert({ ... })
    return Swal.fire({
        ...options,
        ...themeOptions
    });
}
