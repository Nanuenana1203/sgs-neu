"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

type User = { id: number; name: string; email?: string | null; istadmin?: any };

function asBool(v: any): boolean {
  return v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true" || String(v).toLowerCase() === "t";
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [u, setU] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState(""); // optional: neues Kennwort

  useEffect(() => {
    (async () => {
      try {
        // Admin-Gate
        const s = await fetch("/api/session", { cache: "no-store" });
        const sd = await s.json();
        if (!sd?.user?.isAdmin) {
          router.push("/benutzer");
          return;
        }

        const r = await fetch(`/api/users/${id}`, { cache: "no-store" });
        const j = await r.json();
        const user: User = j?.user ?? j;
        setU(user);
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setIsAdmin(asBool(user?.istadmin));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const body: any = { name, email: email || null, istadmin: isAdmin };
    if (password.trim()) body.kennwort = password; // Backend hashed (sofern implementiert)

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      alert("Speichern fehlgeschlagen.");
      return;
    }
    router.push("/benutzer");
  }

  if (loading) return <div className="p-8 text-center">Lade…</div>;
  if (!u) return <div className="p-8 text-center">Benutzer nicht gefunden.</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-center text-slate-800 mb-6">Benutzer bearbeiten</h1>

      <form onSubmit={onSave} className="space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Name</label>
          <input className="w-full px-3 py-2 rounded border border-slate-300" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">E-Mail</label>
          <input type="email" className="w-full px-3 py-2 rounded border border-slate-300" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="admin" type="checkbox" checked={isAdmin} onChange={(e)=>setIsAdmin(e.target.checked)} />
          <label htmlFor="admin">Admin</label>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Neues Kennwort (optional)</label>
          <input type="password" className="w-full px-3 py-2 rounded border border-slate-300" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Speichern</button>
          <Link href="/benutzer" className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800">Abbrechen</Link>
        </div>
      </form>
    </div>
  );
}
