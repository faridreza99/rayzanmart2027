import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListUsers, useToggleUserBlock } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied</div>;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, refetch } = useListUsers({ params: { page: String(page), limit: "20", search } }, { query: {} });
  const toggleBlock = useToggleUserBlock();

  const users = (data as any)?.users ?? [];
  const totalPages = (data as any)?.totalPages ?? 1;

  function handleBlock(userId: string, isBlocked: boolean) {
    toggleBlock.mutate({ id: userId, data: { isBlocked: !isBlocked } }, {
      onSuccess: () => { toast.success(isBlocked ? "User unblocked" : "User blocked"); refetch(); },
      onError: () => toast.error("Failed"),
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-64" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Points</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.profile?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">{u.profile?.phone ?? "—"}</td>
                <td className="px-4 py-3">{u.profile?.loyaltyPoints ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.profile?.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {u.profile?.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.profile?.createdAt ? new Date(u.profile.createdAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBlock(u.id, u.profile?.isBlocked)}
                    className={u.profile?.isBlocked ? "text-green-700" : "text-destructive"}
                  >
                    {u.profile?.isBlocked ? "Unblock" : "Block"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center py-8 text-muted-foreground">No users found</p>}
      </div>
    </div>
  );
}
