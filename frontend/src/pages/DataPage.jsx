import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Upload,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DataPage() {
  const [datasets, setDatasets] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    data: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [datasetsRes, metricsRes] = await Promise.all([
        axios.get(`${API}/datasets`),
        axios.get(`${API}/metrics`),
      ]);
      setDatasets(datasetsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await axios.post(`${API}/seed-data`);
      toast.success("Sample data loaded successfully!");
      fetchData();
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(uploadForm.data);
      } catch {
        toast.error("Invalid JSON format");
        setUploading(false);
        return;
      }

      await axios.post(`${API}/datasets/upload`, {
        name: uploadForm.name,
        description: uploadForm.description,
        data: parsedData,
      });

      toast.success("Dataset uploaded successfully!");
      setShowUpload(false);
      setUploadForm({ name: "", description: "", data: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to upload dataset");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMetric = async (metricId) => {
    try {
      await axios.delete(`${API}/metrics/${metricId}`);
      toast.success("Metric deleted");
      setMetrics(metrics.filter((m) => m.id !== metricId));
    } catch (error) {
      toast.error("Failed to delete metric");
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
    <div className="space-y-8" data-testid="data-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-manrope font-bold text-slate-900 tracking-tight">
            Data Management
          </h1>
          <p className="mt-1 text-slate-600">
            Manage datasets and metrics for your analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSeedData}
            disabled={seeding}
            data-testid="seed-btn"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Load Sample Data
          </Button>
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-slate-900 hover:bg-slate-800"
            data-testid="upload-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Dataset
          </Button>
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-slate-200" data-testid="upload-form">
            <CardHeader className="pb-2">
              <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload New Dataset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Dataset Name
                  </label>
                  <Input
                    placeholder="e.g., Q4 Sales Data"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    required
                    data-testid="dataset-name-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Description
                  </label>
                  <Input
                    placeholder="Brief description of the dataset"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    data-testid="dataset-desc-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Data (JSON Array)
                  </label>
                  <Textarea
                    placeholder='[{"name": "Revenue", "value": 100000}, ...]'
                    value={uploadForm.data}
                    onChange={(e) => setUploadForm({ ...uploadForm, data: e.target.value })}
                    className="min-h-[150px] font-mono text-sm"
                    required
                    data-testid="dataset-data-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter data as a JSON array of objects
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-slate-900 hover:bg-slate-800"
                    data-testid="submit-dataset-btn"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Datasets */}
      <Card className="border-slate-200" data-testid="datasets-section">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-slate-600" />
            Uploaded Datasets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {datasets.length > 0 ? (
            <div className="space-y-3">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="p-4 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{dataset.name}</p>
                    <p className="text-sm text-slate-500">
                      {dataset.row_count} rows • {new Date(dataset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-600">
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No custom datasets uploaded yet.</p>
              <p className="text-sm">Upload a dataset or load sample data to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Metrics */}
      <Card className="border-slate-200" data-testid="metrics-section">
        <CardHeader className="pb-2">
          <CardTitle className="font-manrope text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-600" />
            Current Metrics ({metrics.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length > 0 ? (
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
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr
                      key={metric.id || metric.name}
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
                      <td className="py-3 px-4 text-right font-mono text-slate-900">
                        {metric.value > 100
                          ? `$${(metric.value / 1000).toFixed(0)}K`
                          : `${metric.value}%`}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-sm font-medium ${
                            metric.trend >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {metric.trend >= 0 ? "+" : ""}
                          {metric.trend.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMetric(metric.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-metric-${metric.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No metrics available.</p>
              <p className="text-sm">Load sample data to populate metrics.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Metrics</p>
                <p className="text-xl font-manrope font-bold text-slate-900">{metrics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-md">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Datasets</p>
                <p className="text-xl font-manrope font-bold text-slate-900">{datasets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-md">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Categories</p>
                <p className="text-xl font-manrope font-bold text-slate-900">
                  {new Set(metrics.map((m) => m.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
