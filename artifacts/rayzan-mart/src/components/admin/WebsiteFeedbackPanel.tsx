import { useState } from "react";
import { Loader2, Trash2, CheckCircle, XCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useAdminFeedback,
  useApproveFeedback,
  useDeleteFeedback,
} from "@/hooks/useWebsiteFeedback";
import { toast } from "sonner";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export const WebsiteFeedbackPanel = () => {
  const { language } = useLanguage();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useAdminFeedback(page, 20);
  const approveMutation = useApproveFeedback();
  const deleteMutation = useDeleteFeedback();

  const feedback = data?.feedback ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const approved = feedback.filter((f: any) => f.is_approved).length;
  const pending = feedback.filter((f: any) => !f.is_approved).length;

  const handleApprove = async (id: string, current: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, is_approved: !current });
      toast.success(
        language === "bn"
          ? !current ? "অনুমোদিত হয়েছে" : "অনুমোদন বাতিল হয়েছে"
          : !current ? "Feedback approved" : "Approval removed"
      );
    } catch {
      toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === "bn" ? "এই ফিডব্যাক মুছে ফেলবেন?" : "Delete this feedback?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted");
      refetch();
    } catch {
      toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{language === "bn" ? "ওয়েবসাইট ফিডব্যাক" : "Website Feedback"}</span>
            <div className="flex gap-2 text-sm font-normal">
              <Badge variant="outline" className="text-green-600 border-green-300">
                {language === "bn" ? `অনুমোদিত: ${approved}` : `Approved: ${approved}`}
              </Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                {language === "bn" ? `অপেক্ষমান: ${pending}` : `Pending: ${pending}`}
              </Badge>
              <Badge variant="outline">
                {language === "bn" ? `মোট: ${total}` : `Total: ${total}`}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === "bn" ? "কোনো ফিডব্যাক পাওয়া যায়নি" : "No feedback found"}
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item: any) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    item.is_approved ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{item.user_name}</span>
                        {item.email && (
                          <span className="text-xs text-muted-foreground">{item.email}</span>
                        )}
                        <StarDisplay rating={item.rating} />
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(item.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-BD")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{item.comment}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {item.is_approved ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <Switch
                          checked={item.is_approved}
                          onCheckedChange={() => handleApprove(item.id, item.is_approved)}
                          disabled={approveMutation.isPending}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                {language === "bn" ? "আগের" : "Previous"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {language === "bn"
                  ? `${page} / ${totalPages}`
                  : `Page ${page} of ${totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {language === "bn" ? "পরের" : "Next"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
