import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const TargetPanel = () => {
    const { language, t } = useLanguage();

    const { data: targets, isLoading } = useQuery({
        queryKey: ["affiliate-targets"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("affiliate_sales_targets")
                .select("*")
                .order("created_at", { ascending: false });
            
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{language === "bn" ? "সেলস টার্গেট" : "Sales Targets"}</h2>
                    <p className="text-sm text-slate-500">{language === "bn" ? "আপনার লক্ষ্য এবং অগ্রগতি দেখুন" : "Monitor your monthly goals and achievement"}</p>
                </div>
                <Target className="h-10 w-10 text-primary shrink-0" />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {targets?.map((target) => {
                    const progress = Math.min(100, (target.current_amount / target.target_amount) * 100);
                    const isCompleted = progress >= 100;
                    
                    return (
                        <Card key={target.id} className={isCompleted ? "border-success/30 bg-success/5" : ""}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <CardTitle className="text-lg">{target.month} {target.year}</CardTitle>
                                    </div>
                                    <Badge variant={isCompleted ? "success" : "secondary"}>
                                        {isCompleted ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                                        {isCompleted ? (language === "bn" ? "অর্জিত" : "Completed") : (language === "bn" ? "চলমান" : "In Progress")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="space-y-1">
                                            <p className="font-medium text-slate-500">{language === "bn" ? "বর্তমান সেলস" : "Current Sales"}</p>
                                            <p className="text-2xl font-bold text-slate-900">{t("currency")}{Number(target.current_amount).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="font-medium text-slate-500">{language === "bn" ? "টার্গেট" : "Target"}</p>
                                            <p className="text-2xl font-bold text-slate-900">{t("currency")}{Number(target.target_amount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                                            <span>Progress</span>
                                            <span>{progress.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-3" />
                                    </div>

                                    {target.bonus_amount > 0 && (
                                        <div className="rounded-lg bg-blue-50 p-3 flex items-center justify-between border border-blue-100">
                                            <div className="text-sm">
                                                <p className="font-bold text-blue-700">{language === "bn" ? "বোনাস পুরস্কার" : "Bonus Reward"}</p>
                                                <p className="text-blue-600/70 text-xs">{language === "bn" ? "টার্গেট পূরণ করলে পাবেন" : "Earn this after reaching target"}</p>
                                            </div>
                                            <span className="text-lg font-bold text-blue-700">{t("currency")}{Number(target.bonus_amount).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {(!targets || targets.length === 0) && (
                    <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                        <Target className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                        <p className="text-slate-400 font-medium">{language === "bn" ? "এখনো কোনো টার্গেট সেট করা হয়নি" : "No sales targets assigned yet"}</p>
                        <p className="text-xs text-slate-400 mt-1">{language === "bn" ? "নতুন টার্গেট আসার জন্য অপেক্ষা করুন" : "New targets will appear here when assigned by admin"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
