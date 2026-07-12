"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Building2, Users, Package, Calendar, Wrench, Activity, 
  ArrowLeft, Mail, ShieldAlert, Award, FileSpreadsheet, 
  Search, ChevronLeft, ChevronRight, BarChart3, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDepartmentDetails } from "@/actions/org";
import { exportToCSV } from "@/utils/csv";
import Link from "next/link";

type TabType = "overview" | "employees" | "assets" | "bookings" | "maintenance" | "activity";

export default function DepartmentDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();

  // Data states
  const [dept, setDept] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Search queries
  const [empSearch, setEmpSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [maintSearch, setMaintSearch] = useState("");

  // Pagination states
  const [empPage, setEmpPage] = useState(1);
  const [assetPage, setAssetPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [maintPage, setMaintPage] = useState(1);
  const itemsPerPage = 5;

  const [msgError, setMsgError] = useState("");

  const loadDeptDetails = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentDetails(id);
      if (!data) {
        router.push("/dashboard/admin/org");
        return;
      }
      setDept(data);
    } catch (err) {
      console.error(err);
      setMsgError("Failed to fetch department detailing logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDeptDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  if (!dept) return null;

  // KPIs Calculations
  const assetValuation = (dept.assets || []).reduce((sum: number, a: any) => sum + a.acquisitionCost, 0);
  const employeeCount = dept.users?.length || 0;
  const subdeptsCount = dept.subDepartments?.length || 0;
  const activeBookingsCount = (dept.bookings || []).length;
  
  // Simulated utilization: percentage of assets allocated
  const allocatedAssetsCount = (dept.assets || []).filter((a: any) => a.status === "ALLOCATED").length;
  const assetUtilization = dept.assets?.length > 0 
    ? Math.round((allocatedAssetsCount / dept.assets.length) * 100) 
    : 0;

  // Filter & Paginate logic
  const filteredUsers = (dept.users || []).filter((u: any) => 
    u.name.toLowerCase().includes(empSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(empSearch.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice((empPage - 1) * itemsPerPage, empPage * itemsPerPage);

  const filteredAssets = (dept.assets || []).filter((a: any) => 
    a.name.toLowerCase().includes(assetSearch.toLowerCase()) || 
    a.tag.toLowerCase().includes(assetSearch.toLowerCase())
  );
  const paginatedAssets = filteredAssets.slice((assetPage - 1) * itemsPerPage, assetPage * itemsPerPage);

  const filteredBookings = (dept.bookings || []).filter((b: any) => 
    b.asset.name.toLowerCase().includes(bookingSearch.toLowerCase()) || 
    b.user.name.toLowerCase().includes(bookingSearch.toLowerCase())
  );
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * itemsPerPage, bookingPage * itemsPerPage);

  const filteredMaint = (dept.maintenanceReqs || []).filter((m: any) => 
    m.asset.name.toLowerCase().includes(maintSearch.toLowerCase()) || 
    m.issueDescription.toLowerCase().includes(maintSearch.toLowerCase())
  );
  const paginatedMaint = filteredMaint.slice((maintPage - 1) * itemsPerPage, maintPage * itemsPerPage);

  // CSV Exports
  const exportAssets = () => {
    const data = (dept.assets || []).map((a: any) => ({
      "Asset Tag": a.tag,
      "Name": a.name,
      "Category": a.category.name,
      "Serial Number": a.serialNumber,
      "Acquisition Cost": a.acquisitionCost,
      "Location": a.location,
      "Status": a.status,
      "Custodian": a.currentHolder?.name || "None"
    }));
    exportToCSV(data, `${dept.name}_Assets`);
  };

  const exportEmployees = () => {
    const data = (dept.users || []).map((u: any) => ({
      "Name": u.name,
      "Email": u.email,
      "Role": u.role,
      "Status": u.status
    }));
    exportToCSV(data, `${dept.name}_Employees`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 gap-4">
        <div className="space-y-1">
          <Link href="/dashboard/admin/org" className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-950 gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Org Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-black uppercase border border-zinc-900 shadow-sm text-sm">
              {dept.name.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-950 tracking-tight">{dept.name}</h1>
              <p className="text-xs text-zinc-500">
                System Status: <span className="font-bold text-zinc-800">{dept.status}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportEmployees} className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-850 text-xs py-2 px-4 cursor-pointer font-bold">
            Export Headcount
          </Button>
          <Button onClick={exportAssets} className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-850 text-xs py-2 px-4 cursor-pointer font-bold">
            Export Inventory
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-350 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Asset Valuation</span>
            <Building2 className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-950 tracking-tight">₹{assetValuation.toFixed(2)}</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Accumulated department asset worth</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-350 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Headcount</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-950 tracking-tight">{employeeCount} Employees</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Registered members assigned</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-350 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Asset Utilization</span>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-950 tracking-tight">{assetUtilization}%</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Assigned inventory ratio</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2 shadow-sm hover:border-zinc-350 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Shared Bookings</span>
            <Calendar className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-950 tracking-tight">{activeBookingsCount} Bookings</div>
            <p className="text-[9px] text-zinc-400 font-semibold mt-1">Reservations for shared items</p>
          </div>
        </div>
      </div>

      {/* Tabs List (Glassmorphism layout) */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 scrollbar-none select-none">
        {(["overview", "employees", "assets", "bookings", "maintenance", "activity"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab 
                ? "border-zinc-950 text-zinc-950 font-black" 
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feedback Alert */}
      {msgError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 select-none">
          {msgError}
        </div>
      )}

      {/* Main grids split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main content tabs columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Hierarchy and divisions */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Hierarchy & Divisions
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Parent Division</span>
                    <span className="font-bold text-zinc-900">{dept.parent?.name || "Top Level Organization"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Sub-departments Count</span>
                    <span className="font-bold text-zinc-900">{subdeptsCount} Active Divisions</span>
                  </div>
                </div>

                {dept.subDepartments && dept.subDepartments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Subdepartments list</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {dept.subDepartments.map((sub: any) => (
                        <Link 
                          key={sub.id} 
                          href={`/dashboard/departments/${sub.id}`}
                          className="p-3 border border-zinc-150 bg-zinc-50/50 hover:bg-white rounded-xl cursor-pointer block font-bold text-zinc-800"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Department Head / Command Profile */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Department Head / Director
                </h3>
                {dept.manager ? (
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-black uppercase text-sm">
                      {dept.manager.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 text-sm">{dept.manager.name}</div>
                      <div className="text-zinc-500 font-mono mt-0.5">{dept.manager.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-zinc-400 text-xs italic">
                    No active Department Head assigned. Organization administrators can define manager roles in settings.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: EMPLOYEES HEADCOUNT */}
          {activeTab === "employees" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Active Employees Directory
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    placeholder="Search headcount..."
                    value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(1); }}
                    className="pl-8 h-8 text-xs w-full"
                  />
                </div>
              </div>

              {paginatedUsers.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-xs italic">No matching employees found in this department.</div>
              ) : (
                <div className="divide-y divide-zinc-100 text-xs">
                  {paginatedUsers.map((user: any) => (
                    <div key={user.id} className="py-3 flex justify-between items-center">
                      <div>
                        <Link href={`/dashboard/employees/${user.id}`} className="font-bold text-zinc-900 hover:underline">{user.name}</Link>
                        <span className="text-zinc-400 font-mono block mt-0.5">{user.email}</span>
                      </div>
                      <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {filteredUsers.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-zinc-105 pt-3 text-xs">
                  <span className="text-zinc-400">Showing {Math.min(filteredUsers.length, (empPage - 1) * itemsPerPage + 1)} to {Math.min(filteredUsers.length, empPage * itemsPerPage)} of {filteredUsers.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEmpPage(p => Math.max(1, p - 1))} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setEmpPage(p => p * itemsPerPage < filteredUsers.length ? p + 1 : p)} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHYSICAL INVENTORY ASSETS */}
          {activeTab === "assets" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Department Assets Registry
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    placeholder="Search assets tag..."
                    value={assetSearch}
                    onChange={(e) => { setAssetSearch(e.target.value); setAssetPage(1); }}
                    className="pl-8 h-8 text-xs w-full"
                  />
                </div>
              </div>

              {paginatedAssets.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-xs italic">No matching assets assigned.</div>
              ) : (
                <div className="divide-y divide-zinc-100 text-xs">
                  {paginatedAssets.map((asset: any) => (
                    <div key={asset.id} className="py-3 flex justify-between items-center">
                      <div>
                        <Link href={`/dashboard/assets/${asset.id}`} className="font-bold text-zinc-900 hover:underline">{asset.name}</Link>
                        <span className="text-zinc-450 font-mono block mt-0.5">Tag: {asset.tag} | Location: {asset.location}</span>
                      </div>
                      <span className="bg-zinc-950 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        {asset.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {filteredAssets.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-zinc-105 pt-3 text-xs">
                  <span className="text-zinc-400">Showing {Math.min(filteredAssets.length, (assetPage - 1) * itemsPerPage + 1)} to {Math.min(filteredAssets.length, assetPage * itemsPerPage)} of {filteredAssets.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setAssetPage(p => Math.max(1, p - 1))} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setAssetPage(p => p * itemsPerPage < filteredAssets.length ? p + 1 : p)} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESERVATION BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Shared Resources Bookings Scheduler
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    placeholder="Search bookings..."
                    value={bookingSearch}
                    onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(1); }}
                    className="pl-8 h-8 text-xs w-full"
                  />
                </div>
              </div>

              {paginatedBookings.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-xs italic">No matching reservation history logs compiled.</div>
              ) : (
                <div className="divide-y divide-zinc-100 text-xs">
                  {paginatedBookings.map((b: any) => (
                    <div key={b.id} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-zinc-900">{b.asset.name}</span>
                        <span className="text-zinc-400 block mt-0.5">
                          Reserved by {b.user.name} · {new Date(b.startTime).toLocaleString()}
                        </span>
                      </div>
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {filteredBookings.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-zinc-105 pt-3 text-xs">
                  <span className="text-zinc-400">Showing {Math.min(filteredBookings.length, (bookingPage - 1) * itemsPerPage + 1)} to {Math.min(filteredBookings.length, bookingPage * itemsPerPage)} of {filteredBookings.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setBookingPage(p => Math.max(1, p - 1))} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setBookingPage(p => p * itemsPerPage < filteredBookings.length ? p + 1 : p)} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MAINTENANCE TICKETS */}
          {activeTab === "maintenance" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" /> Repair Maintenance Tickets
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={maintSearch}
                    onChange={(e) => { setMaintSearch(e.target.value); setMaintPage(1); }}
                    className="pl-8 h-8 text-xs w-full"
                  />
                </div>
              </div>

              {paginatedMaint.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 text-xs italic">No matching service requests filed.</div>
              ) : (
                <div className="space-y-3">
                  {paginatedMaint.map((m: any) => (
                    <div key={m.id} className="border border-zinc-200 p-4 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-zinc-950">{m.asset.name}</span>
                        <span className="text-zinc-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-zinc-650 italic mt-1 leading-relaxed">"{m.issueDescription}"</p>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-100">
                        <span className="bg-red-50 text-red-700 border border-red-100 px-1.5 rounded text-[10px] font-bold">{m.priority}</span>
                        <span className="bg-zinc-950 text-white px-1.5 rounded text-[10px] font-bold">{m.status}</span>
                        <span className="text-[10px] text-zinc-400 font-medium ml-auto">Filer: {m.raisedBy.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {filteredMaint.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-zinc-105 pt-3 text-xs">
                  <span className="text-zinc-400">Showing {Math.min(filteredMaint.length, (maintPage - 1) * itemsPerPage + 1)} to {Math.min(filteredMaint.length, maintPage * itemsPerPage)} of {filteredMaint.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setMaintPage(p => Math.max(1, p - 1))} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setMaintPage(p => p * itemsPerPage < filteredMaint.length ? p + 1 : p)} className="p-1 border border-zinc-200 hover:bg-zinc-50 rounded"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TIMELINE ACTIVITY */}
          {activeTab === "activity" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Department Members Activity Feed
              </h3>
              <div className="space-y-4 pl-3 border-l-2 border-zinc-200 text-xs">
                {dept.activityLogs && dept.activityLogs.length > 0 ? (
                  dept.activityLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-3 space-y-0.5">
                      <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-zinc-950 border border-white" />
                      <div className="font-bold text-zinc-900">{log.action.replace("_", " ")}</div>
                      <div className="text-zinc-500 font-medium">Logged by {log.user?.name || "System"}</div>
                      <span className="text-[10px] text-zinc-400 block">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-400 italic">No timeline entries logged for this department division.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Cost Distribution Visuals and Subdivisions */}
        <div className="space-y-6">
          
          {/* Asset cost chart analytics */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Cost Distribution Analytics
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-550">
                  <span>Assigned Custody Cost</span>
                  <span>₹{assetValuation.toFixed(2)}</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-zinc-950 h-full" style={{ width: `${Math.min(100, assetValuation / 10000)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-550">
                  <span>Average Cost per Unit</span>
                  <span>₹{dept.assets?.length > 0 ? (assetValuation / dept.assets.length).toFixed(2) : "0.00"}</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-zinc-450 h-full" style={{ width: "45%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Division Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Division Overview
            </h3>
            <p className="text-xs text-zinc-400 leading-normal">
              Department divisions allocate physical hardware to active headcount. Subdepartments inherit hierarchy permissions.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
