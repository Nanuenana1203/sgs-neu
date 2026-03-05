"use client";
export const dynamic = "force-dynamic";

import BackLink from "./BackLink";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Toaster, toast } from "sonner";

type Slot = { start: string; end: string; booked: any; by?: string };
type Bahn = { bahn_id: number; bahn: string; slots: Slot[] };
type SlotsResponse = { date: string; result: Bahn[] };

function ymFrom(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addMonths(d: Date, m: number) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth() + m, 1));
  return new Date(x.getUTCFullYear(), x.getUTCMonth(), 1);
}

/**
 * Priorität:
 * 1) führende 3-stellige Nummer "101-..." / "201-..."
 * 2) "Bahn 7 ..." + Keyword -> 100+7 oder 200+7
 * 3) fallback bahn_id
 */
function extractNum(b: Bahn): number {
  const t = (b.bahn ?? "").trim();
  let m = t.match(/^(\d{3})\b/);
  if (m) return Number(m[1]);

  m = t.match(/\bbahn\s*(\d+)\b/i);
  if (m) {
    const n = Number(m[1]);
    const low = t.toLowerCase();
    if (low.includes("kurzwaffe") || low.includes("kw")) return 200 + n;
    return 100 + n;
  }

  return Number(b.bahn_id) || 9999;
}

function groupOf(n: number): "lw" | "kw" | "other" {
  if (n >= 100 && n < 200) return "lw";
  if (n >= 200 && n < 300) return "kw";
  return "other";
}

