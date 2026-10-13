import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { ReportSection as Section } from "@/types";
import { MoneyCell, TD, TR } from "@/components/ui/table";

/** Rows for one statement section (e.g. Assets) followed by its subtotal. */
export function ReportSection({ title, section }: { title: string; section: Section }) {
  return (
    <>
      <TR className="bg-muted/40 hover:bg-muted/40">
        <TD colSpan={2} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</TD>
      </TR>
      {section.rows.map((r) => (
        <TR key={`${r.account_id}-${r.name}`}>
          <TD className="pl-6">
            {r.account_id ? (
              <Link href={`/accounts/${r.account_id}`} className="hover:underline"><span className="font-mono text-muted-foreground">{r.code}</span> {r.name}</Link>
            ) : (
              <span className="italic">{r.name}</span>
            )}
          </TD>
          <MoneyCell>{formatCents(r.balance)}</MoneyCell>
        </TR>
      ))}
      <TR className="font-semibold">
        <TD>Total {title.toLowerCase()}</TD>
        <MoneyCell className="border-t">{formatCents(section.total)}</MoneyCell>
      </TR>
    </>
  );
}
