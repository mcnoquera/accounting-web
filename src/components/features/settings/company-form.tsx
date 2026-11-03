"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { saveCompany } from "@/app/actions/company";
import { initialActionState } from "@/lib/action-state";
import { formatTin, isValidTin } from "@/lib/accounts";
import type { Company } from "@/types";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function CompanyForm({ company, readOnly = false }: { company: Company | null; readOnly?: boolean }) {
  const [state, action] = useFormState(saveCompany, initialActionState);
  const [tin, setTin] = useState(company?.tin ?? "");
  const tinHint = tin && !isValidTin(tin) ? ["9 digits plus a 3- or 5-digit branch code, e.g. 123-456-789-000."] : undefined;

  return (
    <form action={action} className="space-y-4">
      {state.message && <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>}
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="c-name">Registered name</Label>
            <Input id="c-name" name="name" required defaultValue={company?.name} aria-invalid={!!state.errors?.name} />
            <FieldError messages={state.errors?.name} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-trade">Trade name <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="c-trade" name="trade_name" defaultValue={company?.trade_name ?? ""} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div className="space-y-1">
            <Label htmlFor="c-tin">TIN</Label>
            <Input
              id="c-tin" name="tin" required inputMode="numeric" placeholder="123-456-789-000"
              value={tin} onChange={(e) => setTin(formatTin(e.target.value))}
              aria-invalid={!!(state.errors?.tin ?? tinHint)}
            />
            <FieldError messages={state.errors?.tin ?? tinHint} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-rdo">RDO code</Label>
            <Input id="c-rdo" name="rdo_code" inputMode="numeric" maxLength={3} placeholder="044" defaultValue={company?.rdo_code ?? ""} aria-invalid={!!state.errors?.rdo_code} />
            <FieldError messages={state.errors?.rdo_code} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div className="space-y-1">
            <Label htmlFor="c-address">Registered address</Label>
            <Textarea id="c-address" name="address" required defaultValue={company?.address} aria-invalid={!!state.errors?.address} />
            <FieldError messages={state.errors?.address} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-zip">ZIP code</Label>
            <Input id="c-zip" name="zip_code" inputMode="numeric" maxLength={4} defaultValue={company?.zip_code ?? ""} aria-invalid={!!state.errors?.zip_code} />
            <FieldError messages={state.errors?.zip_code} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="c-fy">Fiscal year starts</Label>
            <Select id="c-fy" name="fiscal_year_start_month" defaultValue={company?.fiscal_year_start_month ?? 1}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Currency</Label>
            <Input value="PHP — Philippine peso" readOnly disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-pt">Percentage tax rate % <span className="font-normal text-muted-foreground">(non-VAT)</span></Label>
            <Input id="c-pt" name="percentage_tax_rate" inputMode="decimal" className="text-right font-mono"
              defaultValue={((company?.percentage_tax_rate_bp ?? 300) / 100).toString()} aria-invalid={!!state.errors?.percentage_tax_rate} />
            <FieldError messages={state.errors?.percentage_tax_rate} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" name="vat_registered" defaultChecked={company?.vat_registered ?? false} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            VAT-registered
          </label>
        </div>
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end">
          <SubmitButton>{company ? "Save changes" : "Finish setup"}</SubmitButton>
        </div>
      )}
    </form>
  );
}
