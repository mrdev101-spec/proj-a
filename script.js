// Firestore Collection Reference
console.log('Script v6 loaded - Serial Number Update');
const COLLECTION_NAME = 'health_station';

const tableBody = document.getElementById('health-station-list');
const toast = document.getElementById('toast');
const provinceFilter = document.getElementById('province-filter');
const districtFilter = document.getElementById('district-filter');
const searchInput = document.getElementById('search-input');
const rowsFilter = document.getElementById('rows-filter');
let toastTimeout;
let healthStations = []; // Store fetched data
let filteredHealthStations = []; // Store filtered data
let currentPage = 1;
let rowsPerPage = 5;
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
const addModal = document.getElementById('add-modal-v2');
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
        filter_province_default: 'เลือกจังหวัดทั้งหมด',
        filter_district_default: 'เลือกอำเภอทั้งหมด',
        refresh_btn: 'รีเฟรช',
        // Table Headers
        th_no: 'ลำดับ',
        th_health_station: 'สถานีสุขภาพ',
        th_hcode: 'HCode',
        th_serial_number: 'Serial Number',
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
        filter_province_default: 'All Province',
        filter_district_default: 'All Districts',
        refresh_btn: 'Refresh',
        // Table Headers
        th_no: 'No',
        th_health_station: 'Health Station',
        th_hcode: 'HCode',
        th_serial_number: 'Serial Number',
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
                populateProvinces();
                populateDistricts();
            } catch (e) {
                console.error('Error in populateFilters (cache):', e);
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
            populateProvinces();
            populateDistricts();
        } catch (e) {
            console.error('Error in populateFilters:', e);
        }

        // Initial render (or re-render with fresh data)
        filterData();
        updateStats();
        if (window.updateUIText) window.updateUIText();

        // Add event listeners
        if (provinceFilter) provinceFilter.addEventListener('change', () => {
            filterData();
        });
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
    const selectedProvince = provinceFilter ? provinceFilter.value : '';
    const selectedDistrict = districtFilter ? districtFilter.value : '';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    filteredHealthStations = healthStations.filter(h => {
        const matchesProvince = selectedProvince ? h.province === selectedProvince : true;
        const matchesDistrict = selectedDistrict ? h.district === selectedDistrict : true;
        const matchesSearch = query ? (
            (h.name && h.name.toLowerCase().includes(query)) ||
            (h.district && h.district.toLowerCase().includes(query)) ||
            (h.hcode && h.hcode.toLowerCase().includes(query))
        ) : true;

        return matchesProvince && matchesDistrict && matchesSearch;
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

    // Update Search Placeholder
    if (searchInput) {
        searchInput.placeholder = t.search_placeholder;
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
    populateProvinces();
    populateDistricts();
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
            healthStations.push({ id: doc.id, ...doc.data() });
        });

        saveToCache(healthStations);
        console.log(`Loaded ${healthStations.length} hospitals from Firestore`);
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// parseCSV removed as it is no longer needed

function populateProvinces() {
    if (!provinceFilter) return;
    const t = translations[currentLang];
    const currentVal = provinceFilter.value;
    const provinces = [...new Set(healthStations.map(h => h.province).filter(p => p))].sort();
    provinceFilter.innerHTML = `<option value="">${t.filter_province_default}</option>`;
    provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceFilter.appendChild(option);
    });
    if (currentVal) provinceFilter.value = currentVal;
}

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
    const station = healthStations.find(h => String(h.hcode) === String(hcode));
    if (!station) return;

    document.getElementById('edit-hcode').value = station.hcode || '';
    document.getElementById('edit-serial-number').value = station.serial_number || '';
    document.getElementById('edit-name').value = station.name || '';
    document.getElementById('edit-service-center').value = station.service_center || '';
    document.getElementById('edit-district').value = station.district || '';
    document.getElementById('edit-sub-district').value = station.sub_district || '';
    document.getElementById('edit-province').value = station.province || '';
    document.getElementById('edit-zip-code').value = station.zip_code || '';
    document.getElementById('edit-pcid').value = station.pcId || '';
    document.getElementById('edit-anydesk').value = station.anydesk || '';
    document.getElementById('edit-log-book').value = station.log_book || '';

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
        serial_number: document.getElementById('edit-serial-number').value,
        name: document.getElementById('edit-name').value,
        service_center: document.getElementById('edit-service-center').value,
        district: document.getElementById('edit-district').value,
        sub_district: document.getElementById('edit-sub-district').value,
        province: document.getElementById('edit-province').value,
        zip_code: document.getElementById('edit-zip-code').value,
        pcId: document.getElementById('edit-pcid').value,
        anydesk: document.getElementById('edit-anydesk').value,
        log_book: document.getElementById('edit-log-book').value
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
        saveBtn.classList.remove('opacity-0', 'cursor-not-allowed');
    }
}

