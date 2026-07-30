import fs from "node:fs";
import path from "node:path";

function flattenKeys(obj, prefix) {
  const out = [];
  if (typeof obj !== "object" || obj === null) return out;
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      out.push(...flattenKeys(v, full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const en = JSON.parse(
  fs.readFileSync(path.resolve("src/i18n/messages/en.json"), "utf-8"),
);
const es = JSON.parse(
  fs.readFileSync(path.resolve("src/i18n/messages/es.json"), "utf-8"),
);

const enKeys = new Set(flattenKeys(en, ""));
const esKeys = new Set(flattenKeys(es, ""));

const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));
const missingInEn = [...esKeys].filter((k) => !enKeys.has(k));

if (missingInEs.length === 0 && missingInEn.length === 0) {
  console.log("OK: All translation keys match between EN and ES.");
  console.log(`  EN keys: ${enKeys.size}`);
  console.log(`  ES keys: ${esKeys.size}`);
} else {
  if (missingInEs.length > 0) {
    console.log(`Missing in ES (${missingInEs.length}):`);
    missingInEs.forEach((k) => console.log(`  - ${k}`));
  }
  if (missingInEn.length > 0) {
    console.log(`Missing in EN (${missingInEn.length}):`);
    missingInEn.forEach((k) => console.log(`  - ${k}`));
  }
}
