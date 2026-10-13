import type { Role } from "@/types";

/** Mirrors the API's gates so the UI hides actions the API would reject. */
export const can = {
  manageBooks: (role: Role) => role === "admin" || role === "accountant",
  viewAudit: (role: Role) => role === "admin" || role === "auditor",
  manageFindings: (role: Role) => role === "admin" || role === "auditor",
  resolveFindings: (_role: Role) => true,
};
