import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({ tone = "danger", children, className }: { tone?: "danger" | "success" | "info"; children: ReactNode; className?: string }) {
  const styles = {
    danger: "border-destructive/40 bg-destructive/5 text-destructive",
    success: "border-success/40 bg-success/5 text-success",
    info: "border-primary/30 bg-primary/5 text-primary",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-md border px-3 py-2 text-sm", styles, className)}>
      {children}
    </div>
  );
}
