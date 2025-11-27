import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Coffee,
  History,
} from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";

import { TransactionActions } from "./TransactionActions";

interface RecentTransactionsProps {
  onNavigate?: (tab: string) => void;
}

export const RecentTransactions = ({ onNavigate }: RecentTransactionsProps) => {
  const { getRecentTransactions, refetch } = useTransactions();
  const transactions = getRecentTransactions(8);

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-success" : "text-destructive";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Salary: "bg-success/20 text-success",
      Food: "bg-info/20 text-info",
      Transportation: "bg-warning/20 text-warning",
      Housing: "bg-destructive/20 text-destructive",
      Dining: "bg-primary/20 text-primary",
      Coffee: "bg-accent/20 text-accent",
    };
    return colors[category] || "bg-muted/20 text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Transaction History
        </h3>
        <Button
          onClick={() => onNavigate?.("transactions")}
          variant="outline"
          size="sm"
          className="gap-2 hover-scale transition-transform"
        >
          <History className="w-4 h-4" />
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => {
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
                  className={`font-semibold ${getAmountColor(
                    transaction.amount
                  )}`}
                >
                  {formatAmount(transaction.amount)}
                </span>
                <TransactionActions
                  transaction={transaction}
                  onUpdate={refetch}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
