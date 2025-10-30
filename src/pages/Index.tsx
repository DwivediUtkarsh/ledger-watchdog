import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { FlagModal } from "@/components/transactions/FlagModal";
import { FilterPanel } from "@/components/transactions/FilterPanel";
import { MiniLeaderboard } from "@/components/user/MiniLeaderboard";
import { Tx, FilterState, FlagInput } from "@/types";
import { fetchTransactions } from "@/lib/api";
import { mockUser } from "@/lib/mockData";
import { config } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [flaggingTx, setFlaggingTx] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    minAmount: 0,
    minRisk: 0
  });
  const { toast } = useToast();

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch recent USDT transactions with reasonable limits for live feed
      const txs = await fetchTransactions({
        ...filters,
        limit: config.liveFeed.defaultLimit,
        lookback: config.liveFeed.defaultLookback,
      });
      setTransactions(txs);
      
      // Show info if no transactions found
      if (txs.length === 0) {
        toast({
          title: "No recent transactions",
          description: "No USDT transfers found in the last 24 hours. The feed will update every 30 minutes.",
        });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Failed to load transactions",
        description: "Unable to fetch live USDT transactions. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Auto-refresh for live feed
  useEffect(() => {
    const interval = setInterval(() => {
      loadTransactions();
    }, config.liveFeed.refreshInterval);

    return () => clearInterval(interval);
  }, [loadTransactions]);

  // Handlers
  const handleSelectTx = (tx: Tx) => {
    setSelectedTx(tx);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTx(null);
  };

  const handleFlag = (tx: Tx) => {
    setFlaggingTx(tx);
    setFlagModalOpen(true);
    setDrawerOpen(false);
  };

  const handleCloseFlagModal = () => {
    setFlagModalOpen(false);
    setFlaggingTx(null);
  };

  const handleSubmitFlag = (flag: FlagInput) => {
    toast({
      title: "Flag submitted",
      description: "Your analysis has been submitted for review",
    });
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      query: "",
      minAmount: 0,
      minRisk: 0
    });
  };

  const handleKeyboardShortcut = () => {
    toast({
      title: "Keyboard Shortcuts",
      description: "/ - Focus search • Enter - Open first row • F - Flag • Esc - Close",
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "/":
          e.preventDefault();
          // Focus search input
          break;
        case "Enter":
          if (transactions.length > 0 && !drawerOpen) {
            handleSelectTx(transactions[0]);
          }
          break;
        case "f":
        case "F":
          if (selectedTx && drawerOpen) {
            handleFlag(selectedTx);
          }
          break;
        case "Escape":
          if (flagModalOpen) {
            handleCloseFlagModal();
          } else if (drawerOpen) {
            handleCloseDrawer();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [transactions, selectedTx, drawerOpen, flagModalOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        searchQuery={filters.query}
        onSearchChange={(query) => setFilters({ ...filters, query })}
        onKeyboardShortcut={handleKeyboardShortcut}
      />

      {/* Main Layout */}
      <div className="flex gap-6 p-6">
        {/* Left Sidebar */}
        <div className="w-80 space-y-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
          <MiniLeaderboard />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Live USDT Transaction Feed (24h)</h1>
                <p className="text-muted-foreground">
                  {loading ? "Loading..." : `${transactions.length} transactions found`}
                  {!loading && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                      Live (updates every 30 min)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <TransactionTable
              transactions={transactions}
              selectedTx={selectedTx}
              onSelectTx={handleSelectTx}
              onFlag={handleFlag}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Drawer */}
      <TransactionDrawer
        transaction={selectedTx}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onFlag={handleFlag}
      />

      {/* Flag Modal */}
      <FlagModal
        transaction={flaggingTx}
        open={flagModalOpen}
        onClose={handleCloseFlagModal}
        onSubmit={handleSubmitFlag}
      />
    </div>
  );
};

export default Index;
