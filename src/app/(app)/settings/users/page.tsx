import type { Metadata } from "next";
import { getMe, getUsers } from "@/lib/api/endpoints";
import { can } from "@/lib/permissions";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { NoAccess } from "@/components/features/no-access";
import { CreateUserForm, UserControls, UserStatus } from "@/components/features/settings/user-forms";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await getMe();
  if (!can.manageUsers(me.role)) return <NoAccess what="user management" hint="Only administrators can add users or change their access." />;
  const users = await getUsers();

  return (
    <>
      <PageHeader
        title="Users"
        description="Admins manage access. Accountants record and post entries; auditors review the books and audit trail. Five failed sign-ins lock an account for 15 minutes."
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Add user</CardTitle></CardHeader>
        <div className="px-5 pb-5"><CreateUserForm /></div>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH className="w-28">Status</TH>
              <TH className="text-right">Access</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</TD>
                <TD className="text-muted-foreground">{u.email}</TD>
                <TD><UserStatus user={u} /></TD>
                <TD><UserControls user={u} isMe={u.id === me.id} /></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
