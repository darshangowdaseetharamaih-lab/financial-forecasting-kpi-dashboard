import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserMinus,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CHART_COLORS = ["#0F172A", "#2563EB", "#10B981", "#F59E0B", "#6366F1"];

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
            {entry.name}: {typeof entry.value === "number" && entry.value > 1000
              ? formatCurrency(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CustomerPage() {
  const [metrics, setMetrics] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, segmentsRes] = await Promise.all([
          axios.get(`${API}/metrics`),
          axios.get(`${API}/customer-segments`),
        ]);
        setMetrics(metricsRes.data.filter((m) => m.category === "customer" || m.category === "conversion"));
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

  const totalCustomers = segments.reduce((acc, seg) => acc + seg.count, 0);
  const avgLtv = segments.reduce((acc, seg) => acc + seg.ltv * seg.count, 0) / totalCustomers || 0;

  // Radar chart data for segment comparison
  const radarData = segments.map((seg) => ({
    segment: seg.segment,
    customers: (seg.count / totalCustomers) * 100,
    revenue: (seg.revenue / 2450000) * 100,
    ltv: (seg.ltv / 25000) * 100,
  }));

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
    <div className="space-y-8" data-testid="customer-page">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-manrope font-bold text-slate-900 tracking-tight">
          Customer Analytics
        </h1>
        <p className="mt-1 text-slate-600">
          Customer segments, behavior, and lifetime value analysis
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Customers</p>
              <p className="text-xl font-manrope font-bold text-slate-900">
                {totalCustomers.toLocaleString()}
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
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-md">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer LTV</p>
                <p className="text-xl font-manrope font-bold text-slate-900">
                  {formatCurrency(getMetric("Customer Lifetime Value").value)}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              getMetric("Customer Lifetime Value").trend >= 0 ? "trend-positive" : "trend-negative"
            }`}>
              {getMetric("Customer Lifetime Value").trend >= 0 ? "+" : ""}
              {getMetric("Customer Lifetime Value").trend.toFixed(1)}%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="metric-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-md">
                <UserCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">CAC</p>
                <p className="text-xl font-manrope font-bold text-slate-900">
                  ${getMetric("Customer Acquisition Cost").value}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              getMetric("Customer Acquisition Cost").trend <= 0 ? "trend-positive" : "trend-negative"
            }`}>
              {getMetric("Customer Acquisition Cost").trend}%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="metric-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-md">
                <UserMinus className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Churn Rate</p>
                <p className="text-xl font-manrope font-bold text-slate-900">
                  {getMetric("Churn Rate").value}%
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              getMetric("Churn Rate").trend <= 0 ? "trend-positive" : "trend-negative"
            }`}>
              {getMetric("Churn Rate").trend}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution */}
        <Card className="border-slate-200" data-testid="customer-distribution">
          <CardHeader className="pb-2">
            <CardTitle className="font-manrope text-slate-900">
              Customer Distribution by Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="segment"
                    label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {segments.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Segment */}
        <Card className="border-slate-200" data-testid="revenue-by-segment">
          <CardHeader className="pb-2">
            <CardTitle className="font-manrope text-slate-900">
              Revenue by Customer Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segments} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" stroke="#64748B" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="segment" stroke="#64748B" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#2563EB" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LTV by Segment */}
      <Card className="border-slate-200" data-testid="ltv-chart">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900">
            Lifetime Value by Segment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="segment" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ltv" fill="#10B981" name="Lifetime Value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Segment Details Table */}
      <Card className="border-slate-200" data-testid="segment-table">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900">Segment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Segment
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Customers
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    LTV
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((seg, index) => (
                  <motion.tr
                    key={seg.segment}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: CHART_COLORS[index] }}
                        />
                        <span className="font-medium text-slate-900">{seg.segment}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {seg.count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {formatCurrency(seg.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {formatCurrency(seg.ltv)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {((seg.count / totalCustomers) * 100).toFixed(1)}%
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