export default function BahnbuchungPage() {
  const now = useMemo(() => new Date(), []);
  const todayStr = toDateStr(now);

  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [bahnen, setBahnen] = useState<Bahn[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const month = ymFrom(monthDate);
    setAvailableDays([]);
    fetch(`/api/available-days?month=${month}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAvailableDays(Array.isArray(j.days) ? j.days : []))
      .catch(() => setAvailableDays([]));
  }, [monthDate]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    fetch(`/api/slots?date=${selectedDate}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: SlotsResponse) => setBahnen(j?.result ?? []))
      .catch(() => setBahnen([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  async function buchen(bahn_id: number, start: string) {
    if (!name.trim() || !email.trim()) {
      toast.warning("Bitte zuerst Name und E-Mail eingeben.");
      return;
    }
    if (!selectedDate) {
      toast.warning("Bitte zuerst ein Datum wählen.");
      return;
    }
    toast.info("Buchung wird durchgeführt...");
    const r = await fetch("/api/buchen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bahn_id, name, email, datum: selectedDate, startzeit: start }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.ok !== true) {
      toast.error(typeof j?.error === "string" ? j.error : "Buchung fehlgeschlagen");
      return;
    }
    toast.success("Buchung erfolgreich!");
    const rr = await fetch(`/api/slots?date=${selectedDate}`, { cache: "no-store" });
    const jj = await rr.json().catch(() => ({ result: [] }));
    setBahnen(jj?.result ?? []);
  }

  const sorted = useMemo(() => {
    const list = [...bahnen].map((b) => ({ b, n: extractNum(b), g: groupOf(extractNum(b)) }));
    const order = { lw: 1, kw: 2, other: 9 } as const;

    list.sort((x, y) => {
      const gx = order[x.g];
      const gy = order[y.g];
      if (gx !== gy) return gx - gy;
      if (x.n !== y.n) return x.n - y.n;
      return (x.b.bahn ?? "").localeCompare(y.b.bahn ?? "", "de", { sensitivity: "base" });
    });

    return list;
  }, [bahnen]);

  const lw = useMemo(() => sorted.filter((x) => x.g === "lw"), [sorted]);
  const kw = useMemo(() => sorted.filter((x) => x.g === "kw"), [sorted]);
  const other = useMemo(() => sorted.filter((x) => x.g === "other"), [sorted]);

  const calendar = useMemo(() => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const first = new Date(y, m, 1);
    const startWeekday = (first.getDay() + 6) % 7; // Mo=0
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const cells: {
      label: string;
      date?: string;
      available?: boolean;
      isSelected?: boolean;
      isPast?: boolean;
      isToday?: boolean;
    }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ label: "" });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
      const available = availableDays.includes(ds);
      cells.push({
        label: String(d),
        date: ds,
        available,
        isSelected: selectedDate === ds,
        isPast: ds < todayStr,
        isToday: ds === todayStr,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ label: "" });
    return cells;
  }, [monthDate, availableDays, selectedDate, todayStr]);

  function renderGroup(title: string, items: { b: Bahn; n: number }[]) {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="col-span-full mb-2">
          <div className="text-xs font-semibold text-slate-700 px-3 py-2 rounded border bg-white">
            {title}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-3">
          {items.map(({ b }) => (
            <div key={b.bahn_id} className="rounded-2xl border shadow p-3 bg-gray-50">
              <div className="font-bold text-xs mb-1">{b.bahn}</div>
              <div className="flex flex-col gap-2">
                {b.slots.map((s, sidx) => {
                  const booked = !!s.booked;
                  const title = booked ? `Gebucht${s.by ? " von " + s.by : ""}` : `Buchen ${s.start}–${s.end}`;
                  const classes = booked
                    ? "bg-red-100 text-red-900 cursor-not-allowed border-red-200"
                    : "bg-white hover:bg-gray-100";
                  return (
                    <button
                      key={sidx}
                      disabled={booked}
                      onClick={() => buchen(b.bahn_id, s.start)}
                      className={`px-2 py-1 rounded border text-xs text-left ${classes}`}
                      title={title}
                    >
                      {s.start}–{s.end}
                      {booked ? (s.by ? ` · ${s.by}` : "") : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 pb-4 relative">
      <Toaster richColors position="top-center" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold">Bahn Buchung</h1>
        <div className="flex gap-2">
          <Link
            href="/bahnbuchung-storno"
            className="px-3 py-2 rounded border text-sm bg-red-600 hover:bg-red-700"
          >
            Buchung stornieren
          </Link>
          <Suspense fallback={null}>
            <Suspense fallback={null}>
              <BackLink className="px-3 py-2 rounded border text-sm">Zurück</BackLink>
            </Suspense>
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Dein Name</label>
          <input className="w-full px-3 py-2 rounded border" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">E-Mail</label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded border"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">1) Name & E-Mail eingeben · 2) Datum wählen · 3) Slot klicken</div>
      </div>

      <div className="flex gap-6">
        <div className="rounded-2xl border shadow p-3 w-[345px]">
          <div className="flex items-center gap-3 mb-2">
            <button
              aria-label="Vorheriger Monat"
              onClick={() => setMonthDate(addMonths(monthDate, -1))}
              className="w-7 h-7 rounded border text-xs inline-flex items-center justify-center"
            >
              ◀
            </button>
            <div className="flex-1 text-right text-sm font-medium">
              {monthDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </div>
            <button
              aria-label="Nächster Monat"
              onClick={() => setMonthDate(addMonths(monthDate, +1))}
              className="w-7 h-7 rounded border text-xs inline-flex items-center justify-center"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-right text-xs font-medium mb-1">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
              <div key={w} className="py-0.5">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendar.map((c, i) => {
              if (!c.date) return <div key={i} className="h-8" />;
              const disabled = !c.available || c.isPast;
              const base = "h-8 flex items-center justify-center rounded border text-[11px]";
              let cls = "bg-white";
              if (disabled) cls = "bg-gray-100 text-gray-400 cursor-not-allowed";
              else if (c.isSelected) cls = "bg-blue-600 text-white border-blue-600";
              else if (c.isToday) cls = "bg-red-600 text-white border-red-600";
              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => setSelectedDate(c.date!)}
                  className={`${base} ${cls}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-gray-500 mt-3">
            Nur Tage mit Angebot sind anklickbar (fett hervorgehoben). Vergangene Tage sind deaktiviert.
          </div>

          {selectedDate && (
            <div className="mt-2 text-xs">
              Ausgewähltes Datum: <b>{selectedDate}</b>
            </div>
          )}
        </div>

        <div className="flex-1">
          {loadingSlots && <div>Lade Slots…</div>}

          {!loadingSlots && selectedDate && bahnen.length === 0 && (
            <div className="text-sm text-gray-600 mt-1">Für dieses Datum sind aktuell keine freien Bahnen verfügbar.</div>
          )}

          {!loadingSlots && selectedDate && bahnen.length > 0 && (
            <div>
              {renderGroup("Langwaffe (101–112)", lw)}
              {renderGroup("Kurzwaffe (201–210)", kw)}
              {other.length > 0 ? renderGroup("Weitere", other) : null}
            </div>
          )}

          {!selectedDate && <div className="text-sm text-gray-600 mt-1">Bitte zuerst ein Datum wählen.</div>}
        </div>
      </div>

      <div className="mt-8 w-full text-right text-xs font-bold text-slate-500 pr-2">Copyright © 2025–{new Date().getFullYear()} Nanuenana</div>

      
    </div>
  );
}
