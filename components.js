function renderSidebar(activePageId) {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // Helper to get class for active/inactive links
    const getLinkClass = (id) => {
        const baseClass = "flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:shadow-sm hover:translate-x-1 duration-200";
        if (id === activePageId) {
            return `${baseClass} bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium shadow-sm`;
        }
        return `${baseClass} text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200`;
    };

    // Check User Permissions
    let permissions = [];
    let userRole = '';
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            userRole = user.role || '';
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
        }
    } catch (e) {
        console.error('Error checking user permissions:', e);
    }

    const hasPermission = (perm) => permissions.includes(perm);

    const html = `
    <aside class="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-20 shadow-lg animate-slide-in-left h-full">
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <div class="flex items-center gap-3 font-bold text-xl text-slate-800 dark:text-white">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span class="tracking-tight text-lg">Bederly MA & Service</span>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 flex flex-col overflow-y-auto py-4 px-3 space-y-1">
            ${hasPermission('dashboard') ? `
            <a href="dashboard.html" class="${getLinkClass('dashboard')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span data-i18n="nav_dashboard">Dashboard</span>
            </a>` : ''}

            ${hasPermission('health-station') ? `
            <a href="index.html" class="${getLinkClass('health-station')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span data-i18n="nav_hospitals">Health Station</span>
            </a>` : ''}

            ${hasPermission('service-requests') ? `
            <a href="#" class="${getLinkClass('service-requests')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span data-i18n="nav_service_requests">Service Requests</span>
            </a>` : ''}

            ${hasPermission('analytics') ? `
            <a href="#" class="${getLinkClass('analytics')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span data-i18n="nav_analytics">Analytics</span>
            </a>` : ''}

            ${hasPermission('users') ? `
            <a href="users.html" class="${getLinkClass('users')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span data-i18n="nav_users">User Management</span>
            </a>` : ''}

        </nav>
        
        <!-- Sidebar Footer -->
        <div class="mt-auto p-4 border-t border-slate-200 dark:border-slate-700 space-y-1 bg-white dark:bg-slate-800">
            ${hasPermission('settings') ? `
            <a href="settings.html" onclick="window.location.href='settings.html'; return false;" class="${getLinkClass('settings')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span data-i18n="nav_settings">Settings</span>
            </a>` : ''}

            <button id="logout-btn" class="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:shadow-sm hover:translate-x-1 duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span data-i18n="nav_logout">Logout</span>
            </button>
    </div>
    </aside>
    `;

    sidebarContainer.innerHTML = html;
}

function renderHeader(titleKey) {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    // Get user data
    let user = { name: 'Guest', role: 'Visitor' };
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            user = JSON.parse(userStr);
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
    }

    // Generate initials
    const initials = (user.name || 'Guest')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const html = `
    <header class="glass-effect shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10 transition-all duration-300">
        <div class="w-full px-6 sm:px-8 lg:px-10 h-16 flex items-center justify-between">
            <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300"
                data-i18n="${titleKey}">Health Station</h1>

            <div class="flex items-center gap-4">
                <!-- Notification Icon -->
                <button class="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                </button>

                <!-- User Profile -->
                <div class="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                    <div class="text-right hidden sm:block">
                        <div class="text-sm font-bold text-slate-700 dark:text-slate-200">${user.name}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">${user.role || 'User'}</div>
                    </div>
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800 cursor-pointer hover:scale-105 transition-transform">
                        ${initials}
                    </div>
                </div>
            </div>
        </div>
    </header>
    `;

    headerContainer.innerHTML = html;
}
