import "../globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "SGS" };

export default function AppLayout({ children }: { children: ReactNode }) {
  const start = 2025;
  const year = new Date().getFullYear();
  const years = year <= start ? `${start}` : `${start}–${year}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative">
      <div className="mx-auto max-w-7xl flex">
        <aside className="w-56 shrink-0 p-4">
          <nav className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Navigation
            </h2>

            <ul className="mt-2 space-y-1">
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/kasse">
                  Kasse
                </Link>
              </li>
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/bahnbuchung">
                  Buchungsübersicht
                </Link>
              </li>
            </ul>

            <div className="my-3 h-px bg-slate-300" />

            <ul className="space-y-1">
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/mitglieder">
                  Mitglieder
                </Link>
              </li>
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/artikel">
                  Artikel
                </Link>
              </li>
            </ul>

            <div className="my-3 h-px bg-slate-300" />

            <ul className="space-y-1">
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/kassenbuch">
                  Kassenbuch
                </Link>
              </li>
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/kassenbestand">
                  Bestand prüfen
                </Link>
              </li>
            </ul>

            <div className="my-3 h-px bg-slate-300" />

            <ul className="space-y-1">
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/admin/entnahme">
                  Entnahme buchen
                </Link>
              </li>
            </ul>

            <div className="my-3 h-px bg-slate-300" />

            <ul className="space-y-1">
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/benutzer">
                  Benutzer
                </Link>
              </li>
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/bahnen">
                  Bahnen
                </Link>
              </li>
              <li>
                <Link className="block px-3 py-2 rounded-md hover:bg-slate-200" href="/zeitregeln">
                  Zeitslots
                </Link>
              </li>
            </ul>

            <div className="my-3 h-px bg-slate-300" />

            <ul>
              <li>
                <Link
                  href="/auth"
                  className="block px-3 py-2 rounded-md text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold"
                >
                  Abmelden
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-6 pb-24 pb-32 pb-32 pb-24">{children}</main>
      </div>

      <div
        className="fixed bottom-4 right-6 z-[2147483647] pointer-events-none text-xs text-slate-500 bg-white/85 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        Copyright © {years} Nanuenana
      </div>
    </div>
  );
}
