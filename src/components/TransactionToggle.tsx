import { Button } from "../components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TransactionToggleProps {
  activeType: "all" | "income" | "expense";
  onTypeChange: (type: "all" | "income" | "expense") => void;
}

export const TransactionToggle = ({
  activeType,
  onTypeChange,
}: TransactionToggleProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-lg border border-white/10">
      <Button
        variant={activeType === "all" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTypeChange("all")}
        className={`px-4 py-2 transition-all duration-200 ${
          activeType === "all"
            ? "gradient-primary glow-primary shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </Button>

      <Button
        variant={activeType === "income" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTypeChange("income")}
        className={`px-4 py-2 gap-2 transition-all duration-200 ${
          activeType === "income"
            ? "gradient-success glow-success shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        Income
      </Button>

      <Button
        variant={activeType === "expense" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTypeChange("expense")}
        className={`px-4 py-2 gap-2 transition-all duration-200 ${
          activeType === "expense"
            ? "gradient-danger glow-danger shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <TrendingDown className="w-4 h-4" />
        Expense
      </Button>
    </div>
  );
};
