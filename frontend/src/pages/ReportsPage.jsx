import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  Plus,
  Trash2,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ReportsPage() {
  const [metrics, setMetrics] = useState([]);
  const [businessFraming, setBusinessFraming] = useState(null);
  const [insights, setInsights] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFramingForm, setShowFramingForm] = useState(false);
  const [framingForm, setFramingForm] = useState({
    stakeholder: "",
    business_question: "",
    decision_impact: "",
    data_sources: "",
    success_criteria: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, framingRes, historyRes] = await Promise.all([
          axios.get(`${API}/metrics`),
          axios.get(`${API}/business-framing`),
          axios.get(`${API}/insights/history`),
        ]);
        setMetrics(metricsRes.data);
        setBusinessFraming(framingRes.data[0] || null);
        setInsights(historyRes.data[0] || null);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await axios.post(
        `${API}/export/pdf`,
        {
          businessFraming: businessFraming,
          metrics: metrics,
          insights: insights,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `executive_report_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateFraming = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/business-framing`, {
        ...framingForm,
        data_sources: framingForm.data_sources.split(",").map((s) => s.trim()),
      });
      setBusinessFraming(response.data);
      setShowFramingForm(false);
      setFramingForm({
        stakeholder: "",
        business_question: "",
        decision_impact: "",
        data_sources: "",
        success_criteria: "",
      });
      toast.success("Business framing created!");
    } catch (error) {
      toast.error("Failed to create business framing");
    }
  };

  const handleDeleteFraming = async () => {
    if (!businessFraming) return;
    try {
      await axios.delete(`${API}/business-framing/${businessFraming.id}`);
      setBusinessFraming(null);
      toast.success("Business framing deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="reports-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-manrope font-bold text-slate-900 tracking-tight">
            Executive Reports
          </h1>
          <p className="mt-1 text-slate-600">
            Generate and export professional PDF reports with AI insights
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={exporting || metrics.length === 0}
          className="bg-slate-900 hover:bg-slate-800 gap-2"
          data-testid="export-pdf-btn"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export PDF Report
            </>
          )}
        </Button>
      </div>

      {/* Business Framing Section */}
      <Card className="border-slate-200" data-testid="business-framing-section">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Business Framing
            </CardTitle>
            {!businessFraming && !showFramingForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFramingForm(true)}
                data-testid="add-framing-btn"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Framing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showFramingForm ? (
            <form onSubmit={handleCreateFraming} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Stakeholder</label>
                <Input
                  placeholder="e.g., Chief Financial Officer"
                  value={framingForm.stakeholder}
                  onChange={(e) => setFramingForm({ ...framingForm, stakeholder: e.target.value })}
                  required
                  data-testid="stakeholder-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Business Question</label>
                <Textarea
                  placeholder="e.g., How can we improve profitability while maintaining growth?"
                  value={framingForm.business_question}
                  onChange={(e) => setFramingForm({ ...framingForm, business_question: e.target.value })}
                  required
                  data-testid="question-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Decision Impact</label>
                <Textarea
                  placeholder="e.g., Allocation of Q1 2025 budget ($2M)"
                  value={framingForm.decision_impact}
                  onChange={(e) => setFramingForm({ ...framingForm, decision_impact: e.target.value })}
                  required
                  data-testid="impact-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Data Sources (comma-separated)</label>
                <Input
                  placeholder="e.g., Financial transactions, Customer behavior, Marketing data"
                  value={framingForm.data_sources}
                  onChange={(e) => setFramingForm({ ...framingForm, data_sources: e.target.value })}
                  required
                  data-testid="sources-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Success Criteria</label>
                <Input
                  placeholder="e.g., 15% increase in profit margin"
                  value={framingForm.success_criteria}
                  onChange={(e) => setFramingForm({ ...framingForm, success_criteria: e.target.value })}
                  required
                  data-testid="criteria-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-framing-btn">
                  Save Business Framing
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowFramingForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : businessFraming ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stakeholder</p>
                  <p className="font-medium text-slate-900">{businessFraming.stakeholder}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Success Criteria</p>
                  <p className="font-medium text-slate-900">{businessFraming.success_criteria}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Business Question</p>
                <p className="font-medium text-slate-900">{businessFraming.business_question}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Decision Impact</p>
                <p className="font-medium text-slate-900">{businessFraming.decision_impact}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Data Sources</p>
                <div className="flex flex-wrap gap-2">
                  {businessFraming.data_sources?.map((source, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteFraming}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="delete-framing-btn"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Framing
              </Button>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              No business framing defined. Add one to include in your reports.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card className="border-slate-200" data-testid="report-preview">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border border-slate-200 rounded-lg p-8 space-y-6">
            <div className="text-center border-b border-slate-200 pb-6">
              <h2 className="text-2xl font-manrope font-bold text-slate-900">
                Executive Analytics Report
              </h2>
              <p className="text-slate-500 mt-2">
                Generated: {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
              </p>
            </div>

            {businessFraming && (
              <div className="border-b border-slate-200 pb-6">
                <h3 className="font-manrope font-semibold text-slate-900 mb-3">Business Context</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Stakeholder:</span>{" "}
                    <span className="text-slate-900">{businessFraming.stakeholder}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Business Question:</span>{" "}
                    <span className="text-slate-900">{businessFraming.business_question}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-b border-slate-200 pb-6">
              <h3 className="font-manrope font-semibold text-slate-900 mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.slice(0, 8).map((m) => (
                  <div key={m.name} className="p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 truncate">{m.name}</p>
                    <p className="font-mono font-bold text-slate-900">
                      {m.value > 100 ? `$${(m.value / 1000).toFixed(0)}K` : `${m.value}%`}
                    </p>
                    <p className={`text-xs ${m.trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {m.trend >= 0 ? "+" : ""}{m.trend.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {insights && (
              <div>
                <h3 className="font-manrope font-semibold text-slate-900 mb-3">AI Executive Summary</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-6">
                  {insights.executive_summary}
                </p>
                {insights.recommendations?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Top Recommendations</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {insights.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!insights && (
              <div className="text-center py-8 text-slate-500">
                <p>Generate AI insights to include in your report.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
