import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Filter,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Coffee,
  MoreHorizontal,
  EyeOff,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionToggle } from "@/components/TransactionToggle";
import { TransactionActions } from "@/components/TransactionActions";
import { fuzzySearch } from "@/utils/fuzzySearch";
import { exportToPDF } from "@/utils/pdfExport";

export const Transactions = () => {
  const { transactions, loading, refetch, fetchHiddenTransactions, unhideTransaction } = useTransactions();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [hiddenTransactions, setHiddenTransactions] = useState<any[]>([]);
  const [hasVerified, setHasVerified] = useState(false);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (activeType !== "all") {
      filtered = filtered.filter((t) => t.type === activeType);
    }

    // Filter by search term
    if (searchQuery.trim()) {
      filtered = fuzzySearch(filtered, searchQuery);
    }

    return filtered;
  }, [transactions, searchQuery, activeType]);

  // Pagination
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );

  const handleExportPDF = () => {
    const dashboardData = {
      totalIncome: transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: Math.abs(
        transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      ),
    };
    exportToPDF(filteredTransactions, dashboardData);
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = Math.abs(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
    return type === "income" ? `+${formatted}` : `-${formatted}`;
  };

  const getAmountColor = (type: string) => {
    return type === "income" ? "text-success" : "text-destructive";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Salary: "bg-success/20 text-success",
      Freelance: "bg-success/20 text-success",
      Food: "bg-info/20 text-info",
      Transportation: "bg-warning/20 text-warning",
      Housing: "bg-destructive/20 text-destructive",
      Dining: "bg-primary/20 text-primary",
      Coffee: "bg-accent/20 text-accent",
      Shopping: "bg-secondary/20 text-secondary-foreground",
    };
    return colors[category] || "bg-muted/20 text-muted-foreground";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOpenHiddenTransactions = () => {
    setShowHiddenModal(true);
    setPasswordInput("");
    setHasVerified(false);
    setHiddenTransactions([]);
  };

  const handleVerifyPassword = async () => {
    if (!passwordInput.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-password", {
        body: { password: passwordInput },
      });

      if (error) throw error;

      if (data?.valid) {
        // Password correct, fetch hidden transactions
        const hidden = await fetchHiddenTransactions();
        setHiddenTransactions(hidden);
        setHasVerified(true);
        setPasswordInput("");
        
        if (hidden.length > 0) {
          toast({
            title: "Access Granted",
            description: "Viewing hidden transactions",
          });
        }
      } else {
        toast({
          title: "Incorrect Password",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      toast({
        title: "Error",
        description: "Failed to verify password",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnhideTransaction = async (transactionId: string) => {
    try {
      await unhideTransaction(transactionId);
      const updated = await fetchHiddenTransactions();
      setHiddenTransactions(updated);
      toast({
        title: "Transaction Unhidden",
        description: "Transaction is now visible again",
      });
    } catch (error) {
      console.error("Error unhiding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to unhide transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            All Transactions
          </h1>
          <p className="text-muted-foreground">
            View and manage your financial transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 hover-scale transition-transform"
            onClick={handleExportPDF}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>

          <Button className="gradient-primary glow-primary gap-2 hover-scale transition-transform">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex flex-col md:flex-row gap-4 lg:flex-1">
            <div className="relative md:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <TransactionToggle
              activeType={activeType}
              onTypeChange={setActiveType}
            />
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Transactions ({filteredTransactions.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <>
              {paginatedTransactions.map((transaction) => {
                const getIcon = (category: string) => {
                  const iconMap: Record<string, any> = {
                    Salary: ArrowUpCircle,
                    Food: ShoppingCart,
                    Transportation: Car,
                    Housing: Home,
                    Dining: Utensils,
                    Coffee: Coffee,
                  };
                  return iconMap[category] || ArrowDownCircle;
                };

                const IconComponent = getIcon(transaction.category);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-muted/20">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground">
                          {transaction.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant="secondary"
                            className={getCategoryColor(transaction.category)}
                          >
                            {transaction.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold text-lg ${getAmountColor(
                          transaction.type
                        )}`}
                      >
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                      <TransactionActions
                        transaction={transaction}
                        onUpdate={refetch}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-6 pt-6 border-t border-white/10">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "hover-scale transition-transform"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="hover-scale transition-transform"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "hover-scale transition-transform"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Hidden Transactions Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleOpenHiddenTransactions}
        >
          <EyeOff className="w-4 h-4" />
          View Hidden Transactions
        </Button>
      </div>

      {/* Hidden Transactions Modal */}
      <Dialog open={showHiddenModal} onOpenChange={setShowHiddenModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5" />
              Hidden Transactions
            </DialogTitle>
          </DialogHeader>

          {!hasVerified ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your password to view hidden transactions
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyPassword();
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleVerifyPassword}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          ) : hiddenTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤪</div>
              <p className="text-lg font-medium text-muted-foreground">
                Don't try to fool me because there are no hidden transactions
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {hiddenTransactions.length} hidden transaction(s)
              </p>
              {hiddenTransactions.map((transaction) => {
                const getIcon = (category: string) => {
                  const iconMap: Record<string, any> = {
                    Salary: ArrowUpCircle,
                    Food: ShoppingCart,
                    Transportation: Car,
                    Housing: Home,
                    Dining: Utensils,
                    Coffee: Coffee,
                  };
                  return iconMap[category] || ArrowDownCircle;
                };

                const IconComponent = getIcon(transaction.category);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-muted/20">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground">
                          {transaction.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant="secondary"
                            className={getCategoryColor(transaction.category)}
                          >
                            {transaction.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold text-lg ${getAmountColor(
                          transaction.type
                        )}`}
                      >
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnhideTransaction(transaction.id)}
                      >
                        Unhide
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setHiddenTransactions([]);
                  setShowHiddenModal(false);
                }}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
