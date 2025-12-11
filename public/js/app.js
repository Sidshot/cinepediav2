'use strict';

// Global State and Data
let NORM = []; // This will hold the normalized movie data
let state = {
    q: "",
    year: "all",
    director: "all",
    sort: "year_desc",
    page: 1,
    pageSize: 150,
    filter: "all",
    compact: false
};

// Config & Constants
const KEY_ADDS = 'film_user_adds_neo';
const KEY_EDITS = 'film_user_edits_neo';
const PREFS_KEY = 'film_prefs_neo';

const ICONS = {
    themeLight: '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m8.5-12.5l-.7.7M4.2 19.8l-.7.7M21 12h-1M4 12H3m16.8-.7l.7-.7M3.5 4.2l.7-.7"/><circle cx="12" cy="12" r="4"/></svg> Light',
    themeDark: '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M12 21a9 9 0 110-18 9 9 0 010 18z"/></svg> Dark',
    densityCompact: '<svg class="ui-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Compact',
    densityComfort: '<svg class="ui-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> Comfort',
    letterboxd: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
    drive: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l7 12-7 8-7-8z"/></svg>',
    download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10m0 0 4-4m-4 4-4-4M4 21h16"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04l-2.34-2.34-1.83 1.83 3.75 3.75L20.71 7.04z"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
};

// Utilities
const NA = 'N/A';
const fmt = v => (v == null || String(v).trim() === '') ? NA : String(v).trim();
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d) } catch { return JSON.parse(d) } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const norm = s => (s || "").toLowerCase();
const escapeHtml = str => {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

function hash53(str) {
    let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 2654435761);
        h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
    return (h2 * 4294967296 + h1).toString(36);
}

// Data Normalization
function toNormalized(obj) {
    const g = (k, ...alts) => {
        for (const key of [k, ...alts]) {
            if (obj[key] != null && String(obj[key]).trim() !== '') return String(obj[key]).trim();
        }
        return '';
    };
    const title = g('title', 'Title', 'Título', 'Titulo');
    const original = g('original', 'Original Title', 'Título Original', 'Titulo Original');
    const director = g('director', 'Director', 'Diretor');
    const yearStr = g('year', 'Year', 'Ano');
    const lb = g('lb', 'letterboxd', 'Letterboxd', 'Letterboxd Link', 'Link do Letterboxd');
    const drive = g('drive', 'Drive', 'Drive Link', 'Link do Drive');
    const dl = g('dl', 'download', 'Download', 'Download Link', 'Link de Download');
    const year = yearStr ? (parseInt(yearStr, 10) || null) : null;

    // Notes can now be legacy, but we still preserve them structure-wise just in case
    // though the UI won't show them anymore.
    const __id = obj.__id || obj._id || null;

    return { __id, title, original, year, director, lb, drive, dl };
}

// Data Fetching
async function fetchData() {
    try {
        const response = await fetch('/api/movies');
        if (!response.ok) throw new Error('Network response was not ok');
        const rawData = await response.json();

        // Normalize server data
        NORM = rawData.map(toNormalized);

        // Client-side ID Generation for any missing IDs (legacy or safety)
        ensureIdsAndEdits();

        // Initial setup
        init();
        document.getElementById('app-loader').classList.add('hidden');
    } catch (error) {
        console.error('Failed to fetch data:', error);
        document.getElementById('grid').innerHTML = `<div class="empty">Error loading data. Please try again.</div>`;
        document.getElementById('app-loader').classList.add('hidden');
    }
}

// Core Logic: ID Assignment & Edit Application
function ensureIdsAndEdits() {
    if (!Array.isArray(NORM)) return;
    for (const r of NORM) {
        if (!r.__id) {
            const fp = [
                r.title || '', r.original || '', r.year ?? '', r.director || '',
                r.lb || '', r.drive || '', r.dl || ''
            ].join('|').toLowerCase();
            r.__id = `fm_temp_${hash53(fp)}`;
        }
    }
}

// Core Logic: Filtering
function passFilter(r) {
    const yearOk = (state.year === "all" || String(r.year) === state.year);
    const directorOk = (state.director === "all" || (r.director && norm(r.director).includes(norm(state.director))));
    if (!yearOk || !directorOk) return false;

    const hasL = !!r.lb;
    const hasD = !!r.drive;

    switch (state.filter) {
        case 'both_links': return hasL && hasD;
        case 'missing_any': return !hasL || !hasD;
        case 'missing_letterboxd': return !hasL;
        case 'missing_drive': return !hasD;
        case 'no_year': return !r.year;
        default: return true;
    }
}

function filterData() {
    const q = norm(state.q);
    return NORM.filter(r => {
        if (!passFilter(r)) return false;
        if (!q) return true;
        return (r.title && norm(r.title).includes(q)) ||
            (r.original && norm(r.original).includes(q)) ||
            (r.director && norm(r.director).includes(q));
    });
}

// Core Logic: Sorting
function sortData(rows) {
    const byYearDesc = (a, b) => ((b.year || 0) - (a.year || 0)) || String(a.title || "").localeCompare(String(b.title || ""));
    const byYearAsc = (a, b) => ((a.year || 3000) - (b.year || 3000)) || String(a.title || "").localeCompare(String(b.title || ""));
    const byTitleAsc = (a, b) => String(a.title || "").localeCompare(String(b.title || ""));
    const byOrigAsc = (a, b) => String(a.original || "").localeCompare(String(b.original || ""));
    const byDirAsc = (a, b) => String(a.director || "").localeCompare(String(b.director || ""));

    const map = {
        'year_desc': byYearDesc,
        'year_asc': byYearAsc,
        'title_asc': byTitleAsc,
        'original_asc': byOrigAsc,
        'director_asc': byDirAsc
    };
    return rows.slice().sort(map[state.sort]);
}

// Core Logic: Pagination
function paginate(rows) {
    const start = (state.page - 1) * state.pageSize;
    return rows.slice(start, start + state.pageSize);
}

// UI: Rendering
function highlight(text, query) {
    if (!query) return escapeHtml(text || '');
    try {
        const safe = query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
        const re = new RegExp('(' + safe + ')', 'ig');
        return escapeHtml(text || '').replace(re, '<mark>$1</mark>');
    } catch (e) { return escapeHtml(text || ''); }
}

function getPosterUrl(title, year) {
    const query = encodeURIComponent(`${title} ${year || ''} movie poster`);
    return `https://tse2.mm.bing.net/th?q=${query}&w=300&h=450&c=7&rs=1&p=0`;
}

// --- NEW AUTOMATED FETCH FUNCTIONS ---
// --- UPDATED AUTO FETCH WITH EXTRA DETAILS ---
// Fetch details using MediaWiki API for richer content
async function fetchDetails(id, title, year, director) {
    const modalContent = document.getElementById('detailsContent');
    if (!modalContent) return;

    modalContent.innerHTML = '<div style="text-align:center;padding:40px;">Fetching info from the cosmos... 🪐</div>';

    const dlg = document.getElementById('detailsDialog');
    if (dlg) dlg.showModal();

    let plot = 'No specific plot details found on Wikipedia.';
    let wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

    try {
        // Use MediaWiki Query API for full Intro (longer than summary)
        // origin=* is needed for CORS
        const searchTitle = encodeURIComponent(title);
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&redirects=1&titles=${searchTitle}&origin=*`;

        const res = await fetch(apiUrl);
        const data = await res.json();

        // Extract page content (keys are dynamic page IDs)
        const pages = data.query?.pages;
        if (pages) {
            const pageIds = Object.keys(pages);
            if (pageIds.length > 0 && pageIds[0] !== '-1') {
                const page = pages[pageIds[0]];
                if (page.extract) {
                    plot = page.extract; // This is the full intro
                }
                // Construct real Wiki URL from page info if available, else fallback
                wikiUrl = `https://en.wikipedia.org/?curid=${page.pageid}`;
            }
        }

    } catch (e) {
        console.warn('Fetch error:', e);
    }

    // External Search Links
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
                <div class="spoiler-box" style="margin-top:8px; padding:16px; background:rgba(0,0,0,0.2); border-radius:8px; cursor:pointer;" onclick="this.classList.toggle('revealed')">
                    <span class="spoiler-warning">⚠️ Tap to Reveal Full Plot / Intro</span>
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


