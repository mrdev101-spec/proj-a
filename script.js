// REPLACE THIS WITH YOUR GOOGLE SHEET CSV URL
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/15TWNJ1vCFzWeFrwBEieRBaY5mf3HcDo_HjX_eyInTfc/export?format=csv';

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

// Translations
const translations = {
    th: {
        title: 'POH Service Center Dashboard',
        stat_centers: 'จำนวนศูนย์บริการ',
        stat_districts: 'จำนวนอำเภอทั้งหมด',
        search_placeholder: 'ค้นหา HCode / ชื่อ / อำเภอ...',
        filter_district_default: 'เลือกอำเภอทั้งหมด',
        refresh_btn: 'รีเฟรช',
        table_headers: ['ลำดับ', 'สถานบริการ', 'HCode', 'อำเภอ', 'PC-ID', 'AnyDesk', 'แผนที่'],
        map_btn: 'แผนที่',
        loading: 'กำลังโหลดข้อมูล...',
        no_data: 'ไม่พบข้อมูล',
        rows_option: 'แถว',
        copied: 'คัดลอกเรียบร้อย!'
    },
    en: {
        title: 'POH Service Center Dashboard',
        stat_centers: 'Service Centers',
        stat_districts: 'Total Districts',
        search_placeholder: 'Search HCode / Name / District...',
        filter_district_default: 'All Districts',
        refresh_btn: 'Refresh',
        table_headers: ['No.', 'Hospital', 'HCode', 'District', 'PC-ID', 'AnyDesk ID', 'Map'],
        map_btn: 'Map',
        loading: 'Loading data...',
        no_data: 'No data found',
        rows_option: 'rows',
        copied: 'Copied to clipboard!'
    }
};

async function init() {
    try {
        // Initial load: Global overlay is visible by default in HTML
        // Ensure it's visible just in case
        toggleGlobalLoading(true);

        // Language Switcher Logic
        // We will use inline onclick in HTML for robustness
        const langBtns = document.querySelectorAll('.lang-switch button');
        console.log('Found language buttons:', langBtns.length);

        // Expose setLanguage globally
        window.setLanguage = function (lang) {
            console.log('setLanguage called with:', lang);
            if (lang !== currentLang) {
                switchLanguage(lang);
                // Update active class manually since we might not have the button reference
                langBtns.forEach(btn => {
                    if (btn.textContent.toLowerCase() === lang) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        };

        await fetchData();
        populateDistricts();

        // Initial render with default limit
        filterData();
        updateStats(); // Update stats if we have them
        updateUIText(); // Initial UI text update

        // Add event listeners
        if (districtFilter) {
            districtFilter.addEventListener('change', filterData);
        }

        if (searchInput) {
            searchInput.addEventListener('input', filterData);
        }

        if (rowsFilter) {
            rowsFilter.addEventListener('change', () => {
                currentPage = 1; // Reset to page 1 when changing rows per page
                updateTableDisplay();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                // Refresh button: Use table overlay (Local refresh only)
                toggleTableLoading(true);

                // Artificial delay to show loading effect
                await new Promise(r => setTimeout(r, 500));
                try {
                    await fetchData();

                    // Keep current filters, just re-apply them to new data
                    filterData(); // Re-apply filters
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
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: red;">Failed to load data. Check console for details.</td></tr>';
    } finally {
        // Hide global overlay after initial load
        toggleGlobalLoading(false);
    }
}

function switchLanguage(lang) {
    currentLang = lang;
    updateUIText();
    populateDistricts(); // Re-populate to update default option
    updateTableDisplay(); // Re-render table to update headers/buttons
    updateStats(); // Re-render stats
}

function updateUIText() {
    const t = translations[currentLang];

    // Update static elements
    document.querySelector('h1').textContent = t.title;

    // Update placeholders
    if (searchInput) searchInput.placeholder = t.search_placeholder;

    // Update Refresh Button Text (preserve icon)
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('svg');
        refreshBtn.innerHTML = '';
        if (icon) refreshBtn.appendChild(icon);
        refreshBtn.appendChild(document.createTextNode(' ' + t.refresh_btn));
    }

    // Update Table Headers
    const ths = document.querySelectorAll('thead th');
    if (ths.length === t.table_headers.length) {
        ths.forEach((th, index) => {
            th.textContent = t.table_headers[index];
        });
    }

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
}

// Filter function
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

    // Reset to page 1 on new filter
    currentPage = 1;
    updateTableDisplay();
}

function toggleGlobalLoading(isLoading) {
    if (!globalOverlay) return;
    if (isLoading) {
        globalOverlay.classList.remove('hidden');
    } else {
        // Add a small delay for smooth transition if needed, or immediate
        setTimeout(() => {
            globalOverlay.classList.add('hidden');
        }, 500);
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

    // Ensure currentPage is valid
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Calculate slice range
    const startIndex = (currentPage - 1) * limit;
    // If limit is 0 or invalid, show all (though UI doesn't allow it, safe fallback)
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
        btn.classList.add('page-btn');
        if (i === currentPage) btn.classList.add('active');
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
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        hospitals = parseCSV(data);
        console.log(`Loaded ${hospitals.length} hospitals`);
    } catch (error) {
        console.error('Fetch error:', error);
        throw error; // Re-throw to be caught in init
    }
}

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/); // Handle both \n and \r\n
    const result = [];

    // Start from index 1 to skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV with potential quotes (basic implementation)
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const columns = line.split(',');

        // Check if we have enough columns
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
    const currentVal = districtFilter.value; // Preserve selection if possible

    const districts = [...new Set(hospitals.map(h => h.district))].sort();
    districtFilter.innerHTML = `<option value="">${t.filter_district_default}</option>`;
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });

    // Restore selection if it still exists
    if (currentVal) {
        districtFilter.value = currentVal;
    }
}

function renderTable(data, startIndex = 0) {
    const t = translations[currentLang];

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${t.no_data}</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map((hospital, index) => `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td>${hospital.name}</td>
            <td>${hospital.hcode}</td>
            <td>${hospital.district}</td>
            <td>${hospital.pcId}</td>
            <td>
                <div class="copy-wrapper">
                    <span class="anydesk-id">${hospital.anydesk}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${hospital.anydesk}')" aria-label="Copy Anydesk ID">
                        <svg viewBox="0 0 24 24">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            </td>
            <td>
                <button class="map-btn">${t.map_btn}</button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const t = translations[currentLang];
    const statCards = document.querySelectorAll('.stat-card h3');

    if (statCards.length >= 2) {
        // Assuming first card is centers, second is districts
        // We need to keep the numbers dynamic
        const totalCenters = hospitals.length;
        const totalDistricts = new Set(hospitals.map(h => h.district)).size;

        statCards[0].textContent = `${t.stat_centers}: ${totalCenters}`;
        statCards[1].textContent = `${t.stat_districts}: ${totalDistricts}`;
    }
}

function copyToClipboard(text) {
    const t = translations[currentLang];
    if (!text) return;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(t.copied);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const t = translations[currentLang];
    const textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(t.copied);
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
    if (message) toast.textContent = message;
    toast.classList.remove('hidden');

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Start the app
init();
