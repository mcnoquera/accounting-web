import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** A GET form: filters live in the URL so views are shareable and server-rendered. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <form className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3" method="get">
      {children}
      <Button type="submit" variant="secondary">Apply</Button>
    </form>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
