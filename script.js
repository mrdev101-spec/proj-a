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
const addModal = document.getElementById('add-modal-v3');
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
        stat_health_stations: 'สถานีสุขภาพ',
        stat_provinces: 'จำนวนจังหวัด',
        stat_districts: 'จำนวนอำเภอ',
        search_placeholder: 'ค้นหา Serial / HCode / ชื่อ / อำเภอ / ศูนย์...',
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
        stat_health_stations: 'Health Stations',
        stat_provinces: 'Provinces',
        stat_districts: 'Districts',
        search_placeholder: 'Search Serial / HCode / Name / District / Center...',
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

        // Start fetching Thai Address Data in background
        fetchThaiAddressData();

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
            populateDistricts();
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
                    populateProvinces(); // Refresh Province Dropdown
                    populateDistricts(); // Refresh District Dropdown
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

    // Setup Validation
    setupValidation('add-form');
    setupValidation('edit-form');

    // Setup Auto-fill
    setupZipCodeAutoFill('add-form');
    setupZipCodeAutoFill('edit-form');
    setupAddressAutoFill('add-form');
    setupAddressAutoFill('edit-form');

    // Setup Serial Number Validation
    // Setup Serial Number Validation
    setupSerialNumberValidation();

    // Setup Custom Dropdowns
    setupCustomDropdown('province-filter');
    setupCustomDropdown('district-filter');
    setupCustomDropdown('rows-filter');
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
            (h.hcode && h.hcode.toLowerCase().includes(query)) ||
            (h.serial_number && h.serial_number.toLowerCase().includes(query)) ||
            (h.service_center && h.service_center.toLowerCase().includes(query))
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
        const prefix = formId.split('-')[0]; // 'add' or 'edit'

        const setLabel = (suffix, textTh, textEn) => {
            const label = document.querySelector(`label[for="${prefix}-${suffix}"]`);
            if (label) {
                const hasStar = label.querySelector('.text-red-500');
                const text = currentLang === 'th' ? textTh : textEn;

                if (hasStar) {
                    label.innerHTML = `${text} <span class="text-red-500">*</span>`;
                } else {
                    label.textContent = text;
                }
            }
        };

        setLabel('hcode', 'Hospital Code (รหัสสถานบริการ)', 'Hospital Code');
        setLabel('serial-number', 'Serial Number', 'Serial Number');
        setLabel('pcid', 'PC-ID', 'PC-ID');
        setLabel('anydesk', 'AnyDesk ID', 'AnyDesk ID');
        setLabel('district', 'อำเภอ', 'District');
        setLabel('sub-district', 'ตำบล', 'Sub-District');
        setLabel('province', 'จังหวัด', 'Province');
        setLabel('zip-code', 'รหัสไปรษณีย์', 'Zip Code');
        setLabel('log-book', 'สมุดบันทึก', 'Log Book');

        if (prefix === 'add') {
            setLabel('service-center', 'ศูนย์บริการสุขภาพ', 'Health Center');
        } else {
            setLabel('name', 'ชื่อสถานบริการ', 'Health Station Name');
            setLabel('service-center', 'หน่วยบริการ', 'Service Center');
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

        // Sort by createdAt descending (Newest first)
        healthStations.sort((a, b) => {
            const dateA = a.createdAt || '';
            const dateB = b.createdAt || '';
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            return 0;
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
    if (currentVal && provinces.includes(currentVal)) {
        provinceFilter.value = currentVal;
    } else {
        provinceFilter.value = ""; // Reset if valid option not found
    }
}

function populateDistricts() {
    // Ensure no ReferenceError here
    if (!districtFilter) return;
    const t = translations[currentLang];
    const currentVal = districtFilter.value;

    // Filter districts based on selected province
    const selectedProvince = provinceFilter ? provinceFilter.value : '';
    let availableStations = healthStations;

    if (selectedProvince) {
        availableStations = healthStations.filter(h => h.province === selectedProvince);
    }

    const districts = [...new Set(availableStations.map(h => h.district).filter(d => d))].sort();
    districtFilter.innerHTML = `<option value="">${t.filter_district_default}</option>`;
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });
    if (currentVal && districts.includes(currentVal)) {
        districtFilter.value = currentVal;
    } else {
        districtFilter.value = ""; // Reset if valid option not found
    }
}

