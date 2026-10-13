import { ShieldOff } from "lucide-react";
import { Card } from "@/components/ui/card";

export function NoAccess({ what }: { what: string }) {
  return (
    <Card className="mx-auto mt-12 max-w-md p-8 text-center">
      <ShieldOff className="mx-auto mb-3 text-muted-foreground" />
      <p className="font-medium">You don’t have access to {what}</p>
      <p className="mt-1 text-sm text-muted-foreground">This area is limited to auditors and administrators, keeping audit work independent of bookkeeping.</p>
    </Card>
  );
}
