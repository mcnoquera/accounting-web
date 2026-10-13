import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { EntryStatus, FindingStatus, Severity } from "@/types";

const statusTone: Record<EntryStatus, BadgeTone> = { draft: "warning", posted: "success", voided: "neutral" };
const severityTone: Record<Severity, BadgeTone> = { high: "danger", medium: "warning", low: "info" };
const findingTone: Record<FindingStatus, BadgeTone> = { open: "danger", resolved: "success" };

export function StatusBadge({ status }: { status: EntryStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={severityTone[severity]}>{severity}</Badge>;
}

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  return <Badge tone={findingTone[status]}>{status}</Badge>;
}
