// REPLACE THIS WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyCgMCzKOnDr0ijUilksYHokaCHJPoWQ7T1ctU08WgXlVpMbkYviGik4Wb3M41ZcURg_g/exec';

const tableBody = document.getElementById('Hospital');
const toast = document.getElementById('toast');
const districtFilter = document.getElementById('district-filter');
const searchInput = document.getElementById('search-input');
const rowsFilter = document.getElementById('rows-filter');
let toastTimeout;
let hospitals = []; // Store fetched data
let filteredHospitals = []; // Store filtered data
let currentPage = 1;
let currentLang = 'th'; // Default language

const refreshBtn = document.querySelector('.refresh-btn');
const globalOverlay = document.getElementById('global-loading-overlay');
const tableOverlay = document.getElementById('table-loading-overlay');
const tableCard = document.querySelector('.table-card');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.btn-cancel');

// Translations
const translations = {
    th: {
        title: 'POH Dashboard',
        stat_centers: 'จำนวนศูนย์บริการ',
        stat_districts: 'จำนวนอำเภอทั้งหมด',
        search_placeholder: 'ค้นหา HCode / ชื่อ / อำเภอ...',
        filter_district_default: 'เลือกอำเภอทั้งหมด',
        refresh_btn: 'รีเฟรช',
        table_headers: ['ลำดับ', 'สถานบริการ', 'HCode', 'อำเภอ', 'PC-ID', 'AnyDesk', 'แผนที่', 'แก้ไข', 'ลบ'],
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
        title: 'POH Dashboard',
        stat_centers: 'Service Centers',
        stat_districts: 'Total Districts',
        search_placeholder: 'Search HCode / Name / District...',
        filter_district_default: 'All Districts',
        refresh_btn: 'Refresh',
        table_headers: ['No', 'Hospital', 'HCode', 'District', 'PC-ID', 'AnyDesk ID', 'Map', 'Edit', 'Delete'],
        map_btn: 'Map',
        loading: 'Loading data...',
        no_data: 'No data found',
        rows_option: 'rows',
        copied: 'Copied to clipboard!',
        add_btn: 'Add Item',
        save_btn: 'Save',
        cancel_btn: 'Cancel',
        edit_modal_title: 'Edit Information',
        add_modal_title: 'Add New Item',
        saving: 'Saving...',
        saved: 'Saved successfully!',
        save_error: 'Error saving data',
        delete_btn: 'Delete',
        confirm_delete_title: 'Are you sure?',
        confirm_delete_text: 'You won\'t be able to revert this!',
        deleted_success: 'Deleted successfully',
        delete_error: 'Error deleting data'
    }
};

async function init() {
    try {
        // Initial load: Global overlay is visible by default in HTML
        toggleGlobalLoading(true);

        // Language Switcher Logic
        const langBtns = document.querySelectorAll('.lang-switch button');

        // Expose setLanguage globally
        window.setLanguage = function (lang) {
            if (lang !== currentLang) {
                switchLanguage(lang);
                updateLanguageButtons(lang);
            }
        };

        // Dark Mode Logic
        const modeToggleBtn = document.getElementById('mode-toggle-btn');
        const modeToggle = document.getElementById('mode-toggle'); // Hidden checkbox

        // Check localStorage
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.documentElement.classList.add('dark');
            if (modeToggle) modeToggle.checked = true;
        }

        if (modeToggleBtn) {
            modeToggleBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
                if (modeToggle) modeToggle.checked = isDark;
            });
        }

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

        await fetchData();
        populateDistricts();

        // Initial render
        filterData();
        updateStats();
        updateUIText();
        updateLanguageButtons(currentLang);

        // Add event listeners
        if (districtFilter) districtFilter.addEventListener('change', filterData);
        if (searchInput) searchInput.addEventListener('input', filterData);
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
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-500">Failed to load data. Check console for details.</td></tr>';
    } finally {
        toggleGlobalLoading(false);
    }
}

