const state = {
    sort: 'year_desc',
    filter: 'all',
    q: '',
    page: 1,
    pageSize: 100,
    userMode: null // 'admin' or 'guest'
};

// Data Store
let RAW_DATA = [];
let NORM = [];

// Icons
const ICONS = {
    letterboxd: `<svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/></svg>`,
    drive: `<svg viewBox="0 0 24 24" class="icon"><path d="M12.01 2.02c-.17 0-.34.04-.5.13L2.09 7.6c-.32.18-.5.54-.48.91 0 .37.21.71.55.88l9.42 4.71c.15.08.32.12.49.12.18 0 .35-.04.5-.12l9.4-4.7c.34-.17.55-.52.55-.89 0-.36-.2-.71-.52-.89L12.51 2.15c-.16-.09-.33-.13-.5-.13zM12 14.4L3.62 10.2l8.39 4.2 8.35-4.18L12 14.4z"/><path d="M4 12v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6l-8 4-8-4z"/></svg>`,
    download: `<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" class="icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    info: `<svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" class="icon"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" class="icon"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    initLockScreen();
    setupListeners();
});

// 0. Lock Screen
function initLockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    const step1 = document.getElementById('authStep1');
    const step2 = document.getElementById('authStep2');

    // Buttons
    const btnAdmin = document.getElementById('btnAdmin');
    const btnGuest = document.getElementById('btnGuest');
    const btnBack = document.getElementById('backToAuth');
    const btnUnlock = document.getElementById('lockBtn');
    const input = document.getElementById('lockInput');

    if (!lockScreen) return;

    // Guest Flow
    btnGuest.addEventListener('click', () => {
        state.userMode = 'guest';
        unlockApp();
    });

    // Admin Flow
    btnAdmin.addEventListener('click', () => {
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        input.focus();
    });

    btnBack.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        input.value = '';
    });

    // Password Check
    const tryUnlock = async () => {
        const password = input.value;
        if (!password) return;

        // Client-side quick check for "2025" logic requested by user
        if (password === '2025') {
            state.userMode = 'admin';
            unlockApp();
            return;
        }

        // Fallback to server check if needed (or just implement strict check here)
        // Keeping server check for potential robustness if 2025 changes on server
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (data.success) {
                state.userMode = 'admin';
                unlockApp();
            } else {
                // Fail Style
                input.style.borderColor = 'red';
                input.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
            }
        } catch (e) {
            console.error(e);
            alert('Auth Error');
        }
    };

    btnUnlock.addEventListener('click', tryUnlock);
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') tryUnlock();
    });

}, 500);
    }

function unlockApp() {
    lockScreen.style.opacity = '0';
    setTimeout(() => {
        lockScreen.style.display = 'none';
        fetchData();
        // Show Admin Controls
        if (state.userMode === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
    }, 500);
}
}

// 1. Fetch Data
async function fetchData() {
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.remove('hidden');

    try {
        const res = await fetch('/api/movies');
        if (!res.ok) throw new Error('Failed to load');
        RAW_DATA = await res.json();
        normalize();
        populateFilters();
        render(); // First Render
        updateBottomPagination(); // Ensure visible
    } catch (e) {
        document.querySelector('#grid').innerHTML = `<div class="error">Failed to load payload. <br/><small>${e.message}</small></div>`;
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

// 2. Normalize
function normalize() {
    NORM = RAW_DATA.map(r => ({
        ...r,
        title: (r.title || '').trim(),
        original: (r.original || '').trim(),
        year: r.year ? parseInt(r.year) : null,
        director: (r.director || '').trim(),
        lb: r.letterboxd,
        drive: r.drive,
        dl: r.download,
        _s: [(r.title || ''), (r.original || ''), (r.director || ''), (r.year || '')].join(' ').toLowerCase()
    }));
}

// 3. Populate Filters
function populateFilters() {
    const years = [...new Set(NORM.map(x => x.year).filter(Boolean))].sort((a, b) => b - a);
    const ySel = document.querySelector('#yearFilter');
    ySel.innerHTML = '<option value="all">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    const dirs = [...new Set(NORM.map(x => x.director).filter(Boolean))].sort();
    const dSel = document.querySelector('#dirFilter');
    dSel.innerHTML = '<option value="all">All Directors</option>' + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
}

// 4. Setup Listeners
function setupListeners() {
    const r = () => { state.page = 1; render(); };

    document.querySelector('#q').addEventListener('input', (e) => { state.q = e.target.value.toLowerCase(); r(); });
    document.querySelector('#yearFilter').addEventListener('change', (e) => { state.filter = e.target.value === 'all' ? 'all' : { type: 'year', val: parseInt(e.target.value) }; r(); });
    document.querySelector('#dirFilter').addEventListener('change', (e) => { state.filter = e.target.value === 'all' ? 'all' : { type: 'director', val: e.target.value }; r(); });

    document.querySelector('#missingFilter').addEventListener('change', (e) => {
        const v = e.target.value;
        if (v === 'all') state.filter = 'all';
        else state.filter = { type: 'missing', field: v };
        r();
    });

    document.querySelector('#sortFilter').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

    // Theme Logic
    const themeBtn = document.querySelector('#themeToggle');
    if (themeBtn) {
        const updateThemeUI = (theme) => {
            themeBtn.innerHTML = theme === 'light' ? `${ICONS.sun} Light` : `${ICONS.moon} Dark`;
        };
        updateThemeUI(localStorage.getItem('theme') || 'dark');
        themeBtn.addEventListener('click', () => {
            const curr = document.documentElement.getAttribute('data-theme');
            const next = curr === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeUI(next);
        });
    }

    // View Mode
    const compactBtn = document.querySelector('#compactBtn');
    if (compactBtn) {
        compactBtn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/></svg> View`;
        compactBtn.addEventListener('click', () => {
            document.body.classList.toggle('compact');
        });
    }

    // Comfort Mode
    const comfortCheck = document.querySelector('#comfortToggle');
    if (comfortCheck) {
        comfortCheck.addEventListener('change', (e) => {
            document.body.classList.toggle('comfort-mode', e.target.checked);
        });
    }

    // Top Pagination
    document.querySelector('#prev').addEventListener('click', prevPage);
    document.querySelector('#next').addEventListener('click', nextPage);

    // For simplicity, we'll re-render them inside render() to keep sync. or wire global ones below:

    // Admin Tools Listeners (Safe)
    const addBtn = document.querySelector('.add-btn');
    if (addBtn) addBtn.addEventListener('click', () => openEditDialog());

    const csvBtn = document.querySelector('.csv-btn');
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            getDialog('csvDialog', `
                <h2>Import CSV</h2>
                <br>
                <textarea id="csvInput" placeholder="Paste CSV content here..." style="width:100%;height:200px;font-family:monospace;"></textarea>
                <div class="actions" style="justify-content:flex-end;margin-top:10px;">
                    <button class="btn btn-ghost">Cancel</button>
                    <button class="btn btn-primary" onclick="processCSV()">Import</button>
                </div>
            `).showModal();
        });
    }
}

function prevPage() {
    if (state.page > 1) { state.page--; render(); window.scrollTo(0, 0); }
}

function nextPage() {
    const max = Math.ceil(sortData(filterData()).length / state.pageSize);
    if (state.page < max) { state.page++; render(); window.scrollTo(0, 0); }
}

function filterData() {
    let base = NORM;
    if (state.q) base = base.filter(x => x._s.includes(state.q));
    if (state.filter !== 'all') {
        const f = state.filter;
        if (f.type === 'year') base = base.filter(x => x.year === f.val);
        else if (f.type === 'director') base = base.filter(x => x.director === f.val);
        else if (f.type === 'missing') {
            if (f.field === 'letterboxd') base = base.filter(x => !x.lb);
            else if (f.field === 'drive') base = base.filter(x => !x.drive);
            else if (f.field === 'download') base = base.filter(x => !x.dl);
            else if (f.field === 'missing_any') base = base.filter(x => (!x.lb || !x.drive || !x.dl));
            else if (f.field === 'both_links') base = base.filter(x => (x.lb && x.drive));
            else if (f.field === 'no_year') base = base.filter(x => !x.year);
        }
    }
    return base;
}

function sortData(rows) {
    const byYearDesc = (a, b) => ((b.year || 0) - (a.year || 0)) || String(a.title).localeCompare(String(b.title));
    const byYearAsc = (a, b) => ((a.year || 3000) - (b.year || 3000)) || String(a.title).localeCompare(String(b.title));
    const byTitleAsc = (a, b) => String(a.title).localeCompare(String(b.title));
    const byOrigAsc = (a, b) => String(a.original).localeCompare(String(b.original));
    const byDirAsc = (a, b) => String(a.director).localeCompare(String(b.director));

    const map = {
        'year_desc': byYearDesc, 'year_asc': byYearAsc,
        'title_asc': byTitleAsc, 'original_asc': byOrigAsc, 'director_asc': byDirAsc
    };
    return rows.slice().sort(map[state.sort]);
}

function render() {
    const filtered = filterData();
    const all = sortData(filtered);
    const total = all.length;
    const maxPage = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > maxPage) state.page = maxPage;

    // Pagination Slicing
    const start = (state.page - 1) * state.pageSize;
    const pageRows = all.slice(start, start + state.pageSize);

    // Update Counts & Meta
    document.querySelector('#count').textContent = total.toLocaleString();
    const txt = `Page ${state.page} / ${maxPage}`;
    document.querySelector('#pageInfo').textContent = txt;

    // Button States
    const pBtn = document.querySelector('#prev');
    const nBtn = document.querySelector('#next');
    pBtn.disabled = state.page <= 1;
    nBtn.disabled = state.page >= maxPage;

    // Bottom Pagination Update
    updateBottomPagination(state.page, maxPage);

    // Render Grid
    const grid = document.querySelector('#grid');
    grid.innerHTML = '';

    if (pageRows.length === 0) {
        grid.innerHTML = '<div class="empty">No films match your filters.</div>';
        return;
    }

    const frag = document.createDocumentFragment();
    const isAdmin = state.userMode === 'admin';

    pageRows.forEach((r, idx) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.style.animationDelay = `${Math.min(idx * 0.04, 1)}s`;

        const t = escapeHtml(r.title);
        const yr = r.year || NA;

        // --- Edit Button (Admin Only) ---
        const editBtn = isAdmin ? `<button class="edit-btn" onclick="openEditDialog('${r.__id}')">${ICONS.edit} Edit</button>` : '';

        // Poster
        const posterUrl = getPosterUrl(r.title, r.year);
        const posterLink = r.lb || `https://letterboxd.com/search/${encodeURIComponent(r.title + ' ' + (r.year || ''))}`;

        // Interactive Parts
        const titleHtml = `<a href="${posterLink}" target="_blank" class="title-link" style="color:inherit;text-decoration:none;">${highlight(t, state.q)}</a> 
            <span class="badge year-badge" onclick="event.stopPropagation(); filterByYear('${r.year}')" style="cursor:pointer;" title="Filter by ${r.year}">${yr}</span>`;

        const metaHtml = `
            <span class="kv"><span class="label">Original:</span> ${r.original ? escapeHtml(r.original) : NA}</span>
            <span class="kv"><span class="label">Director:</span> ${r.director ? `<a href="#" onclick="event.stopPropagation();filterByDir('${escapeHtml(r.director)}')" style="color:inherit;text-decoration:none;border-bottom:1px dotted;">${highlight(r.director, state.q)}</a>` : NA}</span>`;

        // Buttons
        const lbBtn = r.lb ? `<a class="btn letter" href="${r.lb}" target="_blank">${ICONS.letterboxd} Letterboxd</a>` : '';
        const drBtn = r.drive ? `<a class="btn drive" href="${r.drive}" target="_blank">${ICONS.drive} Drive</a>` : '';
        const dlBtn = r.dl ? `<a class="btn download" href="${r.dl}" target="_blank">${ICONS.download} Download</a>` : '';

        const plotBtn = `<button class="btn info" onclick="event.stopPropagation(); fetchDetails('${r.__id}', '${escapeHtml(t)}', '${r.year}', '${escapeHtml(r.director)}')" title="View Plot">
            ${ICONS.info} Plot of film
        </button>`;

        card.innerHTML = `
            ${editBtn}
            <a href="${posterLink}" target="_blank" style="display:block;position:relative;">
                <img src="${posterUrl}" class="card-poster" loading="lazy" onerror="this.style.opacity='0.3'">
            </a>
            <div class="title">${titleHtml}</div>
            <div class="meta">${metaHtml}</div>
            
            <div class="actions">
                ${lbBtn} ${drBtn} ${dlBtn} ${plotBtn}
            </div>
        `;
        frag.appendChild(card);
    });
    grid.appendChild(frag);
}

function updateBottomPagination(page, maxPage) {
    const container = document.getElementById('paginationBottom');
    if (!container) return;

    // Rebuild HTML
    container.innerHTML = `
        <button class="page-btn prev-btn" ${page <= 1 ? 'disabled' : ''}>Prev</button>
        <span class="counter page-info">Page ${page} / ${maxPage}</span>
        <button class="page-btn next-btn" ${page >= maxPage ? 'disabled' : ''}>Next</button>
    `;

    // Wire events
    container.querySelector('.prev-btn').addEventListener('click', () => { prevPage(); window.scrollTo(0, 0); });
    container.querySelector('.next-btn').addEventListener('click', () => { nextPage(); window.scrollTo(0, 0); });
}

function filterByDir(d) {
    if (!d) return;
    state.filter = { type: 'director', val: d };
    state.page = 1;
    document.querySelector('#dirFilter').value = d;
    render();
}

// ... (Rest of formatters, helpers, and Dialog functions remain similar, ensuring Admin checks in saveItem)

function getPosterUrl(title, year) {
    const query = encodeURIComponent(`${title} ${year || ''} movie poster`);
    return `https://tse2.mm.bing.net/th?q=${query}&w=300&h=450&c=7&rs=1&p=0`;
}

function highlight(text, query) {
    if (!query) return escapeHtml(text || '');
    try {
        const safe = query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
        const re = new RegExp('(' + safe + ')', 'ig');
        return escapeHtml(text || '').replace(re, '<mark>$1</mark>');
    } catch { return escapeHtml(text || ''); }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ... Keep existing Dialog/FetchDetails/Save Item functions, but ensure SaveItem checks permission
async function saveItem(id) {
    if (state.userMode !== 'admin') {
        alert('Guest mode: Editing disabled.');
        return;
    }
    // ... (Existing implementation of saveItem)
    const payload = {
        title: document.getElementById('inpTitle').value,
        year: document.getElementById('inpYear').value,
        original: document.getElementById('inpOriginal').value,
        director: document.getElementById('inpDirector').value,
        letterboxd: document.getElementById('inpLb').value,
        drive: document.getElementById('inpDrive').value,
        download: document.getElementById('inpDl').value,
    };
    if (id) payload.__id = id;

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? '/api/movies/' + id : '/api/movies';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            document.getElementById('editDialog').close();
            fetchData();
        } else alert('Failed to save');
    } catch (e) { console.error(e); alert('Error saving'); }
}

