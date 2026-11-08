import type { Metadata } from "next";
import Link from "next/link";
import { getBook } from "@/lib/api/endpoints";
import { BOOKS, bookPeriod, bookPresets, isBook, periodTooLong, type BookKey } from "@/lib/books";
import { formatCents } from "@/lib/money";
import { today } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { ExportButtons } from "@/components/features/export-buttons";
import { FilterBar, FilterField } from "@/components/features/filter-bar";

export const metadata: Metadata = { title: "Books of accounts" };

export default async function BooksPage({ searchParams }: { searchParams: { book?: string; from?: string; to?: string } }) {
  const book: BookKey = isBook(searchParams.book) ? searchParams.book : "general-journal";
  const { from, to } = bookPeriod(searchParams.from, searchParams.to, today());
  const tooLong = periodTooLong(from, to);
  const data = tooLong ? null : await getBook(book, { from, to });

  return (
    <>
      <PageHeader
        title="Books of accounts"
        description="BIR books in simple journal style, from posted entries. Export each book to PDF (with company header and page numbers) or CSV for printing and binding."
        actions={!tooLong && <ExportButtons apiPath={`/books/${book}/export`} params={{ from, to }} />}
      />

      <nav aria-label="Books" className="mb-3 flex flex-wrap gap-1">
        {(Object.keys(BOOKS) as BookKey[]).map((k) => (
          <Link
            key={k}
            href={`?${new URLSearchParams({ book: k, from, to })}`}
            aria-current={k === book ? "page" : undefined}
            className={cn("rounded-md border px-3 py-1.5 text-sm", k === book ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
          >
            {BOOKS[k]}
          </Link>
        ))}
      </nav>

      <FilterBar>
        <FilterField label="Book">
          <Select name="book" defaultValue={book} className="w-56">
            {(Object.keys(BOOKS) as BookKey[]).map((k) => <option key={k} value={k}>{BOOKS[k]}</option>)}
          </Select>
        </FilterField>
        <FilterField label="From"><Input type="date" name="from" defaultValue={from} /></FilterField>
        <FilterField label="To"><Input type="date" name="to" defaultValue={to} /></FilterField>
        <div className="flex flex-wrap gap-1 self-center text-xs">
          {bookPresets(today()).map((p) => (
            <Link key={p.label} href={`?${new URLSearchParams({ book, from: p.from, to: p.to })}`} className="rounded border px-2 py-1 hover:bg-muted">{p.label}</Link>
          ))}
        </div>
      </FilterBar>

      {tooLong && <Alert className="max-w-2xl">Choose a period of up to one year.</Alert>}

      {data && (
        <>
          <div className="mb-3 space-y-1">
            {data.checks.map((c) => (
              <Alert key={c.label} tone={c.ok ? "success" : "danger"} className="max-w-3xl">
                {c.label}: {formatCents(c.book)} in the book vs {formatCents(c.expected)} — {c.ok ? "ties out" : "does not tie out. Check the entries listed under Other VAT activity in the VAT summary, or entries posted without tax codes."}
              </Alert>
            ))}
          </div>

          <Card>
            <div className="border-b px-4 py-2 text-sm text-muted-foreground">{data.table.title} · {data.table.period}</div>
            {data.table.rows.length <= 1 ? (
              <p className="p-6 text-sm text-muted-foreground">No posted entries for this book in the period.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    {data.table.columns.map((c, i) => <TH key={c} className={cn(data.table.money.includes(i) && "text-right")}>{c}</TH>)}
                  </TR>
                </THead>
                <TBody>
                  {data.table.rows.map((r, n) => (
                    <TR key={n} className={cn(r.kind === "section" && "bg-muted/40 font-medium", r.kind === "total" && "border-t-2 font-semibold")}>
                      {r.cells.map((cell, i) => {
                        const money = data.table.money.includes(i);
                        return (
                          <TD key={i} className={cn(money && "whitespace-nowrap text-right tabular-nums", typeof cell === "string" && cell.startsWith("[VOID]") && "text-destructive")}>
                            {money && typeof cell === "number" ? formatCents(cell) : cell}
                          </TD>
                        );
                      })}
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
          {data.table.notes.length > 0 && (
            <div className="mt-3 max-w-3xl space-y-1 text-xs text-muted-foreground">
              {data.table.notes.filter((n) => !data.checks.some((c) => n.startsWith(`${c.label}:`))).map((n) => <p key={n}>{n}</p>)}
            </div>
          )}
        </>
      )}
    </>
  );
}
