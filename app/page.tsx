'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState<number>(2025);

  const [name, setName] = useState("");
  const [kennwort, setKennwort] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    setYear(new Date().getFullYear());
  }, []);

  if (!mounted) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Anmeldung...");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kennwort }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok === true) {
        document.cookie = `sgs_session=1; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`;
        window.location.href = "/dashboard";
      } else {
        setMsg("Name oder Kennwort ungültig oder Rechner nicht freigegeben");
      }
    } catch {
      setMsg("Netzwerkfehler");
    }
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "#f3f4f6",
        position: "relative",
      }}
    >
      <div style={{ display: "grid", gap: "20px", justifyItems: "center" }}>
        <div
          style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: "360px",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              textAlign: "center",
              fontSize: "1.6rem",
              fontWeight: 700,
            }}
          >
            Anmeldung
          </h1>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: "12px" }} suppressHydrationWarning>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Name"
              style={{
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                width: "100%",
              }}
              required
            />
            <input
              value={kennwort}
              onChange={(e) => setKennwort(e.target.value)}
              type="password"
              placeholder="Kennwort"
              style={{
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                width: "100%",
              }}
              required
            />
            <button
              type="submit"
              style={{
                width: "220px",
                justifySelf: "center",
                padding: "12px",
                border: "none",
                borderRadius: "6px",
                background: "#2563eb",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Anmelden
            </button>
          </form>

          <p
            style={{
              marginTop: "8px",
              textAlign: "center",
              color: "#ef4444",
            }}
          >
            {msg}
          </p>
        </div>

        <Link
          href="/bahnbuchung-public"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "70px",
            borderRadius: "8px",
            background: "#e5e7eb",
            color: "#111",
            textDecoration: "none",
            width: "424px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          Bahnbuchung (öffentlicher Bereich)
        </Link>
      </div>

      <div className="absolute bottom-6 right-6 text-sm font-bold text-slate-700 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-slate-200">
        Copyright © 2025–{year} Nanuenana
      </div>
    </div>
  );
}
