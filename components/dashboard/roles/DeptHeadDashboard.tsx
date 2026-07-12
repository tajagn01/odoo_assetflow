"use client";

import React from "react";
import { Building, Users, CalendarDays, ClipboardList, ShieldAlert, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DeptHeadDashboardProps {
  metrics: any;
  user: any;
}

export default function DeptHeadDashboard({ metrics, user }: DeptHeadDashboardProps) {
  const kpis = metrics?.kpis || {
    assetsAvailable: 0,
    assetsAllocated: 0,
    activeBookings: 0,
    maintenanceToday: 0,
  };
  const overdue = metrics?.overdueReturns || [];
  const deptName = user?.department?.name || "My Department";

  return (
    <div className="space-y-6 font-sans">
      
      {/* Welcome & Dept header */}
      <div className="bg-zinc-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Department Head Deck</span>
          <h2 className="text-xl font-black">{deptName} Command Board</h2>
          <p className="text-xs text-zinc-300 max-w-md">
            Review custody files, approve transfers, and check bookings for members of the {deptName} department.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Department Assets</span>
            <Building className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {metrics?.deptStats?.assetsCount || 0} Items
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Assigned to team members</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Members</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {metrics?.deptStats?.employeesCount || 0} Headcount
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Assigned team members</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Reservations</span>
            <CalendarDays className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{kpis.activeBookings} Bookings</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Shared resource usages</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Team Repairs</span>
            <ClipboardList className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{kpis.maintenanceToday} active</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Under repair tickets</p>
          </div>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Local Bookings Overview */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-zinc-400" /> Team Booking Activity
            </h3>
            <Link
              href="/dashboard/bookings"
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-950 flex items-center transition-colors"
            >
              Calendar Grid <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-xs text-zinc-500">
              Your department employees have reserved bookable items. Maintain schedule conflicts via the scheduler.
            </p>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs font-semibold text-zinc-700 flex items-center space-x-2">
              <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
              <span>Tesla Model Y: Reserved for offsite Marketing shoot (Sneha Reddy).</span>
            </div>
          </div>
        </div>

        {/* Local Custody Issues */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-zinc-400" /> Custody Health Alerts
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 text-xs">
            {overdue.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 italic">
                All department asset returns are on schedule.
              </div>
            ) : (
              overdue.map((alloc: any) => (
                <div key={alloc.id} className="p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-zinc-900">{alloc.asset.name}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">Holder: {alloc.user.name}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-100 rounded">
                    Due Return
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