function updateStats() {
    const t = translations[currentLang];
    const statCenters = document.getElementById('stat-centers-value');
    const statProvinces = document.getElementById('stat-provinces-value');
    const statDistricts = document.getElementById('stat-districts-value');

    if (statCenters) {
        // Health Station count based on Serial Number (filter out empty serials if needed, or just count all records)
        // Request says "count from Serial Number", assuming non-empty serials or just total records. 
        // Typically "count from serial number" implies counting entries that HAVE a serial number.
        const totalHealthStations = healthStations.filter(h => h.serial_number && h.serial_number.trim() !== '').length;
        // If they just mean "Total records", use healthStations.length. Sticking to "from Serial Number" interpretation:

        statCenters.innerHTML = `${t.stat_health_stations}: <span class="text-blue-600 dark:text-blue-400">${totalHealthStations}</span>`;
    }

    if (statProvinces) {
        const uniqueProvinces = new Set(healthStations.map(h => h.province ? h.province.trim() : '').filter(p => p !== '')).size;
        statProvinces.innerHTML = `${t.stat_provinces}: <span class="text-emerald-600 dark:text-emerald-400">${uniqueProvinces}</span>`;
    }

    if (statDistricts) {
        const uniqueDistricts = new Set(healthStations.map(h => h.district ? h.district.trim() : '').filter(d => d !== '')).size;
        statDistricts.innerHTML = `${t.stat_districts}: <span class="text-indigo-600 dark:text-indigo-400">${uniqueDistricts}</span>`;
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

window.openEditModal = function (id) {
    const station = healthStations.find(h => String(h.id) === String(id));
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
        deleteBtn.onclick = () => deleteItem(id);
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

    // Validate Form
    if (!validateForm('edit-form')) {
        const firstError = document.querySelector('#edit-form .val-error');
        if (firstError) {
            firstError.previousElementSibling.focus(); // Focus first invalid input
        }
        return;
    }

    const id = document.getElementById('edit-serial-number').value; // ID is now Serial Number
    const newData = {
        hcode: document.getElementById('edit-hcode').value,
        serial_number: document.getElementById('edit-serial-number').value,
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
        const docRef = window.firebase.doc(window.firebase.db, COLLECTION_NAME, id);
        await window.firebase.updateDoc(docRef, newData);

        const index = healthStations.findIndex(h => String(h.id) === String(id));
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
    const listView = document.getElementById('list-view');
    const detailsView = document.getElementById('details-view');

    // Toggle Views Immediately
    if (detailsView) detailsView.classList.add('hidden');
    if (listView) listView.classList.remove('hidden');

    // Clear details to avoid flashing old data next time
    document.getElementById('detail-name').textContent = '';

    // Show Stats Container Immediately
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.classList.remove('max-h-0', 'mb-0', 'opacity-0', 'scale-95');
        statsContainer.classList.add('max-h-[500px]', 'mb-8', 'opacity-100', 'scale-100');
    }

    // Refresh Table Data to reflect any changes made in Details View
    // Note: This might reset pagination to page 1 depending on filterData implementation
    if (typeof filterData === 'function') filterData();
    if (typeof updateStats === 'function') updateStats();
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

    // Hide Stats Container in Details View Immediately
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.classList.remove('max-h-[500px]', 'mb-8', 'opacity-100', 'scale-100');
        statsContainer.classList.add('max-h-0', 'mb-0', 'opacity-0', 'scale-95');
    }

    // Populate details
    // Hide Name in Header as per request
    const nameEl = document.getElementById('detail-name');
    if (nameEl) {
        nameEl.style.display = 'none';
        nameEl.textContent = station.name || '-';
    }

    // Header Title: S/N : [Serial Number]
    safeSetText('detail-header-sn', station.serial_number ? `S/N : ${station.serial_number}` : '-');

    // --- Station Details Card ---
    safeSetText('detail-serial', station.serial_number || '-');
    safeSetText('detail-pcid', station.pcId || '-');

    // AnyDesk
    const anydeskContainer = document.getElementById('container-anydesk');
    if (anydeskContainer) {
        anydeskContainer.innerHTML = `
            <p class="text-slate-800 dark:text-slate-200 font-bold text-lg" id="detail-anydesk">${station.anydesk || '-'}</p>
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

    // --- Location Card ---
    safeSetText('detail-service-center', station.service_center || '-');
    // FIX: Show HCode correctly (using id or hcode field)
    safeSetText('detail-hcode', station.hcode || station.id || '-');

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

        // Add Delete Button if not exists
        let deleteBtn = document.getElementById('detail-delete-btn');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'detail-delete-btn';
            deleteBtn.className = 'flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition-all active:scale-95 font-medium ml-3';
            deleteBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
            `;
            // Insert after Edit button
            editBtn.parentNode.insertBefore(deleteBtn, editBtn.nextSibling);
        }
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            confirmDelete(station.id);
        };
    }

    // Switch views Immediately
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

    // Animate Stats Container Out
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.classList.remove('max-h-[500px]', 'opacity-100', 'mb-8', 'scale-100');
        statsContainer.classList.add('max-h-0', 'opacity-0', 'mb-0', 'scale-95');
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
        // const nameInput = `< input type = "text" id = "edit-inline-name" value = "${station.name || ''}" class= "w-full bg-transparent border-b-2 border-slate-300 dark:border-slate-600 px-2 py-1 text-2xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder-slate-400" > `;
        // safeReplace('detail-name', nameInput);

        // Basic Info
        safeReplace('detail-serial', createInput(station.serial_number, 'edit-inline-serial'));
        safeReplace('detail-service-center', createInput(station.service_center, 'edit-inline-service-center'));
        safeReplace('detail-hcode', createInput(station.hcode || station.id, 'edit-inline-hcode')); // Added HCode input
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

        // Setup Auto-fill for Inline Edit
        setupInlineAutoFill();

    } catch (e) {
        console.error('Error in enableInlineEdit:', e);
    }
}

