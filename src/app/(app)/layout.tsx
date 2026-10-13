import { getMe } from "@/lib/api/endpoints";
import { Sidebar } from "@/components/features/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