function filterData() {
    const selectedDistrict = districtFilter ? districtFilter.value : '';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    filteredHospitals = hospitals.filter(h => {
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


function updateLanguageButtons(lang) {
    const langBtns = document.querySelectorAll('.lang-switch button');
    langBtns.forEach(btn => {
        const btnLang = btn.textContent.toLowerCase();
        if (btnLang === lang) {
            // Active State
            btn.className = 'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400';
        } else {
            // Inactive State
            btn.className = 'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400';
        }
    });
}

function switchLanguage(lang) {
    currentLang = lang;
    updateUIText();
    populateDistricts();
    updateTableDisplay();
    updateStats();
}

function updateUIText() {
    const t = translations[currentLang];

    // Update static elements
    document.querySelector('h1').textContent = t.title;

    // Update placeholders
    if (searchInput) searchInput.placeholder = t.search_placeholder;

    // Update Refresh Button Text
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('svg');
        refreshBtn.innerHTML = '';
        if (icon) refreshBtn.appendChild(icon);
        const span = document.createElement('span');
        span.textContent = t.refresh_btn;
        refreshBtn.appendChild(span);
    }

    // Update Add Button Text
    const addBtnText = document.getElementById('add-btn-text');
    if (addBtnText) addBtnText.textContent = t.add_btn;

    // Update Table Headers
    const ths = document.querySelectorAll('thead th');
    t.table_headers.forEach((header, index) => {
        if (ths[index]) ths[index].textContent = header;
    });

    // Update Loading Text
    const loadingSpans = document.querySelectorAll('.loading-overlay span');
    loadingSpans.forEach(span => span.textContent = t.loading);

    // Update Rows Filter Options
    if (rowsFilter) {
        const options = rowsFilter.options;
        for (let i = 0; i < options.length; i++) {
            const val = options[i].value;
            options[i].textContent = `${val} ${t.rows_option}`;
        }
    }

    // Update Modal Titles
    const editModalTitle = document.getElementById('modal-title');
    if (editModalTitle) editModalTitle.textContent = t.edit_modal_title;

    const addModalTitle = document.getElementById('add-modal-title');
    if (addModalTitle) addModalTitle.textContent = t.add_modal_title;

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

    // Update Modal Buttons
    const cancelBtns = document.querySelectorAll('.btn-cancel');
    cancelBtns.forEach(btn => btn.textContent = t.cancel_btn);

    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) saveBtn.textContent = t.save_btn;

    const saveAddBtn = document.querySelector('.btn-save-add');
    if (saveAddBtn) saveAddBtn.textContent = t.save_btn;
}

function toggleGlobalLoading(isLoading) {
    if (!globalOverlay) return;
    if (isLoading) {
        globalOverlay.classList.remove('hidden'); // Ensure it's in DOM
        // Small delay to allow display:block to apply before opacity transition
        requestAnimationFrame(() => {
            globalOverlay.classList.remove('opacity-0', 'pointer-events-none');
        });
    } else {
        globalOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            globalOverlay.classList.add('hidden');
        }, 300); // Match duration-300
    }
}

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
    const totalPages = Math.ceil(filteredHospitals.length / limit);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * limit;
    const endIndex = limit > 0 ? startIndex + limit : filteredHospitals.length;
    const paginatedData = filteredHospitals.slice(startIndex, endIndex);

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
    try {
        if (API_URL.includes('REPLACE')) {
            console.warn('API_URL not set.');
        }

        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        hospitals = data;
        console.log(`Loaded ${hospitals.length} hospitals`);
    } catch (error) {
        console.error('Fetch error:', error);
        console.log('Falling back to CSV...');
        try {
            const csvResponse = await fetch('https://docs.google.com/spreadsheets/d/15TWNJ1vCFzWeFrwBEieRBaY5mf3HcDo_HjX_eyInTfc/export?format=csv');
            const csvText = await csvResponse.text();
            hospitals = parseCSV(csvText);
        } catch (csvError) {
            throw error;
        }
    }
}

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',');
        if (columns.length >= 6) {
            result.push({
                name: columns[1].trim(),
                hcode: columns[2].trim(),
                district: columns[3].trim(),
                pcId: columns[4].trim(),
                anydesk: columns[5].trim()
            });
        }
    }
    return result;
}

function populateDistricts() {
    if (!districtFilter) return;
    const t = translations[currentLang];
    const currentVal = districtFilter.value;
    const districts = [...new Set(hospitals.map(h => h.district))].sort();
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
    const statCards = document.querySelectorAll('.stat-card h3');

    if (statCards.length >= 2) {
        const totalCenters = hospitals.length;
        const totalDistricts = new Set(hospitals.map(h => h.district)).size;

        // Use span for the number to keep color
        statCards[0].innerHTML = `${t.stat_centers}: <span class="text-blue-600 dark:text-blue-400">${totalCenters}</span>`;
        statCards[1].innerHTML = `${t.stat_districts}: <span class="text-indigo-600 dark:text-indigo-400">${totalDistricts}</span>`;
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
    const hospital = hospitals.find(h => String(h.hcode) === String(hcode));
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

function closeEditModal() {
    editModal.classList.add('opacity-0');
    const content = editModal.querySelector('.modal-content');
    if (content) content.classList.add('scale-95');

    setTimeout(() => {
        editModal.classList.add('hidden');
    }, 300);
}

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
        if (API_URL.includes('REPLACE')) throw new Error('API_URL not configured');

        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                hcode: hcode,
                data: newData
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            const index = hospitals.findIndex(h => String(h.hcode) === String(hcode));
            if (index !== -1) {
                hospitals[index] = { ...hospitals[index], ...newData };
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
        } else {
            throw new Error(result.message || 'Unknown error');
        }

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

const addModal = document.getElementById('add-modal');

window.openAddModal = function () {
    document.getElementById('add-form').reset();
    addModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        addModal.classList.remove('opacity-0');
        const content = addModal.querySelector('.modal-content');
        if (content) content.classList.remove('scale-95');
    });
};

window.closeAddModal = function () {
    addModal.classList.add('opacity-0');
    const content = addModal.querySelector('.modal-content');
    if (content) content.classList.add('scale-95');

    setTimeout(() => {
        addModal.classList.add('hidden');
    }, 300);
};

document.getElementById('add-form').addEventListener('submit', handleAddSubmit);

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
        if (API_URL.includes('REPLACE')) throw new Error('API_URL not configured');

        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'add',
                data: newData
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            await fetchData(); // Reload data
            filterData();
            closeAddModal();
            Swal.fire({
                icon: 'success',
                title: t.saved,
                showConfirmButton: false,
                timer: 1500,
                customClass: {
                    popup: 'dark:bg-slate-800 dark:text-white'
                }
            });
        } else {
            throw new Error(result.message || 'Unknown error');
        }

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

// --- Delete Function ---

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
        // Show loading state
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
            if (API_URL.includes('REPLACE')) throw new Error('API_URL not configured');

            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    hcode: hcode
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Remove from local array
                hospitals = hospitals.filter(h => String(h.hcode) !== String(hcode));
                filterData();
                updateStats();
                closeEditModal();

                Swal.fire({
                    icon: 'success',
                    title: t.deleted_success,
                    showConfirmButton: false,
                    timer: 1500,
                    customClass: {
                        popup: 'dark:bg-slate-800 dark:text-white'
                    }
                });
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            Swal.fire({
                icon: 'error',
                title: t.delete_error,
                text: error.message,
                customClass: {
                    popup: 'dark:bg-slate-800 dark:text-white'
                }
            });
        }
    }
};

init();
