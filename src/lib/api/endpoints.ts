import "server-only";
import { cache } from "react";
import { api, apiData } from "./client";
import type {
  Account, AccountLedger, AuditExceptions, Company, AuditFinding, AuditLog, BalanceSheet, Dashboard,
  IncomeStatement, JournalEntry, PageMeta, Paginated, TaxCode, TrialBalance, User, VatSummary,
} from "@/types";

type Q = Record<string, string | undefined>;

async function paginated<T>(path: string, query: Q): Promise<Paginated<T>> {
  const res = await api<T[]>(path, { query });
  return { data: res.data, meta: res.meta as PageMeta };
}

/** Deduplicated per request so layout and page can both ask for the user. */
export const getMe = cache(() => apiData<User>("/auth/me"));

/** null until an admin completes first-run setup. */
export const getCompany = cache(() => apiData<Company | null>("/company"));
export const getUsers = () => apiData<User[]>("/users");

export const getTaxCodes = (query: Q = {}) => apiData<TaxCode[]>("/tax-codes", query);

export const getDashboard = () => apiData<Dashboard>("/dashboard");

export const getAccounts = (query: Q = {}) => apiData<Account[]>("/accounts", query);
export const getAccount = (id: string) => apiData<Account>(`/accounts/${id}`);
export const getAccountLedger = (id: string, query: Q) => apiData<AccountLedger>(`/accounts/${id}/ledger`, query);

export const getEntries = (query: Q) => paginated<JournalEntry>("/journal-entries", query);
export const getEntry = (id: string) => apiData<JournalEntry>(`/journal-entries/${id}`);

export const getTrialBalance = (query: Q) => apiData<TrialBalance>("/reports/trial-balance", query);
export const getBalanceSheet = (query: Q) => apiData<BalanceSheet>("/reports/balance-sheet", query);
export const getVatSummary = (query: Q) => apiData<VatSummary>("/reports/vat-summary", query);
export const getIncomeStatement = (query: Q) => apiData<IncomeStatement>("/reports/income-statement", query);

export const getAuditLogs = (query: Q) => paginated<AuditLog>("/audit/logs", query);
export const getAuditExceptions = (query: Q) => apiData<AuditExceptions>("/audit/exceptions", query);
export const getFindings = (query: Q) => paginated<AuditFinding>("/audit/findings", query);
