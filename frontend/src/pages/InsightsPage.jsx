import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Target,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function InsightsPage() {
  const [metrics, setMetrics] = useState([]);
  const [businessFraming, setBusinessFraming] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(true);

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
        setHistory(historyRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const metricsObj = {};
      metrics.forEach((m) => {
        metricsObj[m.name] = { value: m.value, trend: m.trend, category: m.category };
      });

      const response = await axios.post(`${API}/insights/generate`, {
        context: businessFraming
          ? `Stakeholder: ${businessFraming.stakeholder}\nBusiness Question: ${businessFraming.business_question}\nDecision Impact: ${businessFraming.decision_impact}`
          : "General financial and customer analytics overview for executive decision making.",
        metrics_summary: metricsObj,
        question: customQuestion || "Provide executive summary and recommendations based on the data.",
      });

      setInsight(response.data);
      setHistory((prev) => [response.data, ...prev].slice(0, 10));
      toast.success("AI insights generated successfully!");
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setGenerating(false);
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
    <div className="space-y-8" data-testid="insights-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-manrope font-bold text-slate-900 tracking-tight">
            AI-Powered Insights
          </h1>
          <p className="mt-1 text-slate-600">
            Generate executive summaries and recommendations using GPT-5.2
          </p>
        </div>
      </div>

      {/* Business Context Card */}
      {businessFraming && (
        <Card className="border-slate-200 bg-slate-50" data-testid="business-context">
          <CardHeader className="pb-2">
            <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Business Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stakeholder</p>
                <p className="text-sm font-medium text-slate-900">{businessFraming.stakeholder}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Business Question</p>
                <p className="text-sm font-medium text-slate-900">{businessFraming.business_question}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Insights Section */}
      <Card className="border-slate-200" data-testid="generate-insights-section">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Generate New Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Custom Question (Optional)
            </label>
            <Textarea
              placeholder="Ask a specific question about your data, e.g., 'What factors are driving revenue growth?' or leave empty for a general analysis."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="min-h-[100px]"
              data-testid="custom-question-input"
            />
          </div>
          <Button
            onClick={generateInsights}
            disabled={generating || metrics.length === 0}
            className="bg-slate-900 hover:bg-slate-800 gap-2"
            data-testid="generate-btn"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Insights
              </>
            )}
          </Button>
          {metrics.length === 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Load sample data first to generate insights.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Insight */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ai-insight-card"
          data-testid="current-insight"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-manrope font-bold text-slate-900">Executive Summary</h3>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(insight.generated_at).toLocaleString()}
            </span>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap">{insight.executive_summary}</p>
          </div>

          {insight.key_findings && insight.key_findings.length > 0 && (
            <div className="mt-6">
              <h4 className="font-manrope font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Key Findings
              </h4>
              <ul className="space-y-2">
                {insight.key_findings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-emerald-600 mt-1">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.recommendations && insight.recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-manrope font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {insight.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <span className="text-amber-600 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="border-slate-200" data-testid="insights-history">
          <CardHeader className="pb-2">
            <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-slate-600" />
              Insights History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(0, 5).map((item, index) => (
                <div
                  key={item.insight_id || index}
                  className="p-4 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setInsight(item)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">
                      {new Date(item.generated_at).toLocaleString()}
                    </span>
                    <span className="text-xs text-blue-600">Click to view</span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {item.executive_summary?.substring(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
