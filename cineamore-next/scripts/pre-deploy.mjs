
import fs from "fs";
import dotenv from "dotenv";

if (fs.existsSync(".env.local")) {
    dotenv.config({ path: ".env.local" });
}
dotenv.config();

import { execSync } from "child_process";

function fail(msg) {
    console.error("\n🚨 PRE-DEPLOY BLOCKED\n" + msg + "\n");
    process.exit(1);
}

const REQUIRED_ENVS = [
    "MONGODB_URI",
    "TMDB_API_KEY",
    "AUTH_SECRET"
];

for (const env of REQUIRED_ENVS) {
    if (!process.env[env]) {
        fail(`Missing env var: ${env}`);
    }
}

try {
    execSync("npm run build", { stdio: "inherit" });
} catch {
    fail("Build failed");
}

try {
    execSync("node scripts/audit-db.mjs", { stdio: "inherit" });
} catch {
    fail("Database invariant check failed");
}

try {
    execSync("node scripts/check-homepage-bounds.mjs", { stdio: "inherit" });
} catch {
    fail("Homepage query unbounded");
}

console.log("✅ Pre-deploy passed");
