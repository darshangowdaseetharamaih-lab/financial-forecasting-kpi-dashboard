import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialPage() {
  const [metrics, setMetrics] = useState([]);
  const [timeseries, setTimeseries] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, timeseriesRes] = await Promise.all([
          axios.get(`${API}/metrics`),
          axios.get(`${API}/timeseries`),
        ]);
        setMetrics(metricsRes.data);
        setTimeseries(timeseriesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMetrics =
    categoryFilter === "all"
      ? metrics
      : metrics.filter((m) => m.category === categoryFilter);

  const revenueMetrics = metrics.filter((m) => m.category === "revenue");
  const expenseMetrics = metrics.filter((m) => m.category === "expense");

  // Calculate margins
  const totalRevenue = revenueMetrics.find((m) => m.name === "Total Revenue")?.value || 0;
  const grossProfit = revenueMetrics.find((m) => m.name === "Gross Profit")?.value || 0;
  const netIncome = revenueMetrics.find((m) => m.name === "Net Income")?.value || 0;

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="metric-card">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="skeleton h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="financial-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-manrope font-bold text-slate-900 tracking-tight">
            Financial Analytics
          </h1>
          <p className="mt-1 text-slate-600">
            Detailed financial performance metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40" data-testid="category-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Margin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-xl font-manrope font-bold text-slate-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="metric-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-md">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Gross Margin</p>
              <p className="text-xl font-manrope font-bold text-slate-900">
                {grossMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="metric-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-md">
              <PieIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Net Margin</p>
              <p className="text-xl font-manrope font-bold text-slate-900">
                {netMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="metric-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-md">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Net Income</p>
              <p className="text-xl font-manrope font-bold text-slate-900">
                {formatCurrency(netIncome)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Combined Chart */}
      <Card className="border-slate-200" data-testid="financial-trend-chart">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900">
            Financial Performance Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="#2563EB"
                  fillOpacity={0.1}
                  stroke="#2563EB"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Bar dataKey="expenses" fill="#F59E0B" name="Expenses" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2 }}
                  name="Profit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Table */}
      <Card className="border-slate-200" data-testid="metrics-table">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900">All Financial Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map((metric, index) => (
                  <motion.tr
                    key={metric.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{metric.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 capitalize">
                        {metric.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-medium text-slate-900">
                        {metric.value > 100 ? formatCurrency(metric.value) : `${metric.value}%`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          metric.trend >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {metric.trend >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {metric.trend >= 0 ? "+" : ""}
                        {metric.trend.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
