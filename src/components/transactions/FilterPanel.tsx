import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { FilterState } from "@/types";

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.query || filters.minAmount > 0 || filters.minRisk > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReset}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Signature, address, label..."
              className="pl-10 text-sm"
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
            />
          </div>
        </div>

        {/* Min Amount */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Min Amount (USDT)
          </Label>
          <Input
            type="number"
            placeholder="0"
            className="text-sm"
            value={filters.minAmount || ''}
            onChange={(e) => updateFilter('minAmount', parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Min Risk */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Min Risk Level
            </Label>
            <Badge variant="outline" className="text-xs">
              {filters.minRisk}
            </Badge>
          </div>
          <Slider
            value={[filters.minRisk]}
            onValueChange={([value]) => updateFilter('minRisk', value)}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low (0)</span>
            <span>Critical (100)</span>
          </div>
        </div>

        {/* Quick filters */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Filters
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.minRisk >= 70 ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => updateFilter('minRisk', filters.minRisk >= 70 ? 0 : 70)}
            >
              High Risk
            </Button>
            <Button
              variant={filters.minAmount >= 10000 ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => updateFilter('minAmount', filters.minAmount >= 10000 ? 0 : 10000)}
            >
              Large Amount
            </Button>
            <Button
              variant={filters.query === 'mixer' ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => updateFilter('query', filters.query === 'mixer' ? '' : 'mixer')}
            >
              Mixers
            </Button>
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex flex-wrap gap-1">
              {filters.query && (
                <Badge variant="secondary" className="text-xs">
                  "{filters.query}"
                </Badge>
              )}
              {filters.minAmount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  ≥${filters.minAmount.toLocaleString()}
                </Badge>
              )}
              {filters.minRisk > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Risk ≥{filters.minRisk}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}