// Firestore Collection Reference
const COLLECTION_NAME = 'health_station';

const tableBody = document.getElementById('health-station-list');
const toast = document.getElementById('toast');
const districtFilter = document.getElementById('district-filter');
const searchInput = document.getElementById('search-input');
const rowsFilter = document.getElementById('rows-filter');
let toastTimeout;
let healthStations = []; // Store fetched data
let filteredHealthStations = []; // Store filtered data
let currentPage = 1;
// currentLang is managed by common.js
const CACHE_KEY = 'health_station_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const refreshBtn = document.querySelector('.refresh-btn');
// const globalOverlay = document.getElementById('global-loading-overlay'); // Removed
const tableOverlay = document.getElementById('table-loading-overlay');
const tableCard = document.querySelector('.table-card');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const addModal = document.getElementById('add-modal');
const addForm = document.getElementById('add-form');
const closeModalBtn = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.btn-cancel');

// Translations
const translations = {
    th: {
        title: 'สถานีสุขภาพ',
        nav_dashboard: 'แดชบอร์ด',
        nav_health_station: 'สถานีสุขภาพ',
        nav_service_requests: 'แจ้งซ่อม',
        nav_analytics: 'การวิเคราะห์',
        nav_users: 'จัดการผู้ใช้งาน',
        nav_settings: 'การตั้งค่า',
        nav_logout: 'ออกจากระบบ',
        stat_centers: 'จำนวนศูนย์บริการ',
        stat_districts: 'จำนวนอำเภอทั้งหมด',
        search_placeholder: 'ค้นหา HCode / ชื่อ / อำเภอ...',
        filter_district_default: 'เลือกอำเภอทั้งหมด',
        refresh_btn: 'รีเฟรช',
        // Table Headers
        th_no: 'ลำดับ',
        th_health_station: 'สถานีสุขภาพ',
        th_hcode: 'HCode',
        th_district: 'อำเภอ',
        th_pcid: 'PC-ID',
        th_anydesk: 'AnyDesk ID',
        th_map: 'แผนที่',
        th_actions: 'จัดการ',

        map_btn: 'แผนที่',
        loading: 'กำลังโหลดข้อมูล...',
        no_data: 'ไม่พบข้อมูล',
        rows_option: 'แถว',
        copied: 'คัดลอกเรียบร้อย!',
        add_btn: 'เพิ่มรายการ',
        save_btn: 'บันทึก',
        cancel_btn: 'ยกเลิก',
        edit_modal_title: 'แก้ไขข้อมูล',
        add_modal_title: 'เพิ่มรายการใหม่',
        saving: 'กำลังบันทึก...',
        saved: 'บันทึกเรียบร้อย!',
        save_error: 'เกิดข้อผิดพลาดในการบันทึก',
        delete_btn: 'ลบ',
        confirm_delete_title: 'ยืนยันการลบ?',
        confirm_delete_text: 'คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!',
        deleted_success: 'ลบข้อมูลเรียบร้อยแล้ว',
        delete_error: 'เกิดข้อผิดพลาดในการลบ'
    },
    en: {
        title: 'Health Station',
        nav_dashboard: 'Dashboard',
        nav_health_station: 'Health Station',
        nav_service_requests: 'Service Requests',
        nav_analytics: 'Analytics',
        nav_users: 'User Management',
        nav_settings: 'Settings',
        nav_logout: 'Logout',
        stat_centers: 'Service Centers',
        stat_districts: 'Total Districts',
        search_placeholder: 'Search HCode / Name / District...',
        filter_district_default: 'All Districts',
        refresh_btn: 'Refresh',
        // Table Headers
        th_no: 'No',
        th_health_station: 'Health Station',
        th_hcode: 'HCode',
        th_district: 'District',
        th_pcid: 'PC-ID',
        th_anydesk: 'AnyDesk ID',
        th_map: 'Map',
        th_actions: 'Actions',

        map_btn: 'Map',
        loading: 'Loading data...',
        no_data: 'No data found',
        rows_option: 'rows',
        copied: 'Copied to clipboard!',
        add_btn: 'Add New',
        save_btn: 'Save',
        cancel_btn: 'Cancel',
        edit_modal_title: 'Edit Information',
        add_modal_title: 'Add New Health Station',
        saving: 'Saving...',
        saved: 'Saved successfully!',
        save_error: 'Error saving data',
        delete_btn: 'Delete',
        confirm_delete_title: 'Confirm Delete?',
        confirm_delete_text: 'Are you sure you want to delete this item? This action cannot be undone!',
        deleted_success: 'Deleted successfully',
        delete_error: 'Error deleting data'
    }
};

// Make translations globally available
window.translations = translations;

async function init() {
    try {
        // Initial load: Global overlay is visible by default in HTML
        // toggleGlobalLoading(true); // Removed

        // Modal Event Listeners
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) closeEditModal();
            });
        }
        if (editForm) {
            editForm.addEventListener('submit', handleEditSubmit);
        }
        if (addForm) {
            addForm.addEventListener('submit', handleAddSubmit);
        }

        console.log('Fetching data...');

        // Show loading in table
        const t = translations[currentLang] || translations['th'];
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500 dark:text-slate-400">
                <div class="flex justify-center items-center gap-2">
                    <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>${t.loading}</span>
                </div>
            </td></tr>`;
        }

        // 1. Try to load from cache first
        const cachedData = loadFromCache();
        if (cachedData) {
            console.log('Loaded from cache:', cachedData.length);
            healthStations = cachedData;
            try {
                populateDistricts();
            } catch (e) {
                console.error('Error in populateDistricts (cache):', e);
            }
            filterData();
            updateStats();
        }

        // 2. Fetch fresh data in background
        if (!window.firebase) {
            console.log('Waiting for Firebase initialization...');
            await new Promise(resolve => {
                window.addEventListener('firebase-initialized', resolve, { once: true });
                // Fallback timeout in case event was missed or failed
                setTimeout(() => {
                    if (window.firebase) resolve();
                    else console.error('Firebase initialization timeout');
                }, 5000);
            });
        }

        if (window.firebase) {
            await fetchData();
            console.log('Data fetched:', healthStations.length);
        } else {
            throw new Error('Firebase not initialized');
        }

        try {
            populateDistricts();
        } catch (e) {
            console.error('Error in populateDistricts:', e);
        }

        // Initial render (or re-render with fresh data)
        filterData();
        updateStats();
        if (window.updateUIText) window.updateUIText();
        // updateLanguageButtons(currentLang); // Handled by common.js/updateUIText

        // Add event listeners
        if (districtFilter) districtFilter.addEventListener('change', filterData);
        if (searchInput) searchInput.addEventListener('input', debounce(filterData, 300));
        if (rowsFilter) {
            rowsFilter.addEventListener('change', () => {
                currentPage = 1;
                updateTableDisplay();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                toggleTableLoading(true);
                await new Promise(r => setTimeout(r, 500));
                try {
                    await fetchData();
                    filterData();
                    updateStats();
                } catch (err) {
                    console.error("Refresh failed", err);
                } finally {
                    toggleTableLoading(false);
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-red-500">Failed to load data: ${error.message}</td></tr>`;
    } finally {
        // toggleGlobalLoading(false); // Removed
    }
}

function filterData() {
    const selectedDistrict = districtFilter ? districtFilter.value : '';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    filteredHealthStations = healthStations.filter(h => {
        const matchesDistrict = selectedDistrict ? h.district === selectedDistrict : true;
        const matchesSearch = query ? (
            (h.name && h.name.toLowerCase().includes(query)) ||
            (h.district && h.district.toLowerCase().includes(query)) ||
            (h.hcode && h.hcode.toLowerCase().includes(query))
        ) : true;

        return matchesDistrict && matchesSearch;
    });

    currentPage = 1;
    updateTableDisplay();
}


// function updateLanguageButtons(lang) - Removed, using common.js
// function switchLanguage(lang) - Removed, using common.js

function updateLocalUIText() {
    const t = translations[currentLang];
    if (!t) return;

    // Update Rows Filter Options
    if (rowsFilter) {
        const options = rowsFilter.options;
        for (let i = 0; i < options.length; i++) {
            const val = options[i].value;
            options[i].textContent = `${val} ${t.rows_option}`;
        }
    }

    // Update Modal Labels
    const updateLabels = (formId) => {
        const form = document.getElementById(formId);
        if (!form) return;
        const formLabels = form.querySelectorAll('label');
        if (formLabels.length >= 5) {
            formLabels[0].textContent = currentLang === 'th' ? 'HCode (รหัสสถานบริการ)' : 'HCode';
            formLabels[1].textContent = currentLang === 'th' ? 'ชื่อสถานบริการ' : 'Hospital Name';
            formLabels[2].textContent = currentLang === 'th' ? 'อำเภอ' : 'District';
            formLabels[3].textContent = currentLang === 'th' ? 'PC-ID' : 'PC-ID';
            formLabels[4].textContent = currentLang === 'th' ? 'AnyDesk ID' : 'AnyDesk ID';
        }
    };

    updateLabels('edit-form');
    updateLabels('add-form');
}

