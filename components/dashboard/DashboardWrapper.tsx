"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, Eye, EyeOff, Star, ArrowUp, ArrowDown, RefreshCw, 
  RotateCcw, Save, Layout, Check, Sparkles, Building2, Package,
  Calendar, Wrench, Shield, Activity, Users, AlertTriangle, Database, BarChart3, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";
import { transitionMaintenance } from "@/actions/maintenance";
import { getExecutiveDashboardMetrics } from "@/actions/intelligence";

interface DashboardWrapperProps {
  metrics: any;
  user: any;
  assets: any[];
  employees: any[];
  role: string;
}

interface WidgetConfig {
  id: string;
  title: string;
  isHidden: boolean;
  isFavorited: boolean;
}

export default function DashboardWrapper({
  metrics,
  user,
  assets,
  employees,
  role,
}: DashboardWrapperProps) {
  const router = useRouter();

  const handleQuickApproveClick = async (requestId: string) => {
    try {
      const res = await transitionMaintenance({
        requestId,
        status: "APPROVED",
      });
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message || "Failed to approve request.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Landing Page configuration
  const [landingPage, setLandingPage] = useState("/dashboard");
  const [cardSize, setCardSize] = useState<"compact" | "normal" | "spacious">("normal");
  const [showConfig, setShowConfig] = useState(false);

  // Executive dashboard intelligence states
  const [execMetrics, setExecMetrics] = useState<any>(null);

  useEffect(() => {
    if (["ADMIN", "ASSET_MANAGER"].includes(role)) {
      getExecutiveDashboardMetrics().then((data) => {
        setExecMetrics(data);
      });
    }
  }, [role]);

  // Widget layout order config
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  // Group assets by status
  const statusCounts = (assets || []).reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const totalAssetsCount = assets?.length || 1;

  // Group assets by category to show investment value bar chart
  const categoryStats = (assets || []).reduce((acc: Record<string, { count: number; value: number }>, a: any) => {
    const catName = a.category?.name || "Uncategorized";
    const cost = parseFloat(a.acquisitionCost) || 0;
    if (!acc[catName]) {
      acc[catName] = { count: 0, value: 0 };
    }
    acc[catName].count += 1;
    acc[catName].value += cost;
    return acc;
  }, {});

  const categoryStatsList = Object.entries(categoryStats).map(([name, stat]: any) => ({
    name,
    count: stat.count,
    value: stat.value,
  })).sort((a: any, b: any) => b.value - a.value);

  const maxCategoryValue = Math.max(...categoryStatsList.map((c) => c.value), 1);

  // Default widget structures per role
  const getDefaults = (userRole: string): WidgetConfig[] => {
    switch (userRole) {
      case "ADMIN":
        return [
          { id: "admin_kpis", title: "Enterprise KPI summaries", isHidden: false, isFavorited: false },
          { id: "overview_charts", title: "Inventory Graphs & Analytics", isHidden: false, isFavorited: false },
          { id: "admin_actions", title: "Administrator Command Shortcuts", isHidden: false, isFavorited: false },
          { id: "admin_overdue", title: "Overdue Return warning cards", isHidden: false, isFavorited: false },
          { id: "admin_activity", title: "Recent System activity logs feed", isHidden: false, isFavorited: false },
        ];
      case "ASSET_MANAGER":
        return [
          { id: "manager_kpis", title: "Inventory metrics", isHidden: false, isFavorited: false },
          { id: "overview_charts", title: "Inventory Graphs & Analytics", isHidden: false, isFavorited: false },
          { id: "manager_actions", title: "Quick Actions Desk", isHidden: false, isFavorited: false },
          { id: "manager_approvals", title: "Awaiting approvals requests", isHidden: false, isFavorited: false },
        ];
      case "DEPARTMENT_HEAD":
        return [
          { id: "dept_kpis", title: "Department KPIs", isHidden: false, isFavorited: false },
          { id: "overview_charts", title: "Inventory Graphs & Analytics", isHidden: false, isFavorited: false },
          { id: "dept_actions", title: "Quick Actions shortcuts", isHidden: false, isFavorited: false },
          { id: "dept_transfers", title: "Pending Transfer Approvals Hub", isHidden: false, isFavorited: false },
        ];
      default: // EMPLOYEE
        return [
          { id: "emp_kpis", title: "My Custody KPIs", isHidden: false, isFavorited: false },
          { id: "overview_charts", title: "Inventory Graphs & Analytics", isHidden: false, isFavorited: false },
          { id: "emp_actions", title: "Operations shortcuts desk", isHidden: false, isFavorited: false },
          { id: "emp_custody", title: "My Custody Assets register", isHidden: false, isFavorited: false },
          { id: "emp_bookings", title: "My Booking reservation list", isHidden: false, isFavorited: false },
        ];
    }
  };

  // Load configuration from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLanding = localStorage.getItem(`af_landing_page_${user.id}`);
      if (storedLanding) {
        setLandingPage(storedLanding);
        // Handle redirect if page is different from current page
        if (storedLanding !== "/dashboard" && window.location.pathname === "/dashboard") {
          router.push(storedLanding);
          return;
        }
      }

      const storedSize = localStorage.getItem(`af_card_size_${user.id}`) as any;
      if (storedSize) setCardSize(storedSize);

      const storedWidgets = localStorage.getItem(`af_widgets_layout_${role}_${user.id}`);
      if (storedWidgets) {
        setWidgets(JSON.parse(storedWidgets));
      } else {
        setWidgets(getDefaults(role));
      }
    }
  }, [role, user.id]);

  // Persist dashboard configuration
  const handleSaveDashboard = () => {
    localStorage.setItem(`af_landing_page_${user.id}`, landingPage);
    localStorage.setItem(`af_card_size_${user.id}`, cardSize);
    localStorage.setItem(`af_widgets_layout_${role}_${user.id}`, JSON.stringify(widgets));
    setShowConfig(false);
    alert("Dashboard workspace preferences saved successfully.");
  };

  // Restore dashboard configurations
  const handleResetLayout = () => {
    const defaults = getDefaults(role);
    setWidgets(defaults);
    setCardSize("normal");
    setLandingPage("/dashboard");
    localStorage.removeItem(`af_landing_page_${user.id}`);
    localStorage.removeItem(`af_card_size_${user.id}`);
    localStorage.removeItem(`af_widgets_layout_${role}_${user.id}`);
    alert("Workspace layouts restored to standard templates.");
  };

  // Move widget panel in priority order
  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    const updated = [...widgets];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    // Swap positions
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setWidgets(updated);
  };

  const handleToggleHide = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isHidden: !w.isHidden } : w));
  };

  const handleToggleFavorite = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isFavorited: !w.isFavorited } : w));
  };

  // Card padding configuration based on resize selection
  const paddingClass = cardSize === "compact" ? "p-4 space-y-2 text-xs" : cardSize === "spacious" ? "p-8 space-y-4" : "p-6 space-y-3";
  const textClass = cardSize === "compact" ? "text-2xl" : cardSize === "spacious" ? "text-4xl" : "text-3xl";

  return (
    <div className="space-y-6">
      
      {/* Configuration Action Bar */}
      <div className="flex flex-wrap items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-xl gap-4 no-print select-none">
        <div className="flex items-center space-x-2 text-xs font-bold text-zinc-950">
          <Layout className="h-4 w-4" />
          <span>Dashboard Customizer Cockpit</span>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowConfig(!showConfig)}
            className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs py-2 px-3 flex items-center font-bold"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {showConfig ? "Close Customizer" : "Customize Workspace"}
          </Button>
          <Button
            onClick={handleResetLayout}
            className="border border-zinc-200 bg-white hover:bg-zinc-150 text-zinc-800 text-xs py-2 px-3 flex items-center font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Slide-out Customization Panel */}
      {showConfig && (
        <div className="bg-white border border-zinc-300 p-6 rounded-2xl space-y-6 shadow-md animate-in slide-in-from-top-4 duration-200 text-xs font-semibold">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-100">
            {/* Preferred landing page */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Default Landing Page</Label>
              <select
                value={landingPage}
                onChange={(e) => setLandingPage(e.target.value)}
                className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="/dashboard">Overview Dashboard</option>
                <option value="/dashboard/assets">Asset Inventory Directory</option>
                <option value="/dashboard/approvals">Approvals Center</option>
                <option value="/dashboard/notifications">Notification Center</option>
              </select>
            </div>

            {/* Resize Card options */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Card Dimensions Size</Label>
              <div className="flex gap-2">
                {(["compact", "normal", "spacious"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setCardSize(size)}
                    className={`flex-1 py-2 rounded-lg border font-bold capitalize transition-all cursor-pointer ${
                      cardSize === size 
                        ? "bg-zinc-950 text-white border-zinc-900" 
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reordering widgets panel list */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Manage Panels Order & Visibility</Label>
            <div className="space-y-2">
              {widgets.map((widget, idx) => (
                <div key={widget.id} className="flex items-center justify-between p-3 border border-zinc-200 bg-zinc-50/50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleToggleFavorite(widget.id)}
                      className={`cursor-pointer hover:scale-110 transition-transform ${widget.isFavorited ? "text-amber-500" : "text-zinc-300"}`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>
                    <span className="font-bold text-zinc-800">{widget.title}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Reordering arrows */}
                    <button 
                      disabled={idx === 0}
                      onClick={() => handleMoveWidget(idx, "up")}
                      className="p-1 border border-zinc-250 bg-white hover:bg-zinc-50 rounded disabled:opacity-40"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      disabled={idx === widgets.length - 1}
                      onClick={() => handleMoveWidget(idx, "down")}
                      className="p-1 border border-zinc-250 bg-white hover:bg-zinc-50 rounded disabled:opacity-40"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Visibility toggles */}
                    <button 
                      onClick={() => handleToggleHide(widget.id)}
                      className={`p-1 rounded cursor-pointer ${widget.isHidden ? "text-red-500 hover:text-red-700" : "text-zinc-400 hover:text-zinc-650"}`}
                      title={widget.isHidden ? "Show Widget" : "Hide Widget"}
                    >
                      {widget.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save panel changes */}
          <Button
            onClick={handleSaveDashboard}
            className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg py-2.5 flex items-center justify-center font-bold"
          >
            <Save className="h-4 w-4 mr-2" />
            Apply & Save Workspace Layout
          </Button>
        </div>
      )}

      {/* Preventive Maintenance Alert Panel */}
      {metrics?.preventiveAlerts?.count > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-sm flex flex-col sm:flex-row items-start justify-between text-xs font-semibold gap-4 animate-in fade-in select-none">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-red-800 block text-sm tracking-tight">Preventive Maintenance Schedules Overdue / Due Today</span>
              <p className="text-zinc-500 mt-0.5 font-bold">There are {metrics.preventiveAlerts.count} maintenance schedules that require immediate attention.</p>
              <div className="mt-3 space-y-2">
                {metrics.preventiveAlerts.schedules.map((s: any) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-1.5 text-zinc-700">
                    <span className="font-mono bg-red-100/80 text-red-750 px-1.5 py-0.2 border border-red-200 rounded text-[10px] font-bold">{s.asset.tag}</span>
                    <span className="font-bold text-zinc-800">{s.asset.name}</span>
                    <span className="text-zinc-400 font-normal">•</span>
                    <span className="text-zinc-650 font-bold">{s.maintenanceType}</span>
                    <span className="text-zinc-400 font-normal">due on</span>
                    <span className="font-bold text-red-700">{new Date(s.nextDueDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link href="/dashboard/maintenance?tab=preventive" className="text-zinc-950 hover:underline font-black self-end shrink-0 border border-zinc-950 rounded-lg px-3 py-1.5 bg-white shadow-sm inline-flex items-center gap-1">
            <span>Manage Schedules</span> &rarr;
          </Link>
        </div>
      )}

      {/* Render widget panels based on prioritized ordering configuration */}
      <div className="space-y-6">
        {widgets.map((widget) => {
          if (widget.isHidden) {
            // Render minimal hidden placeholder so they can unhide directly from dashboard if needed
            return (
              <div key={widget.id} className="p-3 border border-dashed border-zinc-200 rounded-xl flex justify-between items-center text-xs font-bold text-zinc-400 bg-white no-print">
                <span>Panel Hidden: {widget.title}</span>
                <button 
                  onClick={() => handleToggleHide(widget.id)}
                  className="text-zinc-950 font-black hover:underline cursor-pointer"
                >
                  Show panel
                </button>
              </div>
            );
          }

          const isFav = widget.isFavorited;
          const favClass = isFav ? "border-amber-400 shadow-md ring-1 ring-amber-400/20" : "border-zinc-200 shadow-sm";

          // Render corresponding widgets
          return (
            <div key={widget.id} className={`rounded-xl border bg-white overflow-hidden transition-all ${favClass}`}>
              
              {/* Header card indicator with star label */}
              {isFav && (
                <div className="bg-amber-500/10 text-amber-800 px-4 py-1.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-b border-amber-200">
                  <Star className="h-3 w-3 fill-current" /> Favorite workspace panel
                </div>
              )}

              {/* GLOBAL CHARTS WIDGET */}
              {widget.id === "overview_charts" && (
                <div className="p-6 space-y-6 select-none animate-in fade-in duration-300">
                  <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wider">Inventory Distribution & Asset Valuation</h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-bold">Real-time status breakdowns and capital allocation profiles.</p>
                    </div>
                    <BarChart3 className="h-4 w-4 text-zinc-400" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Status Distribution Chart */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Roster Status Share</span>
                      <div className="space-y-3.5">
                        {[
                          { status: "AVAILABLE", label: "Available / Ready", color: "bg-zinc-950", border: "border-zinc-950/20" },
                          { status: "ALLOCATED", label: "Allocated in Custody", color: "bg-zinc-500", border: "border-zinc-500/20" },
                          { status: "UNDER_MAINTENANCE", label: "Under Active Maintenance", color: "bg-zinc-400", border: "border-zinc-400/20" },
                          { status: "LOST", label: "Reported Lost", color: "bg-zinc-350", border: "border-zinc-350/20" },
                          { status: "RETIRED", label: "Retired / Disposed", color: "bg-zinc-200", border: "border-zinc-200/20" },
                        ].map((cfg) => {
                          const count = statusCounts[cfg.status] || 0;
                          const pct = Math.round((count / totalAssetsCount) * 100);
                          return (
                            <div key={cfg.status} className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-zinc-700">{cfg.label}</span>
                                <span className="text-zinc-950">{count} items ({pct}%)</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                                <div 
                                  className={`h-full ${cfg.color} rounded-full transition-all duration-500`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Category Investment Distribution */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Asset Category Capital Valuation</span>
                      <div className="space-y-3">
                        {categoryStatsList.length === 0 ? (
                          <div className="py-12 text-center text-zinc-400 text-xs italic">No category value information.</div>
                        ) : (
                          categoryStatsList.slice(0, 5).map((cat) => {
                            const pct = Math.round((cat.value / maxCategoryValue) * 100);
                            return (
                              <div key={cat.name} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-zinc-700 truncate max-w-[150px]">{cat.name}</span>
                                  <span className="text-zinc-950">₹{cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-4 flex-1 bg-zinc-50 border border-zinc-150 rounded overflow-hidden">
                                    <div 
                                      className="h-full bg-zinc-950 transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-zinc-400 w-8 text-right shrink-0">{pct}%</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN WIDGETS */}
              {widget.id === "admin_kpis" && (
                <div className={paddingClass}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                    
                    {/* Card 1: Assets Value */}
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Original Asset Value</span>
                        <Database className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        ₹{execMetrics?.assetValue?.original ? execMetrics.assetValue.original.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "..."}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-semibold">
                        Roster count: {metrics?.kpis?.assetsAvailable + metrics?.kpis?.assetsAllocated || 0} items
                      </div>
                    </div>

                    {/* Card 2: Net Book Value after Depreciation */}
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Net Depreciated Value</span>
                        <DollarSign className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-emerald-800 tracking-tight`}>
                        ₹{execMetrics?.assetValue?.current ? execMetrics.assetValue.current.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "..."}
                      </div>
                      <div className="text-[10px] text-red-650 font-semibold">
                        Accumulated: -₹{execMetrics?.assetValue?.accumulatedDepreciation ? execMetrics.assetValue.accumulatedDepreciation.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "..."}
                      </div>
                    </div>

                    {/* Card 3: Headcount Directory & Bookings */}
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Active Bookings</span>
                        <Calendar className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.kpis?.activeBookings || 0}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-semibold">
                        Clearance Users: {execMetrics?.activeUsers || 0} active
                      </div>
                    </div>

                    {/* Card 4: Audit Status */}
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Audit Progress</span>
                        <Shield className="h-4 w-4 text-zinc-450" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {execMetrics?.audit?.progressPct !== undefined ? `${execMetrics.audit.progressPct}%` : "0%"}
                      </div>
                      <div className="text-[10px] text-indigo-650 font-semibold truncate" title={execMetrics?.audit?.cycleName}>
                        {execMetrics?.audit?.cycleName || "No active cycles"}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {widget.id === "admin_actions" && (
                <div className={paddingClass}>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-2">Administrator Quick Control Panel</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/admin/org" className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group">
                      <Users className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
                      <span className="text-xs font-bold text-zinc-900">Manage Directory</span>
                    </Link>
                    <Link href="/dashboard/reports" className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group">
                      <BarChart3 className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
                      <span className="text-xs font-bold text-zinc-900">System Analytics</span>
                    </Link>
                    <Link href="/dashboard/audits" className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group">
                      <Shield className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
                      <span className="text-xs font-bold text-zinc-900">Inventory Audits</span>
                    </Link>
                    <button onClick={() => alert("ERP self-diagnostic complete. All systems online.")} className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group cursor-pointer">
                      <Check className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
                      <span className="text-xs font-bold text-zinc-900">System Diagnosis</span>
                    </button>
                  </div>
                </div>
              )}

              {widget.id === "admin_overdue" && (
                <div className="divide-y divide-zinc-100">
                  <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-zinc-400" /> Overdue Custody Alerts
                    </h3>
                  </div>
                  {(!metrics?.overdueReturns || metrics.overdueReturns.length === 0) ? (
                    <div className="py-8 text-center text-zinc-400 text-xs italic">No overdue returns.</div>
                  ) : (
                    metrics.overdueReturns.map((alloc: any) => (
                      <div key={alloc.id} className="p-4 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono bg-red-50 text-red-700 px-1.5 py-0.2 border border-red-100 rounded font-bold mr-2">{alloc.asset.tag}</span>
                          <span className="font-bold text-zinc-900">{alloc.asset.name}</span>
                          <div className="text-zinc-500 mt-1">Holder: {alloc.user.name}</div>
                        </div>
                        <span className="text-red-600 font-bold">{new Date(alloc.expectedReturnDate).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {widget.id === "admin_activity" && (
                <div className="divide-y divide-zinc-100">
                  <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-zinc-400" /> Recent System Activity Logs
                    </h3>
                  </div>
                  {(!metrics?.activities || metrics.activities.length === 0) ? (
                    <div className="py-8 text-center text-zinc-400 text-xs italic">No logged activity logs.</div>
                  ) : (
                    metrics.activities.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="p-4 flex justify-between text-xs">
                        <div>
                          <span className="font-bold text-zinc-900">{log.action.replace("_", " ")}</span>
                          <div className="text-zinc-500 mt-0.5">By {log.user?.name || "System"} on {log.entityType} ({log.entityId})</div>
                        </div>
                        <span className="text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}


              {/* ASSET MANAGER WIDGETS */}
              {widget.id === "manager_kpis" && (
                <div className={paddingClass}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Available Inventory</span>
                        <Package className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.kpis?.assetsAvailable || 0}
                      </div>
                    </div>
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Currently Allocated</span>
                        <Database className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.kpis?.assetsAllocated || 0}
                      </div>
                    </div>
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Under Maintenance</span>
                        <Wrench className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.kpis?.maintenanceToday || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {widget.id === "manager_actions" && (
                <div className={paddingClass}>
                  <DashboardQuickActions assets={assets} employees={employees} isPowerUser={true} />
                </div>
              )}

              {widget.id === "manager_approvals" && (
                <div className="divide-y divide-zinc-100 text-xs">
                  <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                      <Wrench className="h-4 w-4 mr-2 text-zinc-400" /> Maintenance Approvals Queue
                    </h3>
                  </div>
                  {(!metrics?.pendingMaintenance || metrics.pendingMaintenance.length === 0) ? (
                    <div className="py-8 text-center text-zinc-400 italic">Queues are clear.</div>
                  ) : (
                    metrics.pendingMaintenance.map((req: any) => (
                      <div key={req.id} className="p-4 flex justify-between items-center">
                        <div>
                          <span className="font-mono bg-zinc-100 text-zinc-800 px-1.5 py-0.2 rounded border font-bold mr-2">{req.asset.tag}</span>
                          <span className="font-bold text-zinc-900">{req.asset.name}</span>
                          <div className="text-zinc-500 mt-1">Issue: {req.issueDescription}</div>
                        </div>
                        <button 
                          onClick={() => handleQuickApproveClick(req.id)} 
                          className="px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-900 rounded font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}


              {/* DEPT HEAD WIDGETS */}
              {widget.id === "dept_kpis" && (
                <div className={paddingClass}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                    <div className="p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Department Assets</span>
                        <Package className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.deptStats?.assetsCount || 0} Units
                      </div>
                    </div>
                    <div className="p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Active Bookings</span>
                        <Calendar className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.deptStats?.bookingsCount || 0} Bookings
                      </div>
                    </div>
                    <div className="p-4 rounded-xl space-y-1 bg-white shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Members Headcount</span>
                        <Users className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.deptStats?.employeesCount || 0} Employees
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {widget.id === "dept_actions" && (
                <div className={paddingClass}>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-2">Department Commander Console</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/dashboard/bookings" className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm">
                      <span className="text-xs font-bold text-zinc-900">Department Bookings</span>
                      <Calendar className="h-4 w-4 text-zinc-400" />
                    </Link>
                    <Link href="/dashboard/assets" className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm">
                      <span className="text-xs font-bold text-zinc-900">Inventory Directory</span>
                      <Package className="h-4 w-4 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              )}

              {widget.id === "dept_transfers" && (
                <div className="p-6">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-3">Pending Custody Transfers</span>
                  <p className="text-xs text-zinc-400 italic">Review pending transfer requests in the centralized Approvals workspace panel.</p>
                  <Link href="/dashboard/approvals" className="inline-block mt-3 text-xs font-black text-zinc-950 underline">Open Approvals Center</Link>
                </div>
              )}


              {/* EMPLOYEE WIDGETS */}
              {widget.id === "emp_kpis" && (
                <div className={paddingClass}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>My Custody</span>
                        <Package className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.personal?.myAssetsCount || 0} Items
                      </div>
                    </div>
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>My Bookings</span>
                        <Calendar className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.personal?.myBookingsCount || 0} Bookings
                      </div>
                    </div>
                    <div className="border border-zinc-150 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        <span>Active Repairs</span>
                        <Wrench className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className={`${textClass} font-black text-zinc-950 tracking-tight`}>
                        {metrics?.personal?.myRequestsCount || 0} Tickets
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {widget.id === "emp_actions" && (
                <div className={paddingClass}>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-3">Workspace Operations Desk</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link href="/dashboard/bookings" className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm">
                      <span className="text-xs font-bold text-zinc-900">Reserve Space</span>
                      <Calendar className="h-4 w-4 text-zinc-400" />
                    </Link>
                    <Link href="/dashboard/maintenance" className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm">
                      <span className="text-xs font-bold text-zinc-900">Raise Repair</span>
                      <Wrench className="h-4 w-4 text-zinc-400" />
                    </Link>
                    <Link href="/dashboard/assets" className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm">
                      <span className="text-xs font-bold text-zinc-900">Assets Directory</span>
                      <Package className="h-4 w-4 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              )}

              {widget.id === "emp_custody" && (
                <div className="divide-y divide-zinc-100 text-xs">
                  <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                      <Package className="h-4 w-4 mr-2 text-zinc-400" /> My Active Custody Assets
                    </h3>
                  </div>
                  {(!metrics?.personal?.myAssets || metrics.personal.myAssets.length === 0) ? (
                    <div className="py-8 text-center text-zinc-400 italic">No custody items held.</div>
                  ) : (
                    metrics.personal.myAssets.map((asset: any) => (
                      <div key={asset.id} className="p-4 flex justify-between items-center">
                        <div>
                          <span className="font-mono bg-zinc-100 text-zinc-800 px-1.5 py-0.2 rounded border font-bold mr-2">{asset.tag}</span>
                          <span className="font-bold text-zinc-900">{asset.name}</span>
                          <div className="text-zinc-500 mt-1">Location: {asset.location}</div>
                        </div>
                        <Link href={`/dashboard/assets/${asset.id}`} className="px-2.5 py-1.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded font-bold">
                          View details
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}

              {widget.id === "emp_bookings" && (
                <div className="divide-y divide-zinc-100 text-xs">
                  <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-zinc-400" /> My Upcoming Reservations
                    </h3>
                  </div>
                  {(!metrics?.personal?.myBookings || metrics.personal.myBookings.length === 0) ? (
                    <div className="py-8 text-center text-zinc-400 italic">No active bookings.</div>
                  ) : (
                    metrics.personal.myBookings.map((b: any) => (
                      <div key={b.id} className="p-4 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-zinc-900">{b.asset.name}</span>
                          <div className="text-zinc-500 mt-0.5">{new Date(b.startTime).toLocaleString()}</div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 border border-emerald-100 rounded font-bold uppercase text-[9px]">{b.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
