import { Wallet, ArrowUpRight, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyWalletBalance, useMyWithdrawals, useRequestWithdrawal } from "@/hooks/useWithdrawals";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const WalletSection = () => {
  const { language, t } = useLanguage();
  const { data: balance, isLoading: balanceLoading } = useMyWalletBalance();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useMyWithdrawals();
  const { mutate: requestWithdrawal, isPending: submitting } = useRequestWithdrawal();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bkash" | "nagad" | "">("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) < 200) {
      toast.error(language === "bn" ? "সর্বনিম্ন উইথড্রাল ২০০ টাকা" : "Minimum withdrawal is 200 BDT");
      return;
    }
    
    if (balance && Number(amount) > balance.available_balance) {
      toast.error(language === "bn" ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient balance");
      return;
    }

    if (!method || !accountNumber) {
      toast.error(language === "bn" ? "অনুগ্রহ করে সব তথ্য দিন" : "Please provide all details");
      return;
    }

    requestWithdrawal({
      amount: Number(amount),
      method: method as "bkash" | "nagad",
      accountNumber,
    }, {
      onSuccess: () => {
        toast.success(language === "bn" ? "উইথড্রাল রিকোয়েস্ট পাঠানো হয়েছে" : "Withdrawal request submitted");
        setAmount("");
        setAccountNumber("");
        setMethod("");
      },
      onError: (err) => {
        toast.error(language === "bn" ? "একটি সমস্যা হয়েছে" : "An error occurred");
        console.error(err);
      }
    });
  };

  const walletStats = [
    { label: language === "bn" ? "অনুমোদিত আয়" : "Approved Earnings", value: balance?.total_earned || 0, icon: DollarSign, color: "text-primary" },
    { label: language === "bn" ? "পেন্ডিং কমিশন" : "Pending Commission", value: balance?.pending_commission || 0, icon: Clock, color: "text-warning" },
    { label: language === "bn" ? "উত্তোলন করা হয়েছে" : "Withdrawn", value: balance?.withdrawn || 0, icon: ArrowUpRight, color: "text-success" },
    { label: language === "bn" ? "বর্তমান ব্যালেন্স" : "Available Balance", value: balance?.available_balance || 0, icon: Wallet, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {walletStats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-slate-100 ${stat.color}`}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-bold">৳{Number(stat.value).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === "bn" ? "টাকা উত্তোলন করুন" : "Request Withdrawal"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "পরিমাণ (৳)" : "Amount (BDT)"}</Label>
                <Input 
                  type="number" 
                  min="200" 
                  placeholder={language === "bn" ? "সর্বনিম্ন ২০০" : "Minimum 200"} 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
                <Select value={method} onValueChange={(val: any) => setMethod(val)} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select Method"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "একাউন্ট নম্বর" : "Account Number"}</Label>
                <Input 
                  type="text" 
                  placeholder="01XXXXXXXXX" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={submitting}
                />
              </div>
              
              <div className="bg-muted p-3 flex gap-2 rounded-lg text-sm text-muted-foreground mt-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{language === "bn" ? "উইথড্রাল রিকোয়েস্ট প্রসেস হতে ৪৮ ঘণ্টা পর্যন্ত সময় লাগতে পারে।" : "Withdrawal requests may take up to 48 hours to process."}</p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting || (balance?.available_balance || 0) < 200}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {language === "bn" ? "উইথড্র রিকোয়েস্ট পাঠান" : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "bn" ? "উত্তোলনের হিস্টি" : "Withdrawal History"}</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : withdrawals && withdrawals.length > 0 ? (
               <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="border p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <Badge variant="outline" className="uppercase text-[10px]">{w.method}</Badge>
                           <span className="text-sm font-medium">৳{w.amount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                         <Badge variant={
                           w.status === "completed" ? "success" : 
                           w.status === "approved" ? "primary" : 
                           w.status === "rejected" ? "destructive" : "secondary"
                         }>
                           {w.status}
                         </Badge>
                         {w.admin_notes && (
                           <p className="text-[10px] text-destructive mt-1 max-w-[120px] truncate" title={w.admin_notes}>
                             {w.admin_notes}
                           </p>
                         )}
                      </div>
                    </div>
                  ))}
               </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="mx-auto h-10 w-10 mb-3 opacity-20" />
                <p>{language === "bn" ? "কোন রেকর্ড পাওয়া যায়নি" : "No withdrawal records found"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
