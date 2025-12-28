
import fs from "fs";
import path from "path";

const source = "scripts/hooks/pre-commit";
const target = ".git/hooks/pre-commit";

try {
    // Ensure target dir exists
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
        console.log("No .git/hooks directory found. Skipping hook installation.");
        process.exit(0);
    }

    fs.copyFileSync(source, target);

    // Make executable (Unix) - benign on Windows usually
    try {
        fs.chmodSync(target, "755");
    } catch (e) {
        // Ignore chmod errors on Windows
    }

    console.log("✅ Git hooks installed successfully.");
} catch (e) {
    console.error("❌ Failed to install git hooks:", e);
    process.exit(1);
}
