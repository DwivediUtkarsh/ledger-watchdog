import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Flag, 
  ExternalLink, 
  Copy, 
  Clock, 
  ArrowRight, 
  Shield, 
  TrendingUp,
  Eye,
  EyeOff
} from "lucide-react";
import { Tx, getRiskColor } from "@/types";
import { fetchTransactionDetails, mockUser } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";

interface TransactionDrawerProps {
  transaction: Tx | null;
  open: boolean;
  onClose: () => void;
  onFlag: (tx: Tx) => void;
}

export function TransactionDrawer({ transaction, open, onClose, onFlag }: TransactionDrawerProps) {
  const [details, setDetails] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSensitive, setShowSensitive] = useState(mockUser.isVerified);

  useEffect(() => {
    if (transaction && open) {
      setLoading(true);
      fetchTransactionDetails(transaction.sig)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [transaction, open]);

  if (!transaction) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('$', '');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = () => {
    window.open(`https://solscan.io/tx/${transaction.sig}`, '_blank');
  };

  const maskAddress = (addr: string) => {
    if (showSensitive) return addr;
    return `${addr.slice(0, 4)}${'*'.repeat(addr.length - 8)}${addr.slice(-4)}`;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base">Transaction Details</SheetTitle>
                <SheetDescription className="mono-hash text-xs mt-1">
                  {transaction.sig.slice(0, 16)}...
                </SheetDescription>
              </div>
              <Badge className={`risk-chip ${getRiskColor(transaction.risk)}`}>
                Risk {transaction.risk}
              </Badge>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Verification Gate */}
              {!mockUser.isVerified && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <p className="text-sm font-medium text-amber-400">Verification Required</p>
                  </div>
                  <p className="text-xs text-amber-300/80 mb-3">
                    Some details are masked. Verify your account to access full transaction data.
                  </p>
                  <Button size="sm" variant="outline" className="text-amber-400 border-amber-500/30">
                    Verify Account
                  </Button>
                </div>
              )}

              {/* Overview Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
                  <div>
                    <p className="text-sm font-medium">
                      {formatDistanceToNow(new Date(transaction.tsISO), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.tsISO).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {formatAmount(transaction.amountUSDT)} USDT
                    </p>
                    <p className="text-xs text-muted-foreground">USD Tether</p>
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Signature</p>
                  <div className="flex items-center gap-2">
                    <code className="mono-hash text-xs bg-muted/50 px-2 py-1 rounded flex-1 truncate">
                      {transaction.sig}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(transaction.sig)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Addresses */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Transaction Flow</p>
                  {!mockUser.isVerified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowSensitive(!showSensitive)}
                    >
                      {showSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <code className="mono-hash text-sm">{maskAddress(transaction.from)}</code>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(transaction.from)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">To</p>
                      <code className="mono-hash text-sm">{maskAddress(transaction.to)}</code>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(transaction.to)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Labels & Hints */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Risk Indicators</p>
                  <div className="flex flex-wrap gap-2">
                    {transaction.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {transaction.hints.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Analysis Hints</p>
                    <div className="space-y-1">
                      {transaction.hints.map((hint, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {hint}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Risk History Chart (Placeholder) */}
              {details?.riskHistory && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Risk Trend</p>
                    </div>
                    <div className="h-16 bg-muted/30 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        Risk sparkline: {details.riskHistory.map(r => r.risk).join(' → ')}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {loading && (
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => onFlag(transaction)}
                className="flex-1"
                disabled={!mockUser.isVerified}
              >
                <Flag className="h-4 w-4 mr-2" />
                Flag Transaction
              </Button>
              <Button
                variant="outline"
                onClick={openInExplorer}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Explorer
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(transaction.sig)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {!mockUser.isVerified && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Verification required to submit flags
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}