// Hook into global updateUIText to run local updates as well
const globalUpdateUIText = window.updateUIText;
window.updateUIText = function () {
    if (globalUpdateUIText) globalUpdateUIText();
    updateLocalUIText();
    updateStats();
};

// function toggleGlobalLoading(isLoading) {
//     if (!globalOverlay) return;
//     if (isLoading) {
//         globalOverlay.classList.remove('hidden'); // Ensure it's in DOM
//         // Small delay to allow display:block to apply before opacity transition
//         requestAnimationFrame(() => {
//             globalOverlay.classList.remove('opacity-0', 'pointer-events-none');
//         });
//     } else {
//         globalOverlay.classList.add('opacity-0', 'pointer-events-none');
//         setTimeout(() => {
//             globalOverlay.classList.add('hidden');
//         }, 300); // Match duration-300
//     }
// }

function toggleTableLoading(isLoading) {
    if (!tableOverlay) return;
    if (isLoading) {
        tableOverlay.classList.remove('hidden');
    } else {
        tableOverlay.classList.add('hidden');
    }
}

function updateTableDisplay() {
    const limit = rowsFilter ? parseInt(rowsFilter.value) : 5;
    const totalPages = Math.ceil(filteredHealthStations.length / limit);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * limit;
    const endIndex = limit > 0 ? startIndex + limit : filteredHealthStations.length;
    const paginatedData = filteredHealthStations.slice(startIndex, endIndex);

    renderTable(paginatedData, startIndex);
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        // Tailwind classes for pagination buttons
        btn.className = `w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${i === currentPage
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
            }`;

        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            updateTableDisplay();
        };
        paginationContainer.appendChild(btn);
    }
}

async function fetchData() {
    console.log('fetchData called (Firestore)');
    try {
        const querySnapshot = await window.firebase.getDocs(window.firebase.collection(window.firebase.db, COLLECTION_NAME));
        healthStations = [];
        querySnapshot.forEach((doc) => {
            healthStations.push(doc.data());
        });

        saveToCache(healthStations);
        console.log(`Loaded ${healthStations.length} hospitals from Firestore`);
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// parseCSV removed as it is no longer needed

function populateDistricts() {
    // Ensure no ReferenceError here
    if (!districtFilter) return;
    const t = translations[currentLang];
    const currentVal = districtFilter.value;
    const districts = [...new Set(healthStations.map(h => h.district))].sort();
    districtFilter.innerHTML = `<option value="">${t.filter_district_default}</option>`;
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });
    if (currentVal) districtFilter.value = currentVal;
}

function renderTable(data, startIndex = 0) {
    console.log('renderTable called with', data ? data.length : 0, 'rows');
    const t = translations[currentLang];

    if (!tableBody) return;

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500 dark:text-slate-400">${t.no_data}</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map((hospital, index) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group border-b border-slate-100 dark:border-slate-700 last:border-0">
            <td class="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 font-mono">${startIndex + index + 1}</td>
            <td class="py-4 px-6 text-sm font-medium text-slate-900 dark:text-slate-100">${hospital.name}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-mono bg-slate-50/50 dark:bg-slate-800/50 rounded-lg">${hospital.hcode}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    ${hospital.district}
                </span>
            </td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">${hospital.pcId}</td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-2 group/copy relative">
                    <span class="text-sm font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded select-all">${hospital.anydesk}</span>
                    <button onclick="copyToClipboard('${hospital.anydesk}', this)" class="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all opacity-0 group-hover/copy:opacity-100 focus:opacity-100 relative" aria-label="Copy">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                    <span class="copy-feedback absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">Copied!</span>
                </div>
            </td>
            <td class="py-4 px-6 text-center">
                <button class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all" title="${t.map_btn}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 4.553"/></svg>
                </button>
            </td>
            <td class="py-4 px-6 text-center">
                <button onclick="openEditModal('${hospital.hcode}')" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const t = translations[currentLang];
    const statCenters = document.getElementById('stat-centers-value');
    const statDistricts = document.getElementById('stat-districts-value');

    if (statCenters && statDistricts) {
        const totalCenters = healthStations.length;
        const totalDistricts = new Set(healthStations.map(h => h.district)).size;

        // Use span for the number to keep color
        statCenters.innerHTML = `${t.stat_centers}: <span class="text-blue-600 dark:text-blue-400">${totalCenters}</span>`;
        statDistricts.innerHTML = `${t.stat_districts}: <span class="text-indigo-600 dark:text-indigo-400">${totalDistricts}</span>`;
    }
}

