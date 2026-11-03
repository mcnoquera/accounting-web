import type { Role } from "@/types";

/** Mirrors the API's gates so the UI hides actions the API would reject. */
export const can = {
  manageUsers: (role: Role) => role === "admin",
  manageCompany: (role: Role) => role === "admin",
  manageTaxCodes: (role: Role) => role === "admin",
  manageContacts: (role: Role) => role === "admin" || role === "accountant",
  manageBooks: (role: Role) => role === "admin" || role === "accountant",
  closePeriods: (role: Role) => role === "admin" || role === "accountant",
  reopenPeriods: (role: Role) => role === "admin" || role === "accountant",
  viewAudit: (role: Role) => role === "admin" || role === "auditor",
  manageFindings: (role: Role) => role === "admin" || role === "auditor",
  resolveFindings: (_role: Role) => true,
};
