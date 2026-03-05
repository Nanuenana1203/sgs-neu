import Link from "next/link";
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
  kachel?: boolean | number | null;   // Checkbox „Kachel für Kasse“
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
const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

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

  // Artikel-Suche (links, so breit wie Kacheln)
  const [queryArtikel, setQueryArtikel] = useState('');

  // Warenkorb
  const [korb, setKorb] = useState<Pos[]>([]);
  const summe = useMemo(() => korb.reduce((s, p) => s + p.einzelpreis * p.menge, 0), [korb]);

  // Laden
  useEffect(() => {
    (async () => {
      try {
        const [mRes, aRes] = await Promise.all([
          fetch('/api/mitglieder', { cache: 'no-store' }),
          fetch('/api/artikel',     { cache: 'no-store' }),
        ]);
        const m = mRes.ok ? await mRes.json() : [];
        const a = aRes.ok ? await aRes.json() : [];
        setMitglieder(Array.isArray(m) ? m : []);
        setArtikel(Array.isArray(a) ? a : []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Filter Mitglied (mind. 3 Zeichen)
  const filteredMitglieder = useMemo(() => {
    const n = norm(queryMitglied);
    if (n.length < 3) return [];
    return mitglieder
      .filter(m =>
        norm(m.name).includes(n) ||
        norm(m.ort).includes(n) ||
        norm(m.ausweisnr).includes(n) ||
        norm(m.mitgliedsnr).includes(n)
      )
      .sort((a, b) => norm(a.name).localeCompare(norm(b.name)));
  }, [mitglieder, queryMitglied]);

  // Filter Artikel (mind. 3 Zeichen)
  const filteredArtikel = useMemo(() => {
    const n = norm(queryArtikel);
    if (n.length < 3) return [];
    return artikel.filter(a =>
      norm(a.bezeichnung).includes(n) || norm(a.artnr).includes(n)
    );
  }, [artikel, queryArtikel]);

  // Nur Kachel-Artikel für Schnellzugriff (unter der Suche)
  const kachelArtikel = useMemo(
    () => artikel.filter(a => isTrue(a.kachel)),
    [artikel]
  );

  // Preis anhand Preisgruppe
  function preis(a: Artikel, gruppe?: number | null) {
  const g = Math.max(1, Math.min(5, Number(gruppe ?? 1)));
  const key = ("preis" + g) as keyof Artikel;
  const val = a[key];
  if (val === null || val === undefined) return 0;
  if (typeof val === "number" && !isNaN(val)) return val;
  return 0;
}

  // In den Warenkorb
  function addArtikel(a: Artikel) {
    if (!auswahl) return;
    const ep = preis(a, auswahl.preisgruppe);
    setKorb(prev => {
      const found = prev.find(x => x.artikelId === a.id && x.einzelpreis === ep);
      if (found) return prev.map(x => (x === found ? { ...x, menge: x.menge + 1 } : x));
      return [...prev, { key: `${a.id}@${ep}`, artikelId: a.id, bezeichnung: a.bezeichnung, einzelpreis: ep, menge: 1 }];
    });
  }

  function menge(key: string, delta: number) {
    setKorb(prev =>
      prev.flatMap(x => {
        if (x.key !== key) return [x];
        const m = x.menge + delta;
        return m <= 0 ? [] : [{ ...x, menge: m }];
      })
    );
  }

  async function buchen() {
    if (!auswahl || korb.length === 0) return;
    alert(`Buchung für ${auswahl.name} über ${fmt(summe)} (Demo).`);
    setKorb([]);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Kopf */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Kasse</h1>
        <Link href="/dashboard" className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Zurück</Link>
      </div>

      {/* Mitglied wählen (oben, volle Breite; bleibt wie zuletzt) */}
      {!auswahl ? (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Kunde auswählen</div>
          <input
            className="border rounded-lg px-3 py-2 w-96 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Mitglied suchen (mind. 3 Zeichen)…"
            value={queryMitglied}
            onChange={(e) => setQueryMitglied(e.target.value)}
          />
          {queryMitglied.length >= 3 && (
            <div className="mt-3 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Nr.</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Ort</th>
                    <th className="px-4 py-2">Ausweisnr.</th>
                    <th className="px-4 py-2">Gruppe</th>
                    <th className="px-4 py-2 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMitglieder.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-3 text-center text-gray-500">Keine Mitglieder gefunden.</td></tr>
                  )}
                  {filteredMitglieder.map(m => (
                    <tr key={m.id} className="border-t hover:bg-blue-50">
                      <td className="px-4 py-2">{m.mitgliedsnr}</td>
                      <td className="px-4 py-2">{m.name}</td>
                      <td className="px-4 py-2">{m.ort}</td>
                      <td className="px-4 py-2">{m.ausweisnr}</td>
                      <td className="px-4 py-2">{m.preisgruppe}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => setAuswahl(m)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Übernehmen
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
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="text-base">
              <strong>{auswahl.name}</strong>
              {auswahl.ort ? <> ({auswahl.ort})</> : null}
              {' '}– Preisgruppe: {auswahl.preisgruppe ?? '–'}
            </div>
            <button onClick={() => setAuswahl(null)} className="ml-auto px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
              Mitglied wechseln
            </button>
          </div>
        </div>
      )}

      {/* Unterer Bereich */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Linke Spalte: Artikelsuche (oben) + Kacheln (darunter) */}
        <div className="md:col-span-2 space-y-4">
          {/* Artikelsuche – gleiche Breite wie die Kacheln */}
          <div className={`rounded-xl border bg-white p-4 ${!auswahl ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <div className="text-sm font-semibold text-gray-700 mb-2">Artikel wählen</div>
            <input
              className="border rounded-lg px-3 py-2 w-full md:w-2/3 lg:w-1/2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Artikel suchen (mind. 3 Zeichen)…"
              value={queryArtikel}
              onChange={(e) => setQueryArtikel(e.target.value)}
            />
            {queryArtikel.length >= 3 && (
              <div className="mt-3 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Art.-Nr.</th>
                      <th className="px-4 py-2">Bezeichnung</th>
                      <th className="px-4 py-2 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtikel.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-500">Keine Artikel gefunden.</td></tr>
                    )}
                    {filteredArtikel.map(a => (
                      <tr key={a.id} className="border-t hover:bg-blue-50">
                        <td className="px-4 py-2">{a.artnr ?? ''}</td>
                        <td className="px-4 py-2">{a.bezeichnung}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => addArtikel(a)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 border border-gray-300 shadow-sm hover:shadow-md">
                            Übernehmen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Schnellzugriff-Kacheln */}
          <div className={`rounded-xl border bg-white p-4 ${!auswahl ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {kachelArtikel.map(a => (
                <button
                  key={a.id}
                  onClick={() => addArtikel(a)}
                  className="rounded-lg border-2 border-gray-300 px-3 py-3 text-left shadow-sm hover:border-indigo-400 hover:shadow-md transition"
                  title="Zum Warenkorb hinzufügen"
                >
                  {/* Nur Text – ohne Preis */}
                  <div className="leading-snug">{a.bezeichnung}</div>
                </button>
              ))}
              {kachelArtikel.length === 0 && (
                <div className="col-span-full text-sm text-gray-500">Keine Artikel-Kacheln konfiguriert.</div>
              )}
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Warenkorb (schmaler) */}
        <div className="md:col-span-1 rounded-xl border bg-white p-4">
          <h2 className="font-semibold mb-2">Warenkorb</h2>
          {!auswahl ? (
            <p className="text-sm text-gray-500">Noch kein Mitglied gewählt.</p>
          ) : korb.length === 0 ? (
            <p className="text-sm text-gray-500">Noch keine Positionen.</p>
          ) : (
            <div className="space-y-2">
              {korb.map(p => (
                <div key={p.key} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.bezeichnung}</div>
                    <div className="text-xs text-gray-600">{fmt(p.einzelpreis)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="border rounded px-2 py-1" onClick={() => menge(p.key, -1)}>-</button>
                    <span className="min-w-6 text-center">{p.menge}</span>
                    <button className="border rounded px-2 py-1" onClick={() => menge(p.key, 1)}>+</button>
                    <button className="border rounded px-2 py-1" onClick={() => menge(p.key, -999)} title="Entfernen">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex justify-between font-semibold border-top pt-3">
            <span>Summe</span>
            <span>{fmt(summe)}</span>
          </div>
          <button
            onClick={buchen}
            disabled={!auswahl || korb.length === 0}
            className="mt-3 w-full rounded-lg bg-indigo-600 text-white py-2 disabled:opacity-50"
          >
            Buchen
          </button>
        </div>
      </div>
    </div>
  );
}
