'use server';

import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { searchMovies, getMovieDetails } from '@/lib/tmdb';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

/**
 * Detect file format from content
 */
export async function detectFileFormat(content, filename = '') {
    const ext = filename.split('.').pop()?.toLowerCase();

    // Check by extension first
    if (ext === 'json') return 'json';
    if (ext === 'csv') return 'csv';
    if (ext === 'txt') return 'txt';

    // Auto-detect from content
    const trimmed = content.trim();

    // JSON starts with { or [
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return 'json';
    }

    // CSV typically has headers with commas
    const firstLine = trimmed.split('\n')[0];
    if (firstLine.includes(',') && (
        firstLine.toLowerCase().includes('title') ||
        firstLine.toLowerCase().includes('name') ||
        firstLine.toLowerCase().includes('movie')
    )) {
        return 'csv';
    }

    // Default to TXT (line-by-line)
    return 'txt';
}

/**
 * Smart CSV/TSV Parser
 * Analyzes column content to detect which column contains what data type
 * Works regardless of language or header format
 */
export async function parseCSV(content) {
    // Detect separator (comma or tab)
    const firstLines = content.split('\n').slice(0, 5);
    const commaCount = firstLines.join('').split(',').length;
    const tabCount = firstLines.join('').split('\t').length;
    const separator = tabCount > commaCount * 2 ? '\t' : ',';

    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse all lines into columns
    const allRows = lines.map(line => parseCSVLine(line, separator));

    // Skip any initial rows that look like metadata (less columns than data rows)
    const maxCols = Math.max(...allRows.map(r => r.length));
    let dataStartIdx = 0;
    for (let i = 0; i < Math.min(10, allRows.length); i++) {
        if (allRows[i].length >= maxCols - 1 && allRows[i].some(cell => cell.length > 0)) {
            dataStartIdx = i;
            break;
        }
    }

    // Analyze each column to determine its type using sample data
    const sampleRows = allRows.slice(dataStartIdx + 1, dataStartIdx + 20); // Skip potential header
    const numCols = maxCols;

    const columnAnalysis = [];
    for (let col = 0; col < numCols; col++) {
        const values = sampleRows.map(row => (row[col] || '').trim()).filter(Boolean);
        columnAnalysis.push(analyzeColumn(values, col));
    }

    // Find best columns for each field
    const urlCol = columnAnalysis.findIndex(c => c.type === 'url');
    const yearCol = columnAnalysis.findIndex(c => c.type === 'year');

    // Title is the first substantial text column (not row numbers)
    let titleCol = -1;
    for (let i = 0; i < numCols; i++) {
        if (columnAnalysis[i]?.type === 'text' && !columnAnalysis[i]?.isRowNumber && i !== urlCol) {
            titleCol = i;
            break;
        }
    }
    if (titleCol === -1) titleCol = 1; // Fallback to second column

    // Director is usually another text column after title
    let directorCol = -1;
    for (let i = titleCol + 1; i < numCols; i++) {
        if (columnAnalysis[i]?.type === 'text' && i !== urlCol && i !== titleCol) {
            directorCol = i;
            break;
        }
    }

    console.log(`[Smart CSV] Detected: title=col${titleCol}, url=col${urlCol}, year=col${yearCol}, director=col${directorCol}`);

    if (urlCol === -1) {
        console.log('[Smart CSV] No URL column detected, trying fallback...');
        // Fallback: look for any column with URLs
        for (let i = 0; i < numCols; i++) {
            const values = sampleRows.map(row => (row[i] || '').trim());
            if (values.some(v => isValidUrl(v))) {
                console.log(`[Smart CSV] Found URLs in column ${i}`);
                return parseCSVWithColumns(allRows.slice(dataStartIdx + 1), titleCol, i, yearCol, directorCol);
            }
        }
        return [];
    }

    return parseCSVWithColumns(allRows.slice(dataStartIdx + 1), titleCol, urlCol, yearCol, directorCol);
}

/**
 * Parse CSV rows with known column indices
 */
