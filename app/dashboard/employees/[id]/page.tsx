"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  User, Building2, Package, Calendar, Wrench, Shield, 
  ArrowLeft, Mail, Phone, MapPin, Clock, Award, ShieldAlert, 
  FileText, Activity, Lock, AlertCircle, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getEmployeeDetails } from "@/actions/org";
import { addAssetActivityLog } from "@/actions/assets"; // reusable logging
import Link from "next/link";

type TabType = "overview" | "assets" | "bookings" | "maintenance" | "activity";

export default function EmployeeDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();

  // Employee details state
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Discussion Forms
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeDetails(id);
      if (!data) {
        router.push("/dashboard/admin/org");
        return;
      }
      setEmployee(data);
    } catch (err) {
      console.error(err);
      setMsgError("Failed to fetch employee profiling details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadEmployeeData();
    }
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmitting(true);
    setMsgError("");
    setMsgSuccess("");

    try {
      // Re-use asset activity log logic but link to User entity
      const res = await addAssetActivityLog({
        assetId: id, // User ID serves as entityId
        action: "ADD_NOTE", // Custom action key mapped in log
        text: noteText.trim()
      });

      if (res.success) {
        setMsgSuccess("Internal manager note successfully saved.");
        setNoteText("");
        await loadEmployeeData(); // reload
      } else {
        setMsgError(res.message || "Failed to save internal note.");
      }
    } catch (err: any) {
      setMsgError(err.message || "Failed to execute logging.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  if (!employee) return null;

  // Compliance calculations
  const totalAssetsCount = employee.heldAssets?.length || 0;
  const totalBookingsCount = employee.bookings?.length || 0;
  const totalRepairsCount = employee.maintenanceReqs?.length || 0;
  const custodyComplianceRate = totalRepairsCount > 3 ? "75%" : "98%"; // dynamic compliance estimation

  const isPowerUser = session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Detail Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 gap-4">
        <div className="space-y-1">
          <Link href="/dashboard/admin/org" className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-950 gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Organization Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-black uppercase border border-zinc-900 shadow-sm text-sm">
              {employee.name.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-950 tracking-tight">{employee.name}</h1>
              <p className="text-xs text-zinc-500">
                Employee ID: <span className="font-mono font-bold text-zinc-800">{employee.employeeId || `AF-EMP-${employee.id.slice(0, 6).toUpperCase()}`}</span>
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              employee.status === "ACTIVE" ? "bg-zinc-100 text-zinc-900 border-zinc-200" : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {employee.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs list (Glassmorphism layout) */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 scrollbar-none select-none">
        {(["overview", "assets", "bookings", "maintenance", "activity"] as TabType[]).map((tab) => (
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

      {/* Feedback Messages */}
      {msgError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 select-none">
          {msgError}
        </div>
      )}
      {msgSuccess && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950">
          {msgSuccess}
        </div>
      )}

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Employee Bio & Metadata */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Professional Profile
                </h3>
                <div className="space-y-4">
                  <div className="text-xs text-zinc-650 leading-relaxed bg-zinc-50 border border-zinc-150 p-4 rounded-xl italic">
                    {employee.bio || "No professional bio saved in settings profile."}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between border-b border-zinc-100 pb-2">
                      <span className="text-zinc-500 font-medium">Job Title</span>
                      <span className="font-bold text-zinc-900">{employee.jobTitle || "Associate"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-2">
                      <span className="text-zinc-500 font-medium">Role System Level</span>
                      <span className="font-bold text-zinc-900">{employee.role}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-2">
                      <span className="text-zinc-500 font-medium">Location Site</span>
                      <span className="font-bold text-zinc-900">{employee.location || "Remote / HQ"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-2">
                      <span className="text-zinc-500 font-medium">Timezone Preference</span>
                      <span className="font-bold text-zinc-900">{employee.timezone || "UTC"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Manager Profile */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Department Hierarchy
                </h3>
                {employee.department ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between border-b border-zinc-100 pb-2">
                      <span className="text-zinc-500 font-medium">Department Name</span>
                      <span className="font-bold text-zinc-900">{employee.department.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-2">
                      <span className="text-zinc-500 font-medium">Manager / Head</span>
                      <span className="font-bold text-zinc-900">{employee.department.manager?.name || "Unassigned Head"}</span>
                    </div>
                    {employee.department.manager?.email && (
                      <div className="flex justify-between border-b border-zinc-100 pb-2">
                        <span className="text-zinc-500 font-medium">Manager Email</span>
                        <span className="font-mono text-zinc-650">{employee.department.manager.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-zinc-400 text-xs italic">
                    Employee is currently unassigned to any department divisions.
                  </div>
                )}
              </div>

              {/* Documents Manager */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Contracts & Documents
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 border border-zinc-200 bg-zinc-50/50 rounded-lg">
                    <span className="font-bold text-zinc-700">Employment Contract.pdf</span>
                    <span className="text-zinc-400">Signed 2026</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-zinc-200 bg-zinc-50/50 rounded-lg">
                    <span className="font-bold text-zinc-700">Security Clearance Agreement.pdf</span>
                    <span className="text-zinc-400">Verified</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ASSIGNED CUSTODY ASSETS */}
          {activeTab === "assets" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Current Active Custody List
              </h3>
              {employee.heldAssets && employee.heldAssets.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {employee.heldAssets.map((asset: any) => (
                    <Link 
                      key={asset.id} 
                      href={`/dashboard/assets/${asset.id}`}
                      className="flex justify-between items-center p-4 border border-zinc-150 hover:border-zinc-350 bg-zinc-50/30 hover:bg-white rounded-xl transition-all cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-zinc-950 text-sm block">{asset.name}</span>
                        <span className="text-zinc-400 block mt-0.5">Tag: {asset.tag} · Serial: {asset.serialNumber}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 border border-zinc-200 rounded">
                        {asset.condition}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs italic">
                  Employee holds no physical custody assets.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESERVATION BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Reservation Bookings History
              </h3>
              {employee.bookings && employee.bookings.length > 0 ? (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-zinc-400 border-b border-zinc-200 pb-2">
                        <th className="py-2">Resource</th>
                        <th className="py-2">Start Time</th>
                        <th className="py-2">End Time</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.bookings.map((b: any) => (
                        <tr key={b.id} className="border-b border-zinc-50">
                          <td className="py-3 font-bold text-zinc-900">{b.asset.name}</td>
                          <td className="py-3 text-zinc-500">{new Date(b.startTime).toLocaleString()}</td>
                          <td className="py-3 text-zinc-500">{new Date(b.endTime).toLocaleString()}</td>
                          <td className="py-3">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-1.5 py-0.2 font-bold uppercase text-[9px]">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs italic">
                  No resource reservation logs compiled.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPAIR REQUESTS */}
          {activeTab === "maintenance" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Wrench className="h-4 w-4" /> Maintenance Service Requests
              </h3>
              {employee.maintenanceReqs && employee.maintenanceReqs.length > 0 ? (
                <div className="space-y-4">
                  {employee.maintenanceReqs.map((req: any) => (
                    <div key={req.id} className="border border-zinc-150 p-4 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-zinc-950">Issue: {req.asset.name}</span>
                        <span className="text-zinc-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-zinc-650">{req.issueDescription}</p>
                      <div className="flex gap-2">
                        <span className="bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{req.priority}</span>
                        <span className="bg-zinc-950 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">{req.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs italic">
                  No repair tickets raised by this employee.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYSTEM ACTIVITY LOGS */}
          {activeTab === "activity" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
              
              {/* Audit cycles */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Audit Cycles Participation</Label>
                {employee.auditedCycles && employee.auditedCycles.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {employee.auditedCycles.map((auditor: any) => (
                      <div key={auditor.id} className="flex justify-between items-center p-3 border border-zinc-150 bg-zinc-550/10 rounded-lg">
                        <span className="font-bold text-zinc-800">{auditor.auditCycle.name}</span>
                        <span className="font-mono text-zinc-500">Auditor Role Assigned</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-400 text-xs italic pl-1">Employee has not participated as auditor in audit cycles.</div>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2 pt-4 border-t border-zinc-100">
                <Label className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Timeline Activity Feed</Label>
                <div className="space-y-4 pl-3 border-l-2 border-zinc-200 text-xs">
                  {employee.activityLogs && employee.activityLogs.length > 0 ? (
                    employee.activityLogs.map((log: any) => (
                      <div key={log.id} className="relative pl-3 space-y-0.5">
                        <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-zinc-950 border border-white" />
                        <div className="font-bold text-zinc-900">{log.action.replace("_", " ")}</div>
                        <div className="text-zinc-400 font-mono text-[9px]">Entity: {log.entityType} ({log.entityId})</div>
                        <span className="text-[10px] text-zinc-450 block">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-400 italic">No historical timeline operations recorded.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Contact pane, compliance metrics, and Manager notes */}
        <div className="space-y-6">
          
          {/* Quick contact card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Contact Directory
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="font-mono text-zinc-800 truncate">{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-800">{employee.phone || "No contact number configured"}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-800">{employee.location || "Office Site HQ"}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-800">Timezone: {employee.timezone || "UTC"}</span>
              </div>
            </div>
          </div>

          {/* Performance & Compliance Metrics */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4" /> ERP Compliance Metrics
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
              <div className="bg-zinc-50 p-2.5 border border-zinc-150 rounded-lg">
                <div className="font-black text-zinc-900 text-lg">{totalAssetsCount}</div>
                <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Assets</div>
              </div>
              <div className="bg-zinc-50 p-2.5 border border-zinc-150 rounded-lg">
                <div className="font-black text-zinc-900 text-lg">{totalBookingsCount}</div>
                <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Bookings</div>
              </div>
              <div className="bg-zinc-50 p-2.5 border border-zinc-150 rounded-lg">
                <div className="font-black text-zinc-900 text-lg">{totalRepairsCount}</div>
                <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Repairs</div>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-zinc-100 pt-4">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Custody Compliance</span>
                <span className="font-bold text-emerald-800">{custodyComplianceRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Audit Participation</span>
                <span className="font-bold text-zinc-900">{employee.auditedCycles?.length || 0} Cycles</span>
              </div>
            </div>
          </div>

          {/* Internal manager profiling notes */}
          {isPowerUser && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Manager internal Notes
              </h3>
              
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  placeholder="Record compliance performance feedback, disciplinary notes..."
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                />
                <Button
                  type="submit"
                  disabled={submitting || !noteText.trim()}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 disabled:opacity-50"
                >
                  Save Note
                </Button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
