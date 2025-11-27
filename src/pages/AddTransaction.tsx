import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  DollarSign,
  IndianRupee,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/useTransactions";
import { MoneyAnimation } from "@/components/MoneyAnimation";
import { AnimatePresence } from "framer-motion";

export const AddTransaction = () => {
  const { toast } = useToast();
  const { addTransaction } = useTransactions();
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<"income" | "expense">("income");
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const incomeCategories = [
    "Salary",
    "Freelance",
    "Investment Returns",
    "Business Income",
    "Gifts",
    "Other Income",
  ];

  const expenseCategories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Education",
    "Travel",
    "Housing",
    "Insurance",
    "Other Expenses",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const transaction = {
        title: formData.description,
        amount:
          transactionType === "expense"
            ? -Math.abs(parseFloat(formData.amount))
            : parseFloat(formData.amount),
        type: transactionType,
        category: formData.category,
        date: formData.date || new Date().toISOString(),
        notes: formData.notes,
      };

      await addTransaction(transaction);

      // Trigger animation
      setAnimationType(transactionType);
      setShowAnimation(true);

      toast({
        title: "Transaction Added",
        description: `${
          transactionType === "income" ? "Income" : "Expense"
        } of ₹${formData.amount} has been added successfully.`,
      });

      // Reset form
      setFormData({
        amount: "",
        description: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      {/* Money Animation Overlay */}
      <AnimatePresence>
        {showAnimation && (
          <MoneyAnimation
            type={animationType}
            onComplete={() => setShowAnimation(false)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground font-heading">
          Add New Transaction
        </h1>
        <p className="text-muted-foreground">
          Track your income and expenses to maintain financial clarity
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Transaction Type Selector */}
        <Card className="glass-card p-6">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={transactionType === "income" ? "default" : "outline"}
              className={`h-16 gap-3 ${
                transactionType === "income"
                  ? "gradient-success glow-primary"
                  : ""
              }`}
              onClick={() => setTransactionType("income")}
            >
              <TrendingUp className="w-6 h-6" />
              <div className="text-left">
                <div className="font-medium">Income</div>
                <div className="text-sm opacity-70">Money received</div>
              </div>
            </Button>

            <Button
              variant={transactionType === "expense" ? "default" : "outline"}
              className={`h-16 gap-3 ${
                transactionType === "expense" ? "gradient-danger" : ""
              }`}
              onClick={() => setTransactionType("expense")}
            >
              <TrendingDown className="w-6 h-6" />
              <div className="text-left">
                <div className="font-medium">Expense</div>
                <div className="text-sm opacity-70">Money spent</div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Transaction Form */}
        <Card className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground font-medium">
                Amount *
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  className="pl-10 text-lg font-medium"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-foreground font-medium"
              >
                Description *
              </Label>
              <Input
                id="description"
                placeholder="What was this transaction for?"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(transactionType === "income"
                    ? incomeCategories
                    : expenseCategories
                  ).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground font-medium">
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground font-medium">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full h-12 text-lg font-medium gap-2 ${
                transactionType === "income"
                  ? "gradient-success glow-primary"
                  : "gradient-danger"
              }`}
            >
              <Plus className="w-5 h-5" />
              Add {transactionType === "income" ? "Income" : "Expense"}
            </Button>
          </form>
        </Card>

        {/* Quick Tips */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quick Tips
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>
                Be specific with descriptions to easily track spending patterns
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>
                Choose the most accurate category for better financial insights
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>
                Add notes for important transactions you might reference later
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
};