function render() {
    ensureIdsAndEdits();

    const filtered = filterData();
    const all = sortData(filtered);
    const total = all.length;
    const maxPage = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > maxPage) state.page = maxPage;
    const pageRows = paginate(all);

    // Update Counts & Meta
    const countEl = document.querySelector('#count');
    if (countEl) countEl.textContent = total.toLocaleString();

    const pageInfo = document.querySelector('#pageInfo');
    if (pageInfo) pageInfo.textContent = `Page ${state.page} / ${maxPage}`;

    const prev = document.querySelector('#prev');
    const next = document.querySelector('#next');
    if (prev) prev.disabled = state.page <= 1;
    if (next) next.disabled = state.page >= maxPage;

    // Update Bottom Pagination
    const bottomContainer = document.getElementById('paginationBottom');
    if (bottomContainer) {
        const bPrev = bottomContainer.querySelector('.prev-btn');
        const bNext = bottomContainer.querySelector('.next-btn');
        const bInfo = bottomContainer.querySelector('.page-info');

        if (bPrev) bPrev.disabled = state.page <= 1;
        if (bNext) bNext.disabled = state.page >= maxPage;
        if (bInfo) bInfo.textContent = `Page ${state.page} / ${maxPage}`;
    }

    // Render Grid
    const grid = document.querySelector('#grid');
    grid.innerHTML = '';

    if (pageRows.length === 0) {
        grid.innerHTML = '<div class="empty">No films match your filters.</div>';
        return;
    }

    const frag = document.createDocumentFragment();
    pageRows.forEach((r, idx) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.style.animationDelay = `${Math.min(idx * 0.04, 1)}s`;

        const t = fmt(r.title);
        const yr = (r.year == null || r.year === '') ? NA : r.year;
        const og = fmt(r.original);
        const dir = fmt(r.director);

        const titleHtml = `${highlight(t, state.q)} <span class="badge">${yr}</span>`;

        // Interactive Title: Click -> Letterboxd
        const lbLink = r.lb ? r.lb : `https://letterboxd.com/search/${encodeURIComponent(t + ' ' + yr)}`;
        // We override titleHtml to be a link now
        const interactiveTitleHtml = `<a href="${lbLink}" target="_blank" rel="noopener noreferrer" class="title-link" style="color:inherit;text-decoration:none;">${highlight(t, state.q)}</a> 
            <span class="badge year-badge" onclick="event.stopPropagation(); filterByYear('${r.year}')" style="cursor:pointer;" title="Filter by ${r.year}">${yr}</span>`;


        // --- NEW LINKS ---
        // Director Link
        const dirUrl = `https://www.google.com/search?q=${encodeURIComponent(r.director + ' director')}`;
        const dirHtml = r.director ? `<a href="${dirUrl}" target="_blank" class="dir-link" style="color:inherit;text-decoration:none;border-bottom:1px dotted var(--muted);">${highlight(dir, state.q)}</a>` : NA;

        // Interactive Original: Click -> Google
        const ogUrl = `https://www.google.com/search?q=${encodeURIComponent(og + ' film')}`;
        const ogHtml = r.original ? `<a href="${ogUrl}" target="_blank" class="meta-link" style="color:inherit;text-decoration:none;border-bottom:1px dotted var(--muted);">${highlight(og, state.q)}</a>` : NA;

        const metaHtml = `
            <span class="kv"><span class="label">Original:</span> ${ogHtml}</span>
            <span class="kv"><span class="label">Director:</span> ${dirHtml}</span>`;

        const lb = r.lb || '';
        const dr = r.drive || '';
        const dl = r.dl || '';

        // GLOSSY BUTTONS
        const lbBtn = lb ? `<a class="glossy-box btn-glossy letter" href="${lb}" target="_blank" rel="noopener noreferrer">${ICONS.letterboxd} Letterboxd</a>` : `<span class="btn na" style="opacity:0.3;font-size:0.75rem;">Letterboxd: ${NA}</span>`;
        const drBtn = dr ? `<a class="glossy-box btn-glossy drive" href="${dr}" target="_blank" rel="noopener noreferrer">${ICONS.drive} Drive</a>` : `<span class="btn na" style="opacity:0.3;font-size:0.75rem;">Drive: ${NA}</span>`;
        const dlBtn = dl ? `<a class="glossy-box btn-glossy download" href="${dl}" target="_blank" rel="noopener noreferrer">${ICONS.download} Download</a>` : `<span class="btn na" style="opacity:0.3;font-size:0.75rem;">Download: ${NA}</span>`;


        // Poster HTML with Link
        const posterUrl = getPosterUrl(t, yr);
        const posterLink = r.lb ? r.lb : `https://letterboxd.com/search/${encodeURIComponent(t + ' ' + yr)}`;
        // Wrap poster in link
        const posterHtml = `
            <a href="${posterLink}" target="_blank" rel="noopener noreferrer" style="display:block;position:relative;">
                <img src="${posterUrl}" class="card-poster" alt="${escapeHtml(t)}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTIxIDE1djRhMiAyIDAgMCAxLTIgMmgtNWwtNS01bDUtNSAzIDN6Ii8+PC9zdmc+';this.style.opacity='0.3'">
            </a>`;

        card.innerHTML = `
            <button class="edit-btn" data-id="${r.__id || ''}">${ICONS.edit} Edit</button>
            ${posterHtml}
            <div class="title">${interactiveTitleHtml}</div>
            <div class="meta">${metaHtml}</div>
            <div class="actions">${lbBtn}${drBtn}${dlBtn}</div>
            
            <button class="btn info-btn" style="margin-top:10px;width:100%;justify-content:center;" data-id="${r.__id}">
                ${ICONS.info} Movie Details
            </button>
        `;
        frag.appendChild(card);
    });
    grid.appendChild(frag);

    // Initial button wiring
    grid.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditDialog(btn.getAttribute('data-id')));
    });

    // Wire Info Buttons
    grid.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = NORM.find(x => x.__id === btn.getAttribute('data-id'));
            if (r) fetchDetails(r.__id, r.title, r.year);
        });
    });
}

