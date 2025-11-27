import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PlusCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ExpenseChart } from "./charts/ExpenseChart";
import { CategoryChart } from "./charts/CategoryChart";
import { RecentTransactions } from "./RecentTransactions";
import { useTransactions } from "../hooks/useTransactions";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [showBalance, setShowBalance] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const { user } = useAuth();
  const {
    getTotalIncome,
    getTotalExpenses,
    getTotalSavings,
    getCategoryData,
    loading,
    transactions,
  } = useTransactions();

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const netSavings = getTotalSavings();
  const budgetRemaining = totalIncome - totalExpenses;
  const budgetUsed =
    monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  // Fetch user's budget from profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("budget")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setMonthlyBudget(data.budget || 0);
      }
    };

    fetchProfile();
  }, [user]);

  const statsCards = [
    {
      title: "Total Income",
      amount: totalIncome,
      icon: TrendingUp,
      variant: "success" as const,
      trend: "+12.5%",
    },
    {
      title: "Total Expenses",
      amount: totalExpenses,
      icon: TrendingDown,
      variant: "danger" as const,
      trend: "+8.2%",
    },
    {
      title: "Net Savings",
      amount: netSavings,
      icon: Wallet,
      variant: "info" as const,
      trend: "+24.1%",
    },
    {
      title: "Budget Remaining",
      amount: budgetRemaining,
      icon: DollarSign,
      variant: "warning" as const,
      trend:
        monthlyBudget > 0 ? `${budgetUsed.toFixed(1)}% used` : "Net balance",
    },
  ];

  const formatCurrency = (amount: number) => {
    return showBalance
      ? `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : "****";
  };

  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case "success":
        return "gradient-success glow-primary";
      case "danger":
        return "gradient-danger";
      case "info":
        return "gradient-info";
      case "warning":
        return "gradient-primary";
      default:
        return "glass-card";
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your financial health and make informed decisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="gap-2 hover-scale transition-transform duration-300 hover:bg-muted/30"
          >
            {showBalance ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showBalance ? "Hide" : "Show"} Balance
          </Button>

          <Button
            onClick={() => onNavigate?.("add")}
            className="gradient-primary glow-primary gap-2 hover-scale transition-transform duration-300"
          >
            <PlusCircle className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className={`glass-card p-6 hover:scale-105 transition-transform duration-200 ${getVariantClasses(
              stat.variant
            )}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stat.amount)}
                </p>
                <p className="text-xs text-foreground/60 mt-1">{stat.trend}</p>
              </div>
              <div className="p-3 rounded-full bg-white/10">
                <stat.icon className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Income vs Expenses
            </h3>
            <p className="text-sm text-muted-foreground">
              Monthly trend analysis
            </p>
          </div>
          <ExpenseChart />
        </Card>

        <Card className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Spending by Category
            </h3>
            <p className="text-sm text-muted-foreground">
              Where your money goes
            </p>
          </div>
          <CategoryChart categoryData={getCategoryData()} />
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Recent Transactions
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest financial activity
          </p>
        </div>
        <RecentTransactions onNavigate={onNavigate} />
      </Card>
    </div>
  );
};
