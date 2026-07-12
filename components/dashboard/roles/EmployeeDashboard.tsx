"use client";

import React from "react";
import { Package, CalendarDays, Wrench, ShieldAlert, ArrowRight, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

interface EmployeeDashboardProps {
  metrics: any;
  user: any;
}

export default function EmployeeDashboard({ metrics, user }: EmployeeDashboardProps) {
  const personal = metrics?.personal || {
    myAssetsCount: 0,
    myBookingsCount: 0,
    myAssets: [],
    myBookings: [],
    myRequests: [],
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Welcome banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 relative overflow-hidden select-none">
        <div className="relative z-10 space-y-1.5">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Employee Workspace</span>
          <h2 className="text-xl font-black text-zinc-950">Welcome, {user?.name || "Employee"}</h2>
          <p className="text-xs text-zinc-500 max-w-md">
            Request conference bookings, register maintenance service issues, or request asset handovers below.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">My Custody</span>
            <Package className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{personal.myAssetsCount} Items</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Assets allocated directly to you</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">My Bookings</span>
            <CalendarDays className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">{personal.myBookingsCount} Active</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Resource reservations</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Tickets</span>
            <Wrench className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-zinc-950 tracking-tight">
              {personal.myRequestsCount || 0} Tickets
            </div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Service requests raised</p>
          </div>
        </div>
      </div>

      {/* Action Shortcut list */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 space-y-4 shadow-sm">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Workspace Operations Desk</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/bookings"
            className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group"
          >
            <div className="flex items-center space-x-3">
              <CalendarDays className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950" />
              <div className="text-left">
                <span className="text-xs font-bold text-zinc-900 block">Reserve Resource</span>
                <span className="text-[9px] text-zinc-400 font-semibold">Book rooms or vehicles</span>
              </div>
            </div>
            <PlusCircle className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950" />
          </Link>

          <Link
            href="/dashboard/maintenance"
            className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group"
          >
            <div className="flex items-center space-x-3">
              <Wrench className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950" />
              <div className="text-left">
                <span className="text-xs font-bold text-zinc-900 block">Raise Repair Ticket</span>
                <span className="text-[9px] text-zinc-400 font-semibold">File malfunction notes</span>
              </div>
            </div>
            <PlusCircle className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950" />
          </Link>

          <Link
            href="/dashboard/assets"
            className="flex items-center justify-between p-4 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all shadow-sm group"
          >
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-zinc-500 group-hover:text-zinc-950" />
              <div className="text-left">
                <span className="text-xs font-bold text-zinc-900 block">Request Handovers</span>
                <span className="text-[9px] text-zinc-400 font-semibold">Transfer or return items</span>
              </div>
            </div>
            <PlusCircle className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950" />
          </Link>
        </div>
      </div>

      {/* Custody list vs Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* My Custody Items table */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <Package className="h-4 w-4 mr-2 text-zinc-400" /> My Active Custody Files
            </h3>
            <Link
              href="/dashboard/assets"
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-950 flex items-center transition-colors"
            >
              Directories <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 text-xs">
            {(!personal.myAssets || personal.myAssets.length === 0) ? (
              <div className="p-8 text-center text-zinc-400 italic">
                You currently hold no physical items. Use the directory to request allocations.
              </div>
            ) : (
              personal.myAssets.map((asset: any) => (
                <div key={asset.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-950">{asset.name}</span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">Tag: {asset.tag} | Location: {asset.location}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 border border-zinc-200 rounded">
                      {asset.condition}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/assets?assetId=${asset.id}&action=transfer`}
                      className="flex-1 text-center text-[10px] font-bold text-zinc-700 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded-lg py-1.5 transition-colors"
                    >
                      Request Transfer
                    </Link>
                    <Link
                      href={`/dashboard/assets?assetId=${asset.id}&action=return`}
                      className="flex-1 text-center text-[10px] font-bold text-zinc-700 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded-lg py-1.5 transition-colors"
                    >
                      Return Asset
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Upcoming Bookings */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-zinc-400" /> My Upcoming Reservations
            </h3>
            <Link
              href="/dashboard/bookings"
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-950 flex items-center transition-colors"
            >
              Calendars <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 text-xs">
            {(!personal.myBookings || personal.myBookings.length === 0) ? (
              <div className="p-8 text-center text-zinc-400 italic">
                No active shared reservations found.
              </div>
            ) : (
              personal.myBookings.map((b: any) => (
                <div key={b.id} className="p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-zinc-950">{b.asset.name}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      Start: {new Date(b.startTime).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 border border-green-100 rounded">
                    {b.status}
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
