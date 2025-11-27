import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryChartProps {
  categoryData?: CategoryData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const monthlyAverage = Math.round(data.value / 12); // Simple monthly average

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Total:{" "}
          <span className="text-foreground font-medium">
            ₹{data.value.toLocaleString("en-IN")}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Monthly Avg:{" "}
          <span className="text-foreground font-medium">
            ₹{monthlyAverage.toLocaleString("en-IN")}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export const CategoryChart = ({ categoryData = [] }: CategoryChartProps) => {
  const data = categoryData;
  return (
    <div className="h-80 w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
          <p className="text-lg font-medium">No expense data</p>
          <p className="text-sm">
            Add some transactions to see spending breakdown
          </p>
        </div>
      )}
    </div>
  );
};
