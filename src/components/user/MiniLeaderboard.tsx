import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Shield, TrendingUp } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { mockLeaderboard } from "@/lib/mockData";

export function MiniLeaderboard() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 2:
        return <Medal className="h-4 w-4 text-slate-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTierClass = (tier: LeaderboardEntry["tier"]) => {
    switch (tier) {
      case "Platinum":
        return "tier-platinum";
      case "Gold":
        return "tier-gold";
      case "Silver":
        return "tier-silver";
      default:
        return "tier-bronze";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top Analysts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockLeaderboard.slice(0, 5).map((entry) => (
          <div
            key={entry.handle}
            className={`flex items-center justify-between p-3 rounded-lg border border-border/30 transition-colors hover:bg-muted/30 ${
              entry.handle === "kira" ? "bg-primary/5 border-primary/20" : "bg-muted/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getRankIcon(entry.rank)}
                <span className="text-sm font-medium text-muted-foreground">
                  #{entry.rank}
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entry.handle}</span>
                  {entry.isVerified && (
                    <Shield className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={getTierClass(entry.tier)}>
                    {entry.tier}
                  </span>
                  <span>•</span>
                  <span>L{entry.level}</span>
                  <span>•</span>
                  <span>{entry.trust}% trust</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-primary">
                {entry.points.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {entry.streak}d streak
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-center text-muted-foreground">
            View full leaderboard →
          </p>
        </div>
      </CardContent>
    </Card>
  );
}