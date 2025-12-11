const state = {
    sort: 'year_desc',
    filter: 'all',
    q: '',
    page: 1,
    pageSize: 100, // Reduced from 500 for perf? Or keeping 500? User had 725 total. Let's stick to 100 per page or so.
    // Actually user had infinite scroll desire, but pagination is safer.
    // Let's keep 100.
};

// Data Store
let RAW_DATA = [];
let NORM = [];

// Icons
const ICONS = {
    letterboxd: `<svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/></svg>`, // Simple placeholder, real one is diff
    drive: `<svg viewBox="0 0 24 24" class="icon"><path d="M12.01 2.02c-.17 0-.34.04-.5.13L2.09 7.6c-.32.18-.5.54-.48.91 0 .37.21.71.55.88l9.42 4.71c.15.08.32.12.49.12.18 0 .35-.04.5-.12l9.4-4.7c.34-.17.55-.52.55-.89 0-.36-.2-.71-.52-.89L12.51 2.15c-.16-.09-.33-.13-.5-.13zM12 14.4L3.62 10.2l8.39 4.2 8.35-4.18L12 14.4z"/><path d="M4 12v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6l-8 4-8-4z"/></svg>`, // Folderish
    download: `<svg viewBox="0 0 24 24" class="icon"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" class="icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    info: `<svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
};

const NA = '<span class="na">N/A</span>';

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Hide loader initially (it will be shown by fetchData after unlock)
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hidden');

    initLockScreen();
    setupListeners();
});

// 0. Lock Screen
function initLockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    const input = document.getElementById('lockInput');
    const btn = document.getElementById('lockBtn');

    if (!lockScreen || !input || !btn) return;

    const tryUnlock = async () => {
        const password = input.value;
        if (!password) return;

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (data.success) {
                // Unlock
                lockScreen.style.opacity = '0';
                setTimeout(() => {
                    lockScreen.style.display = 'none';
                    fetchData(); // Load data now
                }, 500); // Fade out
            } else {
                // Fail - Rickroll
                window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            }
        } catch (e) {
            console.error(e);
            alert('Auth Error: ' + e.message);
        }
    };

    btn.addEventListener('click', tryUnlock);
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') tryUnlock();
    });
}

// 1. Fetch Data
async function fetchData() {
    // Show Loader
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.remove('hidden');

    try {
        const res = await fetch('/api/movies');
        if (!res.ok) throw new Error('Failed to load');
        RAW_DATA = await res.json();
        normalize();
        populateFilters();
        render();
    } catch (e) {
        document.querySelector('#grid').innerHTML = `<div class="error">Failed to load payload. <br/><small>${e.message}</small></div>`;
        console.error(e);
    } finally {
        // Hide Loader
        if (loader) loader.classList.add('hidden');
    }
}

// 2. Normalize
function normalize() {
    NORM = RAW_DATA.map(r => ({
        ...r,
        title: (r.title || '').trim(),
        original: (r.original || '').trim(), // Original Title
        year: r.year ? parseInt(r.year) : null,
        director: (r.director || '').trim(),
        // Links
        lb: r.letterboxd,
        drive: r.drive,
        dl: r.download,
        // Search blob
        _s: [(r.title || ''), (r.original || ''), (r.director || ''), (r.year || '')].join(' ').toLowerCase()
    }));
}

// 3. Populate Filters
function populateFilters() {
    // Years
    const years = [...new Set(NORM.map(x => x.year).filter(Boolean))].sort((a, b) => b - a);
    const ySel = document.querySelector('#yearFilter');
    ySel.innerHTML = '<option value="all">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    // Directors
    const dirs = [...new Set(NORM.map(x => x.director).filter(Boolean))].sort();
    const dSel = document.querySelector('#dirFilter');
    dSel.innerHTML = '<option value="all">All Directors</option>' + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
}

