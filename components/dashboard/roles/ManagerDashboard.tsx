"use client";

import React from "react";
import { Package, Wrench, RefreshCw, Layers, CheckSquare, Clock } from "lucide-react";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";

interface ManagerDashboardProps {
  metrics: any;
  assets: any[];
  employees: any[];
  handleQuickApprove: (formData: FormData) => Promise<void>;
}

export default function ManagerDashboard({
  metrics,
  assets,
  employees,
  handleQuickApprove,
}: ManagerDashboardProps) {
  const kpis = metrics?.kpis || {
    assetsAvailable: 0,
    assetsAllocated: 0,
    activeBookings: 0,
    maintenanceToday: 0,
  };
  const pendingM = metrics?.pendingMaintenance || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Available Inventory</span>
            <Package className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{kpis.assetsAvailable}</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Ready for allocation</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Currently Allocated</span>
            <Layers className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{kpis.assetsAllocated}</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Held by employees</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Under Maintenance</span>
            <Wrench className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{kpis.maintenanceToday}</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">In service or prototype lab</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Pending Approvals</span>
            <CheckSquare className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{pendingM.length} Tickets</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Awaiting manager authorization</p>
          </div>
        </div>
      </div>

      {/* Quick Action triggers */}
      <DashboardQuickActions
        assets={assets}
        employees={employees}
        isPowerUser={true}
      />

      {/* Maintenance Approvals Queue */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <Clock className="h-4 w-4 mr-2 text-zinc-400" /> Manager Approvals Queue
            </h2>
            <p className="text-[10px] text-zinc-400 mt-0.5">Physical assets awaiting repair clearance.</p>
          </div>
          <span className="text-[9px] font-bold bg-zinc-950 text-white px-2 py-0.5 rounded-full">
            {pendingM.length} Action Needed
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {pendingM.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs italic">
              All queues are clear. No pending maintenance request tickets.
            </div>
          ) : (
            pendingM.map((req: any) => (
              <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs hover:bg-zinc-50/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className="font-mono bg-zinc-100 text-zinc-800 px-1.5 py-0.2 border border-zinc-200 rounded">
                      {req.asset.tag}
                    </span>
                    <span className="text-zinc-950">{req.asset.name}</span>
                  </div>
                  <div className="text-zinc-500 mt-1">
                    <span className="font-semibold text-zinc-700">Issue:</span> {req.issueDescription}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Reported by <span className="font-bold text-zinc-700">{req.raisedBy.name}</span> ({req.raisedBy.email})
                  </div>
                </div>

                <form action={handleQuickApprove}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <button
                    type="submit"
                    className="px-4 py-2 text-[10px] font-bold bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg cursor-pointer transition-all shadow-sm flex items-center"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" /> Approve & Dispatch
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
