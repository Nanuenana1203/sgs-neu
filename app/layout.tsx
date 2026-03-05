import "./globals.css";
import type { ReactNode } from "react";


export const metadata = { title: "SGS" };

export default function RootLayout({ children }: { children: ReactNode }) {
  const start = 2025;
  const year = new Date().getFullYear();
  const years = year <= start ? `${start}` : `${start}–${year}`;

  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
        <div className="fixed bottom-4 right-6 z-[9999] text-xs text-slate-500 bg-white/85 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow pointer-events-none">
        </div>
        
  
</body>
    </html>
  );
}
