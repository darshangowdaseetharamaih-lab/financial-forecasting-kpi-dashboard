import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Upload,
  Sparkles,
  DollarSign,
  Percent,
  Users,
  Building2,
  FileText,
  RefreshCw,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value?.toFixed(0) || 0}`;
};

const formatPercent = (value) => `${value?.toFixed(1) || 0}%`;

// =============================================================================
// KPI CARD COMPONENT
// =============================================================================

const KPICard = ({ title, value, format, trend, trendLabel, tooltip, icon: Icon }) => {
  const formattedValue = format === "currency" 
    ? formatCurrency(value) 
    : format === "percent" 
    ? formatPercent(value)
    : value?.toFixed(1) || "N/A";
  
  const isPositive = trend > 0;
  const isNeutral = trend === 0 || trend === null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all cursor-help"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  {title}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {formattedValue}
                </p>
              </div>
              {Icon && (
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
              )}
            </div>
            {trend !== undefined && trend !== null && (
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isNeutral 
                      ? "bg-slate-100 text-slate-600"
                      : isPositive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {!isNeutral && (isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ))}
                  {isPositive ? "+" : ""}{trend?.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">{trendLabel || "vs prior"}</span>
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// =============================================================================
// VARIANCE TABLE COMPONENT
// =============================================================================

const VarianceTable = ({ variances }) => {
  if (!variances || variances.length === 0) {
    return <p className="text-slate-500 text-center py-8">No variance data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Metric
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Prior
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Variance
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {variances.map((v, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4">
                <span className="font-medium text-slate-900">{v.metric}</span>
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-700">
                {v.metric.includes("%") 
                  ? `${v.current_value?.toFixed(1)}%`
                  : formatCurrency(v.current_value)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-500">
                {v.metric.includes("%") 
                  ? `${v.prior_value?.toFixed(1)}%`
                  : formatCurrency(v.prior_value)}
              </td>
              <td className="py-3 px-4 text-right">
                <span className={`font-mono font-medium ${
                  v.status === "Favorable" ? "text-emerald-600" : "text-red-600"
                }`}>
                  {v.variance_percent >= 0 ? "+" : ""}{v.variance_percent?.toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  v.status === "Favorable" 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "bg-red-50 text-red-700"
                }`}>
                  {v.status === "Favorable" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {v.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// =============================================================================
// AI NARRATIVE PANEL COMPONENT
// =============================================================================

const NarrativePanel = ({ narrative, loading, onGenerate, focus, setFocus }) => {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-slate-900">
              AI Executive Narrative
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger className="w-44" data-testid="narrative-focus-select">
                <SelectValue placeholder="Focus Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="executive_summary">Executive Summary</SelectItem>
                <SelectItem value="variance">Variance Deep-Dive</SelectItem>
                <SelectItem value="forecast">Forecast Analysis</SelectItem>
                <SelectItem value="recommendations">Recommendations</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={onGenerate} 
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800"
              data-testid="generate-narrative-btn"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </div>
        </div>
        <CardDescription>
          GPT-5.2 powered FP&A analysis for executive decision-making
        </CardDescription>
      </CardHeader>
      <CardContent>
        {narrative ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-slate-900 mb-2">Executive Summary</h4>
              <p className="text-slate-700 leading-relaxed">{narrative.summary}</p>
            </div>
            
            {/* Key Insights */}
            {narrative.key_insights?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Key Insights
                </h4>
                <ul className="space-y-2">
                  {narrative.key_insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Risks */}
            {narrative.risks?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Key Risks
                </h4>
                <ul className="space-y-2">
                  {narrative.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendations */}
            {narrative.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {narrative.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="text-blue-500 mt-1 font-bold">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Generated timestamp */}
            <p className="text-xs text-slate-400 text-right">
              Generated: {new Date(narrative.generated_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Click "Generate" to create an AI-powered executive narrative</p>
            <p className="text-sm mt-1">Select a focus area for targeted analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export default function Dashboard() {
  // State
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runData, setRunData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("base");
  const [narrativeFocus, setNarrativeFocus] = useState("executive_summary");
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch runs on mount
  useEffect(() => {
    fetchRuns();
  }, []);

  // Fetch run data when selection changes
  useEffect(() => {
    if (selectedRunId) {
      fetchRunData(selectedRunId);
    }
  }, [selectedRunId]);

  const fetchRuns = async () => {
    try {
      const response = await axios.get(`${API}/runs`);
      setRuns(response.data);
      if (response.data.length > 0 && !selectedRunId) {
        setSelectedRunId(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching runs:", error);
    }
  };

  const fetchRunData = async (runId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/runs/${runId}`);
      setRunData(response.data);
      
      // Set latest period as default
      if (response.data.kpis?.length > 0) {
        setSelectedPeriod(response.data.kpis[response.data.kpis.length - 1].period);
      }
      
      // Load existing narrative if available
      if (response.data.narratives?.length > 0) {
        setNarrative(response.data.narratives[response.data.narratives.length - 1]);
      } else {
        setNarrative(null);
      }
    } catch (error) {
      console.error("Error fetching run data:", error);
      toast.error("Failed to load analysis data");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleData = async () => {
    setUploading(true);
    try {
      const response = await axios.post(`${API}/sample-data`);
      toast.success("Sample data loaded successfully!");
      await fetchRuns();
      setSelectedRunId(response.data.run_id);
    } catch (error) {
      toast.error("Failed to load sample data");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("run_name", file.name.replace(".csv", ""));
      
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success(`Loaded ${response.data.periods_loaded} periods with ${response.data.kpis_calculated} KPIs calculated`);
      await fetchRuns();
      setSelectedRunId(response.data.run_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (!selectedRunId) return;
    
    setNarrativeLoading(true);
    try {
      const response = await axios.post(`${API}/runs/${selectedRunId}/narrative`, {
        run_id: selectedRunId,
        focus: narrativeFocus
      });
      setNarrative(response.data);
      toast.success("Narrative generated successfully!");
    } catch (error) {
      toast.error("Failed to generate narrative");
    } finally {
      setNarrativeLoading(false);
    }
  };

  // Get current period KPIs
  const currentKPIs = runData?.kpis?.find(k => k.period === selectedPeriod);
  const priorKPIs = runData?.kpis?.find((k, i, arr) => {
    const currentIdx = arr.findIndex(x => x.period === selectedPeriod);
    return i === currentIdx - 1;
  });

  // Get forecast data
  const forecastData = runData?.forecasts?.[selectedScenario]?.periods || [];

  // Prepare chart data
  const chartData = runData?.kpis?.map(k => ({
    period: k.period,
    revenue: k.revenue,
    grossMargin: k.gross_margin,
    operatingMargin: k.operating_margin,
    netMargin: k.net_margin
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Financial Forecasting & KPI Dashboard</h1>
                <p className="text-sm text-slate-500">AI-Enhanced Executive Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Analysis Run Selector */}
              <Select value={selectedRunId || ""} onValueChange={setSelectedRunId}>
                <SelectTrigger className="w-56" data-testid="run-selector">
                  <SelectValue placeholder="Select Analysis" />
                </SelectTrigger>
                <SelectContent>
                  {runs.map(run => (
                    <SelectItem key={run.id} value={run.id}>
                      {run.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  data-testid="file-upload"
                />
                <Button variant="outline" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
              
              {/* Load Sample Data */}
              <Button 
                variant="outline" 
                onClick={handleLoadSampleData}
                disabled={uploading}
                data-testid="load-sample-btn"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sample Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !runData ? (
          <Card className="border-slate-200">
            <CardContent className="py-24 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Analysis Data</h2>
              <p className="text-slate-500 mb-6">
                Upload a CSV file with your financial data or load sample data to get started.
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={handleLoadSampleData} className="bg-slate-900 hover:bg-slate-800">
                  Load Sample Data
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Controls Row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Period:</span>
                <Select value={selectedPeriod || ""} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-36" data-testid="period-selector">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {runData?.kpis?.map(k => (
                      <SelectItem key={k.period} value={k.period}>
                        {k.period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Scenario:</span>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-36" data-testid="scenario-selector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base Case</SelectItem>
                    <SelectItem value="upside">Upside</SelectItem>
                    <SelectItem value="downside">Downside</SelectItem>
                    <SelectItem value="stress">Stress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="kpi-cards">
              <KPICard
                title="Revenue"
                value={currentKPIs?.revenue}
                format="currency"
                trend={currentKPIs?.mom_growth}
                trendLabel="MoM"
                tooltip="Total revenue for the period. Growth compared to prior month."
                icon={DollarSign}
              />
              <KPICard
                title="Gross Margin"
                value={currentKPIs?.gross_margin}
                format="percent"
                trend={priorKPIs ? currentKPIs?.gross_margin - priorKPIs?.gross_margin : null}
                trendLabel="vs prior"
                tooltip="(Revenue - COGS) / Revenue. Measures production efficiency."
                icon={Percent}
              />
              <KPICard
                title="Operating Margin"
                value={currentKPIs?.operating_margin}
                format="percent"
                trend={priorKPIs ? currentKPIs?.operating_margin - priorKPIs?.operating_margin : null}
                trendLabel="vs prior"
                tooltip="Operating Income / Revenue. Core business profitability."
                icon={TrendingUp}
              />
              <KPICard
                title="Net Margin"
                value={currentKPIs?.net_margin}
                format="percent"
                trend={priorKPIs ? currentKPIs?.net_margin - priorKPIs?.net_margin : null}
                trendLabel="vs prior"
                tooltip="Net Income / Revenue. Bottom-line profitability."
                icon={Building2}
              />
              <KPICard
                title="Revenue/Employee"
                value={currentKPIs?.revenue_per_employee}
                format="currency"
                trend={priorKPIs?.revenue_per_employee ? 
                  ((currentKPIs?.revenue_per_employee - priorKPIs?.revenue_per_employee) / priorKPIs?.revenue_per_employee * 100) : null}
                trendLabel="vs prior"
                tooltip="Revenue / Number of Employees. Workforce efficiency metric."
                icon={Users}
              />
            </div>

            {/* Charts & Tables */}
            <Tabs defaultValue="trends" className="space-y-6">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
                <TabsTrigger value="forecast">Forecast Scenarios</TabsTrigger>
              </TabsList>

              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trend */}
                  <Card className="border-slate-200" data-testid="revenue-trend-chart">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Revenue Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                            <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => formatCurrency(v)} />
                            <RechartsTooltip 
                              formatter={(v) => formatCurrency(v)}
                              contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#2563EB" 
                              strokeWidth={2}
                              fill="url(#revenueGrad)"
                              name="Revenue"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Margin Trends */}
                  <Card className="border-slate-200" data-testid="margin-trend-chart">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Margin Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                            <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => `${v}%`} />
                            <RechartsTooltip 
                              formatter={(v) => `${v?.toFixed(1)}%`}
                              contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="grossMargin" stroke="#10B981" strokeWidth={2} name="Gross" dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="operatingMargin" stroke="#F59E0B" strokeWidth={2} name="Operating" dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="netMargin" stroke="#6366F1" strokeWidth={2} name="Net" dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Variance Tab */}
              <TabsContent value="variance">
                <Card className="border-slate-200" data-testid="variance-table">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Month-over-Month Variance Analysis
                    </CardTitle>
                    <CardDescription>
                      Comparing {selectedPeriod} to prior period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VarianceTable variances={runData?.variances} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Forecast Tab */}
              <TabsContent value="forecast" className="space-y-6">
                <Card className="border-slate-200" data-testid="forecast-chart">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-900">
                          {selectedScenario.charAt(0).toUpperCase() + selectedScenario.slice(1)} Scenario Forecast
                        </CardTitle>
                        <CardDescription>
                          {runData?.forecasts?.[selectedScenario]?.assumptions?.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={[...chartData.slice(-3), ...forecastData.map(f => ({ ...f, isForecast: true }))]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                          <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => formatCurrency(v)} />
                          <RechartsTooltip 
                            formatter={(v) => formatCurrency(v)}
                            contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Bar dataKey="revenue" fill="#2563EB" name="Actual Revenue" opacity={0.8} />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10B981" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            name="Forecast"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Forecast Table */}
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Period</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Revenue</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Gross Margin</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Operating Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastData.map((f, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="py-2 px-3 font-medium text-slate-900">{f.period}</td>
                              <td className="py-2 px-3 text-right font-mono">{formatCurrency(f.revenue)}</td>
                              <td className="py-2 px-3 text-right font-mono">{f.gross_margin?.toFixed(1)}%</td>
                              <td className="py-2 px-3 text-right font-mono">{f.operating_margin?.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* AI Narrative Panel */}
            <NarrativePanel
              narrative={narrative}
              loading={narrativeLoading}
              onGenerate={handleGenerateNarrative}
              focus={narrativeFocus}
              setFocus={setNarrativeFocus}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-sm text-slate-500 text-center">
            Financial Forecasting & KPI Dashboard • AI-Enhanced Executive Intelligence • Powered by GPT-5.2
          </p>
        </div>
      </footer>
    </div>
  );
}
