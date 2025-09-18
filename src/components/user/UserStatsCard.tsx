import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, TrendingUp, Flame, Target } from "lucide-react";
import { User } from "@/types";

interface UserStatsCardProps {
  user: User;
}

export function UserStatsCard({ user }: UserStatsCardProps) {
  const nextLevelPoints = (user.level + 1) * 100;
  const currentLevelPoints = user.level * 100;
  const progressToNext = ((user.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

  const getTierPerks = (tier: User["tier"]) => {
    switch (tier) {
      case "Platinum":
        return ["Priority review", "Advanced analytics", "Custom badges"];
      case "Gold":
        return ["Fast review", "Bulk flagging", "Trend insights"];
      case "Silver":
        return ["Quick review", "Batch actions"];
      default:
        return ["Standard review"];
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-primary" />
          Analyst Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user.handle}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.isVerified && (
                <Badge className="verified-badge">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline" className={`tier-${user.tier.toLowerCase()}`}>
                {user.tier}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{user.points}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        {/* Level progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Level {user.level}
            </span>
            <span className="text-muted-foreground">
              {user.points - currentLevelPoints} / {nextLevelPoints - currentLevelPoints}
            </span>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400">
              <Flame className="h-4 w-4" />
              <span className="text-lg font-bold">{user.streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <Target className="h-4 w-4" />
              <span className="text-lg font-bold">{user.trust}%</span>
            </div>
            <p className="text-xs text-muted-foreground">trust score</p>
          </div>
        </div>

        {/* Tier perks */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {user.tier} Perks
          </p>
          <div className="flex flex-wrap gap-1">
            {getTierPerks(user.tier).map((perk, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {perk}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}