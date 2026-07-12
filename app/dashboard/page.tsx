import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Package,
  Calendar,
  AlertTriangle,
  Wrench,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { getDashboardMetrics } from "@/actions/dashboard";
import { getAssets } from "@/actions/assets";
import { getEmployees } from "@/actions/org";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";
import { revalidatePath } from "next/cache";
import { transitionMaintenance } from "@/actions/maintenance";

import DashboardWrapper from "@/components/dashboard/DashboardWrapper";

export default async function DashboardOverview() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch metrics directly on the server
  const metrics = await getDashboardMetrics();

  const isPowerUser = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  // Pre-fetch assets on the server (scoped by role internally)
  const assets = await getAssets() || [];

  // Pre-fetch employees on the server only for quick action modals (power users)
  let employees: any[] = [];
  if (isPowerUser) {
    employees = await getEmployees() || [];
  }

  const role = session.user.role;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Welcome back, {session.user.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Logged in as <span className="font-bold text-zinc-800">{role.replace("_", " ")}</span>
          </p>
        </div>
      </div>

      <DashboardWrapper
        metrics={metrics}
        user={session.user}
        assets={assets}
        employees={employees}
        role={role}
      />
    </div>
  );
}
