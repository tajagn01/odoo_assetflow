"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebarStore } from "@/store/use-sidebar-store";
import {
  LayoutDashboard,
  Building2,
  Package,
  CalendarDays,
  Wrench,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, SystemResource, ResourceAction } from "@/lib/permissions";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();

  // Configuration for links based on RBAC rules
  const menuItems: {
    title: string;
    href: string;
    icon: any;
    resource?: SystemResource;
    action?: ResourceAction;
    free?: boolean;
  }[] = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      free: true,
    },
    {
      title: "Asset Directory",
      href: "/dashboard/assets",
      icon: Package,
      resource: "ASSETS",
      action: "READ",
    },
    {
      title: "Bookings",
      href: "/dashboard/bookings",
      icon: CalendarDays,
      resource: "BOOKINGS",
      action: "READ",
    },
    {
      title: "Maintenance",
      href: "/dashboard/maintenance",
      icon: Wrench,
      resource: "MAINTENANCE",
      action: "READ",
    },
    {
      title: "Asset Audits",
      href: "/dashboard/audits",
      icon: ShieldCheck,
      resource: "AUDITS",
      action: "READ",
    },
    {
      title: "Organization",
      href: "/dashboard/admin/org",
      icon: Building2,
      resource: "DEPARTMENTS",
      action: "CREATE", // only admin manages org
    },
    {
      title: "Reports & Analytics",
      href: "/dashboard/reports",
      icon: BarChart3,
      resource: "REPORTS",
      action: "READ",
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => item.free || (role && item.resource && item.action && hasPermission(role, item.resource, item.action))
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-zinc-200 bg-white h-screen transition-all duration-300 relative select-none z-20",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-100">
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-zinc-950 tracking-wider">ASSET<span className="text-zinc-500 font-medium">FLOW</span></span>
          </div>
        ) : (
          <span className="text-lg font-black text-zinc-950 mx-auto">AF</span>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-950 transition-all cursor-pointer"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-950", isOpen && "mr-3")} />
              {isOpen && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-zinc-100 bg-zinc-50/50">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "group flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
          )}
        >
          <LogOut className={cn("h-4 w-4 shrink-0 text-red-400 group-hover:text-red-600", isOpen && "mr-3")} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
