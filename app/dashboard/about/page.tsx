"use client";

import React from "react";
import { Info, ShieldAlert, Cpu, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-[760px] mx-auto space-y-8 font-sans pb-12 select-none">
      {/* Title */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">About AssetFlow</h1>
        <p className="text-sm text-zinc-500 mt-1">Application parameters, organization licenses, and compliance metadata.</p>
      </div>

      {/* Grid: App Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Release metrics */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
            <Cpu className="h-4 w-4 mr-2 text-zinc-400" /> Software Specifications
          </h3>
          <div className="space-y-2 text-xs font-semibold text-zinc-600">
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span>App Version</span>
              <span className="font-mono text-zinc-900">v1.1.0-enterprise</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span>Next.js Version</span>
              <span className="font-mono text-zinc-900">v16.2 (Turbopack)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Database Engine</span>
              <span className="font-mono text-zinc-900">PostgreSQL (Neon)</span>
            </div>
          </div>
        </div>

        {/* Compliance card */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-zinc-400" /> Security Compliance
            </h3>
            <p className="text-[11px] text-zinc-500 leading-normal">
              AssetFlow leverages row-level RBAC policies, TLS encryption endpoints, and stateless signed credentials reset architectures.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-900 bg-white border border-zinc-200 rounded-lg p-2.5 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <span>SOC-2 Type II Certified (Mock Check Passed)</span>
          </div>
        </div>
      </div>

      {/* Developer note */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-3">
        <Heart className="h-6 w-6 text-zinc-300 mx-auto" />
        <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider">AssetFlow Core Team</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Crafted with care to eliminate double asset allocations, booking conflict overlaps, and missing inventory logs.
        </p>
        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
          © 2026 AssetFlow Inc. Open source MIT License.
        </span>
      </div>

    </div>
  );
}
