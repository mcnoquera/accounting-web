"use client";

import { useFormState } from "react-dom";
import { Download } from "lucide-react";
import { commitImport, previewImport, type ImportState } from "@/app/actions/imports";
import type { ImportKind } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";

const TONE = { create: "success", update: "info", unchanged: "neutral", error: "danger" } as const;

export function ImportCard({ kind, title, hint }: { kind: ImportKind; title: string; hint: string }) {
  const [preview, previewAction] = useFormState(previewImport.bind(null, kind), {} as ImportState);
  const [commit, commitAction] = useFormState(commitImport.bind(null, kind), {} as ImportState);
  const result = commit.committed ? commit.result : preview.result;
  const errors = preview.result?.summary.error ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <a href={`/export/imports/${kind}/template`} className={buttonClass("outline", "sm")} download><Download size={14} /> Template</a>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{hint}</p>
        <form action={previewAction} className="flex flex-wrap items-center gap-2">
          <Input type="file" name="file" accept=".csv,text/csv" required aria-label={`${title} CSV file`} className="max-w-sm" />
          <SubmitButton variant="outline" pendingText="Checking…">Preview</SubmitButton>
        </form>
        {preview.message && !preview.ok && <Alert>{preview.message}</Alert>}
        {commit.message && <Alert tone={commit.committed ? "success" : "danger"}>{commit.message}</Alert>}

        {result && (
          <>
            <div className="flex flex-wrap gap-2 text-sm">
              {(["create", "update", "unchanged", "error"] as const).map((k) => <Badge key={k} tone={TONE[k]}>{result.summary[k]} {k}</Badge>)}
            </div>
            <div className="max-h-80 overflow-auto rounded border">
              <Table>
                <THead><TR><TH className="w-16">Line</TH><TH>{kind === "accounts" ? "Code" : "Name"}</TH><TH className="w-28">Action</TH><TH>Problems</TH></TR></THead>
                <TBody>
                  {result.rows.map((r) => (
                    <TR key={r.line}>
                      <TD className="tabular-nums text-muted-foreground">{r.line}</TD>
                      <TD className="font-medium">{r.key}</TD>
                      <TD><Badge tone={TONE[r.action]}>{r.action}</Badge></TD>
                      <TD className="text-xs text-destructive">{r.errors.join("; ")}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            {!commit.committed && preview.csv && (
              <form action={commitAction} className="flex items-center justify-end gap-3">
                <input type="hidden" name="csv" value={preview.csv} />
                {errors > 0 && <p className="text-sm text-destructive">Fix the {errors} row(s) with problems and preview again.</p>}
                <SubmitButton disabled={errors > 0} pendingText="Importing…">Import {result.summary.create + result.summary.update} row(s)</SubmitButton>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
