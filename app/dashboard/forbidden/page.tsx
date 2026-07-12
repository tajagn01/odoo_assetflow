"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 font-sans select-none antialiased">
      
      {/* Icon Badge */}
      <div className="h-16 w-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm animate-bounce">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 uppercase">403 - Forbidden Access</h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          Your current session role does not have authorization policies to query this route, modify records, or view administrative data.
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center space-x-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs py-2.5 px-6 shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-4">
        AssetFlow Role-Based Access Control (RBAC) System
      </div>

    </div>
  );
}
