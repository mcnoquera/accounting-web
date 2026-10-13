import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; expired?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-mono text-lg font-bold text-primary-foreground">L</div>
          <h1 className="text-xl font-semibold">Sign in to Ledgerly</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accounting &amp; audit workspace</p>
        </div>
        <LoginForm next={searchParams.next} expired={searchParams.expired === "1"} />
        <div className="mt-6 rounded-md border bg-card p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Demo accounts (password: <code>password</code>)</p>
          <ul className="space-y-0.5 font-mono">
            <li>admin@example.com</li>
            <li>accountant@example.com</li>
            <li>controller@example.com</li>
            <li>auditor@example.com</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
