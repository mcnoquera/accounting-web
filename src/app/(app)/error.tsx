"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-12 max-w-md p-8 text-center">
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {process.env.NODE_ENV === "development" ? error.message : "The request couldn’t be completed. Check that the API is running and try again."}
      </p>
      <Button className="mt-4" variant="outline" onClick={reset}>Try again</Button>
    </Card>
  );
}
