import { Download } from "lucide-react";
import { exportHref, type ExportFormat } from "@/lib/exports";
import { buttonClass } from "@/components/ui/button";

/** Plain download links (no JS needed); the /export route adds the API token server-side. */
export function ExportButtons({ apiPath, params = {}, formats = ["csv", "pdf"] }: {
  apiPath: string;
  params?: Record<string, string | number | undefined | null>;
  formats?: ExportFormat[];
}) {
  return (
    <div className="flex gap-2">
      {formats.map((f) => (
        <a key={f} href={exportHref(apiPath, f, params)} className={buttonClass("outline", "sm")} download>
          <Download size={14} /> {f.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
