"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Package, CalendarDays, Bell, Search } from "lucide-react";

export default function MobileBottomNav() {
  const triggerSearch = () => {
    const e = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(e);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 z-30 flex items-center justify-around px-2 pb-safe shadow-lg select-none">
      <Link href="/dashboard" className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-950 font-bold text-[10px] w-12">
        <LayoutDashboard className="h-5 w-5 text-zinc-400" />
        <span className="mt-1">Home</span>
      </Link>
      <Link href="/dashboard/assets" className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-950 font-bold text-[10px] w-12">
        <Package className="h-5 w-5 text-zinc-400" />
        <span className="mt-1">Assets</span>
      </Link>
      <Link href="/dashboard/bookings" className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-950 font-bold text-[10px] w-12">
        <CalendarDays className="h-5 w-5 text-zinc-400" />
        <span className="mt-1">Bookings</span>
      </Link>
      <Link href="/dashboard/notifications" className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-950 font-bold text-[10px] w-12">
        <Bell className="h-5 w-5 text-zinc-400" />
        <span className="mt-1">Alerts</span>
      </Link>
      <button 
        onClick={triggerSearch}
        className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-950 font-bold text-[10px] w-12 cursor-pointer focus:outline-none"
      >
        <Search className="h-5 w-5 text-zinc-400" />
        <span className="mt-1">Search</span>
      </button>
    </div>
  );
}
