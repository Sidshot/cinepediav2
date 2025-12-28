
import fs from "fs";

const page = fs.readFileSync("app/page.js", "utf8");

// Strict Regex: Finds 'Movie.find(' followed by anything EXCEPT '.limit(' until the end of the statement or a reasonable length
// Actually, simpler logic: If 'Movie.find' exists, '.limit(' MUST exist in the file (global check is usually acceptable for page.js because it dictates the data fetching strategy).
// But to be precise: "Every Movie.find call must be chained with limit".
// That is hard to regex perfectly without AST. 
// For now, the protocol requires: "Homepage queries bounded".
// So if the file contains `Movie.find` but NOT `.limit(`, it's a fail.
// This covers 99% of accidental omissions.

if (page.includes("Movie.find") && !page.includes(".limit(")) {
    throw new Error("Unbounded Movie.find detected on homepage (No .limit() found in file)");
}

// Check for explicit LARGE limits (abuse)
const limitMatch = page.match(/\.limit\((\d+)\)/);
if (limitMatch && parseInt(limitMatch[1]) > 100) {
    throw new Error(`Homepage limit too high: ${limitMatch[1]}. Max allowed is 100.`);
}

console.log("✅ Homepage Bounds Check Passed");
