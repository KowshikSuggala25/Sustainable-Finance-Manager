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
  timeRange?: "weekly" | "monthly" | "yearly";
}

export const ExpenseChart = ({
  transactions,
  timeRange = "yearly",
}: ExpenseChartProps) => {
  const { transactions: allTransactions } = useTransactions();
  const dataTransactions = transactions || allTransactions;

  // Generate chart data based on time range
  const generateChartData = () => {
    const dataMap: {
      [key: string]: {
        income: number;
        expenses: number;
        label: string;
        order: number;
      };
    } = {};

    // Helper to initialize periods
    // ...

    if (timeRange === "yearly") {
      const months = [
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
      months.forEach((m, i) => {
        dataMap[m] = { income: 0, expenses: 0, label: m, order: i };
      });

      dataTransactions.forEach((t) => {
        const date = new Date(t.date);
        const month = months[date.getMonth()];
        // Only count if it's in the dataTransactions (which should be filtered by year already if passed from parent)
        // But here we rely on the parent to filter by year if desired?
        // If `transactions` is mostly all transactions... the parent manages filtering.
        // Let's assume parent filters by time window, but we still need to bucket correctly.

        // If we are showing 'Yearly', we buckets by Month.
        // But if parent didn't filter by year, we might be summing multiple years.
        // Assuming parent filters.
        if (dataMap[month]) {
          if (t.type === "income")
            dataMap[month].income += parseFloat(t.amount);
          else dataMap[month].expenses += parseFloat(t.amount);
        }
      });
    } else if (timeRange === "monthly") {
      // Daily breakdown for the month
      // Assume transactions are for a specific month
      // We can just bucket by day number 1-31

      // Find number of days in the month of the first transaction? Or current month?
      // Let's assume we show days 1-31 always or dynamically.
      for (let i = 1; i <= 31; i++) {
        dataMap[i] = { income: 0, expenses: 0, label: `${i}`, order: i };
      }

      dataTransactions.forEach((t) => {
        const date = new Date(t.date);
        const day = date.getDate();
        if (dataMap[day]) {
          if (t.type === "income") dataMap[day].income += parseFloat(t.amount);
          else dataMap[day].expenses += parseFloat(t.amount);
        }
      });
    } else if (timeRange === "weekly") {
      // Daily breakdown (Mon-Sun)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.forEach((d, i) => {
        dataMap[d] = { income: 0, expenses: 0, label: d, order: i };
      });

      dataTransactions.forEach((t) => {
        const date = new Date(t.date);
        const day = days[date.getDay()];
        if (dataMap[day]) {
          if (t.type === "income") dataMap[day].income += parseFloat(t.amount);
          else dataMap[day].expenses += parseFloat(t.amount);
        }
      });
    }

    return Object.values(dataMap)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        name: item.label,
        income: item.income,
        expenses: item.expenses,
      }));
  };

  const data = generateChartData();

  // Calculate max value for proper Y-axis scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    100, // Minimum scale
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
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            interval={timeRange === "monthly" ? 2 : 0} // Skip labels on monthly to avoid clutter
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
