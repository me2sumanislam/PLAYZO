 // scripts/bump-version.js
import { readFileSync, writeFileSync } from "fs";

// ===== main.jsx এ APP_VERSION বাড়াও =====
const mainPath = "src/main.jsx";
let mainContent = readFileSync(mainPath, "utf8");

let oldVersion = "1.0.0";
let newVersion = "1.0.1";

const versionMatch = mainContent.match(/const APP_VERSION = "(\d+)\.(\d+)\.(\d+)"/);

if (!versionMatch) {
  // ✅ না থাকলে যোগ করে দাও
  mainContent = mainContent.replace(
    `const STORAGE_KEY =`,
    `const APP_VERSION = "${oldVersion}";\nconst STORAGE_KEY =`
  );
  writeFileSync(mainPath, mainContent, "utf8");
  console.log(`✅ APP_VERSION:   নতুন যোগ হয়েছে → ${oldVersion}`);
} else {
  const [, major, minor, patch] = versionMatch;
  oldVersion = `${major}.${minor}.${patch}`;
  newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
  mainContent = mainContent.replace(
    `const APP_VERSION = "${oldVersion}"`,
    `const APP_VERSION = "${newVersion}"`
  );
  writeFileSync(mainPath, mainContent, "utf8");
  console.log(`✅ APP_VERSION:   ${oldVersion} → ${newVersion}`);
}

// ===== sw.js এ CACHE_VERSION বাড়াও =====
const swPath = "public/sw.js";
let swContent = readFileSync(swPath, "utf8");

const cacheMatch = swContent.match(/const CACHE_VERSION = "uthiyo-v(\d+)"/);
if (!cacheMatch) {
  console.error("❌ CACHE_VERSION পাওয়া যায়নি public/sw.js এ");
  process.exit(1);
}

const oldV = parseInt(cacheMatch[1]);
const newV = oldV + 1;

swContent = swContent.replace(
  `const CACHE_VERSION = "uthiyo-v${oldV}"`,
  `const CACHE_VERSION = "uthiyo-v${newV}"`
);
writeFileSync(swPath, swContent, "utf8");
console.log(`✅ CACHE_VERSION: uthiyo-v${oldV} → uthiyo-v${newV}`);