"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Gate = "loading" | "ok" | "no-session" | "forbidden";

type BahnMini = { id:number; nummer:string|null; name:string|null };
type Regel = {
  id:number;
  weekday:number;        // 0=So … 6=Sa
  weekday_name?:string;  // kommt schon aus der API, fallbacken wir aber
  start_time:string|null;
  end_time:string|null;
  slot_minutes:number|null;
  aktiv:boolean;
  bahn: BahnMini | null; // verschachtelt geliefert
};

const WDN = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

export default function ZeitregelnPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [rows, setRows] = useState<Regel[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  function fmtTime(s?:string|null) {
    if (!s) return "—";
    const m = /^(\d{2}:\d{2})/.exec(s);
    return m ? m[1] : s;
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch("/api/session", { cache: "no-store", credentials: "include" });
        const sd = await s.json().catch(() => ({}));
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
      const r = await fetch("/api/zeitregeln", { cache: "no-store", credentials: "include" });
      const data = await r.json().catch(()=>[]);
      const arr = Array.isArray(data) ? (data as Regel[]) : [];
      setRows(arr.map(x => ({
        ...x,
        weekday_name: x.weekday_name ?? WDN[(Number(x.weekday) || 0) % 7],
      })));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ if (gate === "ok") load(); },[gate]);

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r=>{
      const wd = (r.weekday_name ?? WDN[r.weekday] ?? "").toLowerCase();
      const st = fmtTime(r.start_time).toLowerCase();
      const et = fmtTime(r.end_time).toLowerCase();
      const bn = `${r.bahn?.nummer ?? ""} ${r.bahn?.name ?? ""}`.toLowerCase();
      return wd.includes(s) || st.includes(s) || et.includes(s) || bn.includes(s);
    });
  },[q, rows]);

  async function delRegel(id:number) {
    if (!confirm("Zeitregel wirklich löschen?")) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/zeitregeln?id=${encodeURIComponent(String(id))}`, { method:"DELETE", credentials: "include" });
      if (!r.ok) throw new Error("delete");
      await load();
    } catch {
      alert("Löschen fehlgeschlagen.");
    } finally { setLoading(false); }
  }

  if (gate !== "ok") {
    const title =
      gate === "loading" ? "Prüfe Berechtigung…" :
      gate === "no-session" ? "Nicht angemeldet" :
      "Kein Zugriff";

    const msg =
      gate === "loading" ? "" :
      gate === "no-session"
        ? "Bitte zuerst einloggen, um Zeitregeln zu verwalten."
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
    <main style={{ padding: "24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <h1 style={{ textAlign:"center", fontSize:"28px", fontWeight:800, marginBottom:16 }}>Zeitregeln</h1>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ display:"flex", gap:12 }}>
            <Link href="/zeitregeln/neu"
                  style={{ background:"#3b82f6", color:"#fff", padding:"8px 14px", borderRadius:6, fontWeight:600, textDecoration:"none" }}>
              + Neue Zeitregel
            </Link>
            <Link href="/dashboard"
                  style={{ background:"#e5e7eb", padding:"8px 14px", borderRadius:6, fontWeight:600, textDecoration:"none" }}>
              Zurück
            </Link>
          </div>

          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Nach Wochentag, Bahn oder Zeit suchen…"
            style={{ width: 360, padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8 }}
          />
        </div>

        <div style={{ border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", background:"#fff" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ background:"#f9fafb" }}>
              <tr>
                <th style={{ padding:12, textAlign:"left" }}>Wochentag</th>
                <th style={{ padding:12, textAlign:"left" }}>Von</th>
                <th style={{ padding:12, textAlign:"left" }}>Bis</th>
                <th style={{ padding:12, textAlign:"left" }}>Bahn</th>
                <th style={{ padding:12, textAlign:"left" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id} style={{ borderTop:"1px solid #e5e7eb" }}>
                  <td style={{ padding:12 }}>{r.weekday_name ?? WDN[r.weekday] ?? "—"}</td>
                  <td style={{ padding:12 }}>{fmtTime(r.start_time)}</td>
                  <td style={{ padding:12 }}>{fmtTime(r.end_time)}</td>
                  <td style={{ padding:12 }}>
                    {r.bahn
                      ? <span>{r.bahn.nummer ?? "—"}{(r.bahn.name ?? "") && " · "}{r.bahn.name ?? ""}</span>
                      : "—"}
                  </td>
                  <td style={{ padding:12 }}>
                    <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                      <Link href={`/zeitregeln/${r.id}`} title="Bearbeiten" style={{ fontSize:"18px", textDecoration:"none" }}>✏️</Link>
                      <button title="Löschen" onClick={()=>delRegel(r.id)}
                        style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:"18px" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr><td colSpan={5} style={{ padding:16, color:"#6b7280" }}>Keine Einträge gefunden.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} style={{ padding:16, color:"#6b7280" }}>Lade…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
