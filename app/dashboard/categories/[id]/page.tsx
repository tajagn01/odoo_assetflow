"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Folder, ArrowLeft, Tag, Calendar, Wrench, Shield, 
  Clock, DollarSign, Database, Activity, FileSpreadsheet, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryDetails } from "@/actions/assets";
import Link from "next/link";

type TabType = "overview" | "assets" | "maintenance" | "timeline";

export default function CategoryDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [assetSearch, setAssetSearch] = useState("");

  const loadCategoryData = async () => {
    setLoading(true);
    try {
      const data = await getCategoryDetails(id);
      if (!data) {
        router.push("/dashboard/admin/org");
        return;
      }
      setCategory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCategoryData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  if (!category) return null;

  // Filter linked assets
  const filteredAssets = (category.assets || []).filter((a: any) => 
    a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.tag.toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Navigation and Name Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/admin/org"
          className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-lg cursor-pointer text-zinc-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <Folder className="h-3.5 w-3.5" /> <span>Category Profiling details</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 mt-1">{category.name}</h1>
        </div>
      </div>

      {/* KPI stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Total Active Assets</span>
          <span className="text-2xl font-black text-zinc-900 block">{category.assetCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Valuation Aggregates</span>
          <span className="text-2xl font-black text-zinc-900 block">${category.totalValuation?.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Under Maintenance</span>
          <span className="text-2xl font-black text-zinc-900 block">{category.underMaintenanceCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 bg-white space-y-1">
          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Allocated Count</span>
          <span className="text-2xl font-black text-zinc-900 block">{category.allocatedCount}</span>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider space-x-6">
        {[
          { id: "overview", label: "Overview details", icon: Folder },
          { id: "assets", label: "Linked Assets", icon: Database },
          { id: "maintenance", label: "Maintenance Trends", icon: Wrench },
          { id: "timeline", label: "Audit Timeline", icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === tab.id 
                  ? "border-zinc-950 text-zinc-950 font-black" 
                  : "border-transparent text-zinc-400 hover:text-zinc-650"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Metadata information card */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase">General Description</h3>
            <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 border border-zinc-150 p-4 rounded-lg">
              {category.description || "No description provided for this category."}
            </p>
            
            <div className="space-y-2 border-t border-zinc-100 pt-4">
              <h4 className="text-xs font-black text-zinc-900 uppercase">Default Configuration Fields</h4>
              <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-4 font-mono text-[10px] text-zinc-600">
                {category.customFields ? JSON.stringify(category.customFields, null, 2) : "{}"}
              </div>
            </div>
          </div>

          {/* Warranty rules card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="text-sm font-black text-zinc-900 uppercase flex items-center gap-1">
              <Shield className="h-4 w-4 text-zinc-900" /> Warranty Rules
            </h3>
            <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-450 font-bold">Standard Warranty:</span>
                <span className="text-zinc-800 font-bold">24 Months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-450 font-bold">Support Scope:</span>
                <span className="text-zinc-800 font-bold">Replacement / On-site</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-450 font-bold">Expiry Warning:</span>
                <span className="text-zinc-800 font-bold">30 Days Before</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASSETS */}
      {activeTab === "assets" && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center flex-wrap gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input 
                placeholder="Search assets tag/name..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-400 font-bold uppercase select-none">
                  <th className="p-3 text-left">Asset Tag</th>
                  <th className="p-3 text-left">Asset Name</th>
                  <th className="p-3 text-left">Condition</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Acquisition Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 italic">No linked assets found.</td>
                  </tr>
                ) : (
                  filteredAssets.map((a: any) => (
                    <tr key={a.id} className="hover:bg-zinc-50/30">
                      <td className="p-3 font-mono font-bold text-zinc-650">
                        <Link href={`/dashboard/assets/${a.id}`} className="hover:underline text-indigo-600">
                          {a.tag}
                        </Link>
                      </td>
                      <td className="p-3 font-bold text-zinc-950">{a.name}</td>
                      <td className="p-3 font-bold text-zinc-700">{a.condition}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-zinc-100 text-zinc-800 border-zinc-200">
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-905">${a.acquisitionCost.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-zinc-900 uppercase">Recent Maintenance Log Sheets</h3>
          <div className="space-y-3 text-xs">
            {category.assets.filter((a: any) => a.status === "UNDER_MAINTENANCE").length === 0 ? (
              <div className="py-8 text-center text-zinc-400 italic">No assets currently undergoing maintenance under this category.</div>
            ) : (
              category.assets.filter((a: any) => a.status === "UNDER_MAINTENANCE").map((a: any) => (
                <div key={a.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-150">
                  <div>
                    <span className="font-bold text-zinc-900">[{a.tag}] {a.name}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">Location: {a.location}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-50 text-amber-700 border border-amber-250 uppercase tracking-wider">Under Repair</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-zinc-900 uppercase flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Category Audit Timeline
          </h3>
          <div className="space-y-4 border-l border-zinc-200 pl-4 relative ml-2">
            <div className="relative text-xs">
              <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-950 border border-white" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Today</span>
              <span className="font-bold text-zinc-900 block mt-1">Category Registry Synced</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">All linked assets snapshot checked by system daemon.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
