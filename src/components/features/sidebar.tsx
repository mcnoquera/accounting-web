import { BookOpen, ClipboardCheck, FileSearch, FileText, LayoutDashboard, ListTree, LogOut, Scale, ScrollText, ShieldAlert, TrendingUp } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { can } from "@/lib/permissions";
import type { User } from "@/types";
import { NavLink } from "./nav-link";

const sections = (user: User) => [
  {
    title: "Books",
    items: [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { href: "/accounts", label: "Chart of accounts", icon: <ListTree size={16} /> },
      { href: "/journal", label: "Journal entries", icon: <BookOpen size={16} /> },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/reports/trial-balance", label: "Trial balance", icon: <Scale size={16} /> },
      { href: "/reports/balance-sheet", label: "Balance sheet", icon: <FileText size={16} /> },
      { href: "/reports/income-statement", label: "Income statement", icon: <TrendingUp size={16} /> },
    ],
  },
  {
    title: "Audit",
    items: [
      ...(can.viewAudit(user.role)
        ? [
            { href: "/audit/exceptions", label: "Exceptions", icon: <ShieldAlert size={16} /> },
            { href: "/audit/logs", label: "Audit trail", icon: <ScrollText size={16} /> },
          ]
        : []),
      { href: "/audit/findings", label: "Findings", icon: <ClipboardCheck size={16} /> },
    ],
  },
];

export function Sidebar({ user }: { user: User }) {
  return (
    <aside className="border-b bg-card md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">L</div>
        <span className="font-semibold">Ledgerly</span>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-5 md:overflow-y-auto md:pb-0">
        {sections(user).map((s) => (
          <div key={s.title} className="flex shrink-0 gap-1 md:flex-col">
            <p className="hidden px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:block">{s.title}</p>
            {s.items.map((i) => (
              <NavLink key={i.href} href={i.href} icon={i.icon}>{i.label}</NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t px-3 py-2 md:block md:p-3">
        <div className="flex items-center gap-2 px-2 md:mb-2">
          <FileSearch size={14} className="text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <form action={logout}>
          <button className="flex items-center md:w-full gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut size={14} /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
