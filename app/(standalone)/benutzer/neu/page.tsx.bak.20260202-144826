"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NeuerBenutzer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kennwort, setKennwort] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!name.trim() || !kennwort.trim()) {
      setMsg("Name und Kennwort sind Pflichtfelder");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() ? email.trim() : null,
          kennwort: kennwort.trim(),
          istadmin: isAdmin, // API akzeptiert istadmin/isAdmin – hier eindeutig
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data?.ok === true || data?.id || data?.user)) {
        router.push("/benutzer");
        return;
      }

      // Fehlermeldung hübsch anzeigen
      const detail =
        data?.detail ||
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : "") ||
        "Fehler beim Speichern";
      setMsg(String(detail));
    } catch {
      setMsg("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, textAlign: "center" }}>
          Neuer Benutzer
        </h1>

        <form
          onSubmit={onSubmit}
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 16 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Name*</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>E-Mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail"
                type="email"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Kennwort*
              </label>
              <input
                type="password"
                value={kennwort}
                onChange={(e) => setKennwort(e.target.value)}
                placeholder="Kennwort"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                id="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <label htmlFor="isAdmin">Administratorrechte</label>
            </div>
          </div>

          {msg && (
            <div style={{ color: "#dc2626", padding: "0 16px 12px 16px" }}>❌ {msg}</div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-start",
              padding: 16,
              borderTop: "1px solid #e5e7eb",
              background: "#f9fafb",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Speichere…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/benutzer")}
              style={{
                background: "#e5e7eb",
                color: "#111827",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}