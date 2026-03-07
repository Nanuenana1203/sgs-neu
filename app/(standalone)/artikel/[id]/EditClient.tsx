"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Art = {
  id:number; artnr:string; bezeichnung:string;
  preis1?:number; preis2?:number; preis3?:number; preis4?:number; preis5?:number;
  preis6?:number; preis7?:number; preis8?:number; preis9?:number;
  kachel?:boolean; artikelgruppe?:string | null;
};

export default function EditClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [artnr, setArtnr] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [preis1, setPreis1] = useState(""); const [preis2, setPreis2] = useState("");
  const [preis3, setPreis3] = useState(""); const [preis4, setPreis4] = useState("");
  const [preis5, setPreis5] = useState(""); const [preis6, setPreis6] = useState("");
  const [preis7, setPreis7] = useState(""); const [preis8, setPreis8] = useState("");
  const [preis9, setPreis9] = useState("");
  const [kachel, setKachel] = useState(false);
  const [artikelgruppe, setArtikelgruppe] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/artikel/${id}`, { cache:"no-store" });
      if (!res.ok) { router.push("/artikel"); return; }
      const json = await res.json();
      const a:Art = json.artikel ?? json;
      setArtnr(a.artnr || ""); setBezeichnung(a.bezeichnung || "");
      setPreis1(a.preis1!=null?String(a.preis1):""); setPreis2(a.preis2!=null?String(a.preis2):"");
      setPreis3(a.preis3!=null?String(a.preis3):""); setPreis4(a.preis4!=null?String(a.preis4):"");
      setPreis5(a.preis5!=null?String(a.preis5):""); setPreis6(a.preis6!=null?String(a.preis6):"");
      setPreis7(a.preis7!=null?String(a.preis7):""); setPreis8(a.preis8!=null?String(a.preis8):"");
      setPreis9(a.preis9!=null?String(a.preis9):""); setKachel(!!a.kachel);
      setArtikelgruppe(a.artikelgruppe ?? "");
      setLoading(false);
    })();
  }, [id, router]);

  const toNum = (v:string)=> v==="" ? null : Number(v);

  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    const body = {
      artnr: artnr.trim(), bezeichnung: bezeichnung.trim(),
      preis1: toNum(preis1), preis2: toNum(preis2), preis3: toNum(preis3),
      preis4: toNum(preis4), preis5: toNum(preis5), preis6: toNum(preis6),
      preis7: toNum(preis7), preis8: toNum(preis8), preis9: toNum(preis9),
      kachel, artikelgruppe: artikelgruppe || null,
    };
    const res = await fetch(`/api/artikel/${id}`, {
      method: "PUT",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) router.push("/artikel"); else alert("Speichern fehlgeschlagen");
  };

  if (loading) return <main style={{padding:24}}>Laden…</main>;
  const Input = (p:any)=><input {...p} style={{ padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8 }} />;

  return (
    <main style={{ padding:24 }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <h1 style={{ textAlign:"center", fontSize:28, fontWeight:800, marginBottom:16 }}>Artikel bearbeiten</h1>
        <form onSubmit={save} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:20, display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:16 }}>
            <label style={{ display:"grid", gap:6 }}>
              <span style={{ fontWeight:600 }}>Art.-Nr.*</span>
              <Input value={artnr} onChange={(e:any)=>setArtnr(e.target.value)} required />
            </label>
            <label style={{ display:"grid", gap:6 }}>
              <span style={{ fontWeight:600 }}>Bezeichnung*</span>
              <Input value={bezeichnung} onChange={(e:any)=>setBezeichnung(e.target.value)} required />
            </label>
            <label style={{ display:"grid", gap:6 }}>
              <span style={{ fontWeight:600 }}>Artikelgruppe</span>
              <select value={artikelgruppe} onChange={(e:any)=>setArtikelgruppe(e.target.value)}
                style={{ padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8 }}>
                <option value="">– keine –</option>
                <option value="Sport">Sport</option>
                <option value="Munition">Munition</option>
                <option value="Scheiben">Scheiben</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </label>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16 }}>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 1 (€)</span><Input type="number" step="0.01" value={preis1} onChange={(e:any)=>setPreis1(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 2 (€)</span><Input type="number" step="0.01" value={preis2} onChange={(e:any)=>setPreis2(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 3 (€)</span><Input type="number" step="0.01" value={preis3} onChange={(e:any)=>setPreis3(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 4 (€)</span><Input type="number" step="0.01" value={preis4} onChange={(e:any)=>setPreis4(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 5 (€)</span><Input type="number" step="0.01" value={preis5} onChange={(e:any)=>setPreis5(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 6 (€)</span><Input type="number" step="0.01" value={preis6} onChange={(e:any)=>setPreis6(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 7 (€)</span><Input type="number" step="0.01" value={preis7} onChange={(e:any)=>setPreis7(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 8 (€)</span><Input type="number" step="0.01" value={preis8} onChange={(e:any)=>setPreis8(e.target.value)} /></label>
            <label style={{ display:"grid", gap:6 }}><span style={{fontWeight:600}}>Preis 9 (€)</span><Input type="number" step="0.01" value={preis9} onChange={(e:any)=>setPreis9(e.target.value)} /></label>
          </div>

          <label style={{ display:"flex", alignItems:"center", gap:10 }}>
            <input type="checkbox" checked={kachel} onChange={(e)=>setKachel(e.currentTarget.checked)} />
            <span style={{ fontWeight:600 }}>Als Kachel in der Kasse anzeigen</span>
          </label>

          <div style={{ display:"flex", gap:12 }}>
            <button type="submit" style={{ background:"#3b82f6", color:"#fff", padding:"10px 16px", borderRadius:6, fontWeight:600, border:"none", cursor:"pointer" }}>
              Speichern
            </button>
            <Link href="/artikel" style={{ background:"#e5e7eb", padding:"10px 16px", borderRadius:6, fontWeight:600, textDecoration:"none", color:"#111827" }}>
              Abbrechen
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