// UI: Dialogs (Add / Edit / Import)
function getDialog(id, html) {
    let dlg = document.getElementById(id);
    if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.id = id;
        dlg.className = 'dialog-modal';
        dlg.innerHTML = html;
        document.body.appendChild(dlg);
        // Common close handler
        const cancelBtn = dlg.querySelector('.btn-ghost');
        if (cancelBtn) cancelBtn.addEventListener('click', () => dlg.close());
    }
    return dlg;
}

// New Auto-Info Dialog
function initDetailsDialog() {
    const html = `
        <div style="position:relative;">
            <button class="btn-ghost" style="position:absolute;top:0;right:0;padding:4px 8px;" onclick="document.getElementById('detailsDialog').close()">✕</button>
            <div id="detailsContent"></div>
        </div>
    `;
    getDialog('detailsDialog', html);
}
// Init immediately
initDetailsDialog();


function openEditDialog(id) {
    const row = NORM.find(x => x.__id === id);
    if (!row) return;

    // --- REMOVED NOTES FIELD ---
    const html = `
      <form method="dialog" id="editForm">
        <h3 style="margin:0 0 10px 0;">Edit film</h3>
        <input type="hidden" name="__id">
        <div class="form-grid">
          <div><label>Title<input name="title" required></label></div>
          <div><label>Original title<input name="original"></label></div>
          <div><label>Year<input name="year" type="number" inputmode="numeric" min="1860" max="2100"></label></div>
          <div><label>Director(s)<input name="director"></label></div>
          <div class="full"><label>Letterboxd link<input name="lb"></label></div>
          <div class="full"><label>Drive link<input name="drive"></label></div>
          <div class="full"><label>Download link<input name="dl"></label></div>
        </div>
        <div class="actions-row">
          <button value="cancel" class="btn-ghost" type="button">Cancel</button>
          <button value="default" class="page-btn" type="submit">Save</button>
        </div>
      </form>`;

    const dlg = getDialog('editDialog', html);
    const f = dlg.querySelector('form');

    // Populate form
    f.__id.value = id;
    f.title.value = row.title || '';
    f.original.value = row.original || '';
    f.year.value = (row.year != null ? row.year : '');
    f.director.value = row.director || '';
    f.lb.value = row.lb || '';
    f.drive.value = row.drive || '';
    f.dl.value = row.dl || '';

    // EDIT SUBMIT
    f.onsubmit = async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(f).entries());
        const pid = fd.__id;
        if (!pid) return;

        const patch = {
            title: fd.title || '',
            original: fd.original || '',
            year: fd.year ? (parseInt(fd.year, 10) || null) : null,
            director: fd.director || '',
            lb: fd.lb || '',
            drive: fd.drive || '',
            dl: fd.dl || ''
        };

        try {
            const res = await fetch(`/api/movies/${pid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch)
            });
            if (!res.ok) throw new Error('Update failed');
            await fetchData();
            dlg.close();
        } catch (err) {
            alert('Error saving edit: ' + err.message);
        }
    };

    dlg.showModal();
}

function openAddDialog() {
    const html = `
      <form method="dialog" id="addForm">
        <h3 style="margin:0 0 10px 0;">Add a film</h3>
        <div class="form-grid">
          <div><label>Title<input name="title" required></label></div>
          <div><label>Original title<input name="original"></label></div>
          <div><label>Year<input name="year" type="number" inputmode="numeric" min="1860" max="2100"></label></div>
          <div><label>Director(s)<input name="director"></label></div>
          <div class="full"><label>Letterboxd link<input name="lb" placeholder="https://boxd.it/..."></label></div>
          <div class="full"><label>Drive link<input name="drive" placeholder="https://drive.google.com/..."></label></div>
          <div class="full"><label>Download link<input name="dl" placeholder="Direct download / transfer link"></label></div>
        </div>
        <div class="actions-row">
          <button value="cancel" class="btn-ghost" type="button">Cancel</button>
          <button value="default" class="page-btn" type="submit">Add</button>
        </div>
      </form>`;

    const dlg = getDialog('addDialog', html);
    const f = dlg.querySelector('form');
    f.reset();

    f.onsubmit = async (e) => {
        e.preventDefault();
        const rec = toNormalized(Object.fromEntries(new FormData(f).entries()));
        if (!rec.title) { alert('Title is required.'); return; }

        try {
            const res = await fetch('/api/movies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rec)
            });
            if (!res.ok) throw new Error('Server error');

            await fetchData();
            dlg.close();
        } catch (err) {
            alert('Failed to add film: ' + err.message);
        }
    };

    dlg.showModal();
}

// ... parseCSV ...
function parseCSV(text) {
    const rows = []; let i = 0, f = '', row = [], q = false;
    while (i < text.length) {
        const c = text[i];
        if (q) { if (c == '"') { if (text[i + 1] == '"') { f += '"'; i++; } else q = false; } else f += c; }
        else {
            if (c === ',') { row.push(f.trim()); f = ''; }
            else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f.trim()); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
            else if (c === '"') { q = true; } else f += c;
        }
        i++;
    }
    if (f.length || row.length) { row.push(f.trim()); rows.push(row); }
    return rows;
}

function handleCSVUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,text/csv';

    fileInput.onchange = () => {
        const f = fileInput.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const rows = parseCSV(String(reader.result || ''));
                if (!rows.length) throw new Error('No rows');
                const headers = rows[0].map(h => h.trim());

                const imports = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;
                    const obj = {};
                    headers.forEach((h, idx) => obj[h] = row[idx] ?? '');
                    const rec = toNormalized(obj);
                    if (rec.title) imports.push(rec);
                }

                if (imports.length === 0) throw new Error('No valid films found');

                // Send to Server
                const res = await fetch('/api/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(imports)
                });

                if (!res.ok) throw new Error('Import failed on server');
                const result = await res.json();

                let msg = `✅ Import Complete!\nSuccess: ${result.success}`;
                if (result.failed > 0) {
                    msg += `\n❌ Failed: ${result.failed}`;
                    // Show first 5 errors to avoid spam
                    const topErrors = result.errors.slice(0, 5).join('\n');
                    msg += `\n\nErrors:\n${topErrors}`;
                    if (result.errors.length > 5) msg += `\n...and ${result.errors.length - 5} more.`;
                }

                alert(msg);
                fetchData();
            } catch (err) {
                alert('CSV import failed: ' + err.message);
            }
        };
        reader.readAsText(f);
    };
    fileInput.click();
}

// UI: Filters Helper
function uniqueValues(key, separator = null) {
    const set = new Set();
    for (const r of NORM) {
        if (r[key]) {
            if (separator) {
                r[key].toString().split(separator).forEach(item => { const t = item.trim(); if (t) set.add(t); });
            } else {
                set.add(r[key]);
            }
        }
    }
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
}

function refreshFilters() {
    const y = document.querySelector('#year');
    const d = document.querySelector('#director');
    if (!y || !d) return;

    const currentY = y.value;
    const currentD = d.value;

    const years = uniqueValues('year').sort((a, b) => b - a);
    const directors = uniqueValues('director', ',');

    y.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
    d.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());

    const fragY = document.createDocumentFragment();
    years.forEach(v => { const o = document.createElement('option'); o.value = String(v); o.textContent = String(v); fragY.appendChild(o); });
    y.appendChild(fragY);

    const fragD = document.createDocumentFragment();
    directors.forEach(v => { const o = document.createElement('option'); o.value = String(v); o.textContent = String(v); fragD.appendChild(o); });
    d.appendChild(fragD);

    y.value = currentY;
    if (y.value !== currentY) y.value = 'all';

    d.value = currentD;
    if (d.value !== currentD) d.value = 'all';
}

// Helper for UI clicks
window.filterByYear = function (year) {
    const ySel = document.getElementById('year');
    if (ySel) {
        ySel.value = year;
        // Trigger change event to update state and render
        ySel.dispatchEvent(new Event('change'));
        // Scroll to filters
        ySel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Initialization & Event Binding
function init() {
    // Load Prefs
    try {
        const saved = JSON.parse(localStorage.getItem(PREFS_KEY));
        if (saved) state = { ...state, ...saved };
    } catch { }

    // Init UI Elements from state
    const q = document.getElementById('q');
    if (q) q.value = state.q;

    const y = document.getElementById('year');
    const d = document.getElementById('director');
    const f = document.getElementById('filter');
    const s = document.getElementById('sort'); // Sort Element
    const themeBtn = document.getElementById('themeBtn');
    const compactBtn = document.getElementById('compactBtn');

    if (f) f.value = state.filter;
    if (s) s.value = state.sort; // Init Sort Value

    refreshFilters(); // Populate dropdowns
    if (y) y.value = state.year;
    if (d) d.value = state.director;

    // Theme Logic
    const savedTheme = localStorage.getItem('film_theme_neo') || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    if (themeBtn) {
        themeBtn.innerHTML = savedTheme === 'dark' ? ICONS.themeDark : ICONS.themeLight;
        themeBtn.onclick = () => {
            const cur = document.documentElement.dataset.theme;
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = next;
            localStorage.setItem('film_theme_neo', next);
            themeBtn.innerHTML = next === 'dark' ? ICONS.themeDark : ICONS.themeLight;
        };
    }

    // Compact Logic (Reuse)
    if (state.compact) document.body.classList.add('compact');
    if (compactBtn) {
        compactBtn.innerHTML = state.compact ? ICONS.densityCompact : ICONS.densityComfort;
        compactBtn.onclick = () => {
            state.compact = !state.compact;
            document.body.classList.toggle('compact', state.compact);
            compactBtn.innerHTML = state.compact ? ICONS.densityCompact : ICONS.densityComfort;
            save(PREFS_KEY, state);
        };
    }

    // Global Event Listeners
    if (q) q.addEventListener('input', e => { state.q = e.target.value; state.page = 1; save(PREFS_KEY, state); render(); });

    // Event Listeners for Filters
    [y, d, f].forEach(el => {
        if (el) el.addEventListener('change', e => {
            state[el.id] = e.target.value;
            state.page = 1;
            save(PREFS_KEY, state);
            render();
        });
    });

    // Pagination Logic (Dual Controls)
    const handlePageChange = (delta) => {
        state.page += delta;
        if (state.page < 1) state.page = 1;

        render();
        document.getElementById('scrollTopBtn').click();
    };

    // Global Prev/Next (Top)
    const topPrev = document.getElementById('prev');
    const topNext = document.getElementById('next');
    if (topPrev) topPrev.onclick = () => handlePageChange(-1);
    if (topNext) topNext.onclick = () => handlePageChange(1);

    // Bottom Pagination Injection
    const bottomContainer = document.getElementById('paginationBottom');
    if (bottomContainer) {
        bottomContainer.innerHTML = `
            <button class="page-btn prev-btn">Prev</button>
            <span class="counter page-info" style="margin:0 10px;"></span>
            <button class="page-btn next-btn">Next</button>
        `;
        bottomContainer.querySelector('.prev-btn').onclick = () => handlePageChange(-1);
        bottomContainer.querySelector('.next-btn').onclick = () => handlePageChange(1);
    }

    // Scroll to Top
    const scrollBtn = document.getElementById('scrollTopBtn');
    window.onscroll = () => {
        if (window.scrollY > 300) scrollBtn.classList.add('visible');
        else scrollBtn.classList.remove('visible');
    };
    scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // Install Import/Add Buttons (Top)
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        const right = toolbar.querySelector('.pagination');
        if (right) {
            const btnAdd = document.createElement('button');
            btnAdd.className = 'page-btn';
            btnAdd.textContent = '+ Film';
            btnAdd.onclick = openAddDialog;

            const btnCSV = document.createElement('button');
            btnCSV.className = 'page-btn';
            btnCSV.textContent = 'CSV';
            btnCSV.onclick = handleCSVUpload;

            // Insert before pagination
            right.parentNode.insertBefore(btnAdd, right);
            right.parentNode.insertBefore(btnCSV, right);
        }
    }

    // Initial Render
    render();
}

// Lock Screen Logic
function initLockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    const lockInput = document.getElementById('lockInput');
    const lockBtn = document.getElementById('lockBtn');

    if (!lockScreen || !lockInput || !lockBtn) return;

    const checkPassword = () => {
        const val = lockInput.value;
        if (val === '2025') {
            lockScreen.classList.add('hidden');
            sessionStorage.setItem('isUnlocked', 'true');
            lockInput.value = '';
        } else {
            // Wrong password -> Redirect
            window.location.href = "https://youtu.be/dQw4w9WgXcQ?si=F4BZ7mvryQUf6nmb";
        }
    };

    lockBtn.addEventListener('click', checkPassword);
    lockInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    initLockScreen();
    fetchData();
});
