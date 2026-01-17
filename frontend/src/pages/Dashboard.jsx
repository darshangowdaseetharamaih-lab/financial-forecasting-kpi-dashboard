import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Sparkles,
  FileText,
  Database,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import axios from "axios";
import { toast } from "sonner";

// Pages
import OverviewPage from "./OverviewPage";
import FinancialPage from "./FinancialPage";
import CustomerPage from "./CustomerPage";
import InsightsPage from "./InsightsPage";
import ReportsPage from "./ReportsPage";
import DataPage from "./DataPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Overview", exact: true },
  { path: "/financial", icon: TrendingUp, label: "Financial Analytics" },
  { path: "/customers", icon: Users, label: "Customer Analytics" },
  { path: "/insights", icon: Sparkles, label: "AI Insights" },
  { path: "/reports", icon: FileText, label: "Reports" },
  { path: "/data", icon: Database, label: "Data Management" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const location = useLocation();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await axios.post(`${API}/seed-data`);
      toast.success("Sample data loaded successfully!");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-container">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="mobile-menu-toggle"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="ml-4 font-manrope font-bold text-slate-900">Analytics Portfolio</h1>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          data-testid="sidebar"
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="font-manrope font-bold text-slate-900">DataVista</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1" data-testid="navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Seed Data Button */}
            <div className="p-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleSeedData}
                disabled={isSeeding}
                data-testid="seed-data-btn"
              >
                <Database className="h-4 w-4" />
                {isSeeding ? "Loading..." : "Load Sample Data"}
              </Button>
            </div>

            {/* Portfolio Attribution */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500">Data Analytics Portfolio</p>
              <p className="text-xs text-slate-400 mt-1">Financial & Customer Intelligence</p>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Top Bar */}
          <header className="hidden lg:flex h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 items-center justify-between px-8">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Dashboard</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900 font-medium">
                {navItems.find((item) =>
                  item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path) && item.path !== "/"
                )?.label || "Overview"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Routes>
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/financial" element={<FinancialPage />} />
                  <Route path="/customers" element={<CustomerPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/data" element={<DataPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