function showList() {
    document.getElementById('details-view').classList.add('hidden');
    document.getElementById('list-view').classList.remove('hidden');
    // Clear details to avoid flashing old data next time
    document.getElementById('detail-name').textContent = '';
}

async function showDetails(id) {
    console.log('showDetails called with ID:', id);
    const station = healthStations.find(s => s.id === id);

    if (!station) {
        console.error('Station not found for ID:', id);
        return;
    }

    // Helper for safe text update
    const safeSetText = (eid, text) => {
        const el = document.getElementById(eid);
        if (el) el.textContent = text;
    };

    // Populate details
    // Hide Name in Header as per request
    const nameEl = document.getElementById('detail-name');
    if (nameEl) {
        nameEl.style.display = 'none';
        nameEl.textContent = station.name || '-';
    }

    safeSetText('detail-hcode', station.serial_number || '-');

    safeSetText('detail-serial', station.serial_number || '-');
    safeSetText('detail-service-center', station.service_center || '-');
    safeSetText('detail-pcid', station.pcId || '-');

    // AnyDesk - Restore View Structure
    const anydeskContainer = document.getElementById('container-anydesk');
    if (anydeskContainer) {
        anydeskContainer.innerHTML = `
            <p class="text-slate-800 dark:text-slate-200 font-mono text-lg" id="detail-anydesk">${station.anydesk || '-'}</p>
            ${station.anydesk ? `
            <button id="detail-copy-anydesk" class="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Copy ID">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>` : ''}
        `;
        // Re-attach event listener
        const copyBtn = document.getElementById('detail-copy-anydesk');
        if (copyBtn) copyBtn.onclick = () => copyToClipboard(station.anydesk);
    }

    safeSetText('detail-sub-district', station.sub_district || '-');
    safeSetText('detail-district', station.district || '-');
    safeSetText('detail-province', station.province || '-');
    safeSetText('detail-zip-code', station.zip_code || '-');

    // Log Book - Restore View Structure
    const logBookContainer = document.getElementById('container-log-book');
    if (logBookContainer) {
        logBookContainer.innerHTML = `<p class="text-slate-600 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed" id="detail-log-book">${station.log_book || '-'}</p>`;
    }

    // Setup Edit Button
    const editBtn = document.getElementById('detail-edit-btn');
    if (editBtn) {
        // Remove old event listeners by cloning (simple trick) or just re-assign onclick
        editBtn.onclick = () => enableInlineEdit(station.id);

        // Reset button state in case it was stuck in edit mode
        editBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
        `;
        editBtn.className = 'flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95 font-medium';
        editBtn.disabled = false;
    }

    // Switch views
    const listView = document.getElementById('list-view');
    const detailsView = document.getElementById('details-view');
    if (listView) listView.classList.add('hidden');
    if (detailsView) detailsView.classList.remove('hidden');
}

function enableInlineEdit(id) {
    console.log('enableInlineEdit called for ID:', id);
    const station = healthStations.find(s => s.id === id);
    if (!station) {
        console.error('Station not found for inline edit');
        return;
    }

    const createInput = (val, eid) => `<input type="text" id="${eid}" value="${val || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm">`;
    const createTextarea = (val, eid) => `<textarea id="${eid}" rows="5" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm">${val || ''}</textarea>`;

    const safeReplace = (elementId, content) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = content;
            // Ensure element is visible when editing
            el.style.display = 'block';
        } else {
            console.warn(`Element with ID ${elementId} not found`);
        }
    };

    try {
        // Replace text with inputs - Modern Styling
        // Custom styling for Header Name to match h2
        // Removed Name Input as per request - Name is now hidden in both View and Edit modes
        // const nameInput = `<input type="text" id="edit-inline-name" value="${station.name || ''}" class="w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-600 px-2 py-1 text-2xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder-slate-400">`;
        // safeReplace('detail-name', nameInput);

        // Basic Info
        safeReplace('detail-serial', createInput(station.serial_number, 'edit-inline-serial'));
        safeReplace('detail-service-center', createInput(station.service_center, 'edit-inline-service-center'));
        safeReplace('detail-pcid', createInput(station.pcId, 'edit-inline-pcid'));

        // Location
        safeReplace('detail-sub-district', createInput(station.sub_district, 'edit-inline-sub-district'));
        safeReplace('detail-district', createInput(station.district, 'edit-inline-district'));
        safeReplace('detail-province', createInput(station.province, 'edit-inline-province'));
        safeReplace('detail-zip-code', createInput(station.zip_code, 'edit-inline-zip-code'));

        // AnyDesk ID
        const anydeskContainer = document.getElementById('container-anydesk');
        if (anydeskContainer) {
            anydeskContainer.innerHTML = createInput(station.anydesk, 'edit-inline-anydesk');
        }

        // Log Book
        const logBookContainer = document.getElementById('container-log-book');
        if (logBookContainer) {
            logBookContainer.innerHTML = createTextarea(station.log_book, 'edit-inline-log-book');
        }

        // Update Header Buttons - Modern UI
        const editBtn = document.getElementById('detail-edit-btn');
        if (!editBtn) {
            console.error('Edit button not found');
            return;
        }

        // Create a container for buttons if not exists to manage layout better
        let btnContainer = document.getElementById('detail-action-btns');
        if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.id = 'detail-action-btns';
            btnContainer.className = 'flex items-center gap-3 animate-fade-in-up';
            if (editBtn.parentNode) {
                editBtn.parentNode.insertBefore(btnContainer, editBtn);
                btnContainer.appendChild(editBtn);
            }
        }

        // Transform Edit Button to Save Button
        editBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Save Changes</span>
        `;
        editBtn.onclick = () => saveInlineEdit(id);
        editBtn.className = 'flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 font-medium';

        // Add Cancel Button
        let cancelBtn = document.getElementById('detail-cancel-btn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.id = 'detail-cancel-btn';
            cancelBtn.className = 'flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all active:scale-95 font-medium';
            cancelBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
            `;
            if (btnContainer) {
                btnContainer.insertBefore(cancelBtn, editBtn); // Put Cancel before Save
            }
        }
        cancelBtn.onclick = () => cancelInlineEdit(id);

    } catch (e) {
        console.error('Error in enableInlineEdit:', e);
    }
}

