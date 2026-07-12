"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Eye, X, Calendar, DollarSign, MapPin, Tag, Wrench, Shield, Check, Info, ArrowRightLeft, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAssets, createAsset, getAssetDetails, deleteAsset, importAssetsAction, bulkDeleteAssets, bulkChangeAssetsDept, bulkChangeAssetsCategory, bulkChangeAssetsStatus, bulkUpdateAssetsCondition } from "@/actions/assets";
import { getCategories, getDepartments } from "@/actions/org";
import { allocateAsset, returnAsset, requestAssetTransfer, getTransferTargets } from "@/actions/allocations";
import { getVendors } from "@/actions/vendors";
import { AssetStatus, AssetCondition } from "@prisma/client";
import { exportToCSV, parseCSV } from "@/utils/csv";
import Link from "next/link";

export default function AssetsPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lists
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [transferTargets, setTransferTargets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<string>("");
  
  // Register Asset Form states
  const [formVendorId, setFormVendorId] = useState("");
  const [warranty, setWarranty] = useState("24");

  // Modals & Panels
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [detailedAsset, setDetailedAsset] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Bulk Operations State & Actions
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [bulkActionSubmitting, setBulkActionSubmitting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssetIds(assets.map((a) => a.id));
    } else {
      setSelectedAssetIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAssetIds((prev) => [...prev, id]);
    } else {
      setSelectedAssetIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const executeBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedAssetIds.length} assets? This action will fail and rollback if any selected assets are currently allocated.`)) return;
    setBulkActionSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await bulkDeleteAssets(selectedAssetIds);
      if (res.success) {
        setSuccess(res.message || "Bulk assets deleted.");
        setSelectedAssetIds([]);
        await loadAssets();
      } else {
        setError(res.message || "Bulk delete failed.");
      }
    } catch (err) {
      setError("Bulk delete execution error.");
    } finally {
      setBulkActionSubmitting(false);
    }
  };

  const executeBulkChangeDept = async (deptId: string) => {
    if (!deptId) return;
    setBulkActionSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await bulkChangeAssetsDept(selectedAssetIds, deptId);
      if (res.success) {
        setSuccess(res.message || "Bulk department updated.");
        setSelectedAssetIds([]);
        await loadAssets();
      } else {
        setError(res.message || "Failed to update department.");
      }
    } catch (err) {
      setError("Bulk department update error.");
    } finally {
      setBulkActionSubmitting(false);
    }
  };

  const executeBulkChangeCategory = async (catId: string) => {
    if (!catId) return;
    setBulkActionSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await bulkChangeAssetsCategory(selectedAssetIds, catId);
      if (res.success) {
        setSuccess(res.message || "Bulk category updated.");
        setSelectedAssetIds([]);
        await loadAssets();
      } else {
        setError(res.message || "Failed to update category.");
      }
    } catch (err) {
      setError("Bulk category update error.");
    } finally {
      setBulkActionSubmitting(false);
    }
  };

  const executeBulkChangeStatus = async (statusVal: any) => {
    if (!statusVal) return;
    setBulkActionSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await bulkChangeAssetsStatus(selectedAssetIds, statusVal);
      if (res.success) {
        setSuccess(res.message || "Bulk status updated.");
        setSelectedAssetIds([]);
        await loadAssets();
      } else {
        setError(res.message || "Failed to update status.");
      }
    } catch (err) {
      setError("Bulk status update error.");
    } finally {
      setBulkActionSubmitting(false);
    }
  };

  const executeBulkUpdateCondition = async (condVal: any) => {
    if (!condVal) return;
    setBulkActionSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await bulkUpdateAssetsCondition(selectedAssetIds, condVal);
      if (res.success) {
        setSuccess(res.message || "Bulk condition updated.");
        setSelectedAssetIds([]);
        await loadAssets();
      } else {
        setError(res.message || "Failed to update condition.");
      }
    } catch (err) {
      setError("Bulk condition update error.");
    } finally {
      setBulkActionSubmitting(false);
    }
  };

  const executeBulkExport = () => {
    const selectedList = assets.filter((a) => selectedAssetIds.includes(a.id));
    const csvRows = selectedList.map((a) => ({
      "Asset Tag": a.tag,
      "Name": a.name,
      "Category": a.category.name,
      "Status": a.status,
      "Condition": a.condition,
      "Location": a.location,
      "Cost": a.acquisitionCost,
      "Acquisition Date": new Date(a.acquisitionDate).toLocaleDateString()
    }));
    exportToCSV(csvRows, `Bulk_Assets_Export_${new Date().toISOString().slice(0, 10)}`);
  };

  const executeBulkPrintLabels = () => {
    const selectedList = assets.filter((a) => selectedAssetIds.includes(a.id));
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Asset Labels</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .label { border: 2px dashed black; padding: 15px; margin: 10px; display: inline-block; width: 220px; }
            .title { font-weight: bold; font-size: 14px; }
            .tag { font-size: 16px; font-weight: bold; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h2>AssetFlow Bulk Labels</h2>
          ${selectedList.map(a => `
            <div class="label">
              <div class="title">${a.name}</div>
              <div class="tag">${a.tag}</div>
              <div>Status: ${a.status}</div>
              <div>Condition: ${a.condition}</div>
            </div>
          `).join("")}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add Asset Form States
  const [name, setName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [condition, setCondition] = useState<AssetCondition>("NEW");
  const [location, setLocation] = useState("");
  const [isSharedResource, setIsSharedResource] = useState(false);
  const [formDeptId, setFormDeptId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Action Form States
  const [allocTargetUserId, setAllocTargetUserId] = useState("");
  const [allocReturnDate, setAllocReturnDate] = useState("");
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("GOOD");
  const [returnNotes, setReturnNotes] = useState("");
  const [transferTargetUserId, setTransferTargetUserId] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const isManagerOrAdmin = session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);
  const isEmployeeOrDeptHead = session && ["EMPLOYEE", "DEPARTMENT_HEAD"].includes(session.user.role);

  // Load Lists
  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getAssets({
        search,
        categoryId,
        status: status ? (status as AssetStatus) : undefined,
      });
      setAssets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [search, categoryId, status]);

  // Load Setup Master Data
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const [cats, depts, targets, vends] = await Promise.all([
          getCategories(),
          getDepartments(),
          getTransferTargets(),
          getVendors({ status: "ACTIVE" }),
        ]);
        setCategories(cats || []);
        setDepartments(depts || []);
        setTransferTargets(targets || []);
        setVendors(vends || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMaster();
  }, []);

  // Load Asset History Details
  useEffect(() => {
    if (!selectedAssetId) {
      setDetailedAsset(null);
      return;
    }
    const loadDetails = async () => {
      setDetailLoading(true);
      try {
        const details = await getAssetDetails(selectedAssetId);
        setDetailedAsset(details);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetails();
  }, [selectedAssetId]);

  // Handle Image base64 Uploads
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await createAsset({
        name,
        categoryId: formCategoryId,
        serialNumber,
        acquisitionDate: new Date(acquisitionDate),
        acquisitionCost: parseFloat(acquisitionCost),
        condition,
        location,
        images,
        isSharedResource,
        departmentId: formDeptId || null,
        vendorId: formVendorId || null,
        warranty: warranty ? parseInt(warranty, 10) : 24,
      });

      if (res.success) {
        setSuccess(res.message || "Asset registered.");
        // Clear
        setName("");
        setSerialNumber("");
        setFormCategoryId("");
        setAcquisitionDate("");
        setAcquisitionCost("");
        setCondition(AssetCondition.NEW);
        setLocation("");
        setIsSharedResource(false);
        setFormDeptId("");
        setFormVendorId("");
        setWarranty("24");
        setImages([]);
        setShowAddModal(false);
        // reload
        loadAssets();
      } else {
        setError(res.message || "Failed to register asset.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetireAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to retire this asset? This will flag it as Retired and disable allocations.")) return;
    setError("");
    try {
      const res = await deleteAsset(assetId);
      if (res.success) {
        setSuccess("Asset retired successfully.");
        setSelectedAssetId(null);
        await loadAssets();
      } else {
        setError(res.message || "Failed to retire asset.");
      }
    } catch (err) {
      setError("Failed to retire asset.");
    }
  };

  // ---- Action Handlers for Allocation, Return, Transfer ----
  const resetActionState = () => {
    setActionError("");
    setActionSuccess("");
    setAllocTargetUserId("");
    setAllocReturnDate("");
    setReturnCondition("GOOD");
    setReturnNotes("");
    setTransferTargetUserId("");
  };

  const handleAllocateAsset = async () => {
    if (!detailedAsset || !allocTargetUserId) {
      setActionError("Please select a target employee.");
      return;
    }
    setActionSubmitting(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await allocateAsset({
        assetId: detailedAsset.id,
        targetUserId: allocTargetUserId,
        expectedReturnDate: allocReturnDate || null,
      });
      if (res.success) {
        setActionSuccess(res.message || "Asset allocated successfully.");
        resetActionState();
        setActionSuccess(res.message || "Asset allocated successfully.");
        await loadAssets();
        // Reload detail
        const details = await getAssetDetails(detailedAsset.id);
        setDetailedAsset(details);
      } else {
        setActionError(res.message || "Failed to allocate.");
      }
    } catch (err: any) {
      setActionError(err.message || "Allocation failed.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReturnAsset = async () => {
    if (!detailedAsset) return;
    setActionSubmitting(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await returnAsset({
        assetId: detailedAsset.id,
        conditionOnReturn: returnCondition,
        checkInNotes: returnNotes || undefined,
      });
      if (res.success) {
        setActionSuccess(res.message || "Asset returned successfully.");
        resetActionState();
        setActionSuccess(res.message || "Asset returned.");
        await loadAssets();
        const details = await getAssetDetails(detailedAsset.id);
        setDetailedAsset(details);
      } else {
        setActionError(res.message || "Failed to return asset.");
      }
    } catch (err: any) {
      setActionError(err.message || "Return failed.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleTransferAsset = async () => {
    if (!detailedAsset || !transferTargetUserId) {
      setActionError("Please select a transfer recipient.");
      return;
    }
    setActionSubmitting(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await requestAssetTransfer({
        assetId: detailedAsset.id,
        targetUserId: transferTargetUserId,
      });
      if (res.success) {
        setActionSuccess(res.message || "Transfer processed.");
        resetActionState();
        setActionSuccess(res.message || "Transfer processed.");
        await loadAssets();
        const details = await getAssetDetails(detailedAsset.id);
        setDetailedAsset(details);
      } else {
        setActionError(res.message || "Transfer failed.");
      }
    } catch (err: any) {
      setActionError(err.message || "Transfer failed.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = assets.map((a) => ({
      "Asset Tag": a.tag,
      "Name": a.name,
      "Category": a.category?.name || "Uncategorized",
      "Serial Number": a.serialNumber,
      "Acquisition Cost": a.acquisitionCost,
      "Condition": a.condition,
      "Status": a.status,
      "Location": a.location,
      "Current Holder": a.currentHolder?.name || "Unallocated",
      "Department": a.department?.name || "None",
      "Acquisition Date": new Date(a.acquisitionDate).toLocaleDateString(),
    }));
    exportToCSV(exportData, "Asset_Directory");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            setError("No valid records found in CSV file.");
            setLoading(false);
            return;
          }

          // Format rows with column fallback mappings
          const formatted = parsed.map((row) => ({
            name: row.Name || row.name || "Unnamed Asset",
            categoryId: row.CategoryId || row.categoryId || (categories.length > 0 ? categories[0].id : ""),
            serialNumber: row.SerialNumber || row.serialNumber || Math.random().toString(36).substring(2, 10).toUpperCase(),
            acquisitionDate: row.AcquisitionDate || row.acquisitionDate || new Date().toISOString().slice(0, 10),
            acquisitionCost: Number(row.AcquisitionCost || row.acquisitionCost) || 0,
            condition: (row.Condition || row.condition || "NEW") as any,
            location: row.Location || row.location || "Warehouse",
            isSharedResource: String(row.IsSharedResource || row.isSharedResource).toLowerCase() === "true",
            departmentId: row.DepartmentId || row.departmentId || null,
          }));

          const res = await importAssetsAction(formatted);
          if (res.success) {
            setSuccess(res.message || "CSV assets imported successfully.");
            await loadAssets();
          } else {
            setError(res.message || "Failed to import CSV assets.");
          }
        } catch (err: any) {
          setError(err.message || "Failed to parse CSV file.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError("Failed to read CSV file.");
      setLoading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Asset Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Search, track lifecycles, and view logs of all physical assets and resources.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          {isManagerOrAdmin && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs py-2 px-4 cursor-pointer bg-white"
              >
                Import CSV
              </Button>
            </>
          )}
          <Button
            onClick={handleExportCSV}
            className="flex items-center border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs py-2 px-4 cursor-pointer bg-white"
          >
            Export CSV
          </Button>
          {isManagerOrAdmin && (
            <Button
              onClick={() => { setShowAddModal(true); setError(""); setSuccess(""); }}
              className="flex items-center bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" /> Register Asset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets, tag..."
            className="w-full h-10 pl-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="RESERVED">Reserved</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="LOST">Lost</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>

        <Button
          onClick={() => { setSearch(""); setCategoryId(""); setStatus(""); }}
          className="h-10 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs cursor-pointer"
        >
          Clear Filters
        </Button>
      </div>

      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950">
          {success}
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Asset Table list */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          {selectedAssetIds.length > 0 && (
            <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-bold gap-4 flex-wrap">
              <div className="text-zinc-700">
                {selectedAssetIds.length} Assets Selected
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  onChange={(e: any) => {
                    executeBulkChangeDept(e.target.value);
                    e.target.value = "";
                  }}
                  className="h-8 rounded border border-zinc-200 bg-white text-[11px] px-1 cursor-pointer"
                >
                  <option value="">Move Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  onChange={(e: any) => {
                    executeBulkChangeCategory(e.target.value);
                    e.target.value = "";
                  }}
                  className="h-8 rounded border border-zinc-200 bg-white text-[11px] px-1 cursor-pointer"
                >
                  <option value="">Move Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  onChange={(e: any) => {
                    executeBulkChangeStatus(e.target.value);
                    e.target.value = "";
                  }}
                  className="h-8 rounded border border-zinc-200 bg-white text-[11px] px-1 cursor-pointer"
                >
                  <option value="">Change Status...</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="RETIRED">Retired</option>
                  <option value="LOST">Lost</option>
                </select>

                <select
                  onChange={(e: any) => {
                    executeBulkUpdateCondition(e.target.value);
                    e.target.value = "";
                  }}
                  className="h-8 rounded border border-zinc-200 bg-white text-[11px] px-1 cursor-pointer"
                >
                  <option value="">Update Condition...</option>
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>

                <button
                  onClick={executeBulkExport}
                  className="h-8 border border-zinc-200 hover:bg-zinc-50 rounded bg-white text-[11px] px-2.5 cursor-pointer font-bold"
                >
                  Export
                </button>

                <button
                  onClick={executeBulkPrintLabels}
                  className="h-8 border border-zinc-200 hover:bg-zinc-50 rounded bg-white text-[11px] px-2.5 cursor-pointer font-bold"
                >
                  Labels
                </button>

                <button
                  onClick={executeBulkDelete}
                  className="h-8 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] px-2.5 cursor-pointer font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedAssetIds.length === assets.length && assets.length > 0} 
                      onChange={(e) => handleSelectAll(e.target.checked)} 
                      className="rounded border-zinc-300 focus:ring-zinc-950 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3">Tag & Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                      No assets found matching filters.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className={`hover:bg-zinc-50/50 cursor-pointer ${
                        selectedAssetId === asset.id ? "bg-zinc-50 font-medium" : ""
                      }`}
                      onClick={() => setSelectedAssetId(asset.id)}
                    >
                      <td className="px-6 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedAssetIds.includes(asset.id)} 
                          onChange={(e) => handleSelectOne(asset.id, e.target.checked)} 
                          className="rounded border-zinc-300 focus:ring-zinc-950 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-950 text-xs font-mono">{asset.tag}</div>
                        <div className="text-zinc-700 text-sm mt-0.5">{asset.name}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{asset.category.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            asset.status === "AVAILABLE"
                              ? "bg-zinc-100 text-zinc-900 border-zinc-200"
                              : asset.status === "ALLOCATED"
                              ? "bg-zinc-900 text-white border-transparent"
                              : asset.status === "UNDER_MAINTENANCE"
                              ? "bg-zinc-50 text-zinc-500 border-zinc-200"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {asset.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{asset.location}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/assets/${asset.id}`} className="text-zinc-600 hover:text-zinc-950 p-1 cursor-pointer">
                          <Eye className="h-4 w-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Side: Timeline History details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm h-fit">
          {!selectedAssetId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
              <Info className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-sm font-semibold">Select an asset from the list to view its complete logs and history.</p>
            </div>
          ) : detailLoading ? (
            <div className="flex py-12 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
            </div>
          ) : detailedAsset ? (
            <div className="space-y-6">
              {/* Detail Header */}
              <div className="border-b border-zinc-100 pb-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded">{detailedAsset.tag}</span>
                    <h2 className="text-lg font-bold text-zinc-950 mt-2">{detailedAsset.name}</h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">S/N: {detailedAsset.serialNumber}</p>
                  </div>
                  {isManagerOrAdmin && detailedAsset.status !== "RETIRED" && (
                    <button
                      onClick={() => handleRetireAsset(detailedAsset.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                    >
                      Retire
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowTagModal(true)}
                  className="flex items-center justify-center space-x-1.5 w-full border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs py-2 px-3 font-bold cursor-pointer transition-all bg-white"
                >
                  <Tag className="h-3.5 w-3.5 text-zinc-500 animate-none" />
                  <span>Generate Printable Label</span>
                </button>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-zinc-400 font-medium">Acquisition Cost</div>
                  <div className="font-semibold text-zinc-800">₹{parseFloat(detailedAsset.acquisitionCost).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-zinc-400 font-medium">Condition</div>
                  <div className="font-semibold text-zinc-800">{detailedAsset.condition}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-zinc-400 font-medium">Location</div>
                  <div className="font-semibold text-zinc-800">{detailedAsset.location}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-zinc-400 font-medium">Type</div>
                  <div className="font-semibold text-zinc-800">{detailedAsset.isSharedResource ? "Bookable Space/Resource" : "Personal Asset"}</div>
                </div>
              </div>

              {/* Asset Photos */}
              {detailedAsset.images && detailedAsset.images.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Asset Photos</h3>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {detailedAsset.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative h-16 w-16 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 shrink-0">
                        <img src={img} alt="Asset upload" className="object-cover h-full w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Relational History</h3>
                
                {/* Active Holder */}
                {detailedAsset.currentHolder && (
                  <div className="rounded-lg bg-zinc-950 text-white p-4">
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Current Custody</div>
                    <div className="mt-1 font-bold text-sm">{detailedAsset.currentHolder.name}</div>
                    <div className="text-xs text-zinc-400">{detailedAsset.currentHolder.email}</div>
                  </div>
                )}

                {/* History list */}
                <div className="space-y-3 pl-2 border-l border-zinc-200">
                  {/* Allocation logs */}
                  {detailedAsset.allocations.map((alloc: any) => (
                    <div key={alloc.id} className="relative pl-4 text-xs space-y-0.5">
                      <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-950 border-2 border-white" />
                      <div className="font-semibold text-zinc-900">
                        {alloc.status === "ACTIVE" ? "Allocated" : "Returned"} to {alloc.user.name}
                      </div>
                      <div className="text-zinc-500 text-[10px]">{new Date(alloc.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}

                  {/* Maintenance logs */}
                  {detailedAsset.maintenanceReqs.map((req: any) => (
                    <div key={req.id} className="relative pl-4 text-xs space-y-0.5">
                      <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-400 border-2 border-white" />
                      <div className="font-semibold text-zinc-700">Maintenance: {req.status}</div>
                      <div className="text-zinc-500 text-[10px]">{req.issueDescription}</div>
                    </div>
                  ))}

                  {detailedAsset.allocations.length === 0 && detailedAsset.maintenanceReqs.length === 0 && (
                    <div className="text-zinc-400 text-xs italic pl-2">No transaction history recorded yet.</div>
                  )}
                </div>
              </div>

              {/* ====== ACTION FORMS ====== */}
              {actionError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-100">
                  {actionSuccess}
                </div>
              )}

              {/* ALLOCATE ASSET — AVAILABLE + Admin/Manager */}
              {isManagerOrAdmin && detailedAsset.status === "AVAILABLE" && (
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Allocate Asset
                  </h3>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="allocTarget" className="text-[10px]">Assign To Employee</Label>
                      <select
                        id="allocTarget"
                        value={allocTargetUserId}
                        onChange={(e) => setAllocTargetUserId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                      >
                        <option value="">Select employee...</option>
                        {transferTargets.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.email}{u.department ? ` (${u.department})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="allocReturn" className="text-[10px]">Expected Return Date (optional)</Label>
                      <Input
                        id="allocReturn"
                        type="date"
                        value={allocReturnDate}
                        onChange={(e) => setAllocReturnDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <Button
                      onClick={handleAllocateAsset}
                      disabled={actionSubmitting || !allocTargetUserId}
                      className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionSubmitting ? "Allocating..." : "Confirm Allocation"}
                    </Button>
                  </div>
                </div>
              )}

              {/* RETURN ASSET — ALLOCATED + Admin/Manager */}
              {isManagerOrAdmin && detailedAsset.status === "ALLOCATED" && (
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Process Return
                  </h3>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="returnCond" className="text-[10px]">Return Condition</Label>
                      <select
                        id="returnCond"
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                      >
                        <option value="NEW">New</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="POOR">Poor</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="returnNotes" className="text-[10px]">Check-in Notes (optional)</Label>
                      <textarea
                        id="returnNotes"
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Cosmetic damage, missing accessories, etc."
                        rows={2}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                      />
                    </div>
                    <Button
                      onClick={handleReturnAsset}
                      disabled={actionSubmitting}
                      className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionSubmitting ? "Processing..." : "Confirm Return"}
                    </Button>
                  </div>
                </div>
              )}

              {/* DIRECT TRANSFER — ALLOCATED + Admin/Manager */}
              {isManagerOrAdmin && detailedAsset.status === "ALLOCATED" && (
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" /> Direct Transfer
                  </h3>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="directTransferTarget" className="text-[10px]">Transfer To Employee</Label>
                      <select
                        id="directTransferTarget"
                        value={transferTargetUserId}
                        onChange={(e) => setTransferTargetUserId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                      >
                        <option value="">Select recipient...</option>
                        {transferTargets.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.email}{u.department ? ` (${u.department})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={handleTransferAsset}
                      disabled={actionSubmitting || !transferTargetUserId}
                      className="w-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 rounded-lg text-xs py-2 cursor-pointer disabled:opacity-50 font-bold"
                    >
                      {actionSubmitting ? "Transferring..." : "Execute Transfer"}
                    </Button>
                  </div>
                </div>
              )}

              {/* REQUEST TRANSFER — ALLOCATED + Employee/DeptHead */}
              {isEmployeeOrDeptHead && detailedAsset.status === "ALLOCATED" && (
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" /> Request Handover / Transfer
                  </h3>
                  <p className="text-[10px] text-zinc-500">
                    Submit a transfer request to management. Once approved, the asset custody will move to the selected recipient.
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="reqTransferTarget" className="text-[10px]">Transfer To</Label>
                      <select
                        id="reqTransferTarget"
                        value={transferTargetUserId}
                        onChange={(e) => setTransferTargetUserId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                      >
                        <option value="">Select recipient...</option>
                        {transferTargets.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — {u.email}{u.department ? ` (${u.department})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={handleTransferAsset}
                      disabled={actionSubmitting || !transferTargetUserId}
                      className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionSubmitting ? "Submitting..." : "Submit Transfer Request"}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>

      {/* REGISTER ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-zinc-200 p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-lg font-black text-zinc-950">Register New Asset</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="assetName">Asset Name</Label>
                  <Input id="assetName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MacBook Pro 16" required />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input id="serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. C02GL4H0Q05D" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="acqDate">Acquisition Date</Label>
                  <Input id="acqDate" type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="acqCost">Cost (USD)</Label>
                  <Input id="acqCost" type="number" step="0.01" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} placeholder="e.g. 2499.00" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cond">Initial Condition</Label>
                  <select
                    id="cond"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as AssetCondition)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="loc">Storage Location</Label>
                  <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Head Office, Shelf B4" required />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="formDept">Default Department</Label>
                  <select
                    id="formDept"
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">No Department Restriction</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="formVendor">Vendor Partner</Label>
                  <select
                    id="formVendor"
                    value={formVendorId}
                    onChange={(e) => setFormVendorId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="">No Vendor Partner</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.companyName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="warranty">Warranty (Months)</Label>
                  <Input
                    id="warranty"
                    type="number"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 24"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="shared"
                    checked={isSharedResource}
                    onChange={(e) => setIsSharedResource(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                  />
                  <Label htmlFor="shared" className="cursor-pointer">Mark as Bookable Shared Resource</Label>
                </div>
              </div>

              {/* Photo uploader */}
              <div className="space-y-2">
                <Label>Asset Photos</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[8px] font-bold mt-1 uppercase">Add</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {images.map((img, idx) => (
                    <div key={idx} className="relative h-16 w-16 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-100">
                      <img src={img} alt="Thumbnail" className="object-cover h-full w-full" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
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
                  variant="primary"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                  disabled={submitting}
                >
                  {submitting ? "Registering..." : "Confirm Registration"}
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

      {/* PRINTABLE TAG LABEL MODAL */}
      {showTagModal && detailedAsset && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 p-6 space-y-6 shadow-xl relative select-none">
            {/* Embedded styles for print media */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-tag, #printable-tag * {
                  visibility: visible;
                }
                #printable-tag {
                  position: fixed;
                  left: 50%;
                  top: 50%;
                  transform: translate(-50%, -50%) scale(1.5);
                  border: 1px solid #000 !important;
                  box-shadow: none !important;
                  padding: 12px !important;
                }
              }
            `}} />

            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h2 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Print Asset Label</h2>
              <button 
                onClick={() => setShowTagModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Tag Label Container */}
            <div className="flex justify-center p-2">
              <div 
                id="printable-tag" 
                className="w-[3.5in] h-[2.5in] border border-zinc-950 bg-white p-3 rounded flex flex-col justify-between select-none relative shadow-sm"
              >
                {/* Tag Header */}
                <div className="flex justify-between items-center border-b border-zinc-950 pb-1.5">
                  <div className="flex items-center space-x-1">
                    <div className="h-4 w-4 bg-zinc-950 text-white rounded text-[8px] font-black flex items-center justify-center">AF</div>
                    <span className="text-[9px] font-black tracking-widest uppercase">AssetFlow ERP</span>
                  </div>
                  <span className="text-[8px] font-bold text-zinc-500 font-mono">PRINTED: {new Date().toLocaleDateString()}</span>
                </div>

                {/* Tag Body */}
                <div className="flex items-stretch justify-between flex-1 py-2 space-x-3">
                  {/* Left Side: Metadata */}
                  <div className="flex flex-col justify-between flex-1 text-left">
                    <div>
                      <div className="text-[14px] font-black text-zinc-950 font-mono tracking-tight leading-none">
                        {detailedAsset.tag}
                      </div>
                      <div className="text-[10px] font-black text-zinc-800 line-clamp-1 mt-1 leading-tight">
                        {detailedAsset.name}
                      </div>
                      <div className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">
                        {detailedAsset.category?.name || "General"}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-zinc-400 font-mono">S/N: {detailedAsset.serialNumber || "N/A"}</div>
                      <div className="text-[8px] text-zinc-400 font-mono">LOC: {detailedAsset.location || "N/A"}</div>
                    </div>
                  </div>

                  {/* Right Side: QR Code */}
                  <div className="w-16 h-16 shrink-0 border border-zinc-300 rounded p-1 flex items-center justify-center bg-white self-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        JSON.stringify({
                          tag: detailedAsset.tag,
                          name: detailedAsset.name,
                          serial: detailedAsset.serialNumber,
                        })
                      )}`} 
                      alt="Asset QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Tag Footer Barcode Simulation */}
                <div className="flex flex-col items-center border-t border-zinc-950/20 pt-1">
                  {/* Styled Barcode Lines */}
                  <div className="w-full h-4 flex justify-between px-1 overflow-hidden opacity-90">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const widthClass = i % 3 === 0 ? "w-[1px]" : i % 5 === 0 ? "w-[2px]" : "w-[0.5px]";
                      return (
                        <div key={i} className={`h-full bg-zinc-950 ${widthClass}`} />
                      );
                    })}
                  </div>
                  <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                    * {detailedAsset.tag} *
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 border-t border-zinc-100 pt-4">
              <Button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs font-bold py-2 px-4 cursor-pointer"
              >
                Print Label
              </Button>
              <Button
                onClick={() => setShowTagModal(false)}
                className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-bold text-zinc-700 py-2 px-4 cursor-pointer bg-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

