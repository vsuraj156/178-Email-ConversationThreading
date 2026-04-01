"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type ViewMode = "threads" | "conversations";

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as ViewMode) || "conversations";

  function setView(mode: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    const base = pathname === "/" ? "/" : "/";
    router.push(`${base}?${params.toString()}`);
  }

  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
      <button
        onClick={() => setView("threads")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md ${
          view === "threads" ? "bg-white shadow text-gray-900" : "text-gray-600"
        }`}
      >
        All Threads
      </button>
      <button
        onClick={() => setView("conversations")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md ${
          view === "conversations"
            ? "bg-white shadow text-gray-900"
            : "text-gray-600"
        }`}
      >
        Multi-thread
      </button>
    </div>
  );
}
