"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  CheckSquare, Check, X, Clock, HelpCircle, User, 
  ArrowRightLeft, UserPlus, Undo2, Calendar, ShieldCheck, 
  Building2, Tag, Wrench, ShieldAlert, Paperclip, MessageSquare, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getPendingApprovals, 
  approveRequest, 
  rejectRequest, 
  transitionToReview, 
  assignReviewer, 
  requestChanges,
  UnifiedApprovalCard
} from "@/actions/approvals";
import { getTransferTargets } from "@/actions/allocations";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const [approvals, setApprovals] = useState<UnifiedApprovalCard[]>([]);
  const [reviewers, setReviewers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // UI state for operations
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [selectedReviewer, setSelectedReviewer] = useState<Record<string, string>>({});
  const [changesText, setChangesText] = useState<Record<string, string>>({});
  
  // Show/Hide expand detail
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Message notifications
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, targetUsers] = await Promise.all([
        getPendingApprovals(),
        getTransferTargets()
      ]);
      setApprovals(list || []);
      setReviewers(targetUsers || []);
    } catch (err) {
      console.error(err);
      setActionError("Failed to retrieve centralized pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, type: any) => {
    setProcessingId(id);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await approveRequest(id, type);
      if (res.success) {
        setActionSuccess(res.message || "Request approved successfully.");
        setApprovals(prev => prev.filter(item => item.id !== id));
      } else {
        setActionError(res.message || "Failed to approve request.");
      }
    } catch (err: any) {
      setActionError(err.message || "Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, type: any) => {
    setProcessingId(id);
    setActionError("");
    setActionSuccess("");
    const comment = feedbackNotes[id] || "";
    try {
      const res = await rejectRequest(id, type, comment);
      if (res.success) {
        setActionSuccess(res.message || "Request rejected.");
        setApprovals(prev => prev.filter(item => item.id !== id));
      } else {
        setActionError(res.message || "Failed to reject request.");
      }
    } catch (err: any) {
      setActionError(err.message || "Rejection failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleTransitionReview = async (id: string, type: any) => {
    setProcessingId(id);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await transitionToReview(id, type);
      if (res.success) {
        setActionSuccess(res.message || "Request marked under review.");
        await loadData();
      } else {
        setActionError(res.message || "Failed to transition status.");
      }
    } catch (err: any) {
      setActionError(err.message || "Transition failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignReviewer = async (id: string, type: any) => {
    const reviewerId = selectedReviewer[id];
    if (!reviewerId) {
      setActionError("Please select a reviewer to assign.");
      return;
    }
    setProcessingId(id);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await assignReviewer(id, type, reviewerId);
      if (res.success) {
        setActionSuccess(res.message || "Reviewer assigned successfully.");
        await loadData();
      } else {
        setActionError(res.message || "Failed to assign reviewer.");
      }
    } catch (err: any) {
      setActionError(err.message || "Assignment failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestChanges = async (id: string, type: any) => {
    const text = changesText[id] || "";
    if (!text.trim()) {
      setActionError("Please describe what changes are required.");
      return;
    }
    setProcessingId(id);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await requestChanges(id, type, text);
      if (res.success) {
        setActionSuccess(res.message || "Changes request dispatched.");
        // Clear text field
        setChangesText(prev => ({ ...prev, [id]: "" }));
        await loadData();
      } else {
        setActionError(res.message || "Failed to request changes.");
      }
    } catch (err: any) {
      setActionError(err.message || "Request changes failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to render type icons/badges
  const getTypeBadge = (type: string) => {
    const badgeBase = "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border gap-1.5 select-none";
    switch (type) {
      case "ALLOCATION_REQUEST":
        return <span className={`${badgeBase} bg-zinc-950 text-white border-transparent`}><UserPlus className="h-3 w-3" /> Allocation</span>;
      case "TRANSFER_REQUEST":
        return <span className={`${badgeBase} bg-sky-50 text-sky-800 border-sky-200`}><ArrowRightLeft className="h-3 w-3" /> Handover</span>;
      case "RETURN_REQUEST":
        return <span className={`${badgeBase} bg-orange-50 text-orange-800 border-orange-200`}><Undo2 className="h-3 w-3" /> Return</span>;
      case "MAINTENANCE_REQUEST":
        return <span className={`${badgeBase} bg-red-50 text-red-800 border-red-200`}><Wrench className="h-3 w-3" /> Maintenance</span>;
      case "BOOKING_REQUEST":
        return <span className={`${badgeBase} bg-emerald-50 text-emerald-800 border-emerald-200`}><Calendar className="h-3 w-3" /> Booking</span>;
      case "AUDIT_CLOSURE_REQUEST":
        return <span className={`${badgeBase} bg-violet-50 text-violet-800 border-violet-200`}><ShieldCheck className="h-3 w-3" /> Audit Close</span>;
      case "DEPARTMENT_REQUEST":
        return <span className={`${badgeBase} bg-amber-50 text-amber-800 border-amber-200`}><Building2 className="h-3 w-3" /> Department</span>;
      case "CATEGORY_REQUEST":
        return <span className={`${badgeBase} bg-teal-50 text-teal-800 border-teal-200`}><Tag className="h-3 w-3" /> Category</span>;
      default:
        return <span className={`${badgeBase} bg-zinc-100 text-zinc-800 border-zinc-200`}><HelpCircle className="h-3 w-3" /> Request</span>;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-50 text-red-700 border-red-100 font-bold";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-100 font-semibold";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-250 font-bold";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-100 font-bold";
      case "UNDER_REVIEW":
        return "bg-sky-50 text-sky-700 border-sky-200 font-semibold";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  // Filter lists
  const filteredApprovals = approvals.filter(item => {
    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    const matchesPriority = priorityFilter === "ALL" || item.priority === priorityFilter;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requestedBy.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-zinc-700" />
            Centralized Approval Desk
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Aggregate, review, assign, or action pending employee request transactions across all organization departments.
          </p>
        </div>
      </div>

      {/* Filter and Query Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search approvals, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
        >
          <option value="ALL">All Categories / Types</option>
          <option value="ALLOCATION_REQUEST">Allocation Requests</option>
          <option value="TRANSFER_REQUEST">Handover / Transfer Requests</option>
          <option value="RETURN_REQUEST">Asset Return Requests</option>
          <option value="MAINTENANCE_REQUEST">Maintenance Repairs</option>
          <option value="BOOKING_REQUEST">Booking Requests</option>
          <option value="AUDIT_CLOSURE_REQUEST">Audit Closures</option>
          <option value="DEPARTMENT_REQUEST">Departments Configurations</option>
          <option value="CATEGORY_REQUEST">Asset Category Setup</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
        >
          <option value="ALL">All Priority Levels</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        <Button
          onClick={() => { setTypeFilter("ALL"); setPriorityFilter("ALL"); setSearchQuery(""); }}
          className="h-10 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs cursor-pointer"
        >
          Reset Filters
        </Button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2 select-none">
          <AlertCircle className="h-4 w-4" />
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-xl border border-zinc-350 bg-zinc-100 p-4 text-xs font-bold text-zinc-950">
          {actionSuccess}
        </div>
      )}

      {/* Main content grid list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-400">
          <CheckSquare className="h-10 w-10 mx-auto text-zinc-200 mb-3 animate-none" />
          <p className="text-sm font-semibold">All clear! No pending approvals found matching the active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredApprovals.map((req) => {
            const isExpanded = expandedCard === req.id;
            return (
              <div 
                key={req.id} 
                className={`rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden transition-all ${
                  isExpanded ? "ring-1 ring-zinc-950 border-zinc-300" : "hover:border-zinc-300"
                }`}
              >
                {/* Card Header Info */}
                <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(req.type)}
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getPriorityStyle(req.priority)}`}>
                        {req.priority}
                      </span>
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                        {req.status.replace("_", " ")}
                      </span>
                      {req.assignedReviewer && (
                        <span className="inline-flex items-center rounded bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-0.5 text-[10px] font-medium">
                          Reviewer: {req.assignedReviewer}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-zinc-950">{req.title}</h3>
                      <p className="text-sm text-zinc-650 mt-1 leading-normal">{req.message}</p>
                    </div>
                    {/* Requested By block */}
                    <div className="flex items-center space-x-2.5 pt-1 text-xs">
                      <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-650 font-bold border border-zinc-200 uppercase text-[10px]">
                        {req.requestedBy.name.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900">{req.requestedBy.name}</span>
                        {req.requestedBy.department && (
                          <span className="text-zinc-400"> · {req.requestedBy.department} Department</span>
                        )}
                        <span className="text-zinc-400 font-mono block sm:inline sm:ml-2">({req.requestedBy.email})</span>
                      </div>
                    </div>
                  </div>
                  {/* Date and toggle */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between shrink-0 text-xs text-zinc-400 gap-1.5 self-stretch md:self-auto">
                    <span>{new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : req.id)}
                      className="text-zinc-900 font-bold hover:underline cursor-pointer py-1 px-3 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-[10px]"
                    >
                      {isExpanded ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-6 animate-in slide-in-from-top-1 duration-150">
                    {/* Metadata attributes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      {req.metadata.assetTag && (
                        <div className="bg-white border border-zinc-150 p-3 rounded-lg">
                          <div className="text-zinc-400 font-medium">Asset ID Tag</div>
                          <div className="font-mono font-bold mt-1 text-zinc-900">{req.metadata.assetTag}</div>
                        </div>
                      )}
                      {req.metadata.assetName && (
                        <div className="bg-white border border-zinc-150 p-3 rounded-lg col-span-2">
                          <div className="text-zinc-400 font-medium">Asset Name</div>
                          <div className="font-bold mt-1 text-zinc-900">{req.metadata.assetName}</div>
                        </div>
                      )}
                      {req.metadata.targetUserName && (
                        <div className="bg-white border border-zinc-150 p-3 rounded-lg">
                          <div className="text-zinc-400 font-medium">Target Recipient</div>
                          <div className="font-bold mt-1 text-zinc-800">{req.metadata.targetUserName}</div>
                        </div>
                      )}
                      {req.metadata.startTime && (
                        <div className="bg-white border border-zinc-150 p-3 rounded-lg col-span-2">
                          <div className="text-zinc-400 font-medium">Booking Duration</div>
                          <div className="font-bold mt-1 text-zinc-800">
                            {new Date(req.metadata.startTime).toLocaleString()} — {new Date(req.metadata.endTime).toLocaleString()}
                          </div>
                        </div>
                      )}
                      {req.metadata.name && (
                        <div className="bg-white border border-zinc-150 p-3 rounded-lg">
                          <div className="text-zinc-400 font-medium">Proposed Name</div>
                          <div className="font-bold mt-1 text-zinc-800">{req.metadata.name}</div>
                        </div>
                      )}
                      {req.metadata.conditionOnReturn && (
                        <div className="bg-white border border-zinc-150 p-3 rounded-lg">
                          <div className="text-zinc-400 font-medium">Return Condition</div>
                          <div className="font-bold mt-1 text-zinc-800">{req.metadata.conditionOnReturn}</div>
                        </div>
                      )}
                    </div>

                    {/* Attachments Section */}
                    {req.attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Attachments</Label>
                        <div className="flex flex-wrap gap-3">
                          {req.attachments.map((url, idx) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 border border-zinc-200 bg-white rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              <span className="max-w-[150px] truncate">Attachment File {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline History Section */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Timeline / Comments</Label>
                      <div className="space-y-3 pl-3 border-l-2 border-zinc-200">
                        {req.comments.length === 0 ? (
                          <div className="text-zinc-400 text-xs italic pl-1">No timeline entries or comments filed yet.</div>
                        ) : (
                          req.comments.map((c, idx) => (
                            <div key={idx} className="relative pl-3 text-xs space-y-0.5">
                              <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-zinc-950 border border-white" />
                              <div className="font-bold text-zinc-900">{c.user}</div>
                              <p className="text-zinc-600">{c.text}</p>
                              <span className="text-[10px] text-zinc-400 block">{new Date(c.date).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Interactive Operations Console */}
                    <div className="border-t border-zinc-200 pt-6 space-y-4">
                      <Label className="text-xs uppercase font-black text-zinc-700 tracking-wider">Workflow Actions</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Assign Reviewer */}
                        <div className="space-y-2">
                          <Label htmlFor={`reviewer-${req.id}`} className="text-[10px] font-bold">Assign Reviewer</Label>
                          <div className="flex gap-2">
                            <select
                              id={`reviewer-${req.id}`}
                              value={selectedReviewer[req.id] || ""}
                              onChange={(e) => setSelectedReviewer(prev => ({ ...prev, [req.id]: e.target.value }))}
                              className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                            >
                              <option value="">Select team member...</option>
                              {reviewers.map((r) => (
                                <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                              ))}
                            </select>
                            <Button
                              onClick={() => handleAssignReviewer(req.id, req.type)}
                              disabled={processingId === req.id || !selectedReviewer[req.id]}
                              className="border border-zinc-200 hover:bg-zinc-50 bg-white text-zinc-800 text-xs h-9 px-3 py-1 font-semibold"
                            >
                              Assign
                            </Button>
                          </div>
                        </div>

                        {/* Request Changes feedback */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`changes-${req.id}`} className="text-[10px] font-bold">Request Changes Feedback</Label>
                          <div className="flex gap-2">
                            <Input
                              id={`changes-${req.id}`}
                              placeholder="Describe changes required before approving..."
                              value={changesText[req.id] || ""}
                              onChange={(e) => setChangesText(prev => ({ ...prev, [req.id]: e.target.value }))}
                              className="flex-1 h-9 text-xs"
                            />
                            <Button
                              onClick={() => handleRequestChanges(req.id, req.type)}
                              disabled={processingId === req.id || !(changesText[req.id] || "").trim()}
                              className="border border-zinc-200 hover:bg-zinc-50 bg-white text-zinc-800 text-xs h-9 px-3 py-1 font-semibold"
                            >
                              Submit
                            </Button>
                          </div>
                        </div>

                      </div>

                      {/* Notes before Action (Approve / Reject) */}
                      <div className="space-y-2 pt-2 border-t border-zinc-150">
                        <Label htmlFor={`notes-${req.id}`} className="text-[10px] font-bold">Feedback / Resolution Notes (optional for Approve, required for Reject)</Label>
                        <textarea
                          id={`notes-${req.id}`}
                          placeholder="Provide context for approval/rejection decision..."
                          rows={2}
                          value={feedbackNotes[req.id] || ""}
                          onChange={(e) => setFeedbackNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                        />
                      </div>

                      {/* Primary approve / reject controls */}
                      <div className="flex items-center justify-between pt-2">
                        {req.status === "PENDING" && (
                          <button
                            onClick={() => handleTransitionReview(req.id, req.type)}
                            disabled={processingId === req.id}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                          >
                            Mark Under Review
                          </button>
                        )}
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => handleReject(req.id, req.type)}
                            disabled={processingId === req.id}
                            className="flex items-center space-x-1 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject Request</span>
                          </button>
                          <button
                            onClick={() => handleApprove(req.id, req.type)}
                            disabled={processingId === req.id}
                            className="flex items-center space-x-1 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-900 rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve Request</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
