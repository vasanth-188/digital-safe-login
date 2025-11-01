import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePhishingScanner, PhishingScan } from "@/hooks/usePhishingScanner";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { processScansForCharts, calculateInsights, chartColors } from "@/lib/chartUtils";
import { TrendingUp, Target, Shield, Activity } from "lucide-react";

export function PhishingAnalytics() {
  const { getScanHistory } = usePhishingScanner();
  const [scans, setScans] = useState<PhishingScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const history = await getScanHistory();
    setScans(history);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No scan data available. Perform some scans to see analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { riskDistribution, confidenceTrend, confidenceDistribution } = processScansForCharts(scans);
  const insights = calculateInsights(scans);

  return (
    <div className="space-y-6">
      {/* Insights Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalScans}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.avgConfidence}%</div>
            <p className="text-xs text-muted-foreground">Detection accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.highestConfidence}%</div>
            <p className="text-xs text-muted-foreground">Peak confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{insights.mostCommonRisk}</div>
            <p className="text-xs text-muted-foreground">Risk level</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Confidence Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Confidence Score Trend</CardTitle>
            <CardDescription>Detection accuracy over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={confidenceTrend.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--card-foreground))" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Confidence %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Breakdown by threat level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Distribution Bar Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Confidence Score Distribution</CardTitle>
            <CardDescription>Number of scans by confidence range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range"
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--card-foreground))" }}
                />
                <Bar dataKey="count" name="Number of Scans" radius={[8, 8, 0, 0]}>
                  {confidenceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
