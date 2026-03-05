"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Gate = "loading" | "ok" | "no-session" | "forbidden";
type UserRow = { id: number; name: string; email?: string | null; istadmin?: any };

function asAdmin(value: any): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "TRUE" || value === "t" || value === "T";
}

export default function BenutzerPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const s = await fetch("/api/session", { cache: "no-store" });
    const sd = await s.json().catch(() => ({}));
    const user = sd?.user ?? null;
    if (!user) return setGate("no-session");
    if (!user.isAdmin) return setGate("forbidden");

    const r = await fetch("/api/users", { cache: "no-store" });
    if (!r.ok) throw new Error("users");
    const j = await r.json().catch(() => ({}));
    const list: UserRow[] = Array.isArray(j) ? j : Array.isArray(j?.users) ? j.users : [];
    setRows(list);
    setGate("ok");
  }

  useEffect(() => { load().catch(() => setGate("no-session")); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((u) =>
      [u.name, u.email].filter(Boolean).some((x) => String(x).toLowerCase().includes(s))
    );
  }, [rows, q]);

  async function delUser(id: number) {
    if (!confirm("Benutzer wirklich löschen?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Löschen fehlgeschlagen.");
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== id));
  }

  if (gate !== "ok") {
    const title =
      gate === "loading" ? "Lade …" :
      gate === "no-session" ? "Nicht angemeldet" : "Kein Zugriff";
    const msg =
      gate === "loading" ? "" :
      gate === "no-session" ? "Bitte zuerst einloggen, um die Benutzerverwaltung zu öffnen." :
      "Für die Benutzerverwaltung ist Admin-Recht erforderlich.";
    const btnHref = gate === "no-session" ? "/" : "/dashboard";
    const btnText = gate === "no-session" ? "Zur Anmeldung" : "Zum Dashboard";
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {msg && <p>{msg}</p>}
        {gate !== "loading" && (
          <Link href={btnHref} className="inline-block px-4 py-2 rounded bg-slate-800 text-white">
            {btnText}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-semibold text-center text-slate-800 mb-6">Benutzer</h1>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/benutzer/neu"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            + Neuer Benutzer
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Zurück
          </Link>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nach Benutzer suchen…"
          className="w-72 px-3 py-2 rounded-md border border-slate-300 outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th style={{ padding: 12, textAlign: "left" }}>Name</th>
              <th style={{ padding: 12, textAlign: "left" }}>E-Mail</th>
              <th style={{ padding: 12, textAlign: "left" }}>Admin</th>
              <th style={{ padding: 12, textAlign: "left" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isAdmin = u.istadmin === true || u.istadmin === 1 || u.istadmin === "1" || String(u.istadmin).toLowerCase() === "true" || String(u.istadmin).toLowerCase() === "t";
              return (
                <tr key={u.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 12 }}>{u.name}</td>
                  <td style={{ padding: 12 }}>{u.email ?? "—"}</td>
                  <td style={{ padding: 12 }}>{isAdmin ? "Ja" : "Nein"}</td>
                  <td style={{ padding: 12 }}>
                    <Link
                      href={`/benutzer/${u.id}`}
                      title="Bearbeiten"
                      style={{ marginRight: 12, textDecoration: "none" }}
                    >✏️</Link>
                    <button
                      title="Löschen"
                      style={{ background: "transparent", border: "none", cursor: "pointer" }}
                      onClick={() => delUser(u.id)}
                    >🗑️</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: "#6b7280", textAlign: "center" }}>
                  Keine Benutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
