import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";

interface ExpenseChartProps {
  transactions?: any[];
}

export const ExpenseChart = ({ transactions }: ExpenseChartProps) => {
  const { transactions: allTransactions } = useTransactions();
  const dataTransactions = transactions || allTransactions;

  // Generate chart data from actual transactions
  const generateChartData = () => {
    // Always show all 12 months
    const allMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize all months with zero values
    const monthlyData: { [key: string]: { income: number; expenses: number } } =
      {};
    allMonths.forEach((month) => {
      monthlyData[month] = { income: 0, expenses: 0 };
    });

    // If we have transactions, populate the data
    if (dataTransactions && dataTransactions.length > 0) {
      dataTransactions.forEach((transaction: any) => {
        const date = new Date(transaction.date);
        const monthKey = date.toLocaleDateString("en-US", { month: "short" });

        const amount = parseFloat(transaction.amount);
        if (transaction.type === "income") {
          monthlyData[monthKey].income += amount;
        } else {
          monthlyData[monthKey].expenses += amount;
        }
      });
    }

    // Convert to chart format in proper order
    return allMonths.map((month) => ({
      month,
      income: monthlyData[month].income,
      expenses: monthlyData[month].expenses,
    }));
  };

  const data = generateChartData();

  // Calculate max value for proper Y-axis scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    100 // Minimum scale
  );
  const yAxisMax = Math.ceil(maxValue * 1.1); // Add 10% padding

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            domain={[0, yAxisMax]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--success))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--success))", strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="hsl(var(--destructive))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