function copyToClipboard(text, btnElement) {
    const t = translations[currentLang];
    if (!text) return;

    // Helper to show inline feedback
    const showInlineFeedback = () => {
        if (btnElement) {
            const container = btnElement.closest('.group\\/copy');
            if (container) {
                const feedback = container.querySelector('.copy-feedback');
                if (feedback) {
                    feedback.textContent = t.copied;
                    feedback.classList.remove('opacity-0');
                    setTimeout(() => {
                        feedback.classList.add('opacity-0');
                    }, 2000);
                }
            }
        } else {
            // Fallback to global toast if button not passed
            showToast(t.copied);
        }
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showInlineFeedback();
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text, showInlineFeedback);
        });
    } else {
        fallbackCopyTextToClipboard(text, showInlineFeedback);
    }
}

function fallbackCopyTextToClipboard(text, callback) {
    const t = translations[currentLang];
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            if (callback) callback();
            else showToast(t.copied);
        } else {
            console.error('Fallback: Copying text command was unsuccessful');
            alert('Copy failed. Please copy manually.');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        alert('Copy failed. Please copy manually.');
    }
    document.body.removeChild(textArea);
}

function showToast(message) {
    if (message) {
        const span = toast.querySelector('span');
        if (span) span.textContent = message;
    }

    // Use Tailwind classes for animation
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 2000);
}

// --- Edit Functions ---

window.openEditModal = function (hcode) {
    const hospital = healthStations.find(h => String(h.hcode) === String(hcode));
    if (!hospital) return;

    document.getElementById('edit-hcode').value = hospital.hcode;
    document.getElementById('edit-name').value = hospital.name;
    document.getElementById('edit-district').value = hospital.district;
    document.getElementById('edit-pcid').value = hospital.pcId;
    document.getElementById('edit-anydesk').value = hospital.anydesk;

    editModal.classList.remove('hidden');
    // Animation
    requestAnimationFrame(() => {
        editModal.classList.remove('opacity-0');
        const content = editModal.querySelector('.modal-content');
        if (content) content.classList.remove('scale-95');
    });

    // Setup delete button in modal
    const deleteBtn = document.getElementById('delete-btn-modal');
    if (deleteBtn) {
        deleteBtn.onclick = () => deleteItem(hcode);
    }
};

window.closeEditModal = function () {
    const editModal = document.getElementById('edit-modal');
    if (!editModal) return;

    editModal.classList.add('opacity-0');
    const content = editModal.querySelector('.modal-content');
    if (content) content.classList.add('scale-95');

    setTimeout(() => {
        editModal.classList.add('hidden');
        editModal.style.display = 'none'; // Force hide
        if (editForm) editForm.reset(); // Clear form data
    }, 300);
};

async function handleEditSubmit(e) {
    e.preventDefault();
    const t = translations[currentLang];

    const hcode = document.getElementById('edit-hcode').value;
    const newData = {
        name: document.getElementById('edit-name').value,
        district: document.getElementById('edit-district').value,
        pcId: document.getElementById('edit-pcid').value,
        anydesk: document.getElementById('edit-anydesk').value
    };

    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = t.saving;
    saveBtn.disabled = true;
    saveBtn.classList.add('opacity-75', 'cursor-not-allowed');

    try {
        const docRef = window.firebase.doc(window.firebase.db, COLLECTION_NAME, hcode);
        await window.firebase.updateDoc(docRef, newData);

        const index = healthStations.findIndex(h => String(h.hcode) === String(hcode));
        if (index !== -1) {
            healthStations[index] = { ...healthStations[index], ...newData };
        }
        filterData();
        closeEditModal();
        Swal.fire({
            icon: 'success',
            title: t.saved,
            showConfirmButton: false,
            timer: 1500,
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white'
            }
        });

    } catch (error) {
        console.error('Save error:', error);
        Swal.fire({
            icon: 'error',
            title: t.save_error,
            text: error.message,
            confirmButtonText: 'OK',
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white'
            }
        });
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

