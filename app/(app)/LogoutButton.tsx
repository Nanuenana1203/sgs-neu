"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    document.cookie = "sgs_session=; Path=/; Max-Age=0";
    router.push("/");
  }

  return (
    <button
      onClick={logout}
      className="block w-full text-left px-3 py-1.5 rounded-md text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
    >
      Abmelden
    </button>
  );
}
