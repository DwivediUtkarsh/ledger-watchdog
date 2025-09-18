import { Shield, Crown, Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";

interface UserBadgeProps {
  user: User;
  compact?: boolean;
}

export function UserBadge({ user, compact = false }: UserBadgeProps) {
  const getTierIcon = (tier: User["tier"]) => {
    switch (tier) {
      case "Platinum":
        return <Crown className="h-3 w-3" />;
      case "Gold":
        return <Award className="h-3 w-3" />;
      case "Silver":
        return <Star className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getTierClass = (tier: User["tier"]) => {
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

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{user.handle}</span>
          {user.isVerified && (
            <Shield className="h-3 w-3 text-emerald-400" />
          )}
        </div>
        <div className={`flex items-center gap-1 ${getTierClass(user.tier)}`}>
          {getTierIcon(user.tier)}
          <span className="text-xs">L{user.level}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.handle}</span>
          {user.isVerified && (
            <Badge className="verified-badge">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className={getTierClass(user.tier)}>
            {getTierIcon(user.tier)} {user.tier}
          </span>
          <span>Level {user.level}</span>
          <span>Trust {user.trust}%</span>
        </div>
      </div>
    </div>
  );
}