async function saveInlineEdit(id) {
    console.log('saveInlineEdit called for ID:', id);
    const t = translations[currentLang];
    const editBtn = document.getElementById('detail-edit-btn');

    // Safety check for button
    if (!editBtn) {
        console.error('Edit button not found during save');
        return;
    }

    const originalContent = editBtn.innerHTML;
    const originalClass = editBtn.className;

    try {
        const station = healthStations.find(s => s.id === id);
        if (!station) throw new Error('Station not found');

        // Helper to safely get value
        const getVal = (eid) => {
            const el = document.getElementById(eid);
            return el ? el.value : '';
        };

        const newData = {
            // name: getVal('edit-inline-name'), // Name is not editable anymore
            serial_number: getVal('edit-inline-serial'),
            service_center: getVal('edit-inline-service-center'),
            pcId: getVal('edit-inline-pcid'),
            sub_district: getVal('edit-inline-sub-district'),
            district: getVal('edit-inline-district'),
            province: getVal('edit-inline-province'),
            zip_code: getVal('edit-inline-zip-code'),
            anydesk: getVal('edit-inline-anydesk'),
            log_book: getVal('edit-inline-log-book')
        };

        console.log('Saving data:', newData);

        // Set Loading State
        editBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving...</span>
        `;
        editBtn.disabled = true;

        // Update Firestore
        const docRef = window.firebase.doc(window.firebase.db, COLLECTION_NAME, station.hcode);
        await window.firebase.updateDoc(docRef, newData);

        // Update local data
        const index = healthStations.findIndex(h => h.id === id);
        if (index !== -1) {
            healthStations[index] = { ...healthStations[index], ...newData };
        }

        // Success Feedback
        Swal.fire({
            icon: 'success',
            title: t.saved,
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: 'dark:bg-slate-800 dark:text-white' }
        });

        // Refresh UI (this will reset the button to "Edit")
        showDetails(id);

        // Cleanup Buttons (Cancel button)
        const btnContainer = document.getElementById('detail-action-btns');
        if (btnContainer) {
            // Move edit button back out to its original place if needed, 
            // but showDetails might have already reset things. 
            // Let's just ensure the container is gone.
            const currentEditBtn = document.getElementById('detail-edit-btn');
            if (currentEditBtn && btnContainer.contains(currentEditBtn)) {
                btnContainer.parentNode.insertBefore(currentEditBtn, btnContainer);
            }
            btnContainer.remove();
        }

    } catch (error) {
        console.error('Save error:', error);
        Swal.fire({
            icon: 'error',
            title: t.save_error,
            text: error.message,
            customClass: { popup: 'dark:bg-slate-800 dark:text-white' }
        });

        // Revert button state on error
        editBtn.innerHTML = originalContent;
        editBtn.className = originalClass; // Restore original styling (green save button)
        editBtn.disabled = false;
    }
}

function cancelInlineEdit(id) {
    // Simply re-render details to revert changes
    showDetails(id);

    // Cleanup Buttons
    const btnContainer = document.getElementById('detail-action-btns');
    if (btnContainer) {
        // Move edit button back out
        const editBtn = document.getElementById('detail-edit-btn');
        btnContainer.parentNode.insertBefore(editBtn, btnContainer);
        btnContainer.remove();
    }
}

function renderTable(data, startIndex = 0) {
    const tbody = document.getElementById('health-station-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="py-8 text-center text-slate-500 dark:text-slate-400">
                    No health stations found
                </td>
            </tr>
        `;
        return;
    }

    // Data is already paginated by updateTableDisplay
    const paginatedData = data;

    paginatedData.forEach((station, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0';

        // Map Link
        const mapLink = station.lat && station.lng
            ? `<a href="https://www.google.com/maps?q=${station.lat},${station.lng}" target="_blank" class="text-blue-500 hover:text-blue-600 transition-colors">
                <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
               </a>`
            : `<span class="text-slate-300 dark:text-slate-600 flex justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg></span>`;

        row.innerHTML = `
            <td class="py-4 px-6 text-sm font-medium text-slate-900 dark:text-white">${startIndex + index + 1}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">${station.serial_number || '-'}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-medium">${station.service_center || '-'}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300"><span class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-1 px-2 rounded-lg text-xs font-semibold">${station.hcode}</span></td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">${station.province || '-'}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-mono">${station.pcId || '-'}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-mono">
                <div class="flex items-center gap-2">
                    <span>${station.anydesk || '-'}</span>
                    ${station.anydesk ? `
                    <button onclick="copyToClipboard('${station.anydesk}')" class="text-slate-400 hover:text-blue-500 transition-colors" title="Copy AnyDesk ID">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>` : ''}
                </div>
            </td>
            <td class="py-4 px-6 text-center">${mapLink}</td>
            <td class="py-4 px-6 text-center">
                <button onclick="showDetails('${station.id}')" class="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Details">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(data.length);
}

// --- Add Functions ---

// addModal and addForm are defined at the top

window.openAddModal = function () {
    console.log('openAddModal called');
    let modal = document.getElementById('add-modal-v3');
    if (!modal) {
        console.error('Add modal not found!');
        return;
    }

    if (addForm) addForm.reset();

    modal.classList.remove('hidden');
    // Force a reflow
    void modal.offsetWidth;

    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        const content = modal.querySelector('.modal-content');
        if (content) content.classList.remove('scale-95');
    });
};

window.closeAddModal = function () {
    let modal = document.getElementById('add-modal-v3');
    if (!modal) return;

    modal.classList.add('opacity-0');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

// Event listener moved to init()

async function handleAddSubmit(e) {
    e.preventDefault();
    const t = translations[currentLang];

    const newData = {
        hcode: document.getElementById('add-hcode').value,
        serial_number: document.getElementById('add-serial-number').value,
        name: document.getElementById('add-service-center').value, // Use Service Center as Name since Name field is removed
        service_center: document.getElementById('add-service-center').value,
        district: document.getElementById('add-district').value,
        sub_district: document.getElementById('add-sub-district').value,
        province: document.getElementById('add-province').value,
        zip_code: document.getElementById('add-zip-code').value,
        pcId: document.getElementById('add-pcid').value,
        anydesk: document.getElementById('add-anydesk').value,
        log_book: document.getElementById('add-log-book').value
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


document.addEventListener('DOMContentLoaded', () => {
    // Render Layout
    if (typeof renderHeader === 'function') renderHeader('nav_health_station');
    if (typeof renderSidebar === 'function') renderSidebar('health-station');

    // Check Permissions
    if (typeof checkPermission === 'function') checkPermission('health-station');

    // Setup Logout
    if (typeof setupLogout === 'function') setupLogout();

    // Initialize Page Logic
    init();
});
