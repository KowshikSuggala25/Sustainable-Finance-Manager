import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import {
  Sprout,
  Leaf,
  TreePine,
  Recycle,
  Car,
  Home,
  Lightbulb,
  Loader2,
  X,
} from "lucide-react";

export const CarbonFootprint = () => {
  const [footprintData, setFootprintData] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { transactions, getTotalExpenses } = useTransactions();

  // Calculate carbon footprint based on actual transactions
  useEffect(() => {
    console.log(
      "Calculating carbon footprint for",
      transactions?.length || 0,
      "transactions"
    );

    if (!transactions || transactions.length === 0) {
      setFootprintData([]);
      return;
    }

    // Calculate spending by category and convert to carbon footprint
    const categorySpending: { [key: string]: number } = {};

    transactions.forEach((transaction: any) => {
      if (transaction.type === "expense") {
        // Normalize category names to match mapping keys
        let category = transaction.category || "Other";
        
        // Map common variations to standard categories (case-insensitive)
        const categoryMap: { [key: string]: string } = {
          "transportation": "Transportation",
          "travel": "Travel",
          "food & dining": "Food & Dining",
          "food and dining": "Food & Dining",
          "food": "Food & Dining",
          "dining": "Food & Dining",
          "shopping": "Shopping",
          "bills & utilities": "Bills & Utilities",
          "bills and utilities": "Bills & Utilities",
          "utilities": "Bills & Utilities",
          "entertainment": "Entertainment",
          "healthcare": "Healthcare",
          "other expenses": "Other expenses",
          "housing": "Housing",
          "insurance": "Insurance",
          "savings": "Savings",
          "other": "Other"
        };
        
        const normalizedCategory = categoryMap[category.toLowerCase()] || category;
        const amount = Math.abs(parseFloat(transaction.amount));
        categorySpending[normalizedCategory] = (categorySpending[normalizedCategory] || 0) + amount;
      }
    });

    console.log("Category spending breakdown:", categorySpending);

    // Convert spending to carbon footprint with comprehensive category mappings
    const categoryMappings: {
      [key: string]: {
        icon: any;
        color: string;
        bgColor: string;
        factor: number; // kg CO2 per rupee spent
      };
    } = {
      Transportation: {
        icon: Car,
        color: "text-destructive",
        bgColor: "bg-destructive/20",
        factor: 0.0005, // Higher factor for transportation
      },
      Travel: {
        icon: Car,
        color: "text-destructive",
        bgColor: "bg-destructive/20",
        factor: 0.0005, // Same as transportation
      },
      "Food & Dining": {
        icon: Leaf,
        color: "text-info",
        bgColor: "bg-info/20",
        factor: 0.0003, // Food has significant carbon impact
      },
      Shopping: {
        icon: Lightbulb,
        color: "text-warning",
        bgColor: "bg-warning/20",
        factor: 0.0002, // Manufacturing and shipping
      },
      "Bills & Utilities": {
        icon: Home,
        color: "text-warning",
        bgColor: "bg-warning/20",
        factor: 0.0006, // Electricity/gas consumption
      },
      Entertainment: {
        icon: Lightbulb,
        color: "text-success",
        bgColor: "bg-success/20",
        factor: 0.00015, // Digital services, events
      },
      Healthcare: {
        icon: Lightbulb,
        color: "text-info",
        bgColor: "bg-info/20",
        factor: 0.0001, // Medical services generally lower
      },
      "Other expenses": {
        icon: Lightbulb,
        color: "text-muted-foreground",
        bgColor: "bg-muted/20",
        factor: 0.0002, // Default factor for other expenses
      },
      Housing: {
        icon: Home,
        color: "text-warning",
        bgColor: "bg-warning/20",
        factor: 0.0004, // Housing related expenses
      },
      Insurance: {
        icon: Lightbulb,
        color: "text-info",
        bgColor: "bg-info/20",
        factor: 0.00005, // Low carbon impact
      },
      Savings: {
        icon: Lightbulb,
        color: "text-success",
        bgColor: "bg-success/20",
        factor: 0.00001, // Minimal carbon impact
      },
      Other: {
        icon: Lightbulb,
        color: "text-muted-foreground",
        bgColor: "bg-muted/20",
        factor: 0.0002, // Default factor
      },
    };

    const carbonData = Object.entries(categorySpending)
      .map(([category, amount]) => {
        const mapping = categoryMappings[category] || categoryMappings["Other"];
        const valueKg = amount * mapping.factor; // kg CO2
        const valueTons = valueKg / 1000; // Convert to tons CO2
        return {
          category,
          value: valueTons,
          valueKg: valueKg,
          icon: mapping.icon,
          color: mapping.color,
          bgColor: mapping.bgColor,
        };
      })
      .filter((item) => item.valueKg > 0);

    console.log("Final carbon data:", carbonData);
    setFootprintData(carbonData);
  }, [transactions]);

  const totalFootprint = footprintData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const handleViewTips = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to get personalized tips",
        variant: "destructive",
      });
      return;
    }

    if (totalFootprint === 0) {
      toast({
        title: "No Data Available",
        description: "Add some transactions to get personalized carbon tips",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingTips(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-carbon-tips",
        {
          headers: {
            Authorization: `Bearer ${
              (
                await supabase.auth.getSession()
              ).data.session?.access_token
            }`,
          },
        }
      );

      if (error) throw error;

      setTips(data.tips || []);
      setShowTipsModal(true);
      toast({
        title: "Tips Generated",
        description: "AI-powered tips based on your spending patterns!",
      });
    } catch (error) {
      console.error("Error generating tips:", error);
      toast({
        title: "Error",
        description: "Failed to generate personalized tips",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTips(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            Carbon Footprint
          </h1>
          <p className="text-muted-foreground">
            Track your environmental impact and make sustainable choices
          </p>
        </div>

        <Dialog open={showTipsModal} onOpenChange={setShowTipsModal}>
          <DialogTrigger asChild>
            <Button
              className="gradient-success glow-primary hover-scale transition-transform"
              onClick={handleViewTips}
              disabled={isLoadingTips}
            >
              {isLoadingTips ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Recycle className="w-4 h-4 mr-2" />
              )}
              {isLoadingTips ? "Generating..." : "View AI Tips"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                Personalized Carbon Reduction Tips
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/10 border border-white/5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Leaf className="w-5 h-5 text-success" />
                    <h4 className="font-medium text-foreground">
                      {tip.category}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {tip.tip}
                  </p>
                  <p className="text-xs text-info font-medium">{tip.impact}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Footprint */}
      <Card className="glass-card p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-success/20">
            <Sprout className="w-12 h-12 text-success" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-foreground">
              {totalFootprint > 0 
                ? `${(totalFootprint * 1000).toFixed(2)} kg` 
                : "0.00 kg"} CO₂
            </h2>
            <p className="text-lg text-muted-foreground">
              ({totalFootprint.toFixed(3)} tons) • (
              {Math.ceil((totalFootprint * 1000) / 22)} trees needed to offset)
            </p>
          </div>
          {totalFootprint > 0 ? (
            <div className="flex items-center gap-2 text-success">
              <TreePine className="w-4 h-4" />
              <span className="text-sm">Based on all your expenses</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <TreePine className="w-4 h-4" />
              <span className="text-sm">
                Add transactions to see your footprint
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {footprintData.length > 0 ? (
          footprintData.map((item, index) => (
            <Card key={index} className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${item.bgColor}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {item.category}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {item.valueKg.toFixed(2)} kg
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CO₂ emissions
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="p-4 rounded-full bg-muted/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Sprout className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              No carbon footprint data
            </p>
            <p className="text-sm text-muted-foreground">
              Start adding transactions to track your environmental impact
            </p>
          </div>
        )}
      </div>

      {/* Default Tips */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          General Eco-Friendly Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/10 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Car className="w-5 h-5 text-info" />
              <h4 className="font-medium text-foreground">Transportation</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Use public transport or bike to reduce emissions
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/10 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Home className="w-5 h-5 text-warning" />
              <h4 className="font-medium text-foreground">Energy</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Switch to LED bulbs and unplug devices when not in use
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/10 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="w-5 h-5 text-success" />
              <h4 className="font-medium text-foreground">Food</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose local and seasonal produce to reduce food miles
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
