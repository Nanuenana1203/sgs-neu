"use client";

import { useState } from "react";
import { getDeviceToken } from "../../../../lib/deviceToken";

export default function RechnerFreigebenButton({ benutzerId }: { benutzerId: number }) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!confirm("Diesen Rechner für den Benutzer freigeben?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/benutzer-rechner-freigeben", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ benutzerId, deviceToken: getDeviceToken() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok !== true) throw new Error(j?.error || `HTTP ${res.status}`);
      alert("Rechner freigegeben.");
    } catch (e) {
      console.error(e);
      alert("Fehler beim Freigeben.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      title="Diesen Rechner freigeben"
    >
      {loading ? "..." : "Rechner freigeben"}
    </button>
  );
}
