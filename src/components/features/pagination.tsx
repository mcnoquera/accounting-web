import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import type { PageMeta } from "@/types";

/** Prev/next links that preserve the current filters. */
export function Pagination({ meta, basePath, params }: { meta: PageMeta; basePath: string; params: Record<string, string | undefined> }) {
  if (meta.last_page <= 1) return null;
  const href = (page: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, page: String(page) }).filter(([, v]) => v) as [string, string][]);
    return `${basePath}?${q}`;
  };
  return (
    <div className="flex items-center justify-between border-t px-3 py-3 text-sm text-muted-foreground">
      <span>
        Page {meta.current_page} of {meta.last_page} · {meta.total} total
      </span>
      <div className="flex gap-2">
        {meta.current_page > 1 && <Link className={buttonClass("outline", "sm")} href={href(meta.current_page - 1)}>Previous</Link>}
        {meta.current_page < meta.last_page && <Link className={buttonClass("outline", "sm")} href={href(meta.current_page + 1)}>Next</Link>}
      </div>
    </div>
  );
}
