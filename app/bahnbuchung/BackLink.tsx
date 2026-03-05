"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export default function BackLink({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const sp = useSearchParams();
  const fromAuth = sp.get("from") === "auth";

  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const hasSession =
      document.cookie
        .split(";")
        .some(c => c.trim().startsWith("sgs_session="));

    setHref(!hasSession || fromAuth ? "/" : "/dashboard");
  }, [fromAuth]);

  if (!href) return null; // verhindert SSR/Client-Mismatch

  return (
    <Link href={href} className={className}>
      {children ?? "Zurück"}
    </Link>
  );
}