function parseCSVWithColumns(rows, titleCol, urlCol, yearCol, directorCol) {
    const movies = [];

    for (const row of rows) {
        const title = (row[titleCol] || '').trim();
        const link = (row[urlCol] || '').trim();
        const yearStr = yearCol >= 0 ? (row[yearCol] || '').trim() : '';
        const director = directorCol >= 0 ? (row[directorCol] || '').trim() : '';

        // Skip invalid rows
        if (!title || title.length < 2) continue;
        if (/^\d+$/.test(title)) continue; // Skip row numbers as titles
        if (!link || !isValidUrl(link)) continue;

        const year = parseInt(yearStr);

        movies.push({
            title,
            year: (year && year > 1800 && year < 2100) ? year : null,
            director: director || null,
            downloadLinks: [{ label: 'Download', url: link }]
        });
    }

    return movies;
}

/**
 * Analyze a column's values to determine its data type
 */
function analyzeColumn(values, colIndex) {
    if (values.length === 0) return { type: 'empty', confidence: 0 };

    let urlCount = 0;
    let yearCount = 0;
    let numericCount = 0;
    let textCount = 0;
    let prevNum = 0;
    let isSequential = true;

    for (let i = 0; i < values.length; i++) {
        const v = values[i];

        if (isValidUrl(v)) {
            urlCount++;
        } else if (/^(19|20)\d{2}$/.test(v)) {
            yearCount++;
        } else if (/^\d+$/.test(v)) {
            numericCount++;
            const num = parseInt(v);
            if (i > 0 && num !== prevNum + 1) {
                isSequential = false;
            }
            prevNum = num;
        } else if (v.length > 1) {
            textCount++;
        }
    }

    const total = values.length;

    if (urlCount / total > 0.4) return { type: 'url', confidence: urlCount / total };
    if (yearCount / total > 0.4) return { type: 'year', confidence: yearCount / total };
    if (numericCount / total > 0.7 && isSequential && colIndex === 0) {
        return { type: 'number', isRowNumber: true, confidence: 1 };
    }
    if (textCount / total > 0.2) return { type: 'text', confidence: textCount / total };

    return { type: 'unknown', confidence: 0 };
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str) {
    if (!str || typeof str !== 'string') return false;
    const s = str.trim().toLowerCase();

    // Must look like a URL
    if (s.startsWith('http://') || s.startsWith('https://')) return true;
    if (s.startsWith('www.')) return true;

    // Check for common file hosting domains
    const urlPatterns = [
        'drive.google.com', 't.co/', 'bit.ly/', 'transfer.it',
        'mega.nz', 'mediafire.com', '1fichier.com', 'rapidgator',
        'dropbox.com', 'onedrive.', 'wetransfer.com', 'sendspace.com',
        'zippyshare', 'uploadhaven', 'uptobox', 'nitroflare'
    ];

    return urlPatterns.some(pattern => s.includes(pattern));
}

/**
 * Parse a single CSV line (handles quoted values and custom separator)
 */
