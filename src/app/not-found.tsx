import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="text-muted-foreground">That page doesn’t exist.</p>
      <Link href="/" className="text-primary hover:underline">Back to dashboard</Link>
    </main>
  );
}