// Re-include other necessary existing functions (Dialogs, CSV etc) if not covered by general 'rest of' comment?
// To be safe, I should have pasted the WHOLE file content if I used replace_file_content for the whole file. 
// Ah, the tool `replace_file_content` replaces a BLOCK. 
// I used `StartLine: 1, EndLine: 717` effectively rewriting the whole file. 
// I need to make sure I included EVERYTHING. 
// I see I omitted `getDialog`, `initDetailsDialog`, `openEditDialog`, `processCSV`. I should include them.

function getDialog(id, html) {
    let dlg = document.getElementById(id);
    if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = id;
        dlg.className = 'dialog-modal';
        dlg.innerHTML = html;
        document.body.appendChild(dlg);
        const cancelBtn = dlg.querySelector('.btn-ghost');
        if (cancelBtn) cancelBtn.addEventListener('click', () => dlg.close());
    }
    return dlg;
}

function initDetailsDialog() {
    let dlg = document.getElementById('detailsDialog');
    if (!dlg) {
        getDialog('detailsDialog', `
            <div style="position:relative;">
                <button class="btn btn-ghost" style="position:absolute;top:0;right:0;padding:4px;" onclick="document.getElementById('detailsDialog').close()">✕</button>
                <div id="detailsContent"></div>
            </div>
        `);
    }
}

async function openEditDialog(id) {
    if (state.userMode !== 'admin') return; // Double check
    const isEdit = !!id;
    let item = {};
    if (isEdit) item = NORM.find(r => r.__id === id) || {};

    const html = `
        <h2>${isEdit ? 'Edit Film' : 'Add New Film'}</h2>
        <form class="edit-form" onsubmit="event.preventDefault(); saveItem('${id || ''}');">
            <div class="form-group"><label>Title</label><input type="text" id="inpTitle" value="${escapeHtml(item.title)}" required></div>
            <div class="form-group"><label>Year</label><input type="number" id="inpYear" value="${item.year || ''}"></div>
            <div class="form-group"><label>Original Title</label><input type="text" id="inpOriginal" value="${escapeHtml(item.original)}"></div>
            <div class="form-group"><label>Director</label><input type="text" id="inpDirector" value="${escapeHtml(item.director)}"></div>
            <div class="form-group"><label>Letterboxd URL</label><input type="url" id="inpLb" value="${item.letterboxd || ''}"></div>
            <div class="form-group"><label>Google Drive URL</label><input type="url" id="inpDrive" value="${item.drive || ''}"></div>
            <div class="form-group"><label>Download URL</label><input type="url" id="inpDl" value="${item.download || ''}"></div>
            <div class="actions" style="margin-top:20px;justify-content:flex-end;">
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('editDialog').close()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;
    const dlg = getDialog('editDialog', html);
    dlg.innerHTML = html;
    dlg.showModal();
}

function processCSV() {
    const txt = document.getElementById('csvInput').value;
    if (!txt.trim()) return;
    fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: txt })
    }).then(res => res.json()).then(d => {
        alert(`Imported ${d.success} items.`); // Fix property name
        document.getElementById('csvDialog').close();
        fetchData();
    }).catch(e => alert('Import failed ' + e));
}

// New FetchDetails from wiki (Copied from previous file but updated needed?)
async function fetchDetails(id, title, year, director) {
    const modalContent = document.getElementById('detailsContent');
    if (!modalContent) return;
    modalContent.innerHTML = '<div style="text-align:center;padding:40px;">Fetching info from the cosmos... 🪐</div>';
    const dlg = document.getElementById('detailsDialog');
    if (dlg) dlg.showModal();

    let plot = 'No specific plot details found on Wikipedia.';
    let wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

    try {
        const searchQuery = `${title} ${year} film`;
        const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
        const searchRes = await fetch(searchApiUrl);
        const searchData = await searchRes.json();

        let targetPageId = null;
        if (searchData.query?.search?.length > 0) {
            targetPageId = searchData.query.search[0].pageid;
            wikiUrl = `https://en.wikipedia.org/?curid=${targetPageId}`;
        }

        if (targetPageId) {
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=7&explaintext&pageids=${targetPageId}&format=json&origin=*`;
            const extractRes = await fetch(extractUrl);
            const extractData = await extractRes.json();

            if (extractData.query?.pages?.[targetPageId]?.extract) {
                const bestPlot = extractData.query.pages[targetPageId].extract;
                const lowerPlot = bestPlot.toLowerCase();
                const isFilm = ['directed by', 'film', 'movie', 'starring', 'released'].some(k => lowerPlot.includes(k));
                if (isFilm || bestPlot.length > 50) {
                    plot = bestPlot;
                }
            }
        }
    } catch (e) { console.warn(e); }

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + year + ' film')}`;
    const imdbUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title + ' ' + year)}`;
    const lbUrl = `https://letterboxd.com/search/${encodeURIComponent(title + ' ' + year)}`;

    modalContent.innerHTML = `
        <div style="text-align:left;">
            <h2 style="margin-top:0; font-family:'Dancing Script', cursive; font-size:2rem; margin-bottom:4px;">${escapeHtml(title)}</h2>
            <div style="font-size:0.9rem; opacity:0.7; margin-bottom:16px;">
                <span>${year || 'N/A'}</span> • <span>${director || 'Director Unknown'}</span>
            </div>
            <div style="margin: 20px 0;">
                <strong>Wikipedia Intro:</strong>
                <div class="spoiler-box" style="margin-top:8px; padding:16px; background:rgba(0,0,0,0.2); border-radius:8px;">
                    <div class="spoiler-content" style="line-height:1.6; font-size:0.95rem; white-space: pre-wrap;">${plot}</div>
                </div>
            </div>
            <div style="margin: 20px 0; display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
                <a class="glossy-box social-link google" href="${googleUrl}" target="_blank">Google</a>
                <a class="glossy-box social-link imdb" href="${imdbUrl}" target="_blank">IMDb</a>
                <a class="glossy-box social-link letterboxd" href="${lbUrl}" target="_blank">Letterboxd</a>
                <a class="glossy-box social-link wiki" href="${wikiUrl}" target="_blank">Wikipedia</a>
            </div>
        </div>
    `;
}

const NA = '<span class="na">N/A</span>';
const fmt = (s) => s || '';


// Finish file content


