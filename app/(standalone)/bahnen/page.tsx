"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Gate = "loading" | "ok" | "no-session" | "forbidden";
type Bahn = { id:number; nummer:string|null; name:string|null };

export default function BahnenPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [rows, setRows] = useState<Bahn[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch("/api/session", { cache:"no-store", credentials:"include" });
        const sd = await s.json().catch(()=>({}));
        const user = sd?.user ?? null;
        if (!user) return setGate("no-session");
        if (!user.isAdmin) return setGate("forbidden");
        setGate("ok");
      } catch {
        setGate("no-session");
      }
    })();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/bahnen", { cache:"no-store" });
      const data = await r.json().catch(()=>[]);
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (gate === "ok") load();
  }, [gate]);

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(b =>
      (b.nummer ?? "").toLowerCase().includes(s) ||
      (b.name ?? "").toLowerCase().includes(s)
    );
  },[q, rows]);

  if (gate !== "ok") {
    const title =
      gate === "loading" ? "Prüfe Berechtigung…" :
      gate === "no-session" ? "Nicht angemeldet" :
      "Kein Zugriff";
    const msg =
      gate === "loading" ? "" :
      gate === "no-session"
        ? "Bitte zuerst einloggen, um Bahnen zu verwalten."
        : "Diese Funktion ist nur für Administratoren.";
    const btnHref = gate === "no-session" ? "/" : "/dashboard";
    const btnText = gate === "no-session" ? "Zur Anmeldung" : "Zum Dashboard";

    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white shadow border border-gray-100 p-6 max-w-xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {msg && <p>{msg}</p>}
          {gate !== "loading" && (
            <Link href={btnHref} className="inline-block px-4 py-2 rounded bg-slate-800 text-white">
              {btnText}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-center text-3xl font-extrabold mb-4">Bahnen</h1>

        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex gap-3">
            <Link href="/bahnen/neu" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold">
              + Neue Bahn
            </Link>
            <Link href="/dashboard" className="px-4 py-2 rounded bg-gray-200 font-semibold">
              Zurück
            </Link>
          </div>

          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Nach Bahn suchen…"
            className="w-80 px-3 py-2 border rounded"
          />
        </div>

        <div className="border rounded bg-white overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Nummer</th>
                <th className="p-3 text-left">Bahn</th>
                <th className="p-3 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b=>(
                <tr key={b.id} className="border-t">
                  <td className="p-3">{b.nummer ?? "—"}</td>
                  <td className="p-3">{b.name ?? "—"}</td>
                  <td className="p-3">
                    <Link href={`/bahnen/${b.id}`} className="text-lg">✏️</Link>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr><td colSpan={3} className="p-4 text-gray-500">Keine Einträge gefunden.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={3} className="p-4 text-gray-500">Lade…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