function parseCSVLine(line, separator = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

/**
 * Parse TXT content (line by line)
 * Expected formats:
 * - "Movie Title | http://link.com"
 * - "Movie Title, http://link.com"
 * - "Movie Title    http://link.com" (tab separated)
 */
export async function parseTXT(content) {
    const lines = content.trim().split('\n').filter(line => line.trim());
    const movies = [];

    for (const line of lines) {
        // Skip comment lines
        if (line.trim().startsWith('#') || line.trim().startsWith('//')) continue;

        // Try different separators: pipe, comma, tab
        let parts = [];

        if (line.includes('|')) {
            parts = line.split('|').map(p => p.trim());
        } else if (line.includes('\t')) {
            parts = line.split('\t').map(p => p.trim());
        } else if (line.includes(',')) {
            // For comma, be careful not to split URLs
            const commaIdx = line.indexOf(',');
            if (commaIdx > 0) {
                parts = [line.slice(0, commaIdx).trim(), line.slice(commaIdx + 1).trim()];
            }
        } else {
            // Try to find URL pattern and split there
            const urlMatch = line.match(/(https?:\/\/\S+)/);
            if (urlMatch) {
                const urlStart = line.indexOf(urlMatch[1]);
                parts = [line.slice(0, urlStart).trim(), urlMatch[1]];
            }
        }

        if (parts.length >= 2) {
            const title = parts[0];
            const link = parts[parts.length - 1]; // Last part is usually the URL

            // Validate it looks like a URL
            if (title && link && (link.startsWith('http') || link.startsWith('www.'))) {
                movies.push({
                    title,
                    downloadLinks: [{ label: 'Download', url: link.startsWith('www.') ? 'https://' + link : link }]
                });
            }
        }
    }

    return movies;
}

/**
 * Parse any file format and normalize to movie array
 */
export async function parseFileContent(content, filename = '') {
    const format = await detectFileFormat(content, filename);

    switch (format) {
        case 'json':
            try {
                const data = JSON.parse(content);
                // Handle both { movies: [...] } and direct array
                return Array.isArray(data) ? data : (data.movies || []);
            } catch (e) {
                throw new Error(`Invalid JSON: ${e.message}`);
            }

        case 'csv':
            return parseCSV(content);

        case 'txt':
            return parseTXT(content);

        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

/**
 * Validate a single movie entry
 * Required: title (valid), downloadLinks (at least one with valid URL)
 */
export async function validateMovieEntry(movie, index) {
    const errors = [];
    const warnings = [];

    // Required: title
    if (!movie.title || typeof movie.title !== 'string' || !movie.title.trim()) {
        errors.push(`Missing or empty title`);
    } else {
        const title = movie.title.trim();
        // Check if title is just a number (likely row index)
        if (/^\d+$/.test(title)) {
            errors.push(`Title "${title}" appears to be a row number, not a movie name`);
        }
        // Check minimum length
        if (title.length < 2) {
            errors.push(`Title "${title}" is too short`);
        }
    }

    // Required: at least one download link
    if (!movie.downloadLinks || !Array.isArray(movie.downloadLinks) || movie.downloadLinks.length === 0) {
        errors.push(`Missing download links`);
    } else {
        // Validate each link has valid URL
        movie.downloadLinks.forEach((link, i) => {
            if (!link.url || !link.url.trim()) {
                errors.push(`Download link ${i + 1} missing URL`);
            } else if (!link.url.startsWith('http') && !link.url.startsWith('www.')) {
                errors.push(`Download link ${i + 1} has invalid URL format`);
            }
        });
    }

    // Warnings for missing optional fields
    if (!movie.year) warnings.push('Missing year (will fetch from TMDB)');
    if (!movie.director) warnings.push('Missing director (will fetch from TMDB)');
    if (!movie.genre || !Array.isArray(movie.genre) || movie.genre.length === 0) {
        warnings.push('Missing genre (will fetch from TMDB)');
    }

    return {
        index,
        title: movie.title || '(No title)',
        isValid: errors.length === 0,
        errors,
        warnings,
        needsTMDB: !movie.year || !movie.director || !movie.genre?.length,
        original: movie
    };
}

/**
 * Validate entire import data structure
 */
export async function validateImportData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

        if (!data.movies || !Array.isArray(data.movies)) {
            return { error: 'Invalid format: expected { "movies": [...] }' };
        }

        // Await all validation promises
        const results = await Promise.all(
            data.movies.map((movie, index) => validateMovieEntry(movie, index))
        );

        const validCount = results.filter(r => r.isValid).length;
        const errorCount = results.filter(r => !r.isValid).length;
        const needsTMDBCount = results.filter(r => r.isValid && r.needsTMDB).length;

        return {
            success: true,
            total: results.length,
            valid: validCount,
            errors: errorCount,
            needsTMDB: needsTMDBCount,
            entries: results
        };
    } catch (e) {
        return { error: `Failed to parse: ${e.message}` };
    }
}

/**
 * Enrich a single movie with TMDB data
 */
export async function enrichWithTMDB(movie) {
    if (!movie.title) return movie;

    try {
        // Search TMDB
        const results = await searchMovies(movie.title);
        if (!Array.isArray(results) || results.length === 0) {
            return { ...movie, tmdbStatus: 'not_found' };
        }

        // Get first result's details
        const tmdbMovie = results[0];
        const details = await getMovieDetails(tmdbMovie.id);

        if (details.error) {
            return { ...movie, tmdbStatus: 'error' };
        }

        // Merge: prefer existing data, fill gaps with TMDB
        return {
            ...movie,
            year: movie.year || parseInt(details.year) || null,
            director: movie.director || details.director || '',
            plot: movie.plot || details.plot || '',
            genre: (movie.genre && movie.genre.length > 0) ? movie.genre : details.genre || [],
            original: movie.original || details.original || '',
            poster: movie.poster || details.posterUrl || '',
            backdrop: movie.backdrop || details.backdropUrl || '',
            tmdbStatus: 'found',
            tmdbId: tmdbMovie.id
        };
    } catch (e) {
        console.error('TMDB enrichment error:', e);
        return { ...movie, tmdbStatus: 'error' };
    }
}

/**
 * Enrich all movies that need TMDB data
 */
export async function enrichAllWithTMDB(movies) {
    const enriched = [];

    for (const movie of movies) {
        // Only enrich if missing key fields
        if (!movie.year || !movie.director || !movie.genre?.length) {
            const enrichedMovie = await enrichWithTMDB(movie);
            enriched.push(enrichedMovie);
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
        } else {
            enriched.push({ ...movie, tmdbStatus: 'skipped' });
        }
    }

    return enriched;
}

/**
 * Check for duplicate movies
 */
export async function checkDuplicates(movies) {
    await dbConnect();

    const results = await Promise.all(movies.map(async (movie) => {
        // Strict match: exact title AND year (if year provided)
        const query = { title: movie.title };
        if (movie.year) {
            query.year = movie.year;
        }

        const existing = await Movie.findOne(query).select('_id title year').lean();

        return {
            ...movie,
            isDuplicate: !!existing,
            existingId: existing?._id?.toString()
        };
    }));

    return results;
}

/**
 * Import movies to database
 */
export async function bulkImportMovies(movies) {
    await dbConnect();

    const results = {
        imported: 0,
        skipped: 0,
        errors: [],
        details: []
    };

    for (const movie of movies) {
        try {
            // Skip invalid entries
            const validation = await validateMovieEntry(movie, 0);
            if (!validation.isValid) {
                results.skipped++;
                results.details.push({ title: movie.title, status: 'skipped', reason: 'Invalid entry' });
                continue;
            }

            // Skip duplicates
            const query = { title: movie.title };
            if (movie.year) query.year = movie.year;
            const existing = await Movie.findOne(query);

            if (existing) {
                results.skipped++;
                results.details.push({ title: movie.title, status: 'skipped', reason: 'Duplicate' });
                continue;
            }

            // Generate IDs
            const newObjectId = new mongoose.Types.ObjectId();
            const legacyId = `m${newObjectId.toString().slice(-8)}`;

            // Prepare download links with addedAt
            const downloadLinks = (movie.downloadLinks || []).map(link => ({
                label: link.label || 'Download',
                url: link.url,
                addedAt: new Date()
            }));

            // Create movie document
            const newMovie = new Movie({
                _id: newObjectId,
                __id: legacyId,
                title: movie.title,
                year: movie.year || null,
                director: movie.director || '',
                original: movie.original || '',
                plot: movie.plot || '',
                genre: movie.genre || [],
                poster: movie.poster || '',
                backdrop: movie.backdrop || '',
                lb: movie.lb || '',
                notes: movie.notes || '',
                downloadLinks,
                addedAt: new Date()
            });

            await newMovie.save();
            results.imported++;
            results.details.push({ title: movie.title, status: 'imported', id: newObjectId.toString() });

        } catch (e) {
            console.error('Error importing movie:', movie.title, e);
            results.errors.push({ title: movie.title, error: e.message });
            results.details.push({ title: movie.title, status: 'error', reason: e.message });
        }
    }

    // Revalidate homepage
    revalidatePath('/');
    revalidatePath('/admin');

    return results;
}