// 4. Setup Listeners
function setupListeners() {
    // Search
    const q = document.querySelector('#q');
    q.addEventListener('input', (e) => {
        state.q = e.target.value.toLowerCase();
        state.page = 1;
        render();
    });

    // Filters
    document.querySelector('#yearFilter').addEventListener('change', (e) => {
        state.filter = e.target.value === 'all' ? 'all' : { type: 'year', val: parseInt(e.target.value) };
        state.page = 1;
        render();
    });

    document.querySelector('#dirFilter').addEventListener('change', (e) => {
        state.filter = e.target.value === 'all' ? 'all' : { type: 'director', val: e.target.value };
        state.page = 1;
        render();
    });

    document.querySelector('#missingFilter').addEventListener('change', (e) => {
        const v = e.target.value;
        if (v === 'all') state.filter = 'all';
        else state.filter = { type: 'missing', field: v };
        state.page = 1;
        render();
    });

    document.querySelector('#sortFilter').addEventListener('change', (e) => {
        state.sort = e.target.value;
        render(); // No page reset needed usually, but maybe good practice?
    });


    // Theme
    // Theme
    const themeBtn = document.querySelector('#themeToggle');
    if (themeBtn) {
        // Init Button Text
        const updateThemeUI = (theme) => {
            themeBtn.innerHTML = theme === 'light' ? `☀ Light` : `${ICONS.letterboxd.replace('path', 'circle')} Dark`;
        };
        // Run once on load
        updateThemeUI(localStorage.getItem('theme') || 'dark');

        themeBtn.addEventListener('click', () => {
            const curr = document.documentElement.getAttribute('data-theme');
            const next = curr === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeUI(next);
        });
    }

    // Grid Icon
    const ICONS = {
        // ... (existing)
        grid: `<svg viewBox="0 0 24 24" class="icon"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" /></svg>`
    };

    // ... (Inside Listeners)
    // Compact Mode
    const compactBtn = document.querySelector('#compactBtn');
    if (compactBtn) {
        // Init Icon
        compactBtn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z"/></svg> View`;

        compactBtn.addEventListener('click', () => {
            document.body.classList.toggle('compact');
            // Optional: Save preference
            // localStorage.setItem('compact', document.body.classList.contains('compact')); 
        });
    }

    // Comfort Mode
    const comfortCheck = document.querySelector('#comfortToggle');
    if (comfortCheck) {
        comfortCheck.addEventListener('change', (e) => {
            document.body.classList.toggle('comfort-mode', e.target.checked);
        });
    }

    // Pagination
    document.querySelector('#prev').addEventListener('click', () => {
        if (state.page > 1) { state.page--; render(); window.scrollTo(0, 0); }
    });
    document.querySelector('#next').addEventListener('click', () => {
        const max = Math.ceil(sortData(filterData()).length / state.pageSize);
        if (state.page < max) { state.page++; render(); window.scrollTo(0, 0); }
    });

    // New Film Btn
    document.querySelector('.add-btn').addEventListener('click', () => {
        openEditDialog(); // No ID = Create
    });

    // CSV Import
    document.querySelector('.csv-btn').addEventListener('click', () => {
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

function ensureIdsAndEdits() {
    // Helper to wire up bottom pagination logic if it strictly relies on render()
    // It's checked inside render()
}

// Logic: Filtering
function filterData() {
    let base = NORM;

    // 1. Text Search
    if (state.q) {
        base = base.filter(x => x._s.includes(state.q));
    }

    // 2. Dropdowns
    if (state.filter !== 'all') {
        const f = state.filter;
        if (f.type === 'year') {
            base = base.filter(x => x.year === f.val);
        } else if (f.type === 'director') {
            base = base.filter(x => x.director === f.val);
        } else if (f.type === 'missing') {
            // "Show: Missing X"
            if (f.field === 'letterboxd') base = base.filter(x => !x.lb);
            else if (f.field === 'drive') base = base.filter(x => !x.drive);
            else if (f.field === 'download') base = base.filter(x => !x.dl);
            else if (f.field === 'any') base = base.filter(x => (!x.lb || !x.drive || !x.dl));
        }
    }
    return base;
}

// Logic: Sorting
function sortData(rows) {
    // year_desc/asc, title_asc, original_asc, director_asc
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
// Fetch details using MediaWiki API with Smart Search and Validation
async function fetchDetails(id, title, year, director) {
    const modalContent = document.getElementById('detailsContent');
    if (!modalContent) return;

    modalContent.innerHTML = '<div style="text-align:center;padding:40px;">Fetching info from the cosmos... 🪐</div>';

    const dlg = document.getElementById('detailsDialog');
    if (dlg) dlg.showModal();

    let plot = 'No specific plot details found on Wikipedia.';
    let wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

    try {
        // Step 1: Search for the specific film to get the correct Page ID
        // We include "film" and the year to disambiguate (e.g., "Companion (2025 film)")
        const limit = 1;
        const searchQuery = `${title} ${year} film`;
        const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;

        const searchRes = await fetch(searchApiUrl);
        const searchData = await searchRes.json();

        let targetPageId = null;

        if (searchData.query?.search?.length > 0) {
            // Pick top result
            targetPageId = searchData.query.search[0].pageid;
            wikiUrl = `https://en.wikipedia.org/?curid=${targetPageId}`;
        }

        // Step 2: Fetch Extract limits
        if (targetPageId) {
            // Request ~6-7 sentences to avoid "essay" but give more than "5 lines"
            // Use exsentences instead of exintro to control length
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=7&explaintext&pageids=${targetPageId}&format=json&origin=*`;
            const extractRes = await fetch(extractUrl);
            const extractData = await extractRes.json();

            if (extractData.query?.pages?.[targetPageId]?.extract) {
                const bestPlot = extractData.query.pages[targetPageId].extract;

                // VALIDATION: Check if this looks like a movie
                const lowerPlot = bestPlot.toLowerCase();
                const isFilm = lowerPlot.includes('directed by') || lowerPlot.includes('film') || lowerPlot.includes('movie') || lowerPlot.includes('starring') || lowerPlot.includes('released');

                // Additional Check: If title is generic (1 word) and no film keywords, likely dictionary
                const titleWords = title.split(' ').length;
                const isGenericTitle = titleWords < 2;

                if (isFilm || (!isGenericTitle && lowerPlot.length > 50)) {
                    plot = bestPlot;
                } else {
                    plot = "Specific film details not found on Wikipedia (Result seemed unrelated).";
                    // Fallback to Wiki search URL so they can find it manually
                    wikiUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title + ' ' + year + ' film')}`;
                }
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

        // SOCIAL BUTTONS (Pills)
        const lbBtn = lb ? `<a class="btn letter" href="${lb}" target="_blank" rel="noopener noreferrer">${ICONS.letterboxd} Letterboxd</a>` : '';
        const drBtn = dr ? `<a class="btn drive" href="${dr}" target="_blank" rel="noopener noreferrer">${ICONS.drive} Drive</a>` : '';

        // DOWNLOAD BUTTON (Pill) - Only if exists
        const dlBtn = dl ? `<a class="btn download" href="${dl}" target="_blank" rel="noopener noreferrer">${ICONS.download} Download</a>` : '';

        // PLOT BUTTON (Pill) - "Plot of film" (Replaces Notes)
        // Always show or only if notes exist? User said "changes the notes tile name... make it similar".
        // Assuming always show "Plot of film" that opens details (which fetches Wiki if no notes).
        // OR if user implies only show if 'notes' field exists? 
        // "removed download tile... keep it only at places where there is a link".
        // Notes tile -> "Plot of film".
        // Let's make it a button that behaves like the others.
        const plotBtn = `<button class="btn info" onclick="event.stopPropagation(); fetchDetails('${r.__id}', '${escapeHtml(t)}', '${r.year}', '${escapeHtml(dir)}')" title="View Plot">
            ${ICONS.info} Plot of film
        </button>`;

        // POSTER LINK WRAPPER
        const posterUrl = getPosterUrl(t, yr);
        const posterLink = r.lb ? r.lb : `https://letterboxd.com/search/${encodeURIComponent(t + ' ' + yr)}`;

        const posterHtml = `
            <a href="${posterLink}" target="_blank" rel="noopener noreferrer" style="display:block;position:relative;">
                <img src="${posterUrl}" class="card-poster" alt="${escapeHtml(t)}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTIxIDE1djRhMiAyIDAgMCAxLTIgMmgtNWwtNS01bDUtNSAzIDN6Ii8+PC9zdmc+';this.style.opacity='0.3'">
            </a>`;

        card.innerHTML = `
            <button class="edit-btn" data-id="${r.__id || ''}">${ICONS.edit} Edit</button>
            ${posterHtml}
            <div class="title">${interactiveTitleHtml}</div>
            <div class="meta">${metaHtml}</div>
            
            <div class="actions" style="margin-top:auto;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;">
                <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-start;">
                    ${lbBtn} ${drBtn} ${dlBtn} ${plotBtn}
                </div>
            </div>
            
            <!-- Removed Big Info Button -->
        `;
        frag.appendChild(card);
    });
    grid.appendChild(frag);

    // Initial button wiring
    grid.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditDialog(btn.getAttribute('data-id')));
    });

    // Wire Info Buttons
    // NOTE: Removed previous generic listener because we now use onclick inline for stability
    /*
    grid.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = NORM.find(x => x.__id === btn.getAttribute('data-id'));
            if (r) fetchDetails(r.__id, r.title, r.year);
        });
    });
    */
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
// Init immediately
initDetailsDialog();

async function openEditDialog(id) {
    const isEdit = !!id;
    let item = {};
    if (isEdit) {
        item = NORM.find(r => r.__id === id) || {};
    }

    const html = `
        <h2>${isEdit ? 'Edit Film' : 'Add New Film'}</h2>
        <form class="edit-form" onsubmit="event.preventDefault(); saveItem('${id || ''}');">
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="inpTitle" value="${escapeHtml(item.title || '')}" required>
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="number" id="inpYear" value="${item.year || ''}">
            </div>
            <div class="form-group">
                <label>Original Title</label>
                <input type="text" id="inpOriginal" value="${escapeHtml(item.original || '')}">
            </div>
            <div class="form-group">
                <label>Director</label>
                <input type="text" id="inpDirector" value="${escapeHtml(item.director || '')}">
            </div>
            <!-- Links -->
            <div class="form-group">
                <label>Letterboxd URL</label>
                <input type="url" id="inpLb" value="${item.letterboxd || ''}">
            </div>
             <div class="form-group">
                <label>Google Drive URL</label>
                <input type="url" id="inpDrive" value="${item.drive || ''}">
            </div>
             <div class="form-group">
                <label>Download URL</label>
                <input type="url" id="inpDl" value="${item.download || ''}">
            </div>

            <div class="actions" style="margin-top:20px;justify-content:flex-end;">
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('editDialog').close()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    const dlg = getDialog('editDialog', html);
    // Refresh content
    dlg.innerHTML = html;
    dlg.showModal();
}

async function saveItem(id) {
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

    // Call API
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
            fetchData(); // Reload
        } else {
            alert('Failed to save');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving');
    }
}

// CSV
function processCSV() {
    const txt = document.getElementById('csvInput').value;
    if (!txt.trim()) return;

    // Very simple CSV parser for demo
    // Expected: Title;Original;Year;Director;Letterboxd;Drive;Download
    // Replacing simple split with something slightly robust or just sending raw text to server?
    // Let's send raw text to server to parse
    fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: txt })
    }).then(res => res.json()).then(d => {
        alert(`Imported ${d.count} items.`);
        document.getElementById('csvDialog').close();
        fetchData();
    }).catch(e => alert('Import failed ' + e));
}

function filterByYear(y) {
    if (!y) return;
    state.filter = { type: 'year', val: parseInt(y) };
    state.page = 1;
    // visual update
    document.querySelector('#yearFilter').value = y;
    render();
}

// Utils
function fmt(s) {
    return s || '';
}
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
