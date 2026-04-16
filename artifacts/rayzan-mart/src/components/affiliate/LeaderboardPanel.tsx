import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, User, Loader2, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const LeaderboardPanel = () => {
    const { language, t } = useLanguage();

    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ["affiliate-leaderboard"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("affiliate_leaderboard")
                .select("*")
                .order("rank", { ascending: true });
            
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
                    <h2 className="text-2xl font-bold text-slate-900">{language === "bn" ? "অ্যাফিলিয়েট লিডারবোর্ড" : "Affiliate Leaderboard"}</h2>
                    <p className="text-sm text-slate-500">{language === "bn" ? "সেরা পারফর্মিং অ্যাফিলিয়েটদের তালিকা" : "Top performing affiliates this month"}</p>
                </div>
                <Trophy className="h-10 w-10 text-yellow-500 shrink-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboard?.slice(0, 3).map((item, idx) => (
                    <Card key={item.id} className={cn(
                        "relative overflow-hidden border-2",
                        idx === 0 ? "border-yellow-400 bg-yellow-50/30" : 
                        idx === 1 ? "border-slate-300 bg-slate-50/30" : 
                        "border-orange-300 bg-orange-50/30"
                    )}>
                        <div className="absolute top-2 right-2">
                             {idx === 0 ? <Trophy className="h-8 w-8 text-yellow-500 opacity-20" /> : <Medal className="h-8 w-8 text-slate-400 opacity-20" />}
                        </div>
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                                <User className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-lg truncate px-2">{item.user_name || "Top Affiliate"}</h3>
                            <p className="text-sm font-bold text-primary mt-1">{t("currency")}{Number(item.earnings || 0).toLocaleString()}</p>
                            <div className="mt-4 flex justify-center">
                                <Badge className={cn(
                                    idx === 0 ? "bg-yellow-500" : 
                                    idx === 1 ? "bg-slate-500" : 
                                    "bg-orange-500"
                                )}>
                                    Rank #{item.rank}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        {language === "bn" ? "সম্পূর্ণ তালিকা" : "Full Leaderboard"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-y border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Affiliate</th>
                                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Earnings</th>
                                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leaderboard?.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full font-bold",
                                                item.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                item.rank === 2 ? "bg-slate-100 text-slate-700" :
                                                item.rank === 3 ? "bg-orange-100 text-orange-700" :
                                                "bg-slate-50 text-slate-500"
                                            )}>
                                                {item.rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                            {item.user_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">
                                            {t("currency")}{Number(item.earnings || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Badge variant="outline">{item.points || 0} pts</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {(!leaderboard || leaderboard.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">
                                            {language === "bn" ? "লিডারবোর্ডে এখনো কোনো ডাটা নেই" : "No leaderboard data available yet"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
