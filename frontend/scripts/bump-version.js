 // scripts/bump-version.js
import { readFileSync, writeFileSync } from 'fs'

// =============================================
// versionCheck.js — APP_VERSION বাড়াও
// =============================================
let vc = readFileSync('src/utils/versionCheck.js', 'utf8')
const oldV = vc.match(/APP_VERSION = "(.+?)"/)[1]
const [maj, min, patch] = oldV.split('.').map(Number)
const newV = `${maj}.${min}.${patch + 1}`
vc = vc.replace(`APP_VERSION = "${oldV}"`, `APP_VERSION = "${newV}"`)
writeFileSync('src/utils/versionCheck.js', vc)

// =============================================
// sw.js — CACHE_VERSION বাড়াও
// =============================================
let sw = readFileSync('public/sw.js', 'utf8')
const oldC = sw.match(/CACHE_VERSION = "uthiyo-v(\d+)"/)[1]
const newC = parseInt(oldC) + 1
sw = sw.replace(`uthiyo-v${oldC}`, `uthiyo-v${newC}`)
writeFileSync('public/sw.js', sw)

console.log(`✅ APP_VERSION:   ${oldV} → ${newV}`)
console.log(`✅ CACHE_VERSION: uthiyo-v${oldC} → uthiyo-v${newC}`)