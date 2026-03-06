import "../globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export const metadata = { title: "SGS" };

const navItem = "block px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.has("sgs_user")) redirect("/");
  const start = 2025;
  const year = new Date().getFullYear();
  const years = year <= start ? `${start}` : `${start}–${year}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl flex">
        <aside className="w-52 shrink-0 p-3 sticky top-0 h-screen overflow-y-auto">
          <nav className="space-y-0.5">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Kasse</p>
            <Link className={navItem} href="/kasse">Kasse</Link>
            <Link className={navItem} href="/bahnbuchung">Buchungsübersicht</Link>

            <div className="my-2 h-px bg-slate-200" />
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Stammdaten</p>
            <Link className={navItem} href="/mitglieder">Kunden</Link>
            <Link className={navItem} href="/artikel">Artikel</Link>

            <div className="my-2 h-px bg-slate-200" />
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Buchhaltung</p>
            <Link className={navItem} href="/kassenbuch">Kassenbuch</Link>
            <Link className={navItem} href="/kassenbestand">Bestand prüfen</Link>

            <div className="my-2 h-px bg-slate-200" />
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Administration</p>
            <Link className={navItem} href="/admin/entnahme">Entnahme buchen</Link>
            <Link className={navItem} href="/mitgliederverwaltung">Mitgliederverwaltung</Link>
            <Link className={navItem} href="/benutzer">Benutzer</Link>
            <Link className={navItem} href="/bahnen">Bahnen</Link>
            <Link className={navItem} href="/zeitregeln">Zeitslots</Link>
            <Link className={navItem} href="/dienste">Dienste</Link>
            <Link className={navItem} href="/dienstbuchung">Dienstübersicht</Link>

            <Link className={navItem} href="/passwort">Kennwort ändern</Link>

            <div className="my-2 h-px bg-slate-200" />
            <LogoutButton />
          </nav>
        </aside>

        <main className="flex-1 p-6 pb-24 min-w-0">{children}</main>
      </div>

      <div
        className="fixed bottom-4 right-6 z-[2147483647] pointer-events-none text-xs text-slate-400 bg-white/85 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        Copyright © {years} Nanuenana
      </div>
    </div>
  );
}
