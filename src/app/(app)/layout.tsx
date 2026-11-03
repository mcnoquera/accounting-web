import Link from "next/link";
import { getCompany, getMe } from "@/lib/api/endpoints";
import { can } from "@/lib/permissions";
import { Sidebar } from "@/components/features/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, company] = await Promise.all([getMe(), getCompany()]);
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} company={company} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          {!company && (
            <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
              <span>
                <span className="font-medium">Setup isn’t finished.</span>{" "}
                {can.manageCompany(user.role) ? "Add your company’s BIR details before recording entries." : "Ask an administrator to add the company profile."}
              </span>
              {can.manageCompany(user.role) && (
                <Link href="/settings/company" className="font-medium text-primary hover:underline">Set up company →</Link>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
