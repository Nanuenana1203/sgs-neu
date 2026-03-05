export default function CopyrightBadge() {
  const start = 2025;
  const y = new Date().getFullYear();
  const years = y <= start ? `${start}` : `${start}–${y}`;

  return (
    <div
      className="fixed bottom-4 right-4 z-[2147483647] pointer-events-none"
      style={{ position: "fixed", bottom: 16, right: 16 }}
    >
      <div className="text-xs text-slate-500 bg-white/85 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow">
        Copyright © {years} Nanuenana
      </div>
    </div>
  );
}
