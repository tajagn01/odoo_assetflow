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

type TabType = "overview" | "utilization" | "departments" | "bookings" | "maintenance" | "lifecycle";

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

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

  return (
    <div className="space-y-6 font-sans print:p-0 print:space-y-4">
      
      {/* Title Header */}
      <div className="border-b border-zinc-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Analytics & Enterprise Reports</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit lifecycle records, track maintenance expenditures, and monitor resource reservation heatmaps.</p>
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
          { id: "overview", label: "Overview Metrics", icon: PieChart },
          { id: "utilization", label: "Asset Utilization", icon: TrendingUp },
          { id: "departments", label: "Department Performance", icon: Database },
          { id: "bookings", label: "Resource Bookings", icon: Calendar },
          { id: "maintenance", label: "Maintenance Cost", icon: Wrench },
          { id: "lifecycle", label: "Forecasts & Expiry", icon: ShieldCheck }
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
          <span className="text-2xl font-black text-zinc-900 block">${data.generalStats?.totalValuation?.toLocaleString() || 0}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Asset Cost</span>
          <span className="text-2xl font-black text-zinc-900 block">${Math.round(data.generalStats?.averageAssetCost || 0).toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Maintenance Expenditures</span>
          <span className="text-2xl font-black text-zinc-900 block">${data.generalStats?.totalMaintenanceCost?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Distribution */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Asset Status Distribution</h3>
            <div className="space-y-2 text-xs">
              {data.assetStatusDistribution?.map((item: any) => (
                <div key={item.status} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <span className="font-bold text-zinc-700">{item.status}</span>
                  <span className="font-bold text-zinc-950">{item.count} assets</span>
                </div>
              ))}
            </div>
          </div>
          {/* Condition Distribution */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Condition Distribution</h3>
            <div className="space-y-2 text-xs">
              {data.conditionDistribution?.map((item: any) => (
                <div key={item.condition} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  <span className="font-bold text-zinc-700">{item.condition}</span>
                  <span className="font-bold text-zinc-950">{item.count} assets</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: UTILIZATION */}
      {activeTab === "utilization" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Asset Category Valuation & Usage</h3>
            <Button 
              onClick={() => handleExportCSV("Category_Distribution", data.categoryDistribution)}
              className="h-8 text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-2.5 font-bold"
            >
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-400 font-bold uppercase select-none">
                  <th className="p-3 text-left">Category Name</th>
                  <th className="p-3 text-center">Active Assets</th>
                  <th className="p-3 text-right">Acquisition Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {data.categoryDistribution?.map((cat: any) => (
                  <tr key={cat.categoryId} className="hover:bg-zinc-50/30">
                    <td className="p-3 font-bold text-zinc-950">{cat.categoryName}</td>
                    <td className="p-3 text-center font-semibold text-zinc-700">{cat.count}</td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-905">${cat.totalCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEPARTMENTS */}
      {activeTab === "departments" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Department Performance Summary</h3>
            <Button 
              onClick={() => handleExportCSV("Department_Performance", data.departmentDistribution)}
              className="h-8 text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-2.5 font-bold"
            >
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-400 font-bold uppercase select-none">
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-center">Managed Assets</th>
                  <th className="p-3 text-right">Valuation Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {data.departmentDistribution?.map((dept: any) => (
                  <tr key={dept.departmentId} className="hover:bg-zinc-50/30">
                    <td className="p-3 font-bold text-zinc-950">{dept.departmentName}</td>
                    <td className="p-3 text-center font-semibold text-zinc-700">{dept.count}</td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-905">${dept.totalCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Resource Booking Heatmap</h3>
            <Button 
              onClick={() => handleExportCSV("Booking_Heatmap", data.bookingHeatmap)}
              className="h-8 text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-2.5 font-bold"
            >
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-400 font-bold uppercase select-none">
                  <th className="p-3 text-left">Resource Name</th>
                  <th className="p-3 text-center">Asset Tag</th>
                  <th className="p-3 text-right">Reservations Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {data.bookingHeatmap?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50/30">
                    <td className="p-3 font-bold text-zinc-950">{item.assetName}</td>
                    <td className="p-3 text-center font-mono font-bold text-zinc-600">{item.tag}</td>
                    <td className="p-3 text-right font-bold text-indigo-755">{item.count} bookings</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cost report */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Maintenance Cost Report</h3>
            <div className="space-y-2 text-xs">
              {data.maintenanceCostReport?.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 italic">No repair costs recorded.</div>
              ) : (
                data.maintenanceCostReport?.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                    <div>
                      <span className="font-bold text-zinc-900 block">[{t.assetTag}] {t.assetName}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Logged on: {t.date}</span>
                    </div>
                    <span className="font-mono font-bold text-red-650">${t.cost.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Frequency report */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase">Maintenance Frequency Report</h3>
            <div className="space-y-2 text-xs">
              {data.maintenanceFrequencyReport?.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 italic">No tickets filed.</div>
              ) : (
                data.maintenanceFrequencyReport?.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                    <span className="font-bold text-zinc-900">[{t.tag}] {t.name}</span>
                    <span className="font-bold text-zinc-650">{t.count} repairs</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LIFECYCLE FORECASTS & EXPIRY */}
      {activeTab === "lifecycle" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Retirement Forecast */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
              <h3 className="text-sm font-black text-zinc-900 uppercase flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Retirement Forecast Action Plan
              </h3>
              <div className="space-y-2 text-xs">
                {data.retirementForecast?.length === 0 ? (
                  <div className="py-6 text-center text-zinc-400 italic">No assets forecasted for retirement.</div>
                ) : (
                  data.retirementForecast?.map((f: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                      <div>
                        <span className="font-bold text-zinc-900 block">[{f.tag}] {f.name}</span>
                        <span className="text-[10px] text-zinc-450 font-medium">Age: {f.ageYears} years · Condition: {f.condition}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-red-100 text-red-750 border border-red-200 uppercase tracking-wider">{f.forecastAction}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warranty Expiry Report */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
              <h3 className="text-sm font-black text-zinc-900 uppercase flex items-center gap-1">
                <Wrench className="h-4 w-4 text-indigo-500" /> Warranty Expiry Ledger
              </h3>
              <div className="space-y-2 text-xs">
                {data.warrantyExpiryReport?.length === 0 ? (
                  <div className="py-6 text-center text-zinc-400 italic">No expired or expiring warranties.</div>
                ) : (
                  data.warrantyExpiryReport?.map((w: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                      <div>
                        <span className="font-bold text-zinc-900 block">[{w.tag}] {w.name}</span>
                        <span className="text-[10px] text-zinc-405 font-medium">Expiry: {w.expiryDate}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${
                        w.status === "EXPIRED" 
                          ? "bg-zinc-100 text-zinc-650 border-zinc-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>{w.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Overdue Allocations */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase flex items-center gap-1">
              <Clock className="h-4 w-4 text-red-500" /> Overdue Asset Allocations Alert Panel
            </h3>
            <div className="space-y-2 text-xs">
              {data.overdueAssetsReport?.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 italic">No overdue allocations. All assets checking in on time.</div>
              ) : (
                data.overdueAssetsReport?.map((al: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                    <div>
                      <span className="font-bold text-zinc-900 block">[{al.tag}] {al.name}</span>
                      <span className="text-[10px] text-zinc-450 font-medium">Assigned to: {al.holder}</span>
                    </div>
                    <span className="font-bold text-red-650 uppercase">Overdue Since {al.overdueSince}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
