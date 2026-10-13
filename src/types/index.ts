export type Role = "admin" | "accountant" | "auditor";
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type EntryStatus = "draft" | "posted" | "voided";
export type Severity = "low" | "medium" | "high";
export type FindingStatus = "open" | "resolved";

export const ACCOUNT_TYPES: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  description: string | null;
  is_active: boolean;
}

export interface JournalLine {
  id: number;
  account_id: number;
  debit: number;
  credit: number;
  memo: string | null;
  account: Account;
}

export interface UserRef {
  id: number;
  name: string;
}

export interface JournalEntry {
  id: number;
  number: string;
  entry_date: string;
  reference: string | null;
  description: string;
  status: EntryStatus;
  created_by: number;
  posted_by: number | null;
  posted_at: string | null;
  voided_by: number | null;
  voided_at: string | null;
  void_reason: string | null;
  lines: JournalLine[];
  creator: UserRef | null;
  poster: UserRef | null;
  voider: UserRef | null;
  findings?: AuditFinding[];
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ReportRow {
  account_id: number | null;
  code: string;
  name: string;
  balance: number;
}

export interface ReportSection {
  rows: ReportRow[];
  total: number;
}

export interface TrialBalance {
  as_of: string | null;
  rows: { account_id: number; code: string; name: string; type: AccountType; debit: number; credit: number }[];
  totals: { debit: number; credit: number };
  balanced: boolean;
}

export interface BalanceSheet {
  as_of: string | null;
  assets: ReportSection;
  liabilities: ReportSection;
  equity: ReportSection;
  total_liabilities_and_equity: number;
  balanced: boolean;
}

export interface IncomeStatement {
  from: string | null;
  to: string | null;
  revenue: ReportSection;
  expenses: ReportSection;
  net_income: number;
}

export interface AccountLedger {
  account: Account;
  from: string | null;
  to: string | null;
  opening_balance: number;
  closing_balance: number;
  rows: {
    entry_id: number;
    number: string;
    entry_date: string;
    description: string;
    memo: string | null;
    debit: number;
    credit: number;
    balance: number;
  }[];
}

export interface Dashboard {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  ytd_revenue: number;
  ytd_expenses: number;
  ytd_net_income: number;
  draft_entries: number;
  open_findings: number;
  books_balanced: boolean;
  recent_entries: { id: number; number: string; entry_date: string; description: string; status: EntryStatus; amount: number }[];
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user: (UserRef & { email: string; role: Role }) | null;
}

export interface AuditFlag {
  rule: string;
  title: string;
  severity: Severity;
  message: string;
  entry: { id: number; number: string; entry_date: string; description: string; amount: number };
}

export interface AuditExceptions {
  rules: { key: string; title: string; count: number }[];
  flags: AuditFlag[];
}

export interface AuditFinding {
  id: number;
  journal_entry_id: number | null;
  title: string;
  description: string;
  severity: Severity;
  status: FindingStatus;
  raised_by: number;
  resolved_by: number | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  entry?: { id: number; number: string; description: string } | null;
  raiser?: UserRef | null;
  resolver?: UserRef | null;
}
