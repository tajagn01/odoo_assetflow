"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Wrench, Plus, X, User, ClipboardList, CheckCircle, AlertTriangle, Play, Pause, Trash2, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMaintenanceRequests, createMaintenanceRequest, transitionMaintenance } from "@/actions/maintenance";
import { getAssets } from "@/actions/assets";
import { getEmployees } from "@/actions/org";
import { 
  getMaintenanceSchedules, 
  createMaintenanceSchedule, 
  updateMaintenanceSchedule, 
  deleteMaintenanceSchedule, 
  updateScheduleStatus, 
  performScheduledMaintenance 
} from "@/actions/preventiveMaintenance";
import { MaintenancePriority, MaintenanceStatus } from "@prisma/client";

export default function MaintenancePage() {
  const { data: session } = useSession();

  // Data Lists
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tickets" | "preventive">("tickets");
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);

  // Modals for preventive schedules
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showPerformScheduleModal, setShowPerformScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Form Fields
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("MEDIUM");
  
  const [techName, setTechName] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [repairAttachments, setRepairAttachments] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");

  // Preventive Schedule Form Fields
  const [schedAssetId, setSchedAssetId] = useState("");
  const [schedType, setSchedType] = useState("");
  const [schedFreq, setSchedFreq] = useState<any>("MONTHLY");
  const [schedCustomDays, setSchedCustomDays] = useState("");
  const [schedDueDate, setSchedDueDate] = useState("");
  const [schedTech, setSchedTech] = useState("");
  const [schedCost, setSchedCost] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);

  // Perform Form Fields
  const [perfCost, setPerfCost] = useState("");
  const [perfTech, setPerfTech] = useState("");
  const [perfNotes, setPerfNotes] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isManagerOrAdmin = session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  // Load All Request Tickets & Schedules
  const loadRequests = async () => {
    setLoading(true);
    try {
      const [reqData, assetData, empData, schedData] = await Promise.all([
        getMaintenanceRequests(),
        getAssets(),
        getEmployees(),
        getMaintenanceSchedules(),
      ]);
      setRequests(reqData || []);
      setAssets(assetData.filter((a) => a.status !== "RETIRED") || []);
      setEmployees(empData || []);
      setSchedules(schedData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (tabParam === "preventive") {
      setActiveTab("preventive");
    }
  }, [tabParam]);

  const handleRaiseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await createMaintenanceRequest({
        assetId: selectedAssetId,
        issueDescription,
        priority,
      });

      if (res.success) {
        setSuccess(res.message || "Maintenance request submitted.");
        setSelectedAssetId("");
        setIssueDescription("");
        setPriority("MEDIUM");
        setShowAddModal(false);
        await loadRequests();
      } else {
        setError(res.message || "Failed to submit request.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await transitionMaintenance({
        requestId,
        status: MaintenanceStatus.APPROVED,
      });
      if (res.success) {
        setSuccess("Request approved. Asset is now flagged as Under Maintenance.");
        await loadRequests();
      } else {
        setError(res.message || "Failed to approve.");
      }
    } catch (err) {
      setError("Failed to transition status.");
    }
  };

  const handleReject = async (requestId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await transitionMaintenance({
        requestId,
        status: MaintenanceStatus.REJECTED,
      });
      if (res.success) {
        setSuccess("Maintenance request has been rejected.");
        await loadRequests();
      } else {
        setError(res.message || "Failed to reject.");
      }
    } catch (err) {
      setError("Failed to transition status.");
    }
  };

  const handleAssignTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRequestId) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await transitionMaintenance({
        requestId: assigningRequestId,
        status: MaintenanceStatus.TECHNICIAN_ASSIGNED,
        technicianName: techName,
        estimatedCompletionDate: estimatedCompletionDate || undefined,
      });

      if (res.success) {
        setSuccess("Technician assigned to work ticket.");
        setTechName("");
        setEstimatedCompletionDate("");
        setAssigningRequestId(null);
        await loadRequests();
      } else {
        setError(res.message || "Failed to assign technician.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRequestId) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await transitionMaintenance({
        requestId: resolvingRequestId,
        status: MaintenanceStatus.RESOLVED,
        resolutionNotes,
        repairCost: parseFloat(repairCost) || undefined,
        repairAttachments: repairAttachments || undefined,
      });

      if (res.success) {
        setSuccess("Ticket resolved. Asset returned to Available status.");
        setResolutionNotes("");
        setRepairCost("");
        setRepairAttachments("");
        setResolvingRequestId(null);
        await loadRequests();
      } else {
        setError(res.message || "Failed to resolve.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await createMaintenanceSchedule({
        assetId: schedAssetId,
        maintenanceType: schedType,
        frequency: schedFreq,
        customIntervalDays: schedFreq === "CUSTOM" ? parseInt(schedCustomDays, 10) : null,
        nextDueDate: schedDueDate,
        technician: schedTech,
        estimatedCost: parseFloat(schedCost) || 0,
        checklist,
        notes: schedNotes,
      });

      if (res.success) {
        setSuccess("Preventive maintenance schedule configured.");
        setShowAddScheduleModal(false);
        setSchedAssetId("");
        setSchedType("");
        setSchedFreq("MONTHLY");
        setSchedCustomDays("");
        setSchedDueDate("");
        setSchedTech("");
        setSchedCost("");
        setSchedNotes("");
        setChecklist([]);
        await loadRequests();
      } else {
        setError(res.message || "Failed to create schedule.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await updateMaintenanceSchedule(selectedSchedule.id, {
        assetId: selectedSchedule.assetId,
        maintenanceType: schedType,
        frequency: schedFreq,
        customIntervalDays: schedFreq === "CUSTOM" ? parseInt(schedCustomDays, 10) : null,
        nextDueDate: schedDueDate,
        technician: schedTech,
        estimatedCost: parseFloat(schedCost) || 0,
        checklist,
        notes: schedNotes,
        status: selectedSchedule.status,
      });

      if (res.success) {
        setSuccess("Preventive maintenance schedule updated.");
        setShowEditScheduleModal(false);
        setSelectedSchedule(null);
        await loadRequests();
      } else {
        setError(res.message || "Failed to update schedule.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleScheduleStatus = async (id: string, currentStatus: string) => {
    setError("");
    setSuccess("");
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await updateScheduleStatus(id, nextStatus as any);
      if (res.success) {
        setSuccess(res.message || "Schedule status updated.");
        await loadRequests();
      } else {
        setError(res.message || "Failed to toggle status.");
      }
    } catch (err) {
      setError("An error occurred.");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await deleteMaintenanceSchedule(id);
      if (res.success) {
        setSuccess("Schedule deleted.");
        await loadRequests();
      } else {
        setError(res.message || "Failed to delete schedule.");
      }
    } catch (err) {
      setError("An error occurred.");
    }
  };

  const handlePerformScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    const checklistResults = selectedSchedule.checklist.map((item: string) => {
      return `${item}: ${checkedItems[item] ? "PASS" : "FAIL"}`;
    });

    try {
      const res = await performScheduledMaintenance(selectedSchedule.id, {
        actualCost: parseFloat(perfCost) || 0,
        technicianName: perfTech || selectedSchedule.technician,
        checklistResults,
        resolutionNotes: perfNotes,
      });

      if (res.success) {
        setSuccess(res.message || "Scheduled maintenance resolved and logged.");
        setShowPerformScheduleModal(false);
        setSelectedSchedule(null);
        setPerfCost("");
        setPerfTech("");
        setPerfNotes("");
        setCheckedItems({});
        await loadRequests();
      } else {
        setError(res.message || "Failed to log maintenance.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardDrop = async (e: React.DragEvent, targetStatus: MaintenanceStatus) => {
    e.preventDefault();
    if (!isManagerOrAdmin) return;
    const requestId = e.dataTransfer.getData("text/plain");
    if (!requestId) return;

    const requestItem = requests.find((r) => r.id === requestId);
    if (!requestItem) return;

    if (requestItem.status === targetStatus) return;

    if (targetStatus === MaintenanceStatus.PENDING) {
      alert("Cannot transition a ticket back to Pending Approval.");
      return;
    }

    if (targetStatus === MaintenanceStatus.APPROVED) {
      if (requestItem.status === MaintenanceStatus.PENDING) {
        await handleApprove(requestId);
      } else {
        alert("Only pending tickets can be moved to Approved / Setup.");
      }
      return;
    }

    if (targetStatus === MaintenanceStatus.TECHNICIAN_ASSIGNED) {
      if (requestItem.status === MaintenanceStatus.PENDING || requestItem.status === MaintenanceStatus.APPROVED) {
        setAssigningRequestId(requestId);
        setTechName("");
        setEstimatedCompletionDate("");
      } else {
        alert("Tickets can only be assigned to a technician from Pending or Approved status.");
      }
      return;
    }

    if (targetStatus === MaintenanceStatus.RESOLVED) {
      if (requestItem.status === MaintenanceStatus.TECHNICIAN_ASSIGNED || requestItem.status === MaintenanceStatus.IN_PROGRESS || requestItem.status === MaintenanceStatus.APPROVED) {
        setResolvingRequestId(requestId);
        setResolutionNotes("");
        setRepairCost("");
        setRepairAttachments("");
      } else {
        alert("Only approved or active tickets can be resolved.");
      }
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  // Group requests by status columns
  const columns: { title: string; status: MaintenanceStatus; items: any[] }[] = [
    {
      title: "Pending Approval",
      status: MaintenanceStatus.PENDING,
      items: requests.filter((r) => r.status === MaintenanceStatus.PENDING),
    },
    {
      title: "Approved / Setup",
      status: MaintenanceStatus.APPROVED,
      items: requests.filter((r) => r.status === MaintenanceStatus.APPROVED),
    },
    {
      title: "In Progress",
      status: MaintenanceStatus.TECHNICIAN_ASSIGNED,
      items: requests.filter((r) => r.status === MaintenanceStatus.TECHNICIAN_ASSIGNED || r.status === MaintenanceStatus.IN_PROGRESS),
    },
    {
      title: "Resolved / Closed",
      status: MaintenanceStatus.RESOLVED,
      items: requests.filter((r) => r.status === MaintenanceStatus.RESOLVED || r.status === MaintenanceStatus.CLOSED),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Maintenance & Schedules</h1>
          <p className="text-sm text-zinc-500 mt-1">Track reactive repair tickets and manage preventive maintenance schedules for company assets.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {activeTab === "tickets" ? (
            <Button
              onClick={() => { setShowAddModal(true); setError(""); setSuccess(""); }}
              className="flex items-center bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer font-bold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> File Repair Ticket
            </Button>
          ) : (
            isManagerOrAdmin && (
              <Button
                onClick={() => {
                  setSelectedSchedule(null);
                  setSchedAssetId("");
                  setSchedType("");
                  setSchedFreq("MONTHLY");
                  setSchedCustomDays("");
                  setSchedDueDate("");
                  setSchedTech("");
                  setSchedCost("");
                  setSchedNotes("");
                  setChecklist([]);
                  setShowAddScheduleModal(true);
                  setError("");
                  setSuccess("");
                }}
                className="flex items-center bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 px-4 cursor-pointer font-bold shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Configure PM Schedule
              </Button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-4 overflow-x-auto select-none scrollbar-none">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "tickets" 
              ? "border-zinc-950 text-zinc-950 font-black" 
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Reactive Tickets
        </button>
        <button
          onClick={() => setActiveTab("preventive")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "preventive" 
              ? "border-zinc-950 text-zinc-950 font-black" 
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Preventive Schedules
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 select-none">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950">
          {success}
        </div>
      )}

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none animate-in fade-in">
          {columns.map((col) => (
            <div 
              key={col.title} 
              onDragOver={(e) => isManagerOrAdmin && e.preventDefault()}
              onDragEnter={() => isManagerOrAdmin && setDraggedOverColumn(col.status)}
              onDragLeave={() => isManagerOrAdmin && setDraggedOverColumn(null)}
              onDrop={(e) => {
                if (isManagerOrAdmin) {
                  setDraggedOverColumn(null);
                  handleCardDrop(e, col.status);
                }
              }}
              className={`rounded-xl border p-4 space-y-4 min-h-[500px] h-fit transition-all duration-200 ${
                draggedOverColumn === col.status
                  ? "border-zinc-950 bg-zinc-100 shadow-md scale-[1.01]"
                  : "border-zinc-200 bg-zinc-50/50"
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h2 className="text-xs font-black text-zinc-950 uppercase tracking-wider">{col.title}</h2>
                <span className="text-[10px] font-bold bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {col.items.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs italic">
                    No tickets in this lane.
                  </div>
                ) : (
                  col.items.map((req) => (
                    <div 
                      key={req.id} 
                      draggable={!!isManagerOrAdmin}
                      onDragStart={(e) => {
                        if (!isManagerOrAdmin) return;
                        e.dataTransfer.setData("text/plain", req.id);
                        e.currentTarget.style.opacity = "0.5";
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                      className={`rounded-lg border border-zinc-200 bg-white p-4 space-y-3 shadow-sm hover:border-zinc-300 transition-all ${
                        isManagerOrAdmin ? "cursor-grab active:cursor-grabbing hover:shadow-md" : ""
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono font-bold bg-zinc-100 text-zinc-800 px-1.5 py-0.2 border border-zinc-200 rounded shrink-0">
                            {req.asset.tag}
                          </span>
                          <span
                            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              req.priority === "HIGH"
                                ? "bg-red-50 text-red-700"
                                : req.priority === "MEDIUM"
                                ? "bg-zinc-100 text-zinc-800"
                                : "bg-zinc-50 text-zinc-400"
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <h3 className="font-bold text-zinc-950 text-xs mt-2">{req.asset.name}</h3>
                        <p className="text-xs text-zinc-600 mt-1 line-clamp-3">{req.issueDescription}</p>
                      </div>

                      <div className="border-t border-zinc-100 pt-2 flex flex-col text-[10px] text-zinc-400 space-y-1">
                        <div><span className="font-semibold text-zinc-500">Reported By:</span> {req.raisedBy.name}</div>
                        {req.technicianName && (
                          <div><span className="font-semibold text-zinc-500">Technician:</span> {req.technicianName}</div>
                        )}
                        {req.estimatedCompletionDate && (
                          <div><span className="font-semibold text-zinc-500">Est. Done:</span> {new Date(req.estimatedCompletionDate).toLocaleDateString()}</div>
                        )}
                        {req.repairCost !== null && req.repairCost !== undefined && (
                          <div><span className="font-semibold text-zinc-500">Cost:</span> ₹{req.repairCost}</div>
                        )}
                        {req.repairAttachments && (
                          <div><span className="font-semibold text-zinc-500">Attachments:</span> <a href={req.repairAttachments} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View files</a></div>
                        )}
                        {req.resolutionNotes && (
                          <div className="text-zinc-500 italic font-medium">Notes: {req.resolutionNotes}</div>
                        )}
                      </div>

                      {/* Manager Decision controls */}
                      {isManagerOrAdmin && (
                        <div className="border-t border-zinc-100 pt-2 flex flex-wrap gap-1">
                          {req.status === "PENDING" && (
                            <div className="flex w-full gap-2">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="flex-1 text-center py-1 text-[10px] font-bold bg-zinc-950 text-white rounded hover:bg-zinc-900 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="flex-1 text-center py-1 text-[10px] font-bold border border-red-200 text-red-600 rounded hover:bg-red-50 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {req.status === "APPROVED" && (
                            <button
                              onClick={() => setAssigningRequestId(req.id)}
                              className="w-full text-center py-1 text-[10px] font-bold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded cursor-pointer"
                            >
                              Assign Technician
                            </button>
                          )}
                          {(req.status === "TECHNICIAN_ASSIGNED" || req.status === "IN_PROGRESS") && (
                            <button
                              onClick={() => setResolvingRequestId(req.id)}
                              className="w-full text-center py-1 text-[10px] font-bold bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 rounded cursor-pointer"
                            >
                              Log Resolution
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PREVENTIVE SCHEDULES */}
      {activeTab === "preventive" && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden select-none animate-in fade-in">
          <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
            <h2 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-zinc-400" /> Preventive Maintenance Schedule Registry
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-black text-zinc-400 uppercase text-[10px]">
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Maintenance Type</th>
                  <th className="px-6 py-3">Frequency</th>
                  <th className="px-6 py-3">Next Due Date</th>
                  <th className="px-6 py-3">Last Maintenance</th>
                  <th className="px-6 py-3">Technician</th>
                  <th className="px-6 py-3">Estimated Cost</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-400 italic">
                      No preventive maintenance schedules configured.
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => {
                    const nextDue = new Date(s.nextDueDate);
                    const today = new Date();
                    const isOverdue = nextDue < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && s.status === "ACTIVE";
                    const isDueToday = nextDue.toDateString() === today.toDateString() && s.status === "ACTIVE";

                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/30">
                        <td className="px-6 py-4 font-bold">
                          <span className="font-mono bg-zinc-100 text-zinc-800 px-1.5 py-0.2 border border-zinc-200 rounded font-semibold mr-2">{s.asset.tag}</span>
                          <span className="text-zinc-900">{s.asset.name}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-650 font-bold">{s.maintenanceType}</td>
                        <td className="px-6 py-4">
                          <span className="bg-zinc-100 text-zinc-800 font-bold text-[9px] px-2 py-0.5 rounded border border-zinc-200 uppercase">
                            {s.frequency}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">
                          <span className={isOverdue ? "text-red-650 font-black animate-pulse" : isDueToday ? "text-amber-600 font-black animate-pulse" : "text-zinc-700"}>
                            {nextDue.toLocaleDateString()}
                          </span>
                          {isOverdue && <span className="ml-1.5 bg-red-50 text-red-700 border border-red-100 text-[8px] font-black uppercase px-1 py-0.2 rounded">Overdue</span>}
                          {isDueToday && <span className="ml-1.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black uppercase px-1 py-0.2 rounded">Today</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-semibold">
                          {s.lastMaintenanceDate ? new Date(s.lastMaintenanceDate).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-750">{s.technician}</td>
                        <td className="px-6 py-4 font-bold text-zinc-850">₹{s.estimatedCost.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-full ${
                            s.status === "ACTIVE" 
                              ? "bg-green-50 border-green-200 text-green-700" 
                              : s.status === "PAUSED" 
                              ? "bg-amber-50 border-amber-200 text-amber-700" 
                              : "bg-zinc-50 border-zinc-200 text-zinc-400"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {isManagerOrAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedSchedule(s);
                                    setPerfCost(s.estimatedCost.toString());
                                    setPerfTech(s.technician);
                                    setPerfNotes("");
                                    setCheckedItems({});
                                    setShowPerformScheduleModal(true);
                                  }}
                                  className="p-1.5 text-zinc-650 hover:bg-zinc-100 rounded border border-zinc-200 hover:text-zinc-950 font-bold flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title="Perform Maintenance"
                                >
                                  <Wrench className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSchedule(s);
                                    setSchedAssetId(s.assetId);
                                    setSchedType(s.maintenanceType);
                                    setSchedFreq(s.frequency);
                                    setSchedCustomDays(s.customIntervalDays?.toString() || "");
                                    setSchedDueDate(new Date(s.nextDueDate).toISOString().split("T")[0]);
                                    setSchedTech(s.technician);
                                    setSchedCost(s.estimatedCost.toString());
                                    setSchedNotes(s.notes || "");
                                    setChecklist(s.checklist || []);
                                    setShowEditScheduleModal(true);
                                  }}
                                  className="p-1.5 text-zinc-650 hover:bg-zinc-100 rounded border border-zinc-200 hover:text-zinc-950 font-bold flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title="Edit Schedule"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleScheduleStatus(s.id, s.status)}
                                  className="p-1.5 text-zinc-650 hover:bg-zinc-100 rounded border border-zinc-200 hover:text-zinc-950 font-bold flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title={s.status === "ACTIVE" ? "Pause" : "Resume"}
                                >
                                  {s.status === "ACTIVE" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(s.id)}
                                  className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded font-bold flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title="Delete Schedule"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: FILE REQUEST */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-lg font-black text-zinc-950">File Repair Ticket</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseRequest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="assetId">Select Damaged Asset</Label>
                <select
                  id="assetId"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                >
                  <option value="">Choose Asset...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.tag}] {asset.name} (Status: {asset.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="desc">Describe the Issue</Label>
                <textarea
                  id="desc"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Provide details about the malfunction..."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="priority">Severity / Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                >
                  <option value="LOW">Low (Cosmetic, minor)</option>
                  <option value="MEDIUM">Medium (Partially unusable)</option>
                  <option value="HIGH">High (Completely broken, blocking operations)</option>
                </select>
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 font-bold"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2.5 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN TECHNICIAN */}
      {assigningRequestId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-zinc-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-black text-zinc-950 uppercase">Assign Technician</h2>
              <button onClick={() => setAssigningRequestId(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTech} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="tech">Select Technician</Label>
                <select
                  id="tech"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                >
                  <option value="">Choose technician...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role?.replace("_", " ") || "Employee"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="estDone">Estimated Completion Date</Label>
                <Input 
                  id="estDone"
                  type="date"
                  value={estimatedCompletionDate}
                  onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 font-bold"
                  disabled={submitting}
                >
                  Assign
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAssigningRequestId(null)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2.5 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE TICKET */}
      {resolvingRequestId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-zinc-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-black text-zinc-950 uppercase">Log Ticket Resolution</h2>
              <button onClick={() => setResolvingRequestId(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="resNotes">Resolution Notes</Label>
                <textarea
                  id="resNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the repairs performed to restore the asset..."
                  rows={3}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="repCost">Repair Cost (₹)</Label>
                  <Input 
                    id="repCost"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150.00"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="repDocs">Attachments (URL/Base64)</Label>
                  <Input 
                    id="repDocs"
                    placeholder="e.g. https://domain.com/invoice.pdf"
                    value={repairAttachments}
                    onChange={(e) => setRepairAttachments(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 font-bold"
                  disabled={submitting}
                >
                  Submit & Resolve Asset
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setResolvingRequestId(null)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2.5 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PREVENTIVE SCHEDULE */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-base font-black text-zinc-950 uppercase">Configure Preventive Schedule</h2>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="schedAssetId">Select Asset</Label>
                <select
                  id="schedAssetId"
                  value={schedAssetId}
                  onChange={(e) => setSchedAssetId(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                >
                  <option value="">Choose Asset...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.tag}] {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="schedType">Maintenance Type</Label>
                  <Input
                    id="schedType"
                    placeholder="e.g. Calibration, Cleaning"
                    value={schedType}
                    onChange={(e) => setSchedType(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="schedFreq">Frequency</Label>
                  <select
                    id="schedFreq"
                    value={schedFreq}
                    onChange={(e) => setSchedFreq(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="EVERY_6_MONTHS">Every 6 Months</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Interval</option>
                  </select>
                </div>
              </div>

              {schedFreq === "CUSTOM" && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                  <Label htmlFor="schedCustomDays">Interval in Days</Label>
                  <Input
                    id="schedCustomDays"
                    type="number"
                    placeholder="e.g. 45"
                    value={schedCustomDays}
                    onChange={(e) => setSchedCustomDays(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="schedDueDate">First Next Due Date</Label>
                  <Input
                    id="schedDueDate"
                    type="date"
                    value={schedDueDate}
                    onChange={(e) => setSchedDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="schedTech">Assigned Technician</Label>
                  <select
                    id="schedTech"
                    value={schedTech}
                    onChange={(e) => setSchedTech(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                  >
                    <option value="">Select Technician...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="schedCost">Estimated Cost (₹)</Label>
                <Input
                  id="schedCost"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 80.00"
                  value={schedCost}
                  onChange={(e) => setSchedCost(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tasks Checklist</Label>
                <div className="flex gap-2">
                  <Input
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="e.g. Check power connectors..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (checklistInput.trim()) {
                        setChecklist([...checklist, checklistInput.trim()]);
                        setChecklistInput("");
                      }
                    }}
                    className="bg-zinc-950 text-white rounded-lg text-xs px-3 font-bold"
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto border border-zinc-150 rounded-lg p-2 bg-zinc-50">
                  {checklist.length === 0 ? (
                    <div className="text-[10px] text-zinc-400 italic text-center py-2">No tasks added to list yet.</div>
                  ) : (
                    checklist.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white border border-zinc-200 rounded px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="schedNotes">Notes (Optional)</Label>
                <textarea
                  id="schedNotes"
                  placeholder="General notes about maintenance requirements..."
                  rows={2}
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 font-bold"
                  disabled={submitting}
                >
                  Configure Schedule
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2.5 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PREVENTIVE SCHEDULE */}
      {showEditScheduleModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-base font-black text-zinc-950 uppercase">Edit PM Schedule: {selectedSchedule.asset.tag}</h2>
              <button onClick={() => setShowEditScheduleModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateScheduleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editSchedType">Maintenance Type</Label>
                  <Input
                    id="editSchedType"
                    value={schedType}
                    onChange={(e) => setSchedType(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editSchedFreq">Frequency</Label>
                  <select
                    id="editSchedFreq"
                    value={schedFreq}
                    onChange={(e) => setSchedFreq(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="EVERY_6_MONTHS">Every 6 Months</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Interval</option>
                  </select>
                </div>
              </div>

              {schedFreq === "CUSTOM" && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                  <Label htmlFor="editSchedCustomDays">Interval in Days</Label>
                  <Input
                    id="editSchedCustomDays"
                    type="number"
                    value={schedCustomDays}
                    onChange={(e) => setSchedCustomDays(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editSchedDueDate">Next Due Date</Label>
                  <Input
                    id="editSchedDueDate"
                    type="date"
                    value={schedDueDate}
                    onChange={(e) => setSchedDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editSchedTech">Assigned Technician</Label>
                  <select
                    id="editSchedTech"
                    value={schedTech}
                    onChange={(e) => setSchedTech(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editSchedCost">Estimated Cost (₹)</Label>
                <Input
                  id="editSchedCost"
                  type="number"
                  step="0.01"
                  value={schedCost}
                  onChange={(e) => setSchedCost(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tasks Checklist</Label>
                <div className="flex gap-2">
                  <Input
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="Add task to list..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (checklistInput.trim()) {
                        setChecklist([...checklist, checklistInput.trim()]);
                        setChecklistInput("");
                      }
                    }}
                    className="bg-zinc-950 text-white rounded-lg text-xs px-3 font-bold"
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto border border-zinc-150 rounded-lg p-2 bg-zinc-50">
                  {checklist.length === 0 ? (
                    <div className="text-[10px] text-zinc-400 italic text-center py-2">No tasks added to list yet.</div>
                  ) : (
                    checklist.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white border border-zinc-200 rounded px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editSchedNotes">Notes (Optional)</Label>
                <textarea
                  id="editSchedNotes"
                  rows={2}
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 font-bold"
                  disabled={submitting}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditScheduleModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2.5 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PERFORM SCHEDULED MAINTENANCE */}
      {showPerformScheduleModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-zinc-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-black text-zinc-950 uppercase">Perform Preventive Cycle</h2>
              <button onClick={() => setShowPerformScheduleModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePerformScheduleSubmit} className="space-y-4 text-xs">
              <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg space-y-1">
                <div className="font-bold text-zinc-800 uppercase text-[9px] tracking-wider text-zinc-400">Asset to Maintain</div>
                <div className="font-bold text-zinc-950">[{selectedSchedule.asset.tag}] {selectedSchedule.asset.name}</div>
                <div className="text-[10px] text-zinc-500 mt-1">Scheduled Cycle: <span className="font-bold text-zinc-700">{selectedSchedule.maintenanceType}</span></div>
              </div>

              {selectedSchedule.checklist && selectedSchedule.checklist.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Tasks Checklist Verification</Label>
                  <div className="space-y-1.5 border border-zinc-200 rounded-lg p-3 bg-zinc-50 max-h-32 overflow-y-auto">
                    {selectedSchedule.checklist.map((item: string) => (
                      <label key={item} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-zinc-100/50 rounded px-1">
                        <input
                          type="checkbox"
                          checked={!!checkedItems[item]}
                          onChange={(e) => setCheckedItems({ ...checkedItems, [item]: e.target.checked })}
                          className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-semibold text-zinc-800">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="perfCost">Actual Cost (₹)</Label>
                  <Input
                    id="perfCost"
                    type="number"
                    step="0.01"
                    value={perfCost}
                    onChange={(e) => setPerfCost(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="perfTech">Servicing Technician</Label>
                  <select
                    id="perfTech"
                    value={perfTech}
                    onChange={(e) => setPerfTech(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="perfNotes">Resolution Notes / Log</Label>
                <textarea
                  id="perfNotes"
                  placeholder="Detail the work done, issues identified, parts replaced..."
                  rows={3}
                  value={perfNotes}
                  onChange={(e) => setPerfNotes(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 font-bold"
                  disabled={submitting}
                >
                  Log Cycle Completed
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPerformScheduleModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2.5 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
