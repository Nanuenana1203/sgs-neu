"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

function fmt2(v: any): string {
  if (v === "" || v == null) return "";
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n.toFixed(2) : "";
}
function toNumOrNull(s: string) {
  if (!s || s.trim() === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const inp = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const num = inp + " text-right";
const lbl = "block text-sm font-medium text-slate-700 mb-1.5";

export default function NeuerArtikel() {
  const router = useRouter();
  const [artnr, setArtnr] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [artikelgruppe, setArtikelgruppe] = useState("");
  const [kachel, setKachel] = useState(false);
  const [p, setP] = useState({ p1: "", p2: "", p3: "", p4: "", p5: "", p6: "", p7: "", p8: "", p9: "" });
  const [err, setErr] = useState("");

  const setPx = (k: keyof typeof p, v: string) => setP(prev => ({ ...prev, [k]: v }));
  const onBlur = (k: keyof typeof p) => setP(prev => ({ ...prev, [k]: fmt2(prev[k]) }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try {
      const body: any = {
        artnr: artnr.trim() === "" ? null : artnr.trim(),
        bezeichnung: bezeichnung.trim(),
        artikelgruppe: artikelgruppe || null,
        preis1: toNumOrNull(p.p1), preis2: toNumOrNull(p.p2), preis3: toNumOrNull(p.p3),
        preis4: toNumOrNull(p.p4), preis5: toNumOrNull(p.p5), preis6: toNumOrNull(p.p6),
        preis7: toNumOrNull(p.p7), preis8: toNumOrNull(p.p8), preis9: toNumOrNull(p.p9),
        kachel,
      };
      const r = await fetch("/api/artikel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.ok === false) throw new Error(j?.detail || j?.error || "Speichern fehlgeschlagen");
      router.push("/artikel");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Neuer Artikel</h1>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Art.-Nr.</label>
                <input className={inp} value={artnr} onChange={e => setArtnr(e.target.value)} placeholder="Artikelnummer" />
              </div>
              <div>
                <label className={lbl}>Bezeichnung*</label>
                <input className={inp} value={bezeichnung} onChange={e => setBezeichnung(e.target.value)} placeholder="Bezeichnung" required />
              </div>
              <div>
                <label className={lbl}>Artikelgruppe</label>
                <select className={inp} value={artikelgruppe} onChange={e => setArtikelgruppe(e.target.value)}>
                  <option value="">– keine –</option>
                  <option value="Sport">Sport</option>
                  <option value="Munition">Munition</option>
                  <option value="Scheiben">Scheiben</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {([
                ["Preis 1 (€)", "p1"], ["Preis 2 (€)", "p2"], ["Preis 3 (€)", "p3"],
                ["Preis 4 (€)", "p4"], ["Preis 5 (€)", "p5"], ["Preis 6 (€)", "p6"],
                ["Preis 7 (€)", "p7"], ["Preis 8 (€)", "p8"], ["Preis 9 (€)", "p9"],
              ] as [string, keyof typeof p][]).map(([label, key]) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  <input className={num} inputMode="decimal"
                    value={p[key]} onChange={e => setPx(key, e.target.value)} onBlur={() => onBlur(key)} />
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600 mr-2">Preisgruppen:</span>
              1 = Gast / 2 = Mitglieder ohne Aufsicht / 3 = Mitglieder mit Aufsicht / 4 = Mitglieder mit Jahreskarte
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={kachel} onChange={e => setKachel(e.target.checked)} className="rounded" />
              Als Kachel in der Kasse anzeigen
            </label>
          </div>

          {err && <p className="px-6 pb-2 text-sm text-red-600">{err}</p>}

          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Speichern</button>
            <button type="button" onClick={() => router.push("/artikel")} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
