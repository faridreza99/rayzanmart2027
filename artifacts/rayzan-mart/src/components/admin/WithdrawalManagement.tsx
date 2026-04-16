import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X, Search, MoreHorizontal, ExternalLink, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllWithdrawals, useUpdateWithdrawalStatus } from "@/hooks/useWithdrawals";

export const WithdrawalManagement = () => {
  const { data: withdrawalsList, isLoading } = useAllWithdrawals();
  const { mutate: updateStatus, isPending } = useUpdateWithdrawalStatus();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fallback for when there's an error fetching (like unmigrated table)
  const withdrawals = Array.isArray(withdrawalsList) ? withdrawalsList : [];

  const filteredWithdrawals = withdrawals.filter((w: any) => {
    const matchesSearch = 
      w.affiliates?.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.affiliates?.profiles?.phone?.includes(searchTerm) ||
      w.id?.includes(searchTerm);
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && w.status === statusFilter;
  });

  const handleStatusUpdate = (status: "approved" | "rejected" | "completed") => {
    if (!selectedWithdrawal) return;

    updateStatus({
      withdrawalId: selectedWithdrawal.id,
      status,
      adminNotes: adminNotes,
    }, {
      onSuccess: () => {
        toast.success(`Withdrawal marked as ${status}`);
        setDialogOpen(false);
        setSelectedWithdrawal(null);
        setAdminNotes("");
      },
      onError: (err) => {
        toast.error("Failed to update status");
        console.error(err);
      }
    });
  };

  const openActionDialog = (w: any) => {
    setSelectedWithdrawal(w);
    setAdminNotes(w.admin_notes || "");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex px-1 space-x-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone or ID..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Withdrawals</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Account details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredWithdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No withdrawals found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWithdrawals.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <p className="font-medium">{w.affiliates?.profiles?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{w.affiliates?.profiles?.phone}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">৳{w.amount}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px]">{w.method}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {w.account_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(w.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        w.status === "completed" ? "success" : 
                        w.status === "approved" ? "primary" : 
                        w.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {w.status === "pending" || w.status === "approved" ? (
                        <Button variant="ghost" size="sm" onClick={() => openActionDialog(w)}>
                          <MessageSquare className="h-4 w-4 mr-1" /> Reivew
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Review the withdrawal details for {selectedWithdrawal?.affiliates?.profiles?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-xl">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">৳{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium uppercase">{selectedWithdrawal.method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">{selectedWithdrawal.account_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline">{selectedWithdrawal.status}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (Optional)</label>
                <Textarea 
                  placeholder="E.g. Transaction ID or reason for rejection" 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedWithdrawal?.status === "pending" && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isPending}
                >
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button 
                  className="bg-primary/90 text-white" 
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
              </>
            )}
            
            {selectedWithdrawal?.status === "approved" && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => handleStatusUpdate("completed")}
                disabled={isPending}
              >
                <Check className="h-4 w-4 mr-2" /> Mark as Paid / Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
