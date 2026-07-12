"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { 
  Package, Calendar, Wrench, Shield, Undo2, ArrowLeft,
  DollarSign, Clock, FileText, Image as ImageIcon, MessageSquare, 
  Paperclip, ShieldAlert, Award, Tag, Activity, Settings, Info, User,
  Plus, X, Download, Eye, Trash2, Upload, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAssetDetails, getAssets, getAssetActivityLogs, addAssetActivityLog, updateAsset } from "@/actions/assets";
import { getCategories, getDepartments } from "@/actions/org";
import { getVendors } from "@/actions/vendors";
import { 
  getAssetDocuments, 
  uploadAssetDocument, 
  replaceAssetDocument, 
  deleteAssetDocument, 
  logDocumentDownload 
} from "@/actions/documents";
import { getAssetDepreciation, getAssetTimeline } from "@/actions/intelligence";
import Link from "next/link";

type TabType = "overview" | "financials" | "schedules" | "audit" | "discussion" | "documents";

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

  // Document management states
  const [documents, setDocuments] = useState<any[]>([]);
  const [docUploadType, setDocUploadType] = useState("Purchase Invoice");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docReplacingId, setDocReplacingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  // Timeline and Depreciation states
  const [depreciationData, setDepreciationData] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  
  // Quick Actions Statuses
  const [submitting, setSubmitting] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");

  // Setup data lists
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSerialNumber, setEditSerialNumber] = useState("");
  const [editAcquisitionDate, setEditAcquisitionDate] = useState("");
  const [editAcquisitionCost, setEditAcquisitionCost] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCondition, setEditCondition] = useState<any>("NEW");
  const [editStatus, setEditStatus] = useState<any>("AVAILABLE");
  const [editIsSharedResource, setEditIsSharedResource] = useState(false);
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editVendorId, setEditVendorId] = useState("");
  const [editWarranty, setEditWarranty] = useState<number>(24);
  const [editImages, setEditImages] = useState<string[]>([]);

  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const [cats, depts, vends] = await Promise.all([
          getCategories(),
          getDepartments(),
          getVendors({ status: "ACTIVE" })
        ]);
        setCategories(cats || []);
        setDepartments(depts || []);
        setVendors(vends || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadSetupData();
  }, []);

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setEditImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsgError("");
    setMsgSuccess("");

    try {
      const res = await updateAsset(id, {
        name: editName,
        categoryId: editCategoryId,
        serialNumber: editSerialNumber,
        acquisitionDate: new Date(editAcquisitionDate),
        acquisitionCost: parseFloat(editAcquisitionCost),
        condition: editCondition,
        location: editLocation,
        images: editImages,
        isSharedResource: editIsSharedResource,
        departmentId: editDepartmentId || null,
        vendorId: editVendorId || null,
        warranty: editWarranty ? parseInt(editWarranty.toString(), 10) : 24,
        status: editStatus,
      });

      if (res.success) {
        setMsgSuccess(res.message || "Asset updated successfully.");
        setShowEditModal(false);
        await loadAssetDetails();
      } else {
        setMsgError(res.message || "Failed to update asset.");
      }
    } catch (err: any) {
      setMsgError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadAssetDetails = async () => {
    setLoading(true);
    try {
      const data = await getAssetDetails(id);
      if (!data) {
        router.push("/dashboard/assets");
        return;
      }
      setAsset(data);

      // Pre-populate edit states
      setEditName(data.name);
      setEditCategoryId(data.categoryId);
      setEditSerialNumber(data.serialNumber);
      setEditAcquisitionCost(data.acquisitionCost.toString());
      setEditLocation(data.location);
      setEditCondition(data.condition);
      setEditStatus(data.status);
      setEditIsSharedResource(data.isSharedResource);
      setEditDepartmentId(data.departmentId || "");
      setEditVendorId(data.vendorId || "");
      setEditWarranty(data.warranty || 24);
      setEditImages(data.images || []);
      const formattedDate = data.acquisitionDate ? new Date(data.acquisitionDate).toISOString().split("T")[0] : "";
      setEditAcquisitionDate(formattedDate);

      // Fetch logs, related, documents, timeline and depreciation
      const [logs, allAssets, docs, depData, timelineData] = await Promise.all([
        getAssetActivityLogs(id),
        getAssets({ categoryId: data.categoryId }),
        getAssetDocuments(id),
        getAssetDepreciation(id),
        getAssetTimeline(id),
      ]);
      setActivityLogs(logs || []);
      setDocuments(docs || []);
      setDepreciationData(depData);
      setTimelineEvents(timelineData || []);
      
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

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    setSubmitting(true);
    setMsgError("");
    setMsgSuccess("");

    try {
      const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".xlsx"];
      const ext = docFile.name.substring(docFile.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExts.includes(ext)) {
        setMsgError("Unsupported file format. Only PDF, DOCX, XLSX and Images are supported.");
        setSubmitting(false);
        return;
      }
      if (docFile.size > 10 * 1024 * 1024) {
        setMsgError("File size exceeds 10MB limit.");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("assetId", id);
      formData.append("documentType", docUploadType);
      formData.append("file", docFile);

      const res = await uploadAssetDocument(formData);
      if (res.success) {
        setMsgSuccess(res.message || "Document uploaded.");
        setDocFile(null);
        // Reset file input
        const fileInput = document.getElementById("docFileInput") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        const docs = await getAssetDocuments(id);
        setDocuments(docs);
      } else {
        setMsgError(res.message || "Failed to upload.");
      }
    } catch (err: any) {
      setMsgError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplaceDoc = async (documentId: string, file: File) => {
    setSubmitting(true);
    setMsgError("");
    setMsgSuccess("");

    try {
      const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".xlsx"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExts.includes(ext)) {
        setMsgError("Unsupported file format.");
        setSubmitting(false);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setMsgError("File exceeds 10MB limit.");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await replaceAssetDocument(documentId, formData);
      if (res.success) {
        setMsgSuccess(res.message || "Document replaced.");
        setDocReplacingId(null);
        const docs = await getAssetDocuments(id);
        setDocuments(docs);
      } else {
        setMsgError(res.message || "Failed to replace.");
      }
    } catch (err: any) {
      setMsgError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoc = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setSubmitting(true);
    setMsgError("");
    setMsgSuccess("");

    try {
      const res = await deleteAssetDocument(documentId);
      if (res.success) {
        setMsgSuccess(res.message || "Document deleted.");
        const docs = await getAssetDocuments(id);
        setDocuments(docs);
      } else {
        setMsgError(res.message || "Failed to delete.");
      }
    } catch (err: any) {
      setMsgError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDoc = async (doc: any) => {
    try {
      await logDocumentDownload(doc.id);
    } catch (err) {
      console.error(err);
    }
  };

  const getTimelineBadge = (type: string) => {
    switch (type) {
      case "Created":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", icon: <Package className="h-3.5 w-3.5" /> };
      case "Allocated":
        return { bg: "bg-purple-50 text-purple-700 border-purple-200", icon: <User className="h-3.5 w-3.5" /> };
      case "Returned":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Undo2 className="h-3.5 w-3.5" /> };
      case "Booked":
        return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Calendar className="h-3.5 w-3.5" /> };
      case "Transfer Requested":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: <Activity className="h-3.5 w-3.5" /> };
      case "Transfer Approved":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Award className="h-3.5 w-3.5" /> };
      case "Maintenance":
        return { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: <Wrench className="h-3.5 w-3.5" /> };
      case "Audit":
        return { bg: "bg-violet-50 text-violet-700 border-violet-200", icon: <Shield className="h-3.5 w-3.5" /> };
      case "Warranty Expired":
        return { bg: "bg-red-50 text-red-700 border-red-200", icon: <Clock className="h-3.5 w-3.5" /> };
      case "Retired":
        return { bg: "bg-zinc-100 text-zinc-800 border-zinc-300", icon: <X className="h-3.5 w-3.5" /> };
      case "Disposed":
        return { bg: "bg-red-100 text-red-800 border-red-300", icon: <Trash2 className="h-3.5 w-3.5" /> };
      default:
        return { bg: "bg-zinc-50 text-zinc-700 border-zinc-200", icon: <Info className="h-3.5 w-3.5" /> };
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
  warrantyExpirationDate.setMonth(warrantyExpirationDate.getMonth() + (asset.warranty || 24));
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
              asset.status === "AVAILABLE" ? "bg-green-50 border-green-200 text-green-755 font-black" : "bg-zinc-950 text-white border-transparent"
            }`}>
              {asset.status.replace("_", " ")}
            </span>
          </div>
        </div>
        {["ADMIN", "ASSET_MANAGER"].includes(session?.user?.role || "") && (
          <Button
            onClick={() => {
              setEditName(asset.name);
              setEditCategoryId(asset.categoryId);
              setEditSerialNumber(asset.serialNumber);
              setEditAcquisitionCost(asset.acquisitionCost.toString());
              setEditLocation(asset.location);
              setEditCondition(asset.condition);
              setEditStatus(asset.status);
              setEditIsSharedResource(asset.isSharedResource);
              setEditDepartmentId(asset.departmentId || "");
              setEditVendorId(asset.vendorId || "");
              setEditWarranty(asset.warranty || 24);
              setEditImages(asset.images || []);
              const formattedDate = asset.acquisitionDate ? new Date(asset.acquisitionDate).toISOString().split("T")[0] : "";
              setEditAcquisitionDate(formattedDate);
              setShowEditModal(true);
              setMsgError("");
              setMsgSuccess("");
            }}
            className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 h-9 shrink-0 cursor-pointer self-start sm:self-center"
          >
            <Settings className="h-4 w-4" /> Edit Asset Details
          </Button>
        )}
      </div>

      {/* Tabs list (Glassmorphism design) */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 scrollbar-none select-none">
        {(["overview", "financials", "schedules", "audit", "discussion", "documents"] as TabType[]).map((tab) => (
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
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Vendor Partner</span>
                    <span className="font-bold text-zinc-900 text-right truncate max-w-[150px]">
                      {asset.vendor ? (
                        <span className="text-zinc-900 font-bold">
                          {asset.vendor.companyName}
                        </span>
                      ) : (
                        "None"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <span className="text-zinc-500 font-medium">Warranty Duration</span>
                    <span className="font-bold text-zinc-900">{asset.warranty || 24} Months</span>
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
              
              {/* Depreciation Summary Widget supporting SL and WDV */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6 select-none">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" /> Multi-Method Asset Depreciation Ledger
                  </h3>
                  <div className="text-[10px] font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200 uppercase">
                    {depreciationData ? `Elapsed Months: ${depreciationData.elapsedMonths}` : ""}
                  </div>
                </div>

                {depreciationData ? (
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-50/50 p-4 rounded-xl border border-zinc-150">
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 block uppercase">Acquisition Cost</span>
                        <span className="text-base font-black text-zinc-950">₹{depreciationData.cost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 block uppercase">Salvage Value (10%)</span>
                        <span className="text-base font-black text-zinc-950">₹{depreciationData.salvageValue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 block uppercase">Useful Life</span>
                        <span className="text-base font-black text-zinc-950">{depreciationData.usefulLifeYears} Years</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 block uppercase">WDV Rate / SL Rate</span>
                        <span className="text-base font-black text-zinc-950">20% / 18%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Method A: Straight Line */}
                      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3.5">
                        <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-2">Straight Line (SL) Method</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Current Book Value:</span>
                            <span className="font-black text-emerald-800">₹{depreciationData.straightLine.currentValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Accumulated Dep:</span>
                            <span className="font-bold text-red-650">₹{depreciationData.straightLine.accumulatedDepreciation.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Remaining Value:</span>
                            <span className="font-bold text-zinc-800">₹{depreciationData.straightLine.remainingValue.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Method B: Written Down Value */}
                      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3.5">
                        <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-2">Written Down Value (WDV) Method</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Current Book Value:</span>
                            <span className="font-black text-emerald-800">₹{depreciationData.wdv.currentValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Accumulated Dep:</span>
                            <span className="font-bold text-red-650">₹{depreciationData.wdv.accumulatedDepreciation.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Remaining Value:</span>
                            <span className="font-bold text-zinc-800">₹{depreciationData.wdv.remainingValue.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Projection Schedules Tables */}
                    <div className="space-y-3 pt-3 border-t border-zinc-100">
                      <div className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider text-zinc-450">Yearly Depreciated Projections Schedule</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-zinc-200 rounded-lg overflow-hidden">
                          <div className="bg-zinc-50 text-[10px] font-black uppercase text-zinc-500 py-1.5 px-3 border-b border-zinc-200">Straight Line Projection</div>
                          <div className="divide-y divide-zinc-100 px-3 py-1 font-semibold text-[11px]">
                            {depreciationData.straightLine.schedule.map((item: any) => (
                              <div key={item.year} className="flex justify-between py-1.5">
                                <span className="text-zinc-500">Year {item.year}</span>
                                <span className="text-zinc-850">₹{item.remainingValue.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border border-zinc-200 rounded-lg overflow-hidden">
                          <div className="bg-zinc-50 text-[10px] font-black uppercase text-zinc-500 py-1.5 px-3 border-b border-zinc-200">WDV Projection</div>
                          <div className="divide-y divide-zinc-100 px-3 py-1 font-semibold text-[11px]">
                            {depreciationData.wdv.schedule.map((item: any) => (
                              <div key={item.year} className="flex justify-between py-1.5">
                                <span className="text-zinc-500">Year {item.year}</span>
                                <span className="text-zinc-850">₹{item.remainingValue.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-zinc-400 italic text-xs py-4 text-center">Loading calculations data...</div>
                )}
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
                <p className="text-xs text-zinc-450 leading-normal">
                  {asset.vendor ? (
                    <>
                      Warranty coverage is supported by vendor partner <strong>{asset.vendor.companyName}</strong>. 
                      Contact representative <strong>{asset.vendor.contactPerson}</strong> at <strong>{asset.vendor.email}</strong> / <strong>{asset.vendor.phone}</strong> for invoice validation and repair tickets.
                    </>
                  ) : (
                    "No vendor partner is linked to this asset. Contact the system administrator for warranty configurations."
                  )}
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

              {/* Chronological Lifecycle Timeline */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                  <Activity className="h-4 w-4" /> Chronological Lifecycle Timeline
                </h3>
                <div className="relative border-l-2 border-zinc-200 ml-4 pl-6 space-y-6">
                  {timelineEvents.length === 0 ? (
                    <div className="text-zinc-400 italic text-xs py-2">No lifecycle events recorded for this asset.</div>
                  ) : (
                    timelineEvents.map((evt, idx) => {
                      const { bg, icon } = getTimelineBadge(evt.type);
                      return (
                        <div key={idx} className="relative group">
                          {/* Circle Icon Badge */}
                          <div className={`absolute -left-[37px] top-0.5 h-6.5 w-6.5 rounded-full border flex items-center justify-center bg-white shadow-sm shrink-0 ${bg}`}>
                            {icon}
                          </div>
                          
                          {/* Event content */}
                          <div className="space-y-1 select-none">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <span className="font-bold text-zinc-950 text-xs">{evt.title}</span>
                              <span className="text-[10px] text-zinc-400 font-medium">{new Date(evt.date).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-zinc-650 leading-relaxed">{evt.description}</p>
                            {evt.user && (
                              <div className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                                <User className="h-3 w-3 text-zinc-400" /> By: {evt.user}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
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

          {/* TAB 6: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              
              {/* Document upload form card */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 animate-in fade-in select-none">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-4 w-4" /> Upload Asset Document
                </h3>
                <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="docType">Document Category</Label>
                      <select
                        id="docType"
                        value={docUploadType}
                        onChange={(e) => setDocUploadType(e.target.value)}
                        className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-zinc-800"
                      >
                        <option value="Purchase Invoice">Purchase Invoice</option>
                        <option value="Warranty Card">Warranty Card</option>
                        <option value="Insurance Certificate">Insurance Certificate</option>
                        <option value="User Manual">User Manual</option>
                        <option value="Compliance Certificate">Compliance Certificate</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="docFile">Choose File (PDF, DOCX, XLSX, Images - Max 10MB)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="docFileInput"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx"
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          required
                          className="h-10 text-xs py-1.5 cursor-pointer bg-zinc-50 border border-zinc-200 hover:bg-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !docFile}
                    className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 disabled:opacity-50 font-bold"
                  >
                    {submitting ? "Uploading file..." : "Upload Document"}
                  </Button>
                </form>
              </div>

              {/* Grouped Documents Registry List */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                  <FileText className="h-4 w-4" /> Document Registry Grouped by Category
                </h3>
                {["Purchase Invoice", "Warranty Card", "Insurance Certificate", "User Manual", "Compliance Certificate"].map((category) => {
                  const catDocs = documents.filter((d) => d.documentType === category);

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-zinc-800 uppercase tracking-tight">{category}</span>
                        <span className="text-[10px] font-black bg-zinc-100 border border-zinc-200 text-zinc-650 px-2 py-0.5 rounded-full shrink-0">
                          {catDocs.length} {catDocs.length === 1 ? "file" : "files"}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {catDocs.length === 0 ? (
                          <div className="text-[11px] text-zinc-400 italic py-2 px-3 border border-dashed border-zinc-150 rounded-xl bg-zinc-50/20">
                            No documents uploaded under this category.
                          </div>
                        ) : (
                          catDocs.map((doc) => (
                            <div key={doc.id} className="p-3.5 border border-zinc-200 bg-white hover:bg-zinc-50/20 rounded-xl flex items-center justify-between text-xs gap-4 shadow-sm hover:border-zinc-300 transition-colors">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <FileText className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="font-bold text-zinc-900 block truncate" title={doc.fileName}>{doc.fileName}</span>
                                  <div className="text-[10px] text-zinc-400 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                                    <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-zinc-500 font-sans">By: {doc.uploadedBy?.name || "System"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="p-1.5 text-zinc-600 hover:bg-zinc-100 border border-zinc-200 hover:text-zinc-950 rounded flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title="Preview Document"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <a
                                  href={doc.filePath}
                                  download={doc.fileName}
                                  onClick={() => handleDownloadDoc(doc)}
                                  className="p-1.5 text-zinc-650 hover:bg-zinc-100 border border-zinc-200 hover:text-zinc-950 rounded flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title="Download File"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setDocReplacingId(docReplacingId === doc.id ? null : doc.id)}
                                    className="p-1.5 text-zinc-650 hover:bg-zinc-100 border border-zinc-200 hover:text-zinc-950 rounded flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                    title="Replace File"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                  {docReplacingId === doc.id && (
                                    <div className="absolute right-0 mt-1 bg-white border border-zinc-200 rounded-lg p-2 shadow-xl z-20 w-44 animate-in slide-in-from-top-1">
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleReplaceDoc(doc.id, file);
                                        }}
                                        className="text-[10px] w-full cursor-pointer"
                                      />
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center justify-center cursor-pointer shadow-sm bg-white"
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

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

      {/* EDIT ASSET MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-zinc-200 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto font-sans text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 select-none">
              <h2 className="text-sm font-black text-zinc-950 uppercase tracking-wider">Modify Asset Configuration</h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="editName">Asset Name</Label>
                  <Input 
                    id="editName" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editSerial">Serial Number</Label>
                  <Input 
                    id="editSerial" 
                    value={editSerialNumber} 
                    onChange={(e) => setEditSerialNumber(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editCategory">Category</Label>
                  <select
                    id="editCategory"
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editAcqDate">Acquisition Date</Label>
                  <Input 
                    id="editAcqDate" 
                    type="date" 
                    value={editAcquisitionDate} 
                    onChange={(e) => setEditAcquisitionDate(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editAcqCost">Cost (USD)</Label>
                  <Input 
                    id="editAcqCost" 
                    type="number" 
                    step="0.01" 
                    value={editAcquisitionCost} 
                    onChange={(e) => setEditAcquisitionCost(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editCond">Condition</Label>
                  <select
                    id="editCond"
                    value={editCondition}
                    onChange={(e: any) => setEditCondition(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editLoc">Location</Label>
                  <Input 
                    id="editLoc" 
                    value={editLocation} 
                    onChange={(e) => setEditLocation(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editDept">Department</Label>
                  <select
                    id="editDept"
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">No Department Restriction</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editVendor">Vendor Partner</Label>
                  <select
                    id="editVendor"
                    value={editVendorId}
                    onChange={(e) => setEditVendorId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">No Vendor Partner</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.companyName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editWarranty">Warranty (Months)</Label>
                  <Input 
                    id="editWarranty" 
                    type="number" 
                    value={editWarranty} 
                    onChange={(e) => setEditWarranty(parseInt(e.target.value, 10))} 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editStatus">Status</Label>
                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ALLOCATED">Allocated</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="LOST">Lost</option>
                    <option value="RETIRED">Retired</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-6 col-span-2">
                  <input
                    type="checkbox"
                    id="editShared"
                    checked={editIsSharedResource}
                    onChange={(e) => setEditIsSharedResource(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                  />
                  <Label htmlFor="editShared" className="cursor-pointer">Mark as Bookable Shared Resource</Label>
                </div>
              </div>

              {/* Photo uploader */}
              <div className="space-y-2">
                <Label>Asset Photos</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[8px] font-bold mt-1 uppercase">Add</span>
                  </button>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative h-16 w-16 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-100">
                      <img src={img} alt="Thumbnail" className="object-cover h-full w-full" />
                      <button
                        type="button"
                        onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1 top-1 bg-black/60 rounded-full text-white p-0.5 hover:bg-black"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl py-2.5 font-bold text-xs"
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Save Configuration"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-xl py-2.5 font-bold text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-zinc-250 p-6 space-y-4 shadow-2xl h-[85vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3 shrink-0">
              <h2 className="text-xs font-black text-zinc-950 uppercase truncate max-w-xs sm:max-w-md">{previewDoc.fileName} - Preview</h2>
              <button type="button" onClick={() => setPreviewDoc(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden flex items-center justify-center">
              {previewDoc.fileMime?.startsWith("image/") || previewDoc.filePath?.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                <img src={previewDoc.filePath} alt="Preview" className="max-w-full max-h-full object-contain" />
              ) : previewDoc.fileMime === "application/pdf" || previewDoc.filePath?.endsWith(".pdf") ? (
                <iframe src={previewDoc.filePath} className="w-full h-full" title="PDF Preview" />
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold text-xs">
                  Preview not available for this format. Please download the file to view its contents.
                </div>
              )}
            </div>
            <div className="flex justify-end pt-3 shrink-0 border-t border-zinc-150 gap-2">
              <a
                href={previewDoc.filePath}
                download={previewDoc.fileName}
                onClick={() => handleDownloadDoc(previewDoc)}
                className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-bold hover:bg-zinc-900 flex items-center justify-center"
              >
                Download Document
              </a>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border border-zinc-250 rounded-lg text-xs font-bold hover:bg-zinc-50 text-zinc-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
