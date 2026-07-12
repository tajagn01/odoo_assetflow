"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BarChart3, Database, Download, AlertCircle, CheckCircle2, PieChart, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReportingData, ReportingDataResponse } from "@/actions/reports";
import { seedDemoData } from "@/actions/seed";
import { exportToCSV } from "@/utils/csv";

interface DonutChartProps {
  data: { label: string; value: number }[];
  type?: "status" | "category";
}

function DonutChart({ data, type = "status" }: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-xs italic">
        No items recorded
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: "#10b981",
    ALLOCATED: "#6366f1",
    RESERVED: "#3b82f6",
    UNDER_MAINTENANCE: "#f59e0b",
    LOST: "#ef4444",
    RETIRED: "#71717a",
    DISPOSED: "#d4d4d8",
  };

  const categoryColors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#06b6d4",
    "#10b981",
  ];

  const getColor = (label: string, idx: number) => {
    if (type === "status") {
      return statusColors[label] || "#71717a";
    }
    return categoryColors[idx % categoryColors.length];
  };

  const radius = 38;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const center = 50;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full font-sans select-none">
      <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#f4f4f5" strokeWidth={strokeWidth} />
          {data.map((item, idx) => {
            const val = item.value;
            if (val === 0) return null;
            const percent = val / total;
            const strokeLength = percent * circumference;
            const strokeOffset = circumference - strokeLength + (accumulatedPercent * circumference);
            accumulatedPercent -= percent;

            const isHovered = hoveredIdx === idx;
            const color = getColor(item.label, idx);

            return (
              <circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 2.5 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-300 cursor-pointer origin-center hover:opacity-90"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
            {hoveredIdx !== null ? (hoveredIdx === null ? "Total Assets" : data[hoveredIdx].label.replace("_", " ")) : "Total Assets"}
          </span>
          <span className="text-2xl font-black text-zinc-950 tracking-tight leading-none mt-1">
            {hoveredIdx !== null ? data[hoveredIdx].value.toLocaleString() : total.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-zinc-500 mt-0.5">
            {hoveredIdx !== null ? `${Math.round((data[hoveredIdx].value / total) * 100)}%` : "100%"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-[10px]">
        {data.map((item, idx) => {
          if (item.value === 0) return null;
          const color = getColor(item.label, idx);
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.label}
              className={`flex items-center space-x-2 transition-all cursor-pointer truncate p-1 rounded ${
                isHovered ? "bg-zinc-100 font-bold" : "text-zinc-500"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate text-zinc-700">{item.label.replace("_", " ")}</span>
              <span className="font-mono text-zinc-400">({item.value})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number }[];
  yFormatter?: (val: number) => string;
}

function VerticalBarChart({ data, yFormatter = (val) => val.toLocaleString() }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((item) => item.value), 1);
  const chartHeight = 110;
  const chartWidth = 280;
  const barWidth = Math.min(22, (chartWidth - 50) / data.length);

  return (
    <div className="relative select-none font-sans py-2 flex flex-col items-center w-full">
      <div className="relative w-full h-[155px]">
        <svg viewBox="0 0 320 160" className="w-full h-full">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 130 - ratio * chartHeight;
            const gridVal = ratio * maxVal;
            return (
              <g key={ratio} className="opacity-40">
                <line
                  x1="55"
                  y1={y}
                  x2="310"
                  y2={y}
                  stroke="#e4e4e7"
                  strokeWidth="0.75"
                  strokeDasharray="3,3"
                />
                <text
                  x="48"
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400 text-[8px] font-bold font-mono"
                >
                  {yFormatter(gridVal)}
                </text>
              </g>
            );
          })}

          {data.map((item, idx) => {
            const barHeight = (item.value / maxVal) * chartHeight;
            const x = 65 + idx * ((chartWidth - 40) / data.length);
            const y = 130 - barHeight;
            const isHovered = hoveredIdx === idx;

            return (
              <g key={item.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill={isHovered ? "#09090b" : "#71717a"}
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <text
                  x={x + barWidth / 2}
                  y="145"
                  textAnchor="middle"
                  className="fill-zinc-500 text-[8px] font-bold"
                >
                  {item.label.length > 7 ? `${item.label.slice(0, 6)}…` : item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 bg-zinc-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transition-all duration-150 z-10 pointer-events-none">
            {data[hoveredIdx].label}: <span className="font-mono">{yFormatter(data[hoveredIdx].value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReportingDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<"lifecycle" | "departments" | "categories" | "condition" | "bookings" | "utilization">("lifecycle");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isPowerUser = session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await getReportingData();
      setData(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const handleSeed = async () => {
    setError("");
    setSuccess("");
    setSeeding(true);
    try {
      const res = await seedDemoData();
      if (res.success) {
        setSuccess(res.message || "Seeding complete.");
        await loadData();
      } else {
        setError(res.message || "Failed to seed demo data.");
      }
    } catch (err) {
      setError("An unexpected error occurred during seeding.");
    } finally {
      setSeeding(false);
    }
  };

  const handleExportCSV = (type: string) => {
    if (!data) return;

    if (type === "categories") {
      const formatted = data.categoryDistribution.map((c) => ({
        "Category Name": c.categoryName,
        "Asset Count": c.count,
        "Total Valuation (USD)": c.totalCost,
      }));
      exportToCSV(formatted, "Reporting_Categories");
    } else if (type === "departments") {
      const formatted = data.departmentDistribution.map((d) => ({
        "Department Name": d.departmentName,
        "Asset Count": d.count,
        "Total Valuation (USD)": d.totalCost,
      }));
      exportToCSV(formatted, "Reporting_Departments");
    } else if (type === "lifecycle") {
      const formatted = data.assetStatusDistribution.map((s) => ({
        "Asset Status": s.status,
        "Quantity": s.count,
      }));
      exportToCSV(formatted, "Reporting_Lifecycle");
    } else if (type === "bookings") {
      const formatted = data.bookingHeatmap.map((b) => ({
        "Resource Name": b.assetName,
        "Asset Tag": b.tag,
        "Bookings Count": b.count,
      }));
      exportToCSV(formatted, "Reporting_Booking_Heatmap");
    } else if (type === "utilization") {
      const formatted = data.underutilizedAssets.map((u) => ({
        "Asset Tag": u.tag,
        "Asset Name": u.name,
        "Location": u.location,
        "Valuation (USD)": u.acquisitionCost,
      }));
      exportToCSV(formatted, "Reporting_Idle_Assets");
    }
  };

  if (!isPowerUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-zinc-200 bg-white rounded-2xl p-8 text-center space-y-4 shadow-sm select-none font-sans">
        <ShieldAlert className="h-12 w-12 text-zinc-400" />
        <h2 className="text-lg font-black text-zinc-950 uppercase tracking-tight">Access Denied</h2>
        <p className="text-xs text-zinc-500 max-w-sm">
          Regular employees do not have system-wide reporting and financial auditing privileges. Please contact an administrator.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  const isEmpty = !data || data.generalStats.totalAssets === 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Embedded style to optimize reports print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar, top navbar, back buttons, seed buttons */
          aside, header, nav, button, .no-print {
            display: none !important;
          }
          main, .print-content {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .grid {
            display: grid !important;
          }
        }
      `}} />

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Reports & Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit organizational asset utilization, categories density, and department cost distributions.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2 no-print">
          <Button
            onClick={() => window.print()}
            className="flex items-center bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Print Report PDF
          </Button>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs py-2 px-4 cursor-pointer"
          >
            <Database className="h-4 w-4 mr-2" />
            {seeding ? "Seeding..." : "Seed Demo Dataset"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-900" />
          <span>{success}</span>
        </div>
      )}

      {/* Database Empty Warning Onboarding Banner */}
      {isEmpty && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-zinc-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-zinc-950 uppercase tracking-tight">Empty Database Detected</h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              No physical assets or cost profiles are currently logged. Click the button below to seed the database with departments, shared vehicles, laptops, Aeron chairs, maintenance requests, and reservation schedules instantly!
            </p>
          </div>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 px-6 font-bold cursor-pointer"
          >
            {seeding ? "Seeding..." : "Populate Demo Assets & Logs"}
          </Button>
        </div>
      )}

      {!isEmpty && data && (
        <>
          {/* General Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Total Tracked Assets</span>
              <span className="text-3xl font-black text-zinc-950 tracking-tight">{data.generalStats.totalAssets} Items</span>
            </div>
            
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Inventory Valuation</span>
              <span className="text-3xl font-black text-zinc-950 tracking-tight">
                ${data.generalStats.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Average Asset Cost</span>
              <span className="text-3xl font-black text-zinc-950 tracking-tight">
                ${data.generalStats.averageAssetCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Shared Resources</span>
              <span className="text-3xl font-black text-zinc-950 tracking-tight">{data.generalStats.sharedResourcesCount} Bookables</span>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-zinc-200 mt-8">
            <button
              onClick={() => setActiveTab("lifecycle")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "lifecycle" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Asset Lifecycle States
            </button>
            <button
              onClick={() => setActiveTab("departments")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "departments" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Department Cost Allocation
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "categories" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Category Distribution
            </button>
            <button
              onClick={() => setActiveTab("condition")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "condition" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Condition & Maintenance
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "bookings" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Resource Heatmap
            </button>
            <button
              onClick={() => setActiveTab("utilization")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "utilization" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Idle Assets
            </button>
          </div>

          {/* TAB CONTENTS */}
          
          {/* TAB 1: ASSET LIFECYCLE */}
          {activeTab === "lifecycle" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Visual Donut Chart representation using custom SVG */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-zinc-400" /> Lifecycle Status Splits
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Status distribution breakdown of non-deleted tracked items.</p>
                </div>

                <DonutChart
                  data={data.assetStatusDistribution.map((item) => ({
                    label: item.status,
                    value: item.count,
                  }))}
                  type="status"
                />

                <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider pt-2 border-t border-zinc-100 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-zinc-400" /> status density weights
                </div>
              </div>

              {/* Right Table Column */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-900">Lifecycle Details Ledger</h3>
                  <Button
                    onClick={() => handleExportCSV("lifecycle")}
                    className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3 cursor-pointer shadow-sm"
                  >
                    <Download className="h-3 w-3 mr-1.5" /> Export CSV
                  </Button>
                </div>
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-zinc-50 font-black text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Lifecycle State</th>
                      <th className="px-6 py-3">Total Items Count</th>
                      <th className="px-6 py-3">Percentage of Total Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {data.assetStatusDistribution.map((item) => {
                      const total = data.generalStats.totalAssets || 1;
                      const percent = Math.round((item.count / total) * 100);
                      return (
                        <tr key={item.status} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-4 font-bold text-zinc-950">{item.status.replace("_", " ")}</td>
                          <td className="px-6 py-4 text-zinc-700">{item.count} Items</td>
                          <td className="px-6 py-4 text-zinc-500">{percent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS */}
          {activeTab === "departments" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Visual Custom Bar Graph */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-zinc-400" /> Department cost density
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Relative distribution of total asset cost values per department.</p>
                </div>

                <div className="space-y-4">
                  <VerticalBarChart
                    data={data.departmentDistribution.map((dept) => ({
                      label: dept.departmentName,
                      value: dept.totalCost,
                    }))}
                    yFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                  />
                  
                  <div className="space-y-2.5 pt-2 border-t border-zinc-100 max-h-[140px] overflow-y-auto pr-1">
                    {data.departmentDistribution.map((dept) => {
                      const maxVal = Math.max(...data.departmentDistribution.map((d) => d.totalCost), 1);
                      const percent = Math.max(Math.round((dept.totalCost / maxVal) * 100), 2);
                      return (
                        <div key={dept.departmentId} className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-zinc-700 truncate max-w-[150px]">{dept.departmentName}</span>
                            <span className="text-zinc-950 font-mono">${dept.totalCost.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden border border-zinc-200">
                            <div className="bg-zinc-950 h-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider pt-2 border-t border-zinc-100 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-zinc-400" /> cost allocation weights
                </div>
              </div>

              {/* Right Table Column */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-900">Department Financial Audit</h3>
                  <Button
                    onClick={() => handleExportCSV("departments")}
                    className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3 cursor-pointer shadow-sm"
                  >
                    <Download className="h-3 w-3 mr-1.5" /> Export CSV
                  </Button>
                </div>
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-zinc-50 font-black text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Items Count</th>
                      <th className="px-6 py-3">Total Asset Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {data.departmentDistribution.map((item) => (
                      <tr key={item.departmentId} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 font-bold text-zinc-950">{item.departmentName}</td>
                        <td className="px-6 py-4 text-zinc-700">{item.count} Items</td>
                        <td className="px-6 py-4 font-mono font-semibold text-zinc-900">
                          ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Visual Custom Bar Graph */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-zinc-400" /> Category Inventory Density
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Item volume counts distribution grouped per Category.</p>
                </div>

                <DonutChart
                  data={data.categoryDistribution.map((cat) => ({
                    label: cat.categoryName,
                    value: cat.count,
                  }))}
                  type="category"
                />

                <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider pt-2 border-t border-zinc-100 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-zinc-400" /> volume distribution weights
                </div>
              </div>

              {/* Right Table Column */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-900">Category Valuation Ledger</h3>
                  <Button
                    onClick={() => handleExportCSV("categories")}
                    className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3 cursor-pointer shadow-sm animate-none"
                  >
                    <Download className="h-3 w-3 mr-1.5" /> Export CSV
                  </Button>
                </div>
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-zinc-50 font-black text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Items Count</th>
                      <th className="px-6 py-3">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {data.categoryDistribution.map((item) => (
                      <tr key={item.categoryId} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 font-bold text-zinc-950">{item.categoryName}</td>
                        <td className="px-6 py-4 text-zinc-700">{item.count} Items</td>
                        <td className="px-6 py-4 font-mono font-semibold text-zinc-900">
                          ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CONDITION & MAINTENANCE */}
          {activeTab === "condition" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Asset condition stats */}
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-900">Asset Condition Summary</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Condition ratings profile of active assets.</p>
                </div>
                <div className="p-6 space-y-4">
                  {data.conditionDistribution.map((cond) => {
                    const total = data.generalStats.totalAssets || 1;
                    const percent = Math.round((cond.count / total) * 100);
                    return (
                      <div key={cond.condition} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-zinc-800">{cond.condition}</span>
                          <span className="text-zinc-950">{cond.count} items ({percent}%)</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                          <div className="bg-zinc-950 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Maintenance Priority stats */}
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-900">Maintenance Request Severity Profile</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Distribution of repair tickets logged by severity level.</p>
                </div>
                <div className="p-6 space-y-4">
                  {data.maintenancePriorityDistribution.map((pri) => {
                    const totalRequests = data.maintenancePriorityDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
                    const percent = Math.round((pri.count / totalRequests) * 100);
                    return (
                      <div key={pri.priority} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-zinc-800">{pri.priority} Priority</span>
                          <span className="text-zinc-950">{pri.count} tickets ({percent}%)</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                          <div className="bg-zinc-950 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESOURCE HEATMAP */}
          {activeTab === "bookings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Visual heat indicator info */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-zinc-400" /> Booking Frequency
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Relative frequency of reservations across bookable assets.</p>
                </div>
                
                <div className="space-y-4">
                  <VerticalBarChart
                    data={data.bookingHeatmap.map((b) => ({
                      label: b.assetName,
                      value: b.count,
                    }))}
                  />
                </div>

                <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider pt-2 border-t border-zinc-100 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-zinc-400" /> booking heat scores
                </div>
              </div>

              {/* Table Ledger */}
              <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-900">Resource Reservation Heatmap</h3>
                  <Button
                    onClick={() => handleExportCSV("bookings")}
                    className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3 cursor-pointer shadow-sm animate-none"
                  >
                    <Download className="h-3 w-3 mr-1.5" /> Export CSV
                  </Button>
                </div>
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-zinc-50 font-black text-zinc-500 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3">Resource Name</th>
                      <th className="px-6 py-3">Asset Tag</th>
                      <th className="px-6 py-3">Completed/Upcoming Bookings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {data.bookingHeatmap.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-zinc-400 italic">No bookings logged yet.</td>
                      </tr>
                    ) : (
                      data.bookingHeatmap.map((item) => (
                        <tr key={item.tag} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-4 font-bold text-zinc-950">{item.assetName}</td>
                          <td className="px-6 py-4 text-zinc-500 font-mono">{item.tag}</td>
                          <td className="px-6 py-4 text-zinc-700 font-semibold">{item.count} Bookings</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: IDLE (UNDERUTILIZED) ASSETS */}
          {activeTab === "utilization" && (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Underutilized (Idle) Assets</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Assets with "Available" status that have zero historical bookings or allocations.</p>
                </div>
                <Button
                  onClick={() => handleExportCSV("utilization")}
                  className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3 cursor-pointer shadow-sm animate-none"
                >
                  <Download className="h-3 w-3 mr-1.5" /> Export CSV
                </Button>
              </div>
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead className="bg-zinc-50 font-black text-zinc-500 uppercase border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3">Asset Tag</th>
                    <th className="px-6 py-3">Asset Name</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Acquisition Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.underutilizedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-400 italic">No idle assets found. Excellent utilization!</td>
                    </tr>
                  ) : (
                    data.underutilizedAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 text-zinc-950 font-mono font-bold">{asset.tag}</td>
                        <td className="px-6 py-4 text-zinc-800">{asset.name}</td>
                        <td className="px-6 py-4 text-zinc-500">{asset.location}</td>
                        <td className="px-6 py-4 text-zinc-950 font-mono">${asset.acquisitionCost.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
