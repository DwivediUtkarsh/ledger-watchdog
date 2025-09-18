import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, Plus, X, AlertTriangle, Star, Coins } from "lucide-react";
import { Tx, FlagInput, calculatePoints } from "@/types";
import { mockUser, submitFlag } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

interface FlagModalProps {
  transaction: Tx | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (flag: FlagInput) => void;
}

const categories = [
  "Phishing / Fake Airdrop",
  "Mixer / Tumbler", 
  "Bridge / Cross-chain",
  "MEV / Sandwich Attack",
  "Token Drainer",
  "Fake DEX",
  "Rug Pull",
  "Wash Trading",
  "Other Suspicious Activity"
];

export function FlagModal({ transaction, open, onClose, onSubmit }: FlagModalProps) {
  const [category, setCategory] = useState<string>("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [confidence, setConfidence] = useState<number[]>([75]);
  const [notes, setNotes] = useState<string>("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setCategory("");
      setSeverity("medium");
      setConfidence([75]);
      setNotes("");
      setEvidenceUrls([""]);
    }
  }, [open, transaction]);

  const addEvidenceUrl = () => {
    setEvidenceUrls([...evidenceUrls, ""]);
  };

  const removeEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const updateEvidenceUrl = (index: number, url: string) => {
    const updated = [...evidenceUrls];
    updated[index] = url;
    setEvidenceUrls(updated);
  };

  const previewPoints = transaction ? 
    calculatePoints(severity, confidence[0], mockUser.isVerified) : 0;

  const canSubmit = transaction && category && notes.length >= 20 && mockUser.isVerified;

  const handleSubmit = async () => {
    if (!canSubmit || !transaction) return;

    const flag: FlagInput = {
      txSig: transaction.sig,
      category,
      severity,
      confidence: confidence[0],
      notes,
      evidenceUrls: evidenceUrls.filter(url => url.trim() !== "")
    };

    setSubmitting(true);
    try {
      const result = await submitFlag(flag);
      if (result.success) {
        toast({
          title: "Flag submitted successfully",
          description: `+${result.points} points earned`,
        });
        onSubmit(flag);
        onClose();
      }
    } catch (error) {
      toast({
        title: "Failed to submit flag",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Flag Suspicious Transaction
          </DialogTitle>
          <DialogDescription className="mono-hash">
            {transaction.sig.slice(0, 16)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Verification Warning */}
          {!mockUser.isVerified && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-medium text-amber-400">Account Not Verified</p>
              </div>
              <p className="text-xs text-amber-300/80">
                Unverified submissions receive 30% reduced points and may have delayed processing.
              </p>
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Severity <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((sev) => (
                <Button
                  key={sev}
                  variant={severity === sev ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverity(sev)}
                  className="capitalize"
                >
                  {sev}
                </Button>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Confidence <span className="text-destructive">*</span>
              </Label>
              <Badge variant="outline" className="text-xs">
                {confidence[0]}%
              </Badge>
            </div>
            <Slider
              value={confidence}
              onValueChange={setConfidence}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low (10%)</span>
              <span>High (100%)</span>
            </div>
          </div>

          {/* Evidence URLs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Evidence URLs</Label>
            <div className="space-y-2">
              {evidenceUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://solscan.io/tx/..."
                    value={url}
                    onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                    className="flex-1"
                  />
                  {evidenceUrls.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEvidenceUrl(index)}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {evidenceUrls.length < 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addEvidenceUrl}
                  className="w-full border-2 border-dashed border-border/50 hover:border-border"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Evidence URL
                </Button>
              )}
            </div>
          </div>

          {/* Analysis Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Analysis & Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Describe the suspicious activity, patterns observed, and your analysis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 20 characters required</span>
              <span className={notes.length >= 20 ? "text-emerald-400" : ""}>
                {notes.length}/20
              </span>
            </div>
          </div>

          <Separator />

          {/* Reward Preview */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Reward Preview</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-lg font-bold text-primary">
                  +{previewPoints}
                </span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">Base</p>
                <p className="font-medium">
                  {severity === "low" ? 12 : severity === "medium" ? 25 : 40} pts
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Confidence</p>
                <p className="font-medium">×{((confidence[0] / 100) * 1.2 + 0.4).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {mockUser.isVerified ? "Verified" : "×0.3"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex-1"
            >
              {submitting ? "Submitting..." : "Submit Flag"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {!mockUser.isVerified && (
            <p className="text-xs text-center text-muted-foreground">
              Verify your account to unlock full submission privileges
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}