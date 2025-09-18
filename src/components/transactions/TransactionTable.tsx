import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Flag, Copy } from "lucide-react";
import { Tx, getRiskLevel, getRiskColor } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface TransactionTableProps {
  transactions: Tx[];
  selectedTx?: Tx;
  onSelectTx: (tx: Tx) => void;
  onFlag: (tx: Tx) => void;
  loading?: boolean;
}

export function TransactionTable({ 
  transactions, 
  selectedTx, 
  onSelectTx, 
  onFlag, 
  loading 
}: TransactionTableProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('$', '');
  };

  const truncateAddress = (addr: string, length = 6) => {
    if (addr.length <= length * 2) return addr;
    return `${addr.slice(0, length)}...${addr.slice(-length)}`;
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="p-6 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
              <div className="h-4 bg-muted animate-pulse rounded w-16" />
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
              <div className="h-4 bg-muted animate-pulse rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-2">Time</div>
          <div className="col-span-3">Signature</div>
          <div className="col-span-2">From</div>
          <div className="col-span-2">To</div>
          <div className="col-span-1 text-right">Amount</div>
          <div className="col-span-1 text-center">Risk</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>
      </div>

      {/* Rows */}
      <div className="max-h-[600px] overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-lg">No transactions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.sig}
              className={`soc-table-row px-6 py-3 grid grid-cols-12 gap-4 items-center ${
                selectedTx?.sig === tx.sig ? 'bg-primary/10 border-primary/20' : ''
              }`}
              onClick={() => onSelectTx(tx)}
            >
              {/* Time */}
              <div className="col-span-2">
                <div className="text-sm">
                  {formatDistanceToNow(new Date(tx.tsISO), { addSuffix: true })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(tx.tsISO).toLocaleTimeString()}
                </div>
              </div>

              {/* Signature */}
              <div className="col-span-3">
                <div className="mono-hash flex items-center gap-2">
                  <span className="text-primary">{truncateAddress(tx.sig, 8)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => copyToClipboard(tx.sig, e)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1 mt-1">
                  {tx.labels.slice(0, 2).map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs py-0 px-1.5">
                      {label}
                    </Badge>
                  ))}
                  {tx.labels.length > 2 && (
                    <Badge variant="outline" className="text-xs py-0 px-1.5">
                      +{tx.labels.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* From */}
              <div className="col-span-2">
                <div className="mono-hash text-sm">{truncateAddress(tx.from)}</div>
              </div>

              {/* To */}
              <div className="col-span-2">
                <div className="mono-hash text-sm">{truncateAddress(tx.to)}</div>
              </div>

              {/* Amount */}
              <div className="col-span-1 text-right">
                <div className="text-sm font-medium">
                  {formatAmount(tx.amountUSDT)}
                </div>
                <div className="text-xs text-muted-foreground">USDT</div>
              </div>

              {/* Risk */}
              <div className="col-span-1 text-center">
                <Badge className={`risk-chip ${getRiskColor(tx.risk)}`}>
                  {tx.risk}
                </Badge>
              </div>

              {/* Actions */}
              <div className="col-span-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlag(tx);
                    }}
                  >
                    <Flag className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://solscan.io/tx/${tx.sig}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}