"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart3, Database, Download, AlertCircle, CheckCircle2, 
  PieChart, ShieldAlert, Sparkles, TrendingUp, Calendar, 
  Wrench, ArrowRightLeft, FileSpreadsheet, Printer, Search, Info, DollarSign,
  TrendingDown, ShieldCheck, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getReportingData } from "@/actions/reports";
import { exportToCSV } from "@/utils/csv";

type TabType = "financials" | "lifecycle" | "bookings";

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("financials");

  // Filters State
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getReportingData({
        departmentId: departmentId || undefined,
        categoryId: categoryId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentId, categoryId, status, startDate, endDate]);

  const handleExportCSV = (reportName: string, rows: any[]) => {
    if (!rows || rows.length === 0) return;
    exportToCSV(rows, `${reportName}_${new Date().toISOString().slice(0,10)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-zinc-400 italic">
        No reporting data available or access unauthorized.
      </div>
    );
  }

  // Calculate chart helpers
  const maxCategoryCost = Math.max(...(data.categoryDistribution || []).map((c: any) => c.totalCost), 1);
  const maxStatusCount = Math.max(...(data.assetStatusDistribution || []).map((s: any) => s.count), 1);
  const maxBookingCount = Math.max(...(data.bookingHeatmap || []).map((b: any) => b.count), 1);

  // Condition Share Conic-Gradient Pie Chart Setup
  const totalConditions = (data.conditionDistribution || []).reduce((sum: number, c: any) => sum + c.count, 0);
  let currentPercent = 0;
  const gradientSlices = (data.conditionDistribution || []).map((item: any, idx: number) => {
    const percent = totalConditions > 0 ? (item.count / totalConditions) * 100 : 0;
    const start = currentPercent;
    currentPercent += percent;
    // Condition colors: NEW (Dark zinc), GOOD (Medium zinc), FAIR (Light-medium zinc), POOR (Light zinc)
    const colors = ["#09090b", "#3f3f46", "#71717a", "#e4e4e7"];
    return `${colors[idx % colors.length]} ${start}% ${currentPercent}%`;
  }).join(", ");

  const pieStyle = totalConditions > 0
    ? { backgroundImage: `conic-gradient(${gradientSlices})` }
    : { backgroundColor: "#e4e4e7" };

  return (
    <div className="space-y-6 font-sans print:p-0 print:space-y-4">
      
      {/* Title Header */}
      <div className="border-b border-zinc-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Analytics & Enterprise Reports</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit lifecycle records, track maintenance expenditures, and monitor resource reservation metrics.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button 
            onClick={handlePrint}
            className="h-9 text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3.5 py-1 cursor-pointer font-bold flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" /> Print Report
          </Button>
          <Button 
            onClick={() => handleExportCSV("General_Statistics", [data.generalStats])}
            className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-3.5 cursor-pointer font-bold flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Export Report Data
          </Button>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4 print:hidden text-xs font-semibold">
        <div className="space-y-1">
          <Label htmlFor="fDept">Department Filter</Label>
          <Input 
            id="fDept" 
            placeholder="Search Dept ID..." 
            value={departmentId} 
            onChange={(e: any) => setDepartmentId(e.target.value)} 
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fCat">Category Filter</Label>
          <Input 
            id="fCat" 
            placeholder="Search Cat ID..." 
            value={categoryId} 
            onChange={(e: any) => setCategoryId(e.target.value)} 
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fStatus">Status Filter</Label>
          <select
            id="fStatus"
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
            className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="fStart">Start Date</Label>
          <Input 
            id="fStart" 
            type="date" 
            value={startDate} 
            onChange={(e: any) => setStartDate(e.target.value)} 
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fEnd">End Date</Label>
          <Input 
            id="fEnd" 
            type="date" 
            value={endDate} 
            onChange={(e: any) => setEndDate(e.target.value)} 
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-zinc-200 select-none text-[10px] font-bold uppercase tracking-wider space-x-6 overflow-x-auto print:hidden">
        {[
          { id: "financials", label: "Financials & Categories", icon: DollarSign },
          { id: "lifecycle", label: "Maintenance & Lifecycle", icon: Wrench },
          { id: "bookings", label: "Resource Reservations", icon: Calendar }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === t.id 
                  ? "border-zinc-950 text-zinc-950 font-black" 
                  : "border-transparent text-zinc-400 hover:text-zinc-650"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* KPI GRID SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 select-none">
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Active Assets</span>
          <span className="text-2xl font-black text-zinc-900 block">{data.generalStats?.totalAssets || 0}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Portfolio Valuation</span>
          <span className="text-2xl font-black text-zinc-900 block">₹{data.generalStats?.totalValuation?.toLocaleString() || 0}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Asset Cost</span>
          <span className="text-2xl font-black text-zinc-900 block">₹{Math.round(data.generalStats?.averageAssetCost || 0).toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Maintenance Expenditures</span>
          <span className="text-2xl font-black text-zinc-900 block">₹{data.generalStats?.totalMaintenanceCost?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* TAB CONTENT: FINANCIALS & CATEGORIES */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart 1: Status Distribution Bar Chart */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 lg:col-span-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Asset Status Distribution</h3>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Real-time status</span>
              </div>
              <div className="h-48 flex items-end gap-4 border-b border-zinc-150 pb-2">
                {data.assetStatusDistribution?.map((item: any) => {
                  const percent = (item.count / maxStatusCount) * 100;
                  return (
                    <div key={item.status} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] font-black font-mono bg-zinc-950 text-white rounded px-1.5 py-0.5 mb-1.5 shadow-sm">
                        {item.count}
                      </span>
                      <div 
                        className="w-full bg-zinc-200 group-hover:bg-zinc-950 rounded-t-sm transition-all duration-500 ease-out" 
                        style={{ height: `${item.count > 0 ? Math.max(percent * 0.75, 4) : 0}%` }}
                      />
                      <span className="text-[8px] font-black text-zinc-400 uppercase truncate w-full text-center tracking-widest mt-2">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Condition Distribution Pie Chart */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Condition Share</h3>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pie Chart</span>
              </div>
              <div className="flex items-center justify-around gap-4 py-2 flex-1">
                {/* Conic Gradient Pie */}
                <div 
                  className="h-28 w-28 rounded-full border border-zinc-200 shadow-inner flex items-center justify-center relative group"
                  style={pieStyle}
                >
                  <div className="h-16 w-16 rounded-full bg-white flex flex-col items-center justify-center">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider leading-none">Total</span>
                    <span className="text-sm font-black text-zinc-950 leading-none mt-1">{totalConditions}</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="space-y-2 text-[9px] font-bold text-zinc-650">
                  {(data.conditionDistribution || []).map((item: any, idx: number) => {
                    const colors = ["bg-zinc-950", "bg-zinc-700", "bg-zinc-500", "bg-zinc-300"];
                    const percent = totalConditions > 0 ? Math.round((item.count / totalConditions) * 100) : 0;
                    return (
                      <div key={item.condition} className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length]}`} />
                        <span className="uppercase tracking-wider truncate max-w-[80px]">{item.condition} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>



          {/* Detailed Valuation Table */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Acquisition & Category Ledger</h3>
              <Button 
                onClick={() => handleExportCSV("Category_Ledger", data.categoryDistribution)}
                className="h-8 text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-2.5 font-bold"
              >
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase select-none">
                    <th className="p-3 text-left">Category Name</th>
                    <th className="p-3 text-center">Active Assets</th>
                    <th className="p-3 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.categoryDistribution?.map((cat: any) => (
                    <tr key={cat.categoryId} className="hover:bg-zinc-50/50">
                      <td className="p-3 font-bold text-zinc-950">{cat.categoryName}</td>
                      <td className="p-3 text-center font-semibold text-zinc-700">{cat.count}</td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-900">₹{cat.totalCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MAINTENANCE & LIFECYCLE */}
      {activeTab === "lifecycle" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Retirement Plan & Action Items */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Retirement Forecast Action Plan
              </h3>
              <div className="space-y-2.5 text-xs">
                {data.retirementForecast?.length === 0 ? (
                  <div className="py-6 text-center text-zinc-400 italic">No assets forecasted for retirement.</div>
                ) : (
                  data.retirementForecast?.map((f: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                      <div>
                        <span className="font-bold text-zinc-900 block">[{f.tag}] {f.name}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">Age: {f.ageYears} years · Condition: {f.condition}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">{f.forecastAction}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overdue Alerts */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-red-500" /> Overdue Asset Allocations
              </h3>
              <div className="space-y-2.5 text-xs">
                {data.overdueAssetsReport?.length === 0 ? (
                  <div className="py-6 text-center text-zinc-450 italic">No overdue allocations. All assets check in on time.</div>
                ) : (
                  data.overdueAssetsReport?.map((al: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                      <div>
                        <span className="font-bold text-zinc-900 block">[{al.tag}] {al.name}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">Assigned to: {al.holder}</span>
                      </div>
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-wider">Overdue: {al.overdueSince}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Maintenance Cost ledger */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-zinc-400" /> Maintenance Expenditure Ledger
            </h3>
            <div className="space-y-2 text-xs">
              {data.maintenanceCostReport?.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 italic">No repair costs recorded.</div>
              ) : (
                data.maintenanceCostReport?.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 hover:border-zinc-300 transition-colors">
                    <div>
                      <span className="font-bold text-zinc-900 block">[{t.assetTag}] {t.assetName}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Logged on: {t.date}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-950">₹{t.cost.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 3: Booking reservations counts (Bar Graph) */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Resource Reservations Bar Graph</h3>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Popular shared resources</span>
            </div>
            {data.bookingHeatmap?.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 italic">No reservations logged for shared resources.</div>
            ) : (
              <div className="h-48 flex items-end gap-4 border-b border-zinc-150 pb-2">
                {data.bookingHeatmap?.map((item: any, idx: number) => {
                  const percent = (item.count / maxBookingCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] font-black font-mono bg-zinc-950 text-white rounded px-1.5 py-0.5 mb-1.5 shadow-sm">
                        {item.count}
                      </span>
                      <div 
                        className="w-full bg-zinc-200 group-hover:bg-zinc-950 rounded-t-sm transition-all duration-500 ease-out" 
                        style={{ height: `${item.count > 0 ? Math.max(percent * 0.75, 4) : 0}%` }}
                      />
                      <span className="text-[8px] font-black text-zinc-400 uppercase truncate w-full text-center tracking-widest mt-2">
                        {item.assetName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bookings Ledger */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Reservation History Ledger</h3>
              <Button 
                onClick={() => handleExportCSV("Reservations_History", data.bookingHeatmap)}
                className="h-8 text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-2.5 font-bold"
              >
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase select-none">
                    <th className="p-3 text-left">Resource Name</th>
                    <th className="p-3 text-center">Asset Tag</th>
                    <th className="p-3 text-right">Reservations Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.bookingHeatmap?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="p-3 font-bold text-zinc-950">{item.assetName}</td>
                      <td className="p-3 text-center font-mono font-bold text-zinc-500">{item.tag}</td>
                      <td className="p-3 text-right font-bold text-zinc-900">{item.count} bookings</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
