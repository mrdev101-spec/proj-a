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

    // Check User Role for User Management Link
    let showUserManagement = false;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role && (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'super admin')) {
                showUserManagement = true;
            }
        }
    } catch (e) {
        console.error('Error checking user role for sidebar:', e);
    }

    const html = `
    <aside class="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-20 shadow-lg animate-slide-in-left h-full">
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <div class="flex items-center gap-3 font-bold text-xl text-slate-800 dark:text-white">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span class="tracking-tight">Health Station</span>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 flex flex-col overflow-y-auto py-4 px-3 space-y-1">
            <a href="dashboard.html" class="${getLinkClass('dashboard')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span data-i18n="nav_dashboard">Dashboard</span>
            </a>

            <a href="index.html" class="${getLinkClass('health-station')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span data-i18n="nav_hospitals">Health Station</span>
            </a>

            <a href="#" class="${getLinkClass('service-requests')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span data-i18n="nav_service_requests">Service Requests</span>
            </a>

            <a href="#" class="${getLinkClass('analytics')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span data-i18n="nav_analytics">Analytics</span>
            </a>

            ${showUserManagement ? `
            <a href="users.html" class="${getLinkClass('users')}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span data-i18n="nav_users">User Management</span>
            </a>
            ` : ''}

            <!-- Sidebar Footer -->
            <div class="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                <button id="logout-btn" class="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:shadow-sm hover:translate-x-1 duration-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span data-i18n="nav_logout">Logout</span>
                </button>
            </div>
        </nav>
    </aside>
    `;

    sidebarContainer.innerHTML = html;
}
