import { Shield, Search, Keyboard, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserBadge } from "@/components/user/UserBadge";
import { mockUser } from "@/lib/mockData";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onKeyboardShortcut: () => void;
}

export function Header({ searchQuery, onSearchChange, onKeyboardShortcut }: HeaderProps) {
  return (
    <header className="glass-panel sticky top-0 z-50 h-16 flex items-center justify-between px-6 border-b">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 animate-pulse-ring border-2 border-primary rounded-full opacity-20" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Cerberus</h1>
            <p className="text-xs text-muted-foreground">Analyst Workbench</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by signature, address, or label..."
            className="pl-10 bg-muted/50 border-border/50 focus:bg-background"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Badge variant="outline" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs">
            /
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Keyboard shortcuts */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onKeyboardShortcut}
          className="text-muted-foreground hover:text-foreground"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Shortcuts
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10">
              <UserBadge user={mockUser} compact />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{mockUser.handle}</p>
              <p className="text-xs text-muted-foreground">
                Level {mockUser.level} • {mockUser.points} points
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}