import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AccountHealthData {
  date: string;
  active: number;
  warning: number;
  error: number;
  total: number;
}

interface AccountHealthChartProps {
  data: AccountHealthData[];
}

export default function AccountHealthChart({ data }: AccountHealthChartProps) {
  const [timeRange, setTimeRange] = useState("7");
  const [chartData, setChartData] = useState<AccountHealthData[]>([]);

  // Filter data based on selected time range
  useEffect(() => {
    const days = parseInt(timeRange);
    const filtered = data.slice(-days);
    setChartData(filtered);
  }, [timeRange, data]);

  // Calculate percentage for each bar
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Account Health</CardTitle>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Select a time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'health') {
                    return [`${value}%`, 'Health Score'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => label}
              />
              <Bar 
                dataKey={(entry) => getPercentage(entry.active, entry.total)} 
                name="health"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => {
                  const percentage = getPercentage(entry.active, entry.total);
                  let color = '#34a853'; // Green for high health
                  
                  if (percentage < 70) {
                    color = '#fbbc04'; // Yellow for medium health
                  }
                  if (percentage < 50) {
                    color = '#ea4335'; // Red for low health
                  }
                  
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
