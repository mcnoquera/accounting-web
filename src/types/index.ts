export type Role = "admin" | "accountant" | "auditor";
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type EntryStatus = "draft" | "posted" | "voided";
export type Severity = "low" | "medium" | "high";
export type FindingStatus = "open" | "resolved";

export const ACCOUNT_TYPES: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];
export const ROLES: Role[] = ["admin", "accountant", "auditor"];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  is_locked: boolean;
  locked_until?: string | null;
}

export interface Company {
  id: number;
  name: string;
  trade_name: string | null;
  tin: string;
  rdo_code: string | null;
  address: string;
  zip_code: string | null;
  vat_registered: boolean;
  /** Basis points: 300 = 3% (BIR 2551Q, non-VAT businesses). */
  percentage_tax_rate_bp?: number;
  currency: "PHP";
  fiscal_year_start_month: number;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parent_id: number | null;
  tax_role: TaxRole | null;
  control_type: ControlType | null;
  normal_balance: "debit" | "credit";
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
  vat_code_id: number | null;
  ewt_code_id: number | null;
  contact_id: number | null;
  contact?: Pick<Contact, "id" | "name" | "type"> | null;
  vat_code?: TaxCode | null;
  ewt_code?: TaxCode | null;
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
  reversal_of_id: number | null;
  is_closing?: boolean;
  reversal_of?: { id: number; number: string } | null;
  reversed_by?: { id: number; number: string } | null;
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

export type PeriodStatus = "open" | "closed";

export interface AccountingPeriod {
  period: string; // YYYY-MM
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  closed_at: string | null;
  closed_by: { id: number; name: string } | null;
  reopened_at: string | null;
  reopened_by: { id: number; name: string } | null;
  reopen_reason: string | null;
  posted_count: number;
  draft_count: number;
  can_close: boolean;
  can_reopen: boolean;
}

export interface PeriodLock {
  /** Last closed day (YYYY-MM-DD); everything on or before it is locked. */
  locked_through: string | null;
  first_open_date: string | null;
  next_to_close: string | null;
  fiscal_year_start_month: number;
}

export interface PeriodsOverview extends PeriodLock {
  periods: AccountingPeriod[];
}

export type TaxRole = "input_vat" | "output_vat" | "ewt_payable" | "cwt_receivable";
export type TaxKind = "vat" | "ewt";
export type VatCategory = "vatable" | "zero_rated" | "exempt";

export const TAX_ROLES: { value: TaxRole; label: string }[] = [
  { value: "input_vat", label: "Input VAT" },
  { value: "output_vat", label: "Output VAT" },
  { value: "ewt_payable", label: "Expanded withholding tax payable" },
  { value: "cwt_receivable", label: "Creditable withholding tax" },
];

export interface TaxCode {
  id: number;
  code: string;
  name: string;
  kind: TaxKind;
  /** Basis points: 1200 = 12% */
  rate_bp: number;
  /** Percentage, e.g. "12.00" */
  rate: string;
  vat_category: VatCategory | null;
  is_active: boolean;
  lines_count?: number;
}

export interface VatBucket {
  month?: string; // YYYY-MM (months only)
  sales: Record<VatCategory, number> & { total: number };
  purchases: Record<VatCategory, number> & { total: number };
  output_vat: number;
  input_vat: number;
  output_vat_from_codes: number;
  input_vat_from_codes: number;
  /** Positive: VAT payable. Negative: excess input VAT. */
  net_vat_payable: number;
}

export interface VatOtherActivity {
  entry_id: number;
  number: string;
  entry_date: string;
  description: string;
  account_id: number;
  account_code: string;
  account_name: string;
  role: "output_vat" | "input_vat";
  amount: number;
}

export interface VatSummary {
  year: number;
  quarter: number;
  from: string;
  to: string;
  vat_registered: boolean | null;
  total: VatBucket;
  months: VatBucket[];
  other_vat_activity: VatOtherActivity[];
  other_vat_activity_total: { output_vat: number; input_vat: number };
}

export type ContactType = "customer" | "supplier" | "both";
export type ControlType = "receivable" | "payable";

export const CONTROL_TYPES: { value: ControlType; label: string }[] = [
  { value: "receivable", label: "Receivable control (customers)" },
  { value: "payable", label: "Payable control (suppliers)" },
];

export interface Contact {
  id: number;
  name: string;
  type: ContactType;
  tin: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  payment_terms_days: number;
  is_active: boolean;
}

export interface ContactLedger {
  contact: Contact;
  control_type: ControlType;
  from: string | null;
  to: string | null;
  opening_balance: number;
  closing_balance: number;
  rows: { entry_id: number; number: string; entry_date: string; description: string; memo: string | null; account_code: string; debit: number; credit: number; balance: number }[];
}

export type AgingBucket = "current" | "days_1_30" | "days_31_60" | "days_61_90" | "over_90";

export interface AgingReport {
  type: ControlType;
  as_of: string;
  rows: ({ contact_id: number; name: string; tin: string | null; payment_terms_days: number; total: number } & Record<AgingBucket, number>)[];
  totals: Record<AgingBucket | "total", number>;
  control_accounts: { id: number; code: string; name: string }[];
  control_balance: number;
  unassigned: number;
}

export interface WithholdingParty {
  contact_id: number | null;
  name: string | null;
  tin: string | null;
  atc: string;
  description: string;
  rate: string;
  base: number;
  tax: number;
}

export interface WithholdingSummary {
  year: number;
  quarter: number;
  from: string;
  to: string;
  withheld: {
    by_atc: { atc: string; description: string; rate: string; base: number; tax: number; months: { month: string; base: number; tax: number }[] }[];
    months: { month: string; base: number; tax: number }[];
    total: { base: number; tax: number };
    booked: number;
    payees: WithholdingParty[];
    payees_without_contact: number;
  };
  received: { by_customer: WithholdingParty[]; total: { base: number; tax: number }; booked: number };
  other_activity: { entry_id: number; number: string; entry_date: string; description: string; account_code: string; role: "ewt_payable" | "cwt_receivable"; amount: number }[];
}

export interface FiscalYear {
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  periods_closed: boolean;
  /** Profit (positive) or loss for the year, excluding closing entries. */
  net_income: number;
  closing_entry: { id: number; number: string } | null;
  retained_earnings_account: { id: number; code: string; name: string } | null;
  closed_by: { id: number; name: string } | null;
  closed_at: string | null;
  can_close: boolean;
}

export interface PercentageTaxBucket { gross: number; exempt: number; taxable: number; tax: number }

export interface PercentageTaxSummary {
  year: number;
  quarter: number;
  from: string;
  to: string;
  vat_registered: boolean | null;
  rate_bp: number;
  rate: string;
  months: (PercentageTaxBucket & { month: string })[];
  total: PercentageTaxBucket;
}

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "voided";

export interface SalesInvoiceLine {
  id: number;
  description: string;
  quantity: string;
  quantity_milli: number;
  unit_price: number;
  amount: number;
  account_id: number;
  vat_code_id: number | null;
  account?: { id: number; code: string; name: string };
  vat_code?: TaxCode | null;
}

export interface SalesInvoice {
  id: number;
  number: string | null;
  contact_id: number;
  contact?: Pick<Contact, "id" | "name" | "tin"> & Partial<Contact>;
  invoice_date: string;
  due_date: string;
  reference: string | null;
  notes: string | null;
  status: InvoiceStatus;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  journal_entry_id: number | null;
  journal_entry?: { id: number; number: string } | null;
  lines?: SalesInvoiceLine[];
  creator?: UserRef | null;
  issuer?: UserRef | null;
  issued_at?: string | null;
  voider?: UserRef | null;
  voided_at?: string | null;
  void_reason?: string | null;
}
