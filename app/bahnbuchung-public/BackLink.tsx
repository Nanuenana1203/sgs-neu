"use client";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function BackLink({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className={className}>
      {children}
    </button>
  );
}
