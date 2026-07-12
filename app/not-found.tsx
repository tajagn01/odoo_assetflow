"use client";

import Link from "next/link";
import { MoveLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 font-sans select-none antialiased">
      <div className="w-full max-w-md text-center space-y-6">
        
        {/* Error Code Tag */}
        <div className="inline-flex items-center space-x-2 bg-zinc-100 border border-zinc-200 rounded-full px-3 py-1 text-xs font-bold text-zinc-950 shadow-sm">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>404 - Page Not Found</span>
        </div>

        {/* Brand Logo */}
        <h1 className="text-4xl font-black tracking-tighter text-zinc-950">
          ASSET<span className="text-zinc-400 font-medium">FLOW</span>
        </h1>

        <div className="space-y-2">
          <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Lost in the Directory?</h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            The page you are looking for does not exist, has been retired, or moved to another routing path.
          </p>
        </div>

        {/* CTA link */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center space-x-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs py-2.5 px-6 shadow-sm transition-all"
          >
            <MoveLeft className="h-4 w-4" />
            <span>Back to Dashboard Overview</span>
          </Link>
        </div>

        {/* Footer specifications */}
        <div className="pt-8 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
          AssetFlow Enterprise Cloud ERP
        </div>

      </div>
    </div>
  );
}
