import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PlusCircle,
  Eye,
  EyeOff,
  Filter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  format,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getYear,
  getMonth,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "yearly">(
    "monthly",
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { user } = useAuth();
  const { loading, transactions } = useTransactions();

  // Navigate date based on time range
  const navigateDate = (direction: number) => {
    if (timeRange === "weekly") {
      setSelectedDate((prev) =>
        direction > 0 ? addDays(prev, 7) : subDays(prev, 7),
      );
    } else if (timeRange === "monthly") {
      setSelectedDate((prev) =>
        direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1),
      );
    } else if (timeRange === "yearly") {
      setSelectedDate((prev) =>
        direction > 0 ? addYears(prev, 1) : subYears(prev, 1),
      );
    }
  };

  const getDateLabel = () => {
    if (timeRange === "weekly") {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else if (timeRange === "monthly") {
      return format(selectedDate, "MMMM yyyy");
    } else if (timeRange === "yearly") {
      return format(selectedDate, "yyyy");
    }
    return "";
  };

  // Filter transactions based on time range and selected date
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);

      if (timeRange === "yearly") {
        return tDate.getFullYear() === selectedDate.getFullYear();
      } else if (timeRange === "monthly") {
        return (
          tDate.getMonth() === selectedDate.getMonth() &&
          tDate.getFullYear() === selectedDate.getFullYear()
        );
      } else if (timeRange === "weekly") {
        const start = startOfWeek(selectedDate);
        const end = endOfWeek(selectedDate);
        // Set time to boundaries to include all transactions in that range
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return tDate >= start && tDate <= end;
      }
      return true;
    });
  }, [transactions, timeRange, selectedDate]);

  // Calculate totals based on filtered transactions
  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
    [filteredTransactions],
  );

  const netSavings = useMemo(() => {
    return filteredTransactions
      .filter(
        (t) =>
          t.category?.toLowerCase() === "savings" ||
          (t.category?.toLowerCase() === "other expenses" &&
            (t.title?.toLowerCase().includes("savings") ||
              t.notes?.toLowerCase().includes("savings"))),
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [filteredTransactions]);

  const budgetRemaining = totalIncome - totalExpenses;
  const budgetUsed =
    monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  // Generate category data from filtered transactions
  const categoryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};

    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category || "Other";
        categoryTotals[category] =
          (categoryTotals[category] || 0) +
          Math.abs(Number(transaction.amount));
      });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], index) => ({
        name,
        value,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      }));
  }, [filteredTransactions]);

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
          <Select
            value={timeRange}
            onValueChange={(v: "weekly" | "monthly" | "yearly") =>
              setTimeRange(v)
            }
          >
            <SelectTrigger className="w-[130px] h-9 bg-background/50 backdrop-blur border-input">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Navigator */}
          <div className="flex items-center bg-background/50 backdrop-blur border border-input rounded-md h-9">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-l-md rounded-r-none hover:bg-muted"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-4 font-normal rounded-none hover:bg-muted min-w-[140px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDateLabel()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-r-md rounded-l-none hover:bg-muted"
              onClick={() => navigateDate(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
              stat.variant,
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
            <p className="text-sm text-muted-foreground capitalize">
              {getDateLabel()} trend analysis
            </p>
          </div>
          <ExpenseChart
            transactions={filteredTransactions}
            timeRange={timeRange}
          />
        </Card>

        <Card className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Spending by Category
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {getDateLabel()} spending breakdown
            </p>
          </div>
          <CategoryChart categoryData={categoryData} />
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
