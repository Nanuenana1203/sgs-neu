"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Mitglied = {
  id: number; mitgliedsnr: string | null; name: string | null;
  ort: string | null; ausweisnr: string | null; preisgruppe: number | null;
};

type ArtikelOption = { id: number; artnr: string | null; bezeichnung: string };

function ArtikelSearch({
  label, value, onChange, artikel,
}: {
  label: string;
  value: string;
  onChange: (artnr: string) => void;
  artikel: ArtikelOption[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const matches = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    return artikel
      .filter(a => (a.artnr ?? "").toLowerCase().includes(s) || a.bezeichnung.toLowerCase().includes(s))
      .slice(0, 10);
  }, [artikel, query]);

  function select(a: ArtikelOption) {
    const v = a.artnr ?? "";
    setQuery(v);
    onChange(v);
    setOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder="Nr. oder Bezeichnung…"
        className="w-40 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {matches.map(a => (
            <button
              key={a.id}
              type="button"
              onMouseDown={() => select(a)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex gap-2 items-baseline border-b border-slate-100 last:border-0"
            >
              <span className="font-medium text-slate-800 shrink-0">{a.artnr ?? "–"}</span>
              <span className="text-slate-500 truncate">{a.bezeichnung}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Buchung = {
  datum: string;
  artikel_nummer: string | null;
  artikel_bezeichnung: string | null;
  menge: number | null;
  einzelpreis: number | null;
  gesamtpreis: number | null;
  mitglied_name: string | null;
  benutzer_name: string | null;
};

const norm = (v: unknown) => (v ?? "").toString().trim().toLowerCase();
const fmt2 = (n: number | null | undefined) => (n ?? 0).toFixed(2).replace(".", ",");

function janFirstISO() { const d = new Date(); return `${d.getFullYear()}-01-01`; }
function todayISO() { const d = new Date(); const z = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }

const inp = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function KassenbuchPage() {
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [artikel, setArtikel] = useState<ArtikelOption[]>([]);
  const [queryMitglied, setQueryMitglied] = useState("");
  const [auswahl, setAuswahl] = useState<Mitglied | null>(null);
  const [from, setFrom] = useState(janFirstISO());
  const [to, setTo] = useState(todayISO());
  const [artikelgruppe, setArtikelgruppe] = useState("");
  const [artnrVon, setArtnrVon] = useState("");
  const [artnrBis, setArtnrBis] = useState("");
  const [rows, setRows] = useState<Buchung[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [mr, ar] = await Promise.all([
          fetch("/api/mitglieder", { cache: "no-store" }),
          fetch("/api/artikel", { cache: "no-store" }),
        ]);
        const mj = mr.ok ? await mr.json() : [];
        setMitglieder(Array.isArray(mj) ? mj : []);
        const aj = ar.ok ? await ar.json() : [];
        const list: ArtikelOption[] = Array.isArray(aj) ? aj : [];
        setArtikel(list.sort((a, b) => (a.artnr ?? "").localeCompare(b.artnr ?? "")));
      } catch {}
    })();
  }, []);

  const filteredMitglieder = useMemo(() => {
    const n = norm(queryMitglied);
    if (n.length < 3) return [];
    return mitglieder
      .filter(m => norm(m.name).includes(n) || norm(m.ort).includes(n) || norm(m.ausweisnr).includes(n) || norm(m.mitgliedsnr).includes(n))
      .sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
  }, [mitglieder, queryMitglied]);

  async function loadData() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      if (auswahl?.id) q.set("mitglied_id", String(auswahl.id));
      if (artikelgruppe) q.set("artikelgruppe", artikelgruppe);
      if (artnrVon) q.set("artnr_von", artnrVon);
      if (artnrBis) q.set("artnr_bis", artnrBis);
      const r = await fetch(`/api/kassenbuch?${q.toString()}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      const list: Buchung[] = Array.isArray(j) ? j : Array.isArray(j?.rows) ? j.rows : [];
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const cols = useMemo(() => ["Datum", "Artikel", "Bezeichnung", "Menge", "EP (€)", "GP (€)", "Mitglied", "Benutzer"], []);

  function exportCSV() {
    const head = cols.join(";");
    const body = rows.map(r => [
      new Date(r.datum).toLocaleDateString("de-DE"),
      r.artikel_nummer ?? "", r.artikel_bezeichnung ?? "",
      r.menge ?? "", fmt2(r.einzelpreis), fmt2(r.gesamtpreis),
      r.mitglied_name ?? "", r.benutzer_name ?? "",
    ].join(";"));
    const csv = [head, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kassenbuch_${from}_bis_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Kassenbuch</h1>
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
            Zurück
          </Link>
        </div>

        {/* Mitglied */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
          {!auswahl ? (
            <>
              <p className="text-sm font-medium text-slate-700 mb-2">Mitglied auswählen (optional)</p>
              <input
                className={inp}
                placeholder="Mitglied suchen (mind. 3 Zeichen)…"
                value={queryMitglied}
                onChange={(e) => setQueryMitglied(e.target.value)}
              />
              {queryMitglied.length >= 3 && (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nr.</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ort</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ausweis</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Gruppe</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMitglieder.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-3 text-center text-slate-400 text-sm">Keine Mitglieder gefunden.</td></tr>
                      )}
                      {filteredMitglieder.map((m) => (
                        <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-700">{m.mitgliedsnr}</td>
                          <td className="px-4 py-2 text-slate-700">{m.name}</td>
                          <td className="px-4 py-2 text-slate-700">{m.ort}</td>
                          <td className="px-4 py-2 text-slate-700">{m.ausweisnr}</td>
                          <td className="px-4 py-2 text-slate-700">{m.preisgruppe}</td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => setAuswahl(m)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                              Ubernehmen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-700">
                <strong>{auswahl.name}</strong>
                {auswahl.ort ? <> ({auswahl.ort})</> : null}
                {" – Preisgruppe: "}{auswahl.preisgruppe ?? "–"}
              </div>
              <button
                onClick={() => { setAuswahl(null); setQueryMitglied(""); }}
                className="ml-auto px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Mitglied wechseln
              </button>
            </div>
          )}
        </div>

        {/* Filter + Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Datum von</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Datum bis</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Artikelgruppe</label>
              <select value={artikelgruppe} onChange={(e) => setArtikelgruppe(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Alle</option>
                <option value="Sport">Sport</option>
                <option value="Munition">Munition</option>
                <option value="Scheiben">Scheiben</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>
            <ArtikelSearch label="Art.-Nr. von" value={artnrVon} onChange={setArtnrVon} artikel={artikel} />
            <ArtikelSearch label="Art.-Nr. bis" value={artnrBis} onChange={setArtnrBis} artikel={artikel} />
            <div className="flex gap-3 ml-auto">
              <button onClick={loadData} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Anzeigen
              </button>
              <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
                Exportieren (CSV)
              </button>
            </div>
          </div>
        </div>

        {/* Tabelle */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {cols.map(c => (
                  <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-slate-400 text-sm">Lade…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-slate-400 text-sm">Keine Buchungen gefunden</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 even:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-700">{new Date(r.datum).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 text-slate-700">{r.artikel_nummer}</td>
                    <td className="px-4 py-3 text-slate-700">{r.artikel_bezeichnung}</td>
                    <td className="px-4 py-3 text-slate-700 text-right">{r.menge}</td>
                    <td className="px-4 py-3 text-slate-700 text-right">{fmt2(r.einzelpreis)}</td>
                    <td className="px-4 py-3 text-slate-700 text-right">{fmt2(r.gesamtpreis)}</td>
                    <td className="px-4 py-3 text-slate-700">{r.mitglied_name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.benutzer_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
