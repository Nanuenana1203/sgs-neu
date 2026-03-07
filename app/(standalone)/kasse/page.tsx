'use client';
import React, { useEffect, useMemo, useState } from 'react';

type Mitglied = {
  id: number;
  mitgliedsnr: string | null;
  name: string | null;
  ort: string | null;
  ausweisnr: string | null;
  preisgruppe: number | null;
};

type Artikel = {
  id: number;
  artnr?: string | null;
  bezeichnung: string;
  kachel?: boolean | number | null;
  preis1?: number | null;
  preis2?: number | null;
  preis3?: number | null;
  preis4?: number | null;
  preis5?: number | null;
};

type Pos = {
  key: string;
  artikelId: number;
  bezeichnung: string;
  einzelpreis: number;
  menge: number;
};

const norm = (v: unknown) => (v ?? '').toString().trim().toLowerCase();
const fmt = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

const isTrue = (v: unknown) => {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 't' || s === 'yes';
  }
  return false;
};

export default function KassePage() {
  // Daten
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [artikel, setArtikel] = useState<Artikel[]>([]);

  // Auswahl
  const [queryMitglied, setQueryMitglied] = useState('');
  const [auswahl, setAuswahl] = useState<Mitglied | null>(null);

  // Artikelsuche (unter den Kacheln)
  const [queryArtikel, setQueryArtikel] = useState('');

  // Warenkorb
  const [korb, setKorb] = useState<Pos[]>([]);
  const [isStorno, setIsStorno] = useState(false);
  const summe = useMemo(
    () => korb.reduce((s, p) => s + p.einzelpreis * p.menge, 0),
    [korb]
  );

  // Laden
  useEffect(() => {
    (async () => {
      try {
        const [mRes, aRes] = await Promise.all([
          fetch('/api/mitglieder', { cache: 'no-store' }),
          fetch('/api/artikel', { cache: 'no-store' }),
        ]);
        const m = mRes.ok ? await mRes.json() : [];
        const a = aRes.ok ? await aRes.json() : [];
        setMitglieder(Array.isArray(m) ? m : []);
        setArtikel(Array.isArray(a) ? a : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Filter Mitglied
  const filteredMitglieder = useMemo(() => {
    const n = norm(queryMitglied);
    if (n.length < 3) return [];
    return mitglieder
      .filter(
        (m) =>
          norm(m.name).includes(n) ||
          norm(m.ort).includes(n) ||
          norm(m.ausweisnr).includes(n) ||
          norm(m.mitgliedsnr).includes(n)
      )
      .sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
  }, [mitglieder, queryMitglied]);

  // Filter Artikel (für die Tabelle unten)
  const filteredArtikel = useMemo(() => {
    const n = norm(queryArtikel);
    if (n.length < 3) return [];
    return artikel.filter(
      (a) => norm(a.bezeichnung).includes(n) || norm(a.artnr).includes(n)
    );
  }, [artikel, queryArtikel]);

  // Nur Kachel-Artikel
  const kachelArtikel = useMemo(
    () => artikel.filter((a) => isTrue(a.kachel)),
    [artikel]
  );

  // Preis anhand Preisgruppe (0 bleibt 0; null/undef => 0)
  function preis(a: Artikel, gruppe?: number | null) {
    const g = Math.max(1, Math.min(9, Number(gruppe ?? 1)));
    const key = ('preis' + g) as keyof Artikel;
    const val = a[key] as number | null | undefined;
    return typeof val === 'number' && !isNaN(val) ? val : 0;
  }

  // In den Warenkorb
  function addArtikel(a: Artikel) {
    if (!auswahl) return;
    const ep = preis(a, auswahl.preisgruppe);
    setKorb((prev) => {
      const found = prev.find((x) => x.artikelId === a.id && x.einzelpreis === ep);
      if (found) return prev.map((x) => (x === found ? { ...x, menge: x.menge + 1 } : x));
      return [
        ...prev,
        {
          key: `${a.id}@${ep}`,
          artikelId: a.id,
          bezeichnung: a.bezeichnung,
          einzelpreis: ep,
          menge: 1,
        },
      ];
    });
  }

  function menge(key: string, delta: number) {
    setKorb((prev) =>
      prev.flatMap((x) => {
        if (x.key !== key) return [x];
        const m = x.menge + delta;
        return m <= 0 ? [] : [{ ...x, menge: m }];
      })
    );
  }

  // BUCHEN: schreibt den Warenkorb über die API in die DB inkl. Mitglied & Benutzer
  async function handleBuchen() {
    if (!auswahl || korb.length === 0) {
      alert('Warenkorb ist leer oder kein Mitglied gewählt.');
      return;
    }

    // Benutzer aus der Session nachladen (falls vorhanden)
    let benutzer_id: number | null = null;
    let benutzer_name: string | null = null;
    try {
      const sres = await fetch('/api/session', { cache: 'no-store' });
      if (sres.ok) {
        const sess = await sres.json();
        benutzer_id = (sess?.user?.id ?? sess?.id ?? null) as number | null;
        benutzer_name = (sess?.user?.name ?? sess?.name ?? null) as string | null;
      }
    } catch {
      // falls Session nicht erreichbar ist: nulls schreiben
    }

    const payload = {
      mitglied_id: auswahl.id,
      mitglied_nummer: auswahl.mitgliedsnr ?? null,
      mitglied_name: auswahl.name ?? null,
      benutzer_id,
      benutzer_name,
      items: korb.map((p) => ({
        id: p.artikelId,
        bezeichnung: p.bezeichnung,
        qty: p.menge,
        preis: (isStorno ? -Math.abs(p.einzelpreis) : p.einzelpreis),
      })),
    };

    try {
      const res = await fetch('/api/kasse/buchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as any)?.ok) {
        alert(`Buchung gespeichert (${(data as any).count} Positionen).`);
        setKorb([]); setAuswahl(null); setQueryMitglied(""); setQueryArtikel(""); setIsStorno(false); } else {
        alert('Fehler: ' + ((data as any)?.error ?? res.statusText));
      }
    } catch (e: any) {
      alert('Fehler: ' + (e?.message ?? String(e)));
    }
  }

  // Kacheln gruppiert: Umbruch wenn erstes Zeichen der Artikelnummer (Fallback Bezeichnung) wechselt
  const kachelRows = useMemo(() => {
    const arr = [...kachelArtikel].sort((a, b) => {
      const ak = String(a.artnr ?? a.bezeichnung ?? '');
      const bk = String(b.artnr ?? b.bezeichnung ?? '');
      return ak.localeCompare(bk, 'de');
    });
    const rows: JSX.Element[] = [];
    let prev: string | undefined;
    for (const a of arr) {
      const keyStr = String(a.artnr ?? a.bezeichnung ?? '').trim();
      const ch = (keyStr[0] ?? '').toUpperCase();
      if (prev !== undefined && ch !== prev) {
        rows.push(<div key={`br-${prev}`} className="col-span-full h-0" />);
      }
      prev = ch;

      rows.push(
        <button
          key={a.id}
          onClick={() => addArtikel(a)}
          className="rounded-xl border border-slate-200 px-2 py-1 text-left shadow-sm hover:border-blue-400 hover:shadow-md transition bg-slate-50 hover:bg-white w-full h-14 flex items-center justify-center"
          title="Zum Warenkorb hinzufügen"
        >
          <div className="text-sm leading-tight break-words line-clamp-2">
            {a.bezeichnung}
          </div>
        </button>
      );
    }
    return rows;
  }, [kachelArtikel, auswahl]);

  return (
    <div className={"min-h-screen " + (isStorno ? "bg-red-50" : "bg-slate-50")}>
    <div className={"p-6 space-y-5 max-w-7xl mx-auto"}>
      {/* Kopf */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kasse</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsStorno((v) => !v)}
            className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " + (isStorno ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-100 text-red-700 hover:bg-red-200")}
          >
            Storno
          </button>
          <a href="/dashboard" className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
            Zurück
          </a>
        </div>
      </div>

      {/* Mitglied wählen */}
      {!auswahl ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <p className="text-sm font-medium text-slate-700 mb-2">Kunde auswählen</p>
          <input
            className="w-full max-w-sm px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Kunde suchen (mind. 3 Zeichen)…"
            value={queryMitglied}
            onChange={(e) => setQueryMitglied(e.target.value)}
          />
          {queryMitglied.length >= 3 && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nr.</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ort</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ausweisnr.</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Gruppe</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMitglieder.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-center text-slate-400 text-sm">
                        Keine Mitglieder gefunden.
                      </td>
                    </tr>
                  )}
                  {filteredMitglieder.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-700">{m.mitgliedsnr}</td>
                      <td className="px-4 py-2 text-slate-700">{m.name}</td>
                      <td className="px-4 py-2 text-slate-700">{m.ort}</td>
                      <td className="px-4 py-2 text-slate-700">{m.ausweisnr}</td>
                      <td className="px-4 py-2 text-slate-700">{m.preisgruppe}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => { setKorb([]); setAuswahl(m); }}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Ubernehmen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-700">
              <strong>{auswahl.name}</strong>
              {auswahl.ort ? <> ({auswahl.ort})</> : null}{' – Preisgruppe: '}
              {auswahl.preisgruppe ?? '–'}
            </div>
            <button
              onClick={() => { setKorb([]); setAuswahl(null); }}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Mitglied wechseln
            </button>
          </div>
        </div>
      )}

      {/* Unterer Bereich */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Linke Spalte: Kacheln + Artikelsuche */}
        <div className="md:col-span-2 space-y-4">
          <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-4 ${!auswahl ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {kachelRows}
              {kachelArtikel.length === 0 && (
                <div className="col-span-full text-sm text-slate-400">Keine Artikel-Kacheln konfiguriert.</div>
              )}
            </div>
          </div>

          <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-4 ${!auswahl ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <p className="text-sm font-medium text-slate-700 mb-2">Artikel wählen</p>
            <input
              className="w-full max-w-sm px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Artikel suchen (mind. 3 Zeichen)…"
              value={queryArtikel}
              onChange={(e) => setQueryArtikel(e.target.value)}
            />
            {queryArtikel.length >= 3 && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Art.-Nr.</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Bezeichnung</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtikel.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-3 text-center text-slate-400 text-sm">Keine Artikel gefunden.</td></tr>
                    )}
                    {filteredArtikel.map((a) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-700">{a.artnr ?? ''}</td>
                        <td className="px-4 py-2 text-slate-700">{a.bezeichnung}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => addArtikel(a)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                            Ubernehmen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Warenkorb */}
        <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Warenkorb</h2>
          {!auswahl ? (
            <p className="text-sm text-slate-400">Noch kein Mitglied gewählt.</p>
          ) : korb.length === 0 ? (
            <p className="text-sm text-slate-400">Noch keine Positionen.</p>
          ) : (
            <div className="space-y-2">
              {korb.map((p) => (
                <div key={p.key} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate">{p.bezeichnung}</div>
                    <div className="text-xs text-slate-500">{fmt(isStorno ? -Math.abs(p.einzelpreis) : p.einzelpreis)}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm" onClick={() => menge(p.key, -1)}>-</button>
                    <span className="w-6 text-center text-sm">{p.menge}</span>
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm" onClick={() => menge(p.key, 1)}>+</button>
                    <button className="w-7 h-7 rounded border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 text-sm" onClick={() => menge(p.key, -999)} title="Entfernen">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between font-semibold border-t border-slate-100 pt-3 text-slate-900">
            <span>Summe</span>
            <span>{fmt(isStorno ? -Math.abs(summe) : summe)}</span>
          </div>

          <button
            onClick={handleBuchen}
            disabled={!auswahl || korb.length === 0}
            className="mt-4 w-full bg-green-600 text-white px-4 py-3 rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Buchen
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}