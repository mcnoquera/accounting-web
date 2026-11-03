"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const path = usePathname();
  const search = useSearchParams();
  const [hrefPath, hrefQuery] = href.split("?");
  // Links that differ only by query (e.g. receivables vs payables aging) match on those params too.
  const queryMatches = !hrefQuery || Array.from(new URLSearchParams(hrefQuery)).every(([k, v]) => (search.get(k) ?? (k === "type" ? "receivable" : null)) === v);
  const active = (hrefPath === "/" ? path === "/" : path.startsWith(hrefPath)) && queryMatches;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors",
        active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
