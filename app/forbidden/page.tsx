import Link from "next/link";

export default function Forbidden({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-xl shadow p-8 text-center space-y-4 max-w-md">
        <h1 className="text-xl font-semibold">Kein Zugriff</h1>
        <p>
          Dieser Bereich ist nur für <b>Administratoren</b> freigegeben.
        </p>
        {searchParams?.from && (
          <p className="text-sm text-slate-500">
            Bereich: <code>{searchParams.from}</code>
          </p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/dashboard" className="inline-block px-4 py-2 rounded bg-slate-800 text-white">
            Zum Dashboard
          </Link>
          <Link href="/" className="inline-block px-4 py-2 rounded bg-slate-200 text-slate-800">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
