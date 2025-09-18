import { Shield, Search, Keyboard, User, Bell, Activity, TrendingUp, Award, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserBadge } from "@/components/user/UserBadge";
import { mockUser, mockLeaderboard } from "@/lib/mockData";
import { useState } from "react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onKeyboardShortcut: () => void;
}

export function Header({ searchQuery, onSearchChange, onKeyboardShortcut }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications] = useState(3);
  
  const nextLevelPoints = (mockUser.level + 1) * 100;
  const currentLevelPoints = mockUser.level * 100;
  const progressToNext = ((mockUser.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  
  const userRank = mockLeaderboard.findIndex(entry => entry.handle === mockUser.handle) + 1;
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="glass-panel sticky top-0 z-50 border-b">
      {/* Main Header Row */}
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="relative">
              <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
              <div className="absolute inset-0 animate-pulse-ring border-2 border-primary rounded-full opacity-20" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-foreground">Ledger Watchdog</h1>
              <p className="text-xs text-muted-foreground hidden lg:block">Transaction Monitor</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-48 sm:w-72 lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10 bg-muted/50 border-border/50 focus:bg-background text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <Badge variant="outline" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs hidden sm:block">
              /
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Activity Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Online</span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 lg:h-9 lg:w-9 p-0"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> : <Moon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 lg:h-9 lg:w-9 p-0 relative"
          >
            <Bell className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 p-0 flex items-center justify-center bg-primary text-xs">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Keyboard shortcuts */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onKeyboardShortcut}
            className="text-muted-foreground hover:text-foreground hidden lg:flex"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>

          {/* Enhanced User Profile */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-10 px-3">
                <UserBadge user={mockUser} compact />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 sm:w-80 p-0">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 space-y-4">
                  {/* User Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{mockUser.handle}</p>
                          {mockUser.isVerified && (
                            <Badge className="verified-badge">
                              <Shield className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`tier-${mockUser.tier.toLowerCase()}`}>
                            {mockUser.tier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Rank #{userRank}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{mockUser.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Level {mockUser.level}
                      </span>
                      <span className="text-muted-foreground">
                        {mockUser.points - currentLevelPoints} / {nextLevelPoints - currentLevelPoints}
                      </span>
                    </div>
                    <Progress value={progressToNext} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {nextLevelPoints - mockUser.points} points to next level
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 py-2 border-y border-border/50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{mockUser.flagsSubmitted}</p>
                      <p className="text-xs text-muted-foreground">Flags</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{mockUser.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">{mockUser.streak}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      View Full Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Award className="h-4 w-4 mr-2" />
                      Achievements
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Secondary Stats Bar */}
      <div className="h-8 lg:h-10 px-4 lg:px-6 bg-muted/20 border-t border-border/30 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-3 lg:gap-6 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-muted-foreground">Session: 2h 34m</span>
          </div>
          <div className="text-muted-foreground">
            Today: <span className="text-foreground font-medium">12</span>
          </div>
          <div className="text-muted-foreground hidden sm:block">
            Rank: <span className="text-primary font-medium">#{userRank}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 whitespace-nowrap">
          <div className="text-muted-foreground hidden md:block">
            Trust: <span className="text-emerald-400 font-medium">{mockUser.trustScore}%</span>
          </div>
          <div className="text-muted-foreground hidden lg:block">
            Next: <span className="text-foreground font-medium">
              {mockUser.tier === "Bronze" ? "Silver" : 
               mockUser.tier === "Silver" ? "Gold" : 
               mockUser.tier === "Gold" ? "Platinum" : "Max"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}