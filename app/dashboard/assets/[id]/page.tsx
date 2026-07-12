"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { 
  Package, Calendar, Wrench, Shield, Undo2, ArrowLeft,
  DollarSign, Clock, FileText, Image as ImageIcon, MessageSquare, 
  Paperclip, ShieldAlert, Award, Tag, Activity, Settings, Info, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAssetDetails, getAssets } from "@/actions/assets";
import { getAssetActivityLogs, addAssetActivityLog } from "@/actions/assets";
import Link from "next/link";

type TabType = "overview" | "financials" | "schedules" | "audit" | "discussion";

export default function AssetDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();

  // Asset detail states
  const [asset, setAsset] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [relatedAssets, setRelatedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Discussion Forms
  const [commentText, setCommentText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Quick Actions Statuses
  const [submitting, setSubmitting] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");

  const loadAssetDetails = async () => {
    setLoading(true);
    try {
      const data = await getAssetDetails(id);
      if (!data) {
        router.push("/dashboard/assets");
        return;
      }
      setAsset(data);

      // Fetch logs and related
      const [logs, allAssets] = await Promise.all([
        getAssetActivityLogs(id),
        getAssets({ categoryId: data.categoryId })
      ]);
      setActivityLogs(logs || []);
      
      // Filter out current asset from related list
      const filteredRelated = (allAssets || [])
        .filter((a: any) => a.id !== id)
        .slice(0, 4);
      setRelatedAssets(filteredRelated);

    } catch (err) {
      console.error(err);
      setMsgError("Failed to fetch asset details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAssetDetails();
    }
  }, [id]);

  const handleAddLog = async (action: "ADD_COMMENT" | "ADD_NOTE") => {
    const text = action === "ADD_COMMENT" ? commentText : noteText;
    if (!text.trim()) return;

    setSubmitting(true);
    setMsgError("");
    setMsgSuccess("");

    try {
      const res = await addAssetActivityLog({
        assetId: id,
        action,
        text: text.trim(),
      });

      if (res.success) {
        setMsgSuccess(res.message || "Message logged.");
        if (action === "ADD_COMMENT") setCommentText("");
        else setNoteText("");
        
        // Reload logs
        const updatedLogs = await getAssetActivityLogs(id);
        setActivityLogs(updatedLogs || []);
      } else {
        setMsgError(res.message || "Failed to log action.");
      }
    } catch (err: any) {
      setMsgError(err.message || "An error occurred.");
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

  if (!asset) return null;

  // Depreciation Calculation (Straight Line)
  // Acquisition Cost, Salvage Value (10%), Useful Life (5 Years)
  const acqCost = parseFloat(asset.acquisitionCost) || 0;
  const salvageValue = acqCost * 0.1;
  const usefulLifeYears = 5;
  const annualDepreciation = (acqCost - salvageValue) / usefulLifeYears;
  
  // Calculate age of asset in years
  const acqDate = new Date(asset.acquisitionDate);
  const diffTime = Math.abs(new Date().getTime() - acqDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const assetAgeYears = Math.min(usefulLifeYears, diffDays / 365);
  
  const accumulatedDepreciation = annualDepreciation * assetAgeYears;
  const bookValue = Math.max(salvageValue, acqCost - accumulatedDepreciation);

  // Warranty Countdown
  const warrantyExpirationDate = new Date(asset.acquisitionDate);
  warrantyExpirationDate.setFullYear(warrantyExpirationDate.getFullYear() + 3); // 3-year warranty default
  const isWarrantyActive = warrantyExpirationDate > new Date();
  const warrantyDaysLeft = Math.ceil((warrantyExpirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 font-sans">
      
      {/* Detail Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 gap-4">
        <div className="space-y-1">
          <Link href="/dashboard/assets" className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-950 gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Assets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">{asset.name}</h1>
            <span className="text-[10px] font-mono font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded">{asset.tag}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              asset.status === "AVAILABLE" ? "bg-zinc-100 text-zinc-900 border-zinc-200" : "bg-zinc-900 text-white border-transparent"
            }`}>
              {asset.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs list (Glassmorphism design) */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 scrollbar-none select-none">
        {(["overview", "financials", "schedules", "audit", "discussion"] as TabType[]).map((tab) => (
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

      {/* Feedback messages */}
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

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Content panels */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Image gallery */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" /> Image Gallery
                </h3>
                {asset.images && asset.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {asset.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 group">
                        <img src={img} alt="Asset spec" className="object-cover h-full w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    No images uploaded for this asset directory listing.
                  </div>
                )}
              </div>

              {/* Specifications */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Asset Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Serial Number</span>
                    <span className="font-mono font-bold text-zinc-900">{asset.serialNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Model Category</span>
                    <span className="font-bold text-zinc-900">{asset.category.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Custodian Location</span>
                    <span className="font-bold text-zinc-900">{asset.location}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Condition Rating</span>
                    <span className="font-bold text-zinc-900">{asset.condition}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Target Department</span>
                    <span className="font-bold text-zinc-900">{asset.department?.name || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Shared Resource Type</span>
                    <span className="font-bold text-zinc-900">{asset.isSharedResource ? "Bookable Space" : "Assigned Device"}</span>
                  </div>
                </div>
              </div>

              {/* Document Manager list */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4" /> Document Manager
                </h3>
                {asset.documents && asset.documents.length > 0 ? (
                  <div className="space-y-2">
                    {asset.documents.map((doc: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-zinc-200 bg-zinc-50/50 rounded-lg text-xs">
                        <span className="font-bold text-zinc-700">Contract File {idx + 1}</span>
                        <a href={doc} target="_blank" rel="noreferrer" className="text-zinc-950 font-bold hover:underline">Download</a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    No attachments or documents uploaded for warranty/invoice validation.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: FINANCIALS & WARRANTY */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              
              {/* Depreciation Summary */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" /> Straight-Line Depreciation Ledger
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Initial Cost</span>
                    <span className="text-lg font-black text-zinc-900">${acqCost.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Useful Life</span>
                    <span className="text-lg font-black text-zinc-900">{usefulLifeYears} Years</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Depreciation Rate</span>
                    <span className="text-lg font-black text-zinc-900">18.00% / Yr</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Salvage Value</span>
                    <span className="text-lg font-black text-zinc-900">${salvageValue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-zinc-100 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Accumulated Depreciation</span>
                    <span className="font-bold text-red-650">${accumulatedDepreciation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-medium">Book Value (Current Valuation)</span>
                    <span className="font-bold text-emerald-800">${bookValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warranty Coverage details */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> Active Warranty Coverage
                </h3>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                  <div className="space-y-1 text-xs">
                    <span className="text-zinc-500 font-medium">Coverage Expiration Date</span>
                    <span className="font-bold text-zinc-900 block">{warrantyExpirationDate.toLocaleDateString()}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border ${
                    isWarrantyActive 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {isWarrantyActive ? `${warrantyDaysLeft} Days Remaining` : "Expired Coverage"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-normal">
                  Standard enterprise 3-year warranty support is automatically enabled from the acquisition date. Contact support vendors for repair cycles.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: SCHEDULES & MAINTENANCE */}
          {activeTab === "schedules" && (
            <div className="space-y-6">
              
              {/* Allocation History table */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Allocation & Handover History
                </h3>
                {asset.allocations && asset.allocations.length > 0 ? (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-zinc-400 border-b border-zinc-200 pb-2">
                          <th className="py-2">Employee</th>
                          <th className="py-2">Assigned Date</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Condition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asset.allocations.map((alloc: any) => (
                          <tr key={alloc.id} className="border-b border-zinc-50">
                            <td className="py-3 font-bold text-zinc-900">{alloc.user.name}</td>
                            <td className="py-3 text-zinc-500">{new Date(alloc.createdAt).toLocaleDateString()}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold border ${
                                alloc.status === "ACTIVE" ? "bg-zinc-950 text-white border-transparent" : "bg-zinc-100 text-zinc-500"
                              }`}>
                                {alloc.status}
                              </span>
                            </td>
                            <td className="py-3 text-zinc-500">{alloc.conditionOnAllocation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    No active or historical allocation files found.
                  </div>
                )}
              </div>

              {/* Bookings Scheduler log */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Booking History (Shared Resource logs)
                </h3>
                {asset.bookings && asset.bookings.length > 0 ? (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-zinc-400 border-b border-zinc-200 pb-2">
                          <th className="py-2">Booked By</th>
                          <th className="py-2">Start Time</th>
                          <th className="py-2">End Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asset.bookings.map((b: any) => (
                          <tr key={b.id} className="border-b border-zinc-50">
                            <td className="py-3 font-bold text-zinc-900">{b.user.name}</td>
                            <td className="py-3 text-zinc-500">{new Date(b.startTime).toLocaleString()}</td>
                            <td className="py-3 text-zinc-500">{new Date(b.endTime).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    No calendar bookings filed for this asset.
                  </div>
                )}
              </div>

              {/* Maintenance Ticket list */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" /> Maintenance Tickets Log
                </h3>
                {asset.maintenanceReqs && asset.maintenanceReqs.length > 0 ? (
                  <div className="space-y-4">
                    {asset.maintenanceReqs.map((req: any) => (
                      <div key={req.id} className="border border-zinc-200 bg-zinc-50/50 p-4 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-950">Repair Requested by {req.raisedBy.name}</span>
                          <span className="text-zinc-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-650 leading-relaxed">{req.issueDescription}</p>
                        <div className="flex gap-2">
                          <span className="bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{req.priority} PRIORITY</span>
                          <span className="bg-zinc-950 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">{req.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    No repair maintenance tickets filed.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: AUDIT & HISTORY LOGS */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              
              {/* Audit history */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> Audit Cycles Confirmations
                </h3>
                {asset.auditItems && asset.auditItems.length > 0 ? (
                  <div className="space-y-4">
                    {asset.auditItems.map((item: any) => (
                      <div key={item.id} className="border border-zinc-200 bg-zinc-50/50 p-4 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-950">Cycle: {item.auditCycle.name}</span>
                          <span className="text-zinc-400">{item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString() : "Unverified"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-zinc-950 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.status}</span>
                          {item.verifiedBy && (
                            <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-medium border border-zinc-200">
                              Auditor: {item.verifiedBy.name}
                            </span>
                          )}
                        </div>
                        {item.discrepancyNotes && (
                          <p className="text-zinc-550 border-t border-zinc-150 pt-2 italic mt-2">
                            Notes: "{item.discrepancyNotes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs italic">
                    No verification records filed under active audit cycles.
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> Complete Activity Timeline
                </h3>
                <div className="space-y-4 pl-3 border-l-2 border-zinc-200 text-xs">
                  {activityLogs.length === 0 ? (
                    <div className="text-zinc-400 italic">No activity records logged.</div>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="relative pl-3 space-y-1">
                        <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-zinc-950 border border-white" />
                        <div className="font-bold text-zinc-900">
                          {log.action.replace("_", " ")}
                        </div>
                        {log.newValues?.text && (
                          <p className="text-zinc-650 bg-zinc-50 border border-zinc-150 p-2 rounded-lg mt-1 italic">
                            "{log.newValues.text}"
                          </p>
                        )}
                        <div className="text-[10px] text-zinc-400">
                          Logged by {log.user?.name || "System"} · {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: DISCUSSION & NOTES */}
          {activeTab === "discussion" && (
            <div className="space-y-6">
              
              {/* Comments form */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> Public Comments Thread
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="commentInput" className="text-[10px] font-bold">Write a comment</Label>
                  <textarea
                    id="commentInput"
                    placeholder="Share spec updates, condition updates, or questions..."
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                  />
                  <Button
                    onClick={() => handleAddLog("ADD_COMMENT")}
                    disabled={submitting || !commentText.trim()}
                    className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 disabled:opacity-50"
                  >
                    Post Comment
                  </Button>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-100 text-xs">
                  {activityLogs
                    .filter((log) => log.action === "ADD_COMMENT")
                    .map((comment) => (
                      <div key={comment.id} className="p-3 border border-zinc-150 bg-zinc-50/50 rounded-xl space-y-1">
                        <div className="flex justify-between font-bold text-zinc-900">
                          <span>{comment.user?.name || "User"}</span>
                          <span className="text-[10px] font-medium text-zinc-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-650 leading-relaxed font-serif">"{comment.newValues?.text}"</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Internal notes */}
              {session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role) && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" /> Manager Internal Notes (Strictly Confidential)
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="noteInput" className="text-[10px] font-bold">Add manager audit note</Label>
                    <textarea
                      id="noteInput"
                      placeholder="Add configuration secrets, warranty details, or vendor issues..."
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                    />
                    <Button
                      onClick={() => handleAddLog("ADD_NOTE")}
                      disabled={submitting || !noteText.trim()}
                      className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 disabled:opacity-50"
                    >
                      Save Internal Note
                    </Button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-100 text-xs">
                    {activityLogs
                      .filter((log) => log.action === "ADD_NOTE")
                      .map((note) => (
                        <div key={note.id} className="p-3 border border-red-150 bg-red-50/10 rounded-xl space-y-1">
                          <div className="flex justify-between font-bold text-zinc-900">
                            <span>{note.user?.name || "Manager"}</span>
                            <span className="text-[10px] font-medium text-zinc-400">{new Date(note.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-zinc-650 leading-relaxed font-sans font-medium text-red-900">"{note.newValues?.text}"</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Side: QR/Barcode, Custodian info, and Related Assets */}
        <div className="space-y-6">
          
          {/* QR Code and Barcode Box */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-left flex items-center gap-1.5">
              <Tag className="h-4 w-4" /> Print Labels
            </h3>
            
            <div className="flex flex-col items-center justify-center p-4 border border-zinc-100 bg-zinc-50/50 rounded-xl">
              <div className="w-32 h-32 shrink-0 border border-zinc-300 rounded-lg p-1.5 flex items-center justify-center bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    JSON.stringify({
                      tag: asset.tag,
                      name: asset.name,
                      serial: asset.serialNumber,
                    })
                  )}`} 
                  alt="Asset QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-mono font-bold mt-2 text-zinc-600">{asset.tag}</span>
            </div>

            {/* Simulated Barcode */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-full h-8 flex justify-between px-1 overflow-hidden opacity-90">
                {Array.from({ length: 48 }).map((_, i) => {
                  const widthClass = i % 3 === 0 ? "w-[1px]" : i % 5 === 0 ? "w-[2px]" : "w-[0.5px]";
                  return (
                    <div key={i} className={`h-full bg-zinc-950 ${widthClass}`} />
                  );
                })}
              </div>
              <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-1">
                * {asset.tag} *
              </span>
            </div>
          </div>

          {/* Current Custodian */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4" /> Current Custody
            </h3>
            {asset.currentHolder ? (
              <div className="p-3 border border-zinc-100 bg-zinc-50/50 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-zinc-900 text-sm">{asset.currentHolder.name}</div>
                <div className="text-zinc-500 font-mono">{asset.currentHolder.email}</div>
                <span className="inline-flex items-center rounded bg-zinc-950 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-2">
                  Held Custody
                </span>
              </div>
            ) : (
              <div className="text-zinc-400 text-xs italic py-4">
                No active employee has custodian ownership. This asset is in storage warehouse storage.
              </div>
            )}
          </div>

          {/* Related Assets list */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Related Assets
            </h3>
            <div className="space-y-3 text-xs">
              {relatedAssets.length === 0 ? (
                <div className="text-zinc-400 italic">No similar category assets found.</div>
              ) : (
                relatedAssets.map((rel: any) => (
                  <Link 
                    key={rel.id} 
                    href={`/dashboard/assets/${rel.id}`}
                    className="flex justify-between items-center p-3 border border-zinc-100 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all rounded-xl cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 block truncate max-w-[120px]">{rel.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{rel.tag}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-zinc-100 text-zinc-800 px-1.5 py-0.2 rounded border border-zinc-200">
                      {rel.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
