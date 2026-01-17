import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CHART_COLORS = ["#0F172A", "#2563EB", "#10B981", "#F59E0B", "#6366F1"];

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const formatPercent = (value) => `${value.toFixed(1)}%`;

const MetricCard = ({ title, value, trend, icon: Icon, format = "currency" }) => {
  const isPositive = trend >= 0;
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? formatPercent(value)
      : value.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="metric-card card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-2xl font-manrope font-bold text-slate-900 tracking-tight">
            {formattedValue}
          </p>
        </div>
        <div className="p-2 bg-slate-100 rounded-md">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isPositive ? "trend-positive" : "trend-negative"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {isPositive ? "+" : ""}
          {trend.toFixed(1)}%
        </span>
        <span className="text-xs text-slate-500">vs last month</span>
      </div>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-sm font-medium text-slate-900">{label}</p>
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

export default function OverviewPage() {
  const [metrics, setMetrics] = useState([]);
  const [timeseries, setTimeseries] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, timeseriesRes, segmentsRes] = await Promise.all([
          axios.get(`${API}/metrics`),
          axios.get(`${API}/timeseries`),
          axios.get(`${API}/customer-segments`),
        ]);
        setMetrics(metricsRes.data);
        setTimeseries(timeseriesRes.data);
        setSegments(segmentsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMetric = (name) => metrics.find((m) => m.name === name) || { value: 0, trend: 0 };

  const kpiCards = [
    { title: "Total Revenue", metric: "Total Revenue", icon: DollarSign, format: "currency" },
    { title: "Net Income", metric: "Net Income", icon: TrendingUp, format: "currency" },
    { title: "Customer LTV", metric: "Customer Lifetime Value", icon: Users, format: "currency" },
    { title: "Conversion Rate", metric: "Conversion Rate", icon: Target, format: "percent" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-grid">
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
    <div className="space-y-8" data-testid="overview-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-manrope font-bold text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            Financial & Customer Analytics Overview
          </p>
        </div>
        <Button
          onClick={() => navigate("/insights")}
          className="bg-slate-900 hover:bg-slate-800 gap-2"
          data-testid="generate-insights-btn"
        >
          <Sparkles className="h-4 w-4" />
          Generate AI Insights
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" data-testid="kpi-cards">
        {kpiCards.map((card, index) => {
          const metric = getMetric(card.metric);
          return (
            <MetricCard
              key={card.title}
              title={card.title}
              value={metric.value}
              trend={metric.trend}
              icon={card.icon}
              format={card.format}
            />
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 border-slate-200" data-testid="revenue-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-manrope text-slate-900">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card className="border-slate-200" data-testid="segments-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-manrope text-slate-900">Revenue by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="revenue"
                    nameKey="segment"
                  >
                    {segments.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: "white",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {segments.map((seg, index) => (
                <div key={seg.segment} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: CHART_COLORS[index] }}
                  />
                  <span className="text-slate-600">{seg.segment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis */}
      <Card className="border-slate-200" data-testid="profit-chart">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900">
            Profit & Expense Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" fill="#10B981" name="Profit" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#F59E0B" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="border-slate-200 cursor-pointer card-hover"
          onClick={() => navigate("/financial")}
          data-testid="quick-financial"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Financial Analytics</p>
              <p className="text-sm text-slate-500">Deep dive into financials</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>

        <Card
          className="border-slate-200 cursor-pointer card-hover"
          onClick={() => navigate("/customers")}
          data-testid="quick-customers"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-md">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Customer Analytics</p>
              <p className="text-sm text-slate-500">Segment & behavior analysis</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>

        <Card
          className="border-slate-200 cursor-pointer card-hover"
          onClick={() => navigate("/reports")}
          data-testid="quick-reports"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-md">
              <ShoppingCart className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Export Reports</p>
              <p className="text-sm text-slate-500">Generate PDF memos</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
