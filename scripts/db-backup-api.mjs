// SGS Datenbank-Backup via Supabase REST API
// Exportiert alle Tabellen als JSON
// Verwendung: node scripts/db-backup-api.mjs

import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Fehler: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const TABLES = [
  "benutzer",
  "mitglieder",
  "artikel",
  "kasse",
  "kasse_saldo",
  "bahnen",
  "bahn_regeln",
  "bahn_buchungen",
  "app_settings",
  "dienste",
  "dienst_slots",
  "dienst_zeilen",
];

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function exportTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=100000`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tabelle ${table}: HTTP ${res.status} – ${text}`);
  }
  return res.json();
}

async function main() {
  console.log(`Backup gestartet: ${new Date().toISOString()}`);
  const backup = { meta: { created_at: new Date().toISOString(), url: SUPABASE_URL }, tables: {} };

  for (const table of TABLES) {
    try {
      const rows = await exportTable(table);
      backup.tables[table] = rows;
      console.log(`  ✓ ${table}: ${rows.length} Zeilen`);
    } catch (err) {
      console.warn(`  ⚠ ${table}: ${err.message}`);
      backup.tables[table] = [];
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = "./db-backups";
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `sgs-backup-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2));
  console.log(`\nBackup gespeichert: ${outFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
