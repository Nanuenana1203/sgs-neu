"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = { id: number; artnr: number | null; bezeichnung: string; preis1: number | null; artikelgruppe: string | null };

export default function ArtikelPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          fetch("/api/session", { cache: "no-store" }),
          fetch("/api/artikel", { cache: "no-store" }),
        ]);
        const sd = await sRes.json().catch(() => ({}));
        setIsAdmin(!!sd?.user?.isAdmin);
        const j = await rRes.json().catch(() => []);
        const list: Row[] = Array.isArray(j) ? j : Array.isArray(j?.artikel) ? j.artikel : [];
        setRows(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(a =>
      [a.artnr, a.bezeichnung].filter(v => v !== null && v !== undefined)
        .some(v => String(v).toLowerCase().includes(s))
    );
  }, [rows, q]);

  async function delArtikel(id: number) {
    if (!confirm("Artikel wirklich loschen?")) return;
    const res = await fetch(`/api/artikel/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Loschen fehlgeschlagen."); return; }
    setRows(prev => prev.filter(x => x.id !== id));
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Lade…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Artikel</h1>
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nach Artikel suchen..."
              className="w-64 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Link href="/artikel/neu" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              + Neuer Artikel
            </Link>
            <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
              Zurück
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Artikelnummer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Bezeichnung</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Gruppe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Preis 1</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{a.artnr ?? "–"}</td>
                  <td className="px-4 py-3 text-slate-700">{a.bezeichnung}</td>
                  <td className="px-4 py-3 text-slate-700">{a.artikelgruppe ?? "–"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {a.preis1 != null ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(a.preis1)) : "–"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/artikel/${a.id}`} title="Bearbeiten" className="text-slate-500 hover:text-blue-600 transition-colors text-base leading-none">✏️</Link>
                      {isAdmin && <button onClick={() => delArtikel(a.id)} title="Löschen" className="text-slate-500 hover:text-red-600 transition-colors text-base leading-none">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">
                    Keine Artikel gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
