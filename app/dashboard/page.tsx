import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

import AdminDashboard from "@/components/dashboard/roles/AdminDashboard";
import ManagerDashboard from "@/components/dashboard/roles/ManagerDashboard";
import DeptHeadDashboard from "@/components/dashboard/roles/DeptHeadDashboard";
import EmployeeDashboard from "@/components/dashboard/roles/EmployeeDashboard";

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch metrics directly on the server
  const metrics = await getDashboardMetrics();

  const isPowerUser = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  // Pre-fetch assets and employees on the server for quick action modals
  let assets: any[] = [];
  let employees: any[] = [];

  if (isPowerUser) {
    const [assetList, employeeList] = await Promise.all([
      getAssets(),
      getEmployees(),
    ]);
    assets = assetList || [];
    employees = employeeList || [];
  }

  const handleQuickApprove = async (formData: FormData) => {
    "use server";
    const requestId = formData.get("requestId") as string;
    if (requestId) {
      await transitionMaintenance({
        requestId,
        status: "APPROVED",
      });
      revalidatePath("/dashboard");
    }
  };

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

      {/* Render matching dashboard deck */}
      {role === "ADMIN" && (
        <AdminDashboard metrics={metrics} user={session.user} />
      )}

      {role === "ASSET_MANAGER" && (
        <ManagerDashboard
          metrics={metrics}
          assets={assets}
          employees={employees}
          handleQuickApprove={handleQuickApprove}
        />
      )}

      {role === "DEPARTMENT_HEAD" && (
        <DeptHeadDashboard metrics={metrics} user={session.user} />
      )}

      {role === "EMPLOYEE" && (
        <EmployeeDashboard metrics={metrics} user={session.user} />
      )}
    </div>
  );
}
