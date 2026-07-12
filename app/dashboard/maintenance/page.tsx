"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Wrench, Plus, X, User, ClipboardList, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMaintenanceRequests, createMaintenanceRequest, transitionMaintenance } from "@/actions/maintenance";
import { getAssets } from "@/actions/assets";
import { getEmployees } from "@/actions/org";
import { MaintenancePriority, MaintenanceStatus } from "@prisma/client";

export default function MaintenancePage() {
  const { data: session } = useSession();

  // Data Lists
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);

  // Form Fields
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("MEDIUM");
  
  const [techName, setTechName] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [repairAttachments, setRepairAttachments] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isManagerOrAdmin = session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  // Load All Request Tickets
  const loadRequests = async () => {
    setLoading(true);
    try {
      const [reqData, assetData, empData] = await Promise.all([
        getMaintenanceRequests(),
        getAssets(),
        getEmployees(),
      ]);
      setRequests(reqData || []);
      setAssets(assetData.filter((a) => a.status !== "RETIRED") || []);
      setEmployees(empData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

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
        setSuccess(`Technician ${techName} assigned successfully.`);
        setTechName("");
        setEstimatedCompletionDate("");
        setAssigningRequestId(null);
        await loadRequests();
      } else {
        setError(res.message || "Failed to assign.");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Maintenance Board</h1>
          <p className="text-sm text-zinc-500 mt-1">Raise and approve repair tickets, assign technicians, and track resolution timelines.</p>
        </div>
        <Button
          onClick={() => { setShowAddModal(true); setError(""); setSuccess(""); }}
          className="mt-4 sm:mt-0 flex items-center bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" /> File Repair Ticket
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950">
          {success}
        </div>
      )}

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {columns.map((col) => (
          <div key={col.title} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-4 min-h-[500px] h-fit">
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
                  <div key={req.id} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3 shadow-sm hover:border-zinc-300 transition-all">
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
                        <div><span className="font-semibold text-zinc-500">Cost:</span> ${req.repairCost}</div>
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

            <form onSubmit={handleRaiseRequest} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="assetId">Select Damaged Asset</Label>
                <select
                  id="assetId"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
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
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="priority">Severity / Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
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
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs"
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

            <form onSubmit={handleAssignTech} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tech">Select Technician</Label>
                <select
                  id="tech"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
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
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                  disabled={submitting}
                >
                  Assign
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAssigningRequestId(null)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs"
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

            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="resNotes">Resolution Notes</Label>
                <textarea
                  id="resNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the repairs performed to restore the asset..."
                  rows={3}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="repCost">Repair Cost ($)</Label>
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
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                  disabled={submitting}
                >
                  Submit & Resolve Asset
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setResolvingRequestId(null)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs"
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