// --- Add Functions ---

// addModal and addForm are defined at the top

window.openAddModal = function () {
    if (addForm) addForm.reset();
    if (addModal) {
        addModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            addModal.classList.remove('opacity-0');
            const content = addModal.querySelector('.modal-content');
            if (content) content.classList.remove('scale-95');
        });
    }
};

window.closeAddModal = function () {
    if (!addModal) return;
    addModal.classList.add('opacity-0');
    const content = addModal.querySelector('.modal-content');
    if (content) content.classList.add('scale-95');

    setTimeout(() => {
        addModal.classList.add('hidden');
    }, 300);
};

// Event listener moved to init()

async function handleAddSubmit(e) {
    e.preventDefault();
    const t = translations[currentLang];

    const newData = {
        hcode: document.getElementById('add-hcode').value,
        name: document.getElementById('add-name').value,
        district: document.getElementById('add-district').value,
        pcId: document.getElementById('add-pcid').value,
        anydesk: document.getElementById('add-anydesk').value
    };

    const saveBtn = document.querySelector('.btn-save-add');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = t.saving;
    saveBtn.disabled = true;
    saveBtn.classList.add('opacity-75', 'cursor-not-allowed');

    try {
        // Use hcode as document ID
        const docRef = window.firebase.doc(window.firebase.db, COLLECTION_NAME, newData.hcode);

        // Check if exists first to prevent overwrite? Or just setDoc (upsert/overwrite)
        // For safety, let's use setDoc which overwrites if exists, or creates new.
        await window.firebase.setDoc(docRef, newData);

        closeAddModal();
        Swal.fire({
            icon: 'success',
            title: t.saved,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white',
                confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
            }
        }).then(async () => {
            // Refresh data after alert closes
            toggleTableLoading(true);
            await fetchData();
            filterData();
            updateStats();
            populateDistricts(); // Update district filter
            toggleTableLoading(false);
        });

    } catch (error) {
        console.error('Save error:', error);
        Swal.fire({
            icon: 'error',
            title: t.save_error,
            text: error.message,
            confirmButtonText: 'OK',
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white'
            }
        });
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

// Redefining deleteItem to be safe
window.deleteItem = async function (hcode) {
    const t = translations[currentLang];

    const result = await Swal.fire({
        title: t.confirm_delete_title,
        text: t.confirm_delete_text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: t.delete_btn,
        cancelButtonText: t.cancel_btn,
        customClass: {
            popup: 'dark:bg-slate-800 dark:text-white'
        }
    });

    if (result.isConfirmed) {
        Swal.fire({
            title: t.saving,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white'
            }
        });

        try {
            const docRef = window.firebase.doc(window.firebase.db, COLLECTION_NAME, hcode);
            await window.firebase.deleteDoc(docRef);

            Swal.fire({
                title: t.deleted_success,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: {
                    popup: 'dark:bg-slate-800 dark:text-white'
                }
            });

            // Remove from local array
            healthStations = healthStations.filter(h => String(h.hcode) !== String(hcode));
            filterData();
            updateStats();
            populateDistricts();

            // Close modal if open
            const editModal = document.getElementById('edit-modal');
            if (editModal) {
                editModal.classList.add('hidden');
                editModal.style.setProperty('display', 'none', 'important');
                editModal.classList.remove('opacity-0');
            }

        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire({
                title: t.delete_error,
                text: error.message,
                icon: 'error',
                customClass: {
                    popup: 'dark:bg-slate-800 dark:text-white'
                }
            });
        }
    }
};

// --- Helper Functions ---

function saveToCache(data) {
    try {
        const cachePayload = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
        console.error('Error saving to cache:', e);
    }
}

function loadFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const payload = JSON.parse(cached);
        const now = Date.now();

        // Check expiration
        if (now - payload.timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return payload.data;
    } catch (e) {
        console.error('Error loading from cache:', e);
        return null;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// init(); // Removed to prevent race condition with module loading
