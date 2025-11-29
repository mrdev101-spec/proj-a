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

async function init() {
    try {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading data...</td></tr>';
        await fetchData();
        populateDistricts();

        // Initial render with default limit
        filterData();
        updateStats(); // Update stats if we have them

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

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: red;">Failed to load data. Check console for details.</td></tr>';
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

    // Generate page buttons
    // For a large number of pages, we might want to limit this, but for now let's show all
    // or a simple window if it gets too large. 
    // Given the mockup showed 1-11, let's try to show a reasonable amount.

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.classList.add('page-btn');
        if (i === currentPage) btn.classList.add('active');
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            updateTableDisplay();
            // Optional: Scroll to top of table
            // document.querySelector('.table-card').scrollIntoView({ behavior: 'smooth' });
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
        // This regex splits by comma but ignores commas inside quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        // Fallback to simple split if regex doesn't match expected structure or for simple data
        // The previous simple split is often sufficient for Google Sheets CSV if no commas in data
        const columns = line.split(',');

        // Check if we have enough columns
        // Index 0: No
        // Index 1: Service Center (Name)
        // Index 2: HCode
        // Index 3: District
        // Index 4: PC-ID
        // Index 5: AnyDesk
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

    const districts = [...new Set(hospitals.map(h => h.district))].sort();
    districtFilter.innerHTML = '<option value="">เลือกอำเภอทั้งหมด</option>';
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });
}

function renderTable(data, startIndex = 0) {
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">ไม่พบข้อมูล</td></tr>';
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
                <button class="map-btn">แผนที่</button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    // Example: Update stats based on data
    // document.querySelector('.stat-card:nth-child(1) h3').textContent = `จำนวนศูนย์บริการ: ${hospitals.length}`;
}

function copyToClipboard(text) {
    if (!text) return;

    // Try modern API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast();
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // Fallback for non-secure contexts or older browsers
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure it's not visible but part of DOM
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
            showToast();
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

function showToast() {
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
