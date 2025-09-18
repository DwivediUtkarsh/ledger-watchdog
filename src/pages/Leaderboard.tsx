import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { UserBadge } from "@/components/user/UserBadge";
import { Trophy, Crown, Medal, Award, Shield, TrendingUp, Flame, Target } from "lucide-react";
import { mockLeaderboard, mockUser } from "@/lib/mockData";

const Leaderboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default:
        return "bg-muted/10 border-border/50";
    }
  };

  const getTierClass = (tier: string) => {
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
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onKeyboardShortcut={() => {}}
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Global Leaderboard
              </h1>
              <p className="text-muted-foreground">
                Top analysts ranked by points, trust, and contribution
              </p>
            </div>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{mockLeaderboard.length}</div>
                <div className="text-sm text-muted-foreground">Active Analysts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {mockLeaderboard.filter(e => e.isVerified).length}
                </div>
                <div className="text-sm text-muted-foreground">Verified Analysts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {mockLeaderboard.reduce((sum, e) => sum + e.points, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            {mockLeaderboard.map((entry) => (
              <Card
                key={entry.handle}
                className={`transition-all hover:scale-[1.02] ${getRankBackground(entry.rank)} ${
                  entry.handle === mockUser.handle ? "ring-2 ring-primary/50" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center gap-2 min-w-[60px]">
                        {getRankIcon(entry.rank)}
                        <span className="text-lg font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      </div>

                      {/* User info */}
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-semibold">{entry.handle}</span>
                            {entry.isVerified && (
                              <Shield className="h-4 w-4 text-emerald-400" />
                            )}
                            {entry.handle === mockUser.handle && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className={getTierClass(entry.tier)}>
                              {entry.tier}
                            </span>
                            <span>Level {entry.level}</span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {entry.trust}% trust
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-400" />
                              {entry.streak}d streak
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tier info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Tier System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="tier-bronze font-medium">Bronze</div>
                  <div className="text-xs text-muted-foreground">0-999 points</div>
                  <div className="text-xs">Standard review</div>
                </div>
                <div>
                  <div className="tier-silver font-medium">Silver</div>
                  <div className="text-xs text-muted-foreground">1000-2499 points</div>
                  <div className="text-xs">Quick review, batch actions</div>
                </div>
                <div>
                  <div className="tier-gold font-medium">Gold</div>
                  <div className="text-xs text-muted-foreground">2500-4999 points</div>
                  <div className="text-xs">Fast review, bulk flagging</div>
                </div>
                <div>
                  <div className="tier-platinum font-medium">Platinum</div>
                  <div className="text-xs text-muted-foreground">5000+ points</div>
                  <div className="text-xs">Priority review, advanced tools</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;