function setupInlineAutoFill() {
    const zipInput = document.getElementById('edit-inline-zip-code');
    const subDistrictInput = document.getElementById('edit-inline-sub-district');
    const districtInput = document.getElementById('edit-inline-district');
    const provinceInput = document.getElementById('edit-inline-province');

    let isAutoFilling = false; // Flag to prevent feedback loop

    if (zipInput) {
        zipInput.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, ''); // Digits only
            if (value.length === 5) {
                if (!thaiAddressDB) {
                    if (window.showToast) window.showToast('Loading address data... please wait');
                    return;
                }
                const addresses = lookupAllAddresses(value);
                if (addresses && addresses.length > 0) {
                    isAutoFilling = true; // Set flag
                    const firstMatch = addresses[0];

                    if (districtInput) {
                        districtInput.value = firstMatch.district;
                        districtInput.dispatchEvent(new Event('input'));
                    }
                    if (provinceInput) {
                        provinceInput.value = firstMatch.province;
                        provinceInput.dispatchEvent(new Event('input'));
                    }

                    if (subDistrictInput) {
                        const existingSelect = document.getElementById('edit-inline-sub-district-select');

                        if (addresses.length > 1) {
                            let select = existingSelect;
                            if (!select) {
                                select = document.createElement('select');
                                select.id = 'edit-inline-sub-district-select';
                                select.className = subDistrictInput.className;
                                select.classList.add('cursor-pointer');
                                subDistrictInput.parentNode.insertBefore(select, subDistrictInput);
                            }

                            select.innerHTML = '';
                            addresses.forEach(addr => {
                                const option = document.createElement('option');
                                option.value = addr.subDistrict;
                                option.textContent = addr.subDistrict;
                                select.appendChild(option);
                            });

                            subDistrictInput.style.display = 'none';
                            select.style.display = 'block';

                            select.value = firstMatch.subDistrict;
                            subDistrictInput.value = firstMatch.subDistrict;
                            subDistrictInput.dispatchEvent(new Event('input')); // Trigger update

                            select.onchange = () => {
                                subDistrictInput.value = select.value;
                                subDistrictInput.dispatchEvent(new Event('input')); // Important for saving

                                const selectedAddr = addresses.find(a => a.subDistrict === select.value);
                                if (selectedAddr) {
                                    if (districtInput) {
                                        districtInput.value = selectedAddr.district;
                                        districtInput.dispatchEvent(new Event('input'));
                                    }
                                    if (provinceInput) {
                                        provinceInput.value = selectedAddr.province;
                                        provinceInput.dispatchEvent(new Event('input'));
                                    }
                                }
                            };
                        } else {
                            if (existingSelect) existingSelect.style.display = 'none';
                            subDistrictInput.style.display = 'block';
                            subDistrictInput.value = firstMatch.subDistrict;
                            subDistrictInput.dispatchEvent(new Event('input'));
                        }
                    }
                    // Reset flag after events have propagated
                    setTimeout(() => isAutoFilling = false, 0);
                }
            }
        });
    }

    // Reverse Auto-fill (Address -> Zip)
    const handleReverseAutoFill = () => {
        if (isAutoFilling) return; // Exit if triggered by forward auto-fill

        if (subDistrictInput && districtInput && provinceInput && thaiAddressDB) {
            // Ensure we have values to check
            if (subDistrictInput.value && districtInput.value && provinceInput.value) {
                if (typeof lookupZip === 'function') {
                    const result = lookupZip(subDistrictInput.value, districtInput.value, provinceInput.value);
                    if (result && zipInput) {
                        zipInput.value = result;
                    }
                }
            }
        }
    };

    if (subDistrictInput) subDistrictInput.addEventListener('input', handleReverseAutoFill); // Changed to input for real-time feel
    if (districtInput) districtInput.addEventListener('input', handleReverseAutoFill);
    if (provinceInput) provinceInput.addEventListener('input', handleReverseAutoFill);
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
            hcode: getVal('edit-inline-hcode'), // Added HCode
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

function confirmDelete(id) {
    const t = translations[currentLang];
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!',
        customClass: {
            popup: 'dark:bg-slate-800 dark:text-white'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Force immediate view switch before processing delete
            showList();
            deleteItem(id);
        }
    });
}

async function deleteItem(id) {
    const t = translations[currentLang];
    console.log('deleteItem called for ID:', id);

    // 1. Optimistic UI: Switch back to list immediately
    showList();

    // 2. Optimistic Data Update: Remove locally first
    const originalStations = [...healthStations]; // Backup in case of error
    const stationIndex = healthStations.findIndex(s => s.id === id);

    if (stationIndex === -1) {
        console.warn('Station not found locally');
        // Even if not found locally, we might still want to try deleting from DB if ID is valid
        // But for UI purpose, we just return/proceed.
    } else {
        // Remove from local array
        healthStations.splice(stationIndex, 1);
    }

    // Refresh Dropdown Filters using the updated local data
    populateProvinces();
    populateDistricts();

    // Refresh Table & Stats IMMEDIATELY (After filters are potentially reset)
    filterData();
    updateStats();

    // Success Toast Immediately (Optimistic)
    if (window.showToast) {
        showToast('Deleted successfully');
    } else {
        console.log('Deleted successfully');
    }

    try {
        // 3. Perform Actual Delete
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, COLLECTION_NAME, id));

        // 4. Update Cache to prevent "stuck" data on refresh
        if (typeof saveToCache === 'function') {
            saveToCache(healthStations);
        }

    } catch (error) {
        console.error('Delete error, rolling back:', error);

        // Rollback
        healthStations = originalStations;
        filterData();
        updateStats();

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete item from database. Changes reverted. ' + error.message,
            customClass: {
                popup: 'dark:bg-slate-800 dark:text-white'
            }
        });
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
        <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </a>`
            : `<span class="text-slate-300 dark:text-slate-600 flex justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></span>`;

        row.innerHTML = `
            <td class="py-4 px-6 text-sm font-medium text-slate-900 dark:text-white">${startIndex + index + 1}</td>
            <td class="py-4 px-6 text-sm">
                <div class="flex items-center gap-2">
                    <span class="font-mono font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-800/50">${station.serial_number || '-'}</span>
                    ${station.serial_number ? `
                    <button onclick="copyToClipboard('${station.serial_number}', this)" class="group/copy relative p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Copy Serial Number">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span class="copy-feedback absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 transition-opacity pointer-events-none whitespace-nowrap">Copied!</span>
                    </button>` : ''}
                </div>
            </td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-medium">${station.service_center || '-'}</td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300"><span class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-1 px-2 rounded-lg text-xs font-semibold">${station.hcode}</span></td>
            <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">${station.district || '-'}</td>
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

// Debug-enhanced openAddModal
window.openAddModal = function () {
    console.log('openAddModal called - Debug v1');
    const modalId = 'add-modal-v3';
    let modal = document.getElementById(modalId);

    if (!modal) {
        console.error(`CRITICAL: Modal with ID '${modalId}' not found in DOM!`);
        // Fallback attempt to find ANY add modal
        modal = document.querySelector('[id^="add-modal"]');
        if (modal) console.log('Found alternative modal:', modal.id);
    }

    if (!modal) {
        alert('Error: Add Modal not found. Please refresh the page.');
        return;
    }

    console.log('Modal found:', modal);

    if (addForm) {
        addForm.reset();
        console.log('Form reset');
    }

    // Force visible
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Direct override

    // Force reflow
    void modal.offsetWidth;

    // Animation
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.remove('scale-95');
        }
    }, 10);
};

window.closeAddModal = function () {
    const modalId = 'add-modal-v3';
    let modal = document.getElementById(modalId);

    // Fallback search if ID fetch fails (consistency with open)
    if (!modal) modal = document.querySelector('[id^="add-modal"]');

    if (!modal) return;

    modal.classList.add('opacity-0');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // CRITICAL: Clear the inline flex
        if (addForm) addForm.reset();
    }, 300);
};

// --- Address Auto-fill Functions ---
let thaiAddressDB = null;

async function fetchThaiAddressData() {
    try {
        console.log('Starting address fetch...');
        const response = await fetch('https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json');
        if (!response.ok) throw new Error('Network response was not ok');
        thaiAddressDB = await response.json();
        console.log('Thai Address Data loaded:', thaiAddressDB.length, 'entries');
        if (thaiAddressDB.length > 0) {
            console.log('Sample DB Entry:', thaiAddressDB[0]);
        }
    } catch (error) {
        console.warn('Auto-fill data failed to load:', error);
        // Fallback or retry logic could go here
    }
}

function lookupAddress(zipCode) {
    if (!thaiAddressDB) return null;

    // Normalize input
    const zipInt = parseInt(zipCode, 10);

    // Search for match by zip code
    const match = thaiAddressDB.find(item => {
        const z = item.z || item.zipcode;
        if (Array.isArray(z)) {
            return z.some(code => code == zipCode || code == zipInt);
        }
        return z == zipCode || z == zipInt;
    });

    if (match) {
        return {
            subDistrict: match.d || match.district || match.sub_district || '',
            district: match.a || match.amphoe || match.amphur || match.district || '',
            province: match.p || match.province || ''
        };
    }
    return null;
}

function lookupAllAddresses(zipCode) {
    if (!thaiAddressDB) return [];

    const zipInt = parseInt(zipCode, 10);

    return thaiAddressDB.filter(item => {
        const z = item.z || item.zipcode;
        if (Array.isArray(z)) {
            return z.some(code => code == zipCode || code == zipInt);
        }
        return z == zipCode || z == zipInt;
    }).map(item => ({
        subDistrict: item.d || item.district || item.sub_district || '',
        district: item.a || item.amphoe || item.amphur || item.district || '',
        province: item.p || item.province || ''
    }));
}

function setupZipCodeAutoFill(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const prefix = formId.split('-')[0]; // 'add' or 'edit'
    const zipInput = document.getElementById(`${prefix}-zip-code`);

    if (!zipInput) return; // Exit if input not found

    zipInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Digits only

        // Auto-fill trigger when 5 digits
        if (value.length === 5) {
            if (!thaiAddressDB) {
                // Show a small non-intrusive notification if data is still loading
                const t = translations[currentLang];
                if (window.showToast) window.showToast('Loading address data... please wait');
                return;
            }

            const addresses = lookupAllAddresses(value);
            if (addresses && addresses.length > 0) {
                const subDistrictInput = document.getElementById(`${prefix}-sub-district`);
                const districtInput = document.getElementById(`${prefix}-district`);
                const provinceInput = document.getElementById(`${prefix}-province`);

                // Always take District and Province from the first match (usually consistent per zip)
                // Or we could logic check if they vary, but typically Zip -> District/Province is 1:1 or close enough for auto-fill default
                const firstMatch = addresses[0];

                if (districtInput) {
                    districtInput.value = firstMatch.district;
                    clearError(districtInput);
                }
                if (provinceInput) {
                    provinceInput.value = firstMatch.province;
                    clearError(provinceInput);
                }

                if (subDistrictInput) {
                    if (addresses.length > 1) {
                        // Multiple matches: Convert input to select
                        let select = document.getElementById(`${prefix}-sub-district-select`);

                        // If select doesn't exist, create it and hide input
                        if (!select) {
                            select = document.createElement('select');
                            select.id = `${prefix}-sub-district-select`;
                            // Copy styling from input
                            select.className = subDistrictInput.className;
                            // Remove some unneeded classes if any, adding styling for select
                            select.classList.add('cursor-pointer');

                            subDistrictInput.parentNode.insertBefore(select, subDistrictInput);
                        }

                        // Populate options
                        select.innerHTML = '';
                        addresses.forEach(addr => {
                            const option = document.createElement('option');
                            option.value = addr.subDistrict;
                            option.textContent = addr.subDistrict;
                            select.appendChild(option);
                        });

                        // Switch visibility
                        subDistrictInput.style.display = 'none';
                        subDistrictInput.classList.add('hidden-by-autofill'); // Marker class
                        select.style.display = 'block';

                        // Sync value to hidden input
                        select.value = addresses[0].subDistrict;
                        subDistrictInput.value = addresses[0].subDistrict;
                        clearError(subDistrictInput);

                        // Add change listener to sync back to input (for saving logic stability)
                        select.onchange = () => {
                            subDistrictInput.value = select.value;
                            // Potential: If sub-districts belong to different districts/provinces (rare but possible), update them too
                            const selectedAddr = addresses.find(a => a.subDistrict === select.value);
                            if (selectedAddr) {
                                if (districtInput) districtInput.value = selectedAddr.district;
                                if (provinceInput) provinceInput.value = selectedAddr.province;
                            }
                        };

                    } else {
                        // Single match: Revert to input if needed
                        const select = document.getElementById(`${prefix}-sub-district-select`);
                        if (select) {
                            select.style.display = 'none';
                        }
                        subDistrictInput.style.display = 'block';
                        subDistrictInput.classList.remove('hidden-by-autofill');

                        subDistrictInput.value = firstMatch.subDistrict;
                        clearError(subDistrictInput);
                    }
                }
            }
        }
    });
}

function lookupZip(subDistrict, district, province) {
    if (!thaiAddressDB) return null;

    // Normalize inputs
    const sd = subDistrict?.trim();
    const d = district?.trim();
    const p = province?.trim();

    if (!sd && !d && !p) return null;

    // Find match
    const match = thaiAddressDB.find(item => {
        const matchP = p ? (item.p === p || item.province === p) : true;
        const matchD = d ? (item.a === d || item.amphoe === d || item.amphur === d) : true;
        const matchSD = sd ? (item.d === sd || item.district === sd || item.sub_district === sd) : true;

        // Require at least District and Province match for accuracy, or SubDistrict and Province
        // Searching by just District or SubDistrict matches too many locally
        return matchP && (matchD || matchSD);
    });

    if (match) {
        let z = match.z || match.zipcode;
        return Array.isArray(z) ? z[0] : z;
    }
    return null;
}

function setupAddressAutoFill(formId) {
    const prefix = formId.split('-')[0];
    const subDistrictInput = document.getElementById(`${prefix}-sub-district`);
    const districtInput = document.getElementById(`${prefix}-district`);
    const provinceInput = document.getElementById(`${prefix}-province`);
    const zipInput = document.getElementById(`${prefix}-zip-code`);

    if (!zipInput) return;

    const performLookup = () => {
        if (!thaiAddressDB) return;

        const zip = lookupZip(
            subDistrictInput?.value,
            districtInput?.value,
            provinceInput?.value
        );

        if (zip) {
            zipInput.value = zip;
            clearError(zipInput);
        }
    };

    // Attach listeners
    [subDistrictInput, districtInput, provinceInput].forEach(input => {
        if (input) {
            input.addEventListener('change', performLookup); // Trigger on change (blur/enter) 
            // Also optional: 'input' with debounce if desired, but 'change' is safer for exact text
        }
    });
}

// --- Validation Functions ---

function showError(input, message) {
    const formGroup = input.closest('.form-group') || input.parentElement;
    clearError(input); // Clear existing first

    input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    input.classList.remove('border-slate-200', 'dark:border-slate-600', 'focus:border-blue-500', 'focus:ring-blue-500');

    const errorMsg = document.createElement('p');
    errorMsg.className = 'val-error text-red-500 text-xs mt-1 animate-fade-in-up';
    errorMsg.textContent = message;
    formGroup.appendChild(errorMsg);
}

function clearError(input) {
    const formGroup = input.closest('.form-group') || input.parentElement;

    input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    input.classList.add('border-slate-200', 'dark:border-slate-600', 'focus:border-blue-500', 'focus:ring-blue-500');

    const existingMsg = formGroup.querySelector('.val-error');
    if (existingMsg) {
        existingMsg.remove();
    }
}

function validateField(input) {
    const value = input.value.trim();
    const id = input.id;
    let isValid = true;
    let message = '';

    // Required check
    if (input.hasAttribute('required') && !value) {
        isValid = false;
        message = 'Please fill out this field.';
    }

    // Specific Field Rules
    if (isValid && value) {
        if (id.includes('hcode')) {
            if (value.length !== 5 || isNaN(value)) {
                isValid = false;
                message = 'Hospital Code must be 5 digits.';
            }
        }

        if (id.includes('zip-code')) {
            if (value.length !== 5 || isNaN(value)) {
                isValid = false;
                message = 'Zip Code must be 5 digits.';
            }
        }

        if (id.includes('anydesk')) {
            // Remove spaces and dashes for check
            const cleanValue = value.replace(/[\s-]/g, '');
            if (isNaN(cleanValue) || cleanValue.length < 9) {
                isValid = false;
                message = 'Invalid AnyDesk ID format.';
            }
        }
    }

    if (!isValid) {
        showError(input, message);
    } else {
        clearError(input);
    }

    return isValid;
}

function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    let isFormValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        // Skip hidden or disabled fields if any
        if (input.type === 'hidden' || input.disabled) return;

        if (!validateField(input)) {
            isFormValid = false;
        }
    });

    return isFormValid;
}

function setupValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // Clear error on input
        input.addEventListener('input', () => {
            clearError(input);
        });

        // Validate on blur
        input.addEventListener('blur', () => {
            validateField(input);
        });
    });
}

// Event listener moved to init()

async function handleAddSubmit(e) {
    e.preventDefault();
    const t = translations[currentLang];

    // Validate Form
    if (!validateForm('add-form')) {
        const firstError = document.querySelector('#add-form .val-error');
        if (firstError) {
            firstError.previousElementSibling.focus(); // Focus first invalid input
        }
        return;
    }

    const serialNumber = document.getElementById('add-serial-number').value.trim();

    // Manual fallback check
    if (!serialNumber) {
        showError(document.getElementById('add-serial-number'), 'Please enter Serial Number');
        return;
    }

    const newData = {
        hcode: document.getElementById('add-hcode').value,
        serial_number: serialNumber,
        service_center: document.getElementById('add-service-center').value,
        district: document.getElementById('add-district').value,
        sub_district: document.getElementById('add-sub-district').value,
        province: document.getElementById('add-province').value,
        zip_code: document.getElementById('add-zip-code').value,
        pcId: document.getElementById('add-pcid').value,
        anydesk: document.getElementById('add-anydesk').value,
        log_book: document.getElementById('add-log-book').value,
        createdAt: new Date().toISOString() // Add timestamp for sorting
    };

    const saveBtn = document.querySelector('.btn-save-add');
    const originalText = saveBtn ? saveBtn.textContent : 'Save';
    if (saveBtn) {
        saveBtn.textContent = t.saving;
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-75', 'cursor-not-allowed');
    }

    try {
        // Check if exists using Serial Number as ID
        const docRef = window.firebase.doc(window.firebase.db, COLLECTION_NAME, serialNumber);
        const docSnap = await window.firebase.getDoc(docRef);

        if (docSnap.exists()) {
            throw new Error('Health Station with this Serial Number already exists.');
        }

        await window.firebase.setDoc(docRef, newData);

        // Optimistic Update: Add to TOP of list
        healthStations.unshift({ id: serialNumber, ...newData });

        // Refresh Table & Stats & Filters IMMEDIATELY
        filterData();
        updateStats();
        populateProvinces(); // Refresh Province Dropdown
        populateDistricts(); // Refresh District Dropdown

        // Clear validation icon
        const iconContainer = document.getElementById('sn-status-icon');
        if (iconContainer) iconContainer.innerHTML = '';

        // Update Cache
        updateStats();
        populateProvinces(); // Refresh Province Dropdown
        populateDistricts(); // Refresh District Dropdown

        // Update Cache
        if (typeof saveToCache === 'function') {
            saveToCache(healthStations);
        }

        // Close Modal
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
        if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }
}

function setupSerialNumberValidation() {
    const snInput = document.getElementById('add-serial-number');
    const iconContainer = document.getElementById('sn-status-icon');
    const saveBtn = document.querySelector('.btn-save-add');

    if (!snInput || !iconContainer) return;

    snInput.addEventListener('input', () => {
        const val = snInput.value.trim();

        if (!val) {
            iconContainer.innerHTML = ''; // Empty
            // Reset border
            snInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500', 'border-green-500', 'focus:ring-green-500', 'focus:border-green-500');
            snInput.classList.add('border-slate-200', 'dark:border-slate-600', 'focus:ring-blue-500', 'focus:border-blue-500');

            // Re-enable save button (let validation handle empty required field on submit)
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            return;
        }

        const isDuplicate = healthStations.some(h => String(h.serial_number) === String(val));

        if (isDuplicate) {
            // Warning Icon
            iconContainer.innerHTML = `
                <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            `;
            // Add red border
            snInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            snInput.classList.remove('border-slate-200', 'dark:border-slate-600', 'focus:ring-blue-500', 'focus:border-blue-500', 'border-green-500', 'focus:ring-green-500', 'focus:border-green-500');

            // Disable Save Button
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
                saveBtn.title = 'Serial Number already exists';
            }
        } else {
            // Correct Icon
            iconContainer.innerHTML = `
                <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            `;
            // Add green border
            snInput.classList.add('border-green-500', 'focus:ring-green-500', 'focus:border-green-500');
            snInput.classList.remove('border-slate-200', 'dark:border-slate-600', 'focus:ring-blue-500', 'focus:border-blue-500', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');

            // Enable Save Button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                saveBtn.title = '';
            }
        }
    });
}

// Redefining deleteItem to be safe


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


// Redefining deleteItem to be safe
// (Assuming deleteItem is properly defined above or will be cleaned up, focusing on appending custom dropdown logic)

function setupCustomDropdown(selectId) {
    const originalSelect = document.getElementById(selectId);
    if (!originalSelect) return;

    // Check if already initialized
    if (originalSelect.dataset.customDropdownInitialized) return;
    originalSelect.dataset.customDropdownInitialized = 'true';

    // Hide original select completely to prevent native popup
    originalSelect.style.display = 'none';
    originalSelect.classList.add('hidden'); // Tailwind hidden
    originalSelect.style.visibility = 'hidden';
    originalSelect.style.opacity = '0';
    originalSelect.style.position = 'absolute'; // Remove from flow just in case
    originalSelect.style.zIndex = '-1';

    // Create Custom Wrapper
    const wrapper = document.createElement('div');
    // Check if original select has specific width classes or default to auto
    const widthClass = originalSelect.classList.contains('sm:w-48') ? 'w-full sm:w-48' : 'w-auto min-w-[120px]';
    wrapper.className = `relative ${widthClass}`;
    originalSelect.parentNode.insertBefore(wrapper, originalSelect);

    // Create Trigger Button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer';

    // Create text span
    const selectedText = document.createElement('span');
    selectedText.className = 'truncate mr-2';
    trigger.appendChild(selectedText);

    // Create Chevron Icon
    const chevron = document.createElement('div');
    chevron.innerHTML = `<svg class="w-4 h-4 text-slate-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;
    trigger.appendChild(chevron);

    wrapper.appendChild(trigger);

    // Create Options List Container (Hidden by default)
    const optionsList = document.createElement('div');
    optionsList.className = 'absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto opacity-0 invisible scale-95 transition-all duration-200 origin-top';
    wrapper.appendChild(optionsList);

    // Filter native chevron if it exists in HTML (the SVG sibling)
    const nativeChevron = originalSelect.nextElementSibling;
    if (nativeChevron && nativeChevron.tagName === 'DIV') {
        nativeChevron.style.display = 'none';
    }

    // State
    let isOpen = false;

    // Toggle Function
    const toggleDropdown = () => {
        isOpen = !isOpen;
        if (isOpen) {
            // Close other dropdowns
            document.querySelectorAll('.custom-dropdown-options').forEach(el => {
                if (el !== optionsList) {
                    el.classList.add('opacity-0', 'invisible', 'scale-95');
                    el.classList.remove('opacity-100', 'visible', 'scale-100');
                    // Reset chevrons
                    const otherChevron = el.parentElement.querySelector('svg');
                    if (otherChevron) otherChevron.classList.remove('rotate-180');
                }
            });

            optionsList.classList.remove('opacity-0', 'invisible', 'scale-95');
            optionsList.classList.add('opacity-100', 'visible', 'scale-100');
            chevron.firstElementChild.classList.add('rotate-180');
        } else {
            optionsList.classList.add('opacity-0', 'invisible', 'scale-95');
            optionsList.classList.remove('opacity-100', 'visible', 'scale-100');
            chevron.firstElementChild.classList.remove('rotate-180');
        }
    };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            if (isOpen) {
                isOpen = false;
                optionsList.classList.add('opacity-0', 'invisible', 'scale-95');
                optionsList.classList.remove('opacity-100', 'visible', 'scale-100');
                chevron.firstElementChild.classList.remove('rotate-180');
            }
        }
    });

    // Function to populate options from native select
    const syncOptions = () => {
        optionsList.innerHTML = '';
        const options = originalSelect.options;

        // Update Trigger Text
        if (originalSelect.selectedIndex >= 0) {
            selectedText.textContent = options[originalSelect.selectedIndex].text;
        }

        Array.from(options).forEach((opt, index) => {
            const item = document.createElement('div');
            item.className = `px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-slate-700/50 ${opt.selected ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-slate-700/30' : 'text-slate-700 dark:text-slate-300'}`;
            item.textContent = opt.text;

            item.addEventListener('click', () => {
                originalSelect.selectedIndex = index;
                originalSelect.dispatchEvent(new Event('change')); // Trigger native change
                selectedText.textContent = opt.text;
                toggleDropdown(); // Close

                // Re-sync styling
                syncOptions(); // To update bold/selected state in list
            });

            optionsList.appendChild(item);
        });
    };

    // Initial Sync
    syncOptions();

    // Observe changes in native select (for populateProvinces etc.)
    const observer = new MutationObserver(() => {
        syncOptions();
    });
    observer.observe(originalSelect, { childList: true, subtree: true, attributes: true });

    // Listen for manual value changes on native select (e.g. if updated via JS elsewhere)
    originalSelect.addEventListener('change', () => {
        if (originalSelect.selectedIndex >= 0) {
            selectedText.textContent = originalSelect.options[originalSelect.selectedIndex].text;
        }
    });
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
