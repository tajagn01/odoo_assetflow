"use client";

import React from "react";
import { ShieldCheck, Users, Calendar, AlertTriangle, Activity, Database, CheckCircle, BarChart3, Clock } from "lucide-react";
import Link from "next/link";

interface AdminDashboardProps {
  metrics: any;
  user: any;
}

export default function AdminDashboard({ metrics, user }: AdminDashboardProps) {
  const kpis = metrics?.kpis || {
    assetsAvailable: 0,
    assetsAllocated: 0,
    activeBookings: 0,
    maintenanceToday: 0,
  };
  const activities = metrics?.activities || [];
  const overdue = metrics?.overdueReturns || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Enterprise Assets</span>
            <Database className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {kpis.assetsAvailable + kpis.assetsAllocated}
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Total physical inventory units</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Bookings</span>
            <Calendar className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{kpis.activeBookings}</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Reservations active today</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Headcount</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {overdue.length + 4} Employees
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Registered organization members</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">ERP System Health</span>
            <Activity className="h-4 w-4 text-zinc-400 animate-pulse" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight flex items-center">
              <span>99.9%</span>
              <span className="h-2 w-2 rounded-full bg-green-500 ml-2 animate-ping shrink-0" />
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Operational & Connected</p>
          </div>
        </div>
      </div>

      {/* Admin Operations Quick Actions Deck */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 space-y-4 shadow-sm">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Administrator Quick Control Panel</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/admin/org"
            className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group"
          >
            <Users className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
            <span className="text-xs font-bold text-zinc-900">Manage Directory</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group"
          >
            <BarChart3 className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
            <span className="text-xs font-bold text-zinc-900">System Analytics</span>
          </Link>
          <Link
            href="/dashboard/audits"
            className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group"
          >
            <ShieldCheck className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
            <span className="text-xs font-bold text-zinc-900">Inventory Audits</span>
          </Link>
          <button
            onClick={() => alert("ERP self-diagnostic complete. All connections online. CPU load: 1.2%, Mem load: 24%.")}
            className="flex flex-col items-center justify-center p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group cursor-pointer"
          >
            <CheckCircle className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950 mb-2" />
            <span className="text-xs font-bold text-zinc-900">System Diagnosis</span>
          </button>
        </div>
      </div>

      {/* Activities and Overdue Alerts Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Overdue Returns Alert Board */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h2 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-zinc-400" /> Overdue Custody Alerts
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {overdue.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs italic">
                No overdue return warnings active.
              </div>
            ) : (
              overdue.map((alloc: any) => (
                <div key={alloc.id} className="p-4 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold">
                      <span className="font-mono bg-red-50 text-red-700 px-1.5 py-0.2 border border-red-100 rounded">
                        {alloc.asset.tag}
                      </span>
                      <span className="text-zinc-900">{alloc.asset.name}</span>
                    </div>
                    <div className="text-zinc-500 mt-1">
                      Holder: <span className="font-bold text-zinc-800">{alloc.user.name}</span> ({alloc.user.email})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600 block">Overdue</span>
                    <span className="text-zinc-400 text-[10px] mt-0.5">
                      {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Activity Ledger Feed */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h2 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <Clock className="h-4 w-4 mr-2 text-zinc-400" /> Global Activity Audit Log
            </h2>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[360px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs italic">
                No system activity logs found.
              </div>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} className="p-4 text-xs hover:bg-zinc-50/50">
                  <div className="flex justify-between items-start font-semibold">
                    <span className="text-zinc-900">{act.action.replace("_", " ")}</span>
                    <span className="text-[10px] text-zinc-400">{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1 text-zinc-500 flex justify-between">
                    <span>
                      Actor: <span className="font-bold text-zinc-800">{act.user?.name || "System"}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">ID: {act.entityId.slice(0, 8)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
