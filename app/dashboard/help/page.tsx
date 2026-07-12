"use client";

import React, { useState } from "react";
import { HelpCircle, BookOpen, Key, Mail, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I book shared resources (e.g., vehicles, conference rooms)?",
      a: "Navigate to the 'Bookings' scheduler using the sidebar menu. Filter the calendar grid by category, double-click an available slot or click the 'Create Booking' action, fill in the time ranges, and submit. The system runs conflict detection instantly.",
    },
    {
      q: "Who is responsible for approving my physical asset transfer requests?",
      a: "Handovers are reviewed by either the Department Head of your team or the general organization Asset Manager. Once authorized, the old allocation is closed and custody is reassigned to the target holder automatically.",
    },
    {
      q: "What does setting an asset to 'Under Maintenance' do?",
      a: "When a maintenance request is approved, the asset's status changes to 'Under Maintenance', removing it from availability for bookings or allocations. Once resolved by a technician, the status automatically reverts to 'Available'.",
    },
    {
      q: "How often are organization-wide audit cycles conducted?",
      a: "System administrators create custom audit cycles. Designated auditors verify active assets in the directory, log missing/damaged items, compile discrepancies, and close the cycle into a read-only historical state.",
    },
  ];

  return (
    <div className="max-w-[760px] mx-auto space-y-8 font-sans pb-12">
      {/* Title */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Help Center & Guides</h1>
        <p className="text-sm text-zinc-500 mt-1">Access FAQ manuals, keyboard shortcuts, and IT service desks.</p>
      </div>

      {/* Grid: Docs vs Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Support channels card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
              <Mail className="h-4 w-4 mr-2 text-zinc-400" /> IT Support Service Desk
            </h3>
            <p className="text-xs text-zinc-500 leading-normal">
              Need assistance with credentials, new asset procurement, or category attributes? Contact our team.
            </p>
          </div>
          <div className="space-y-2 text-xs font-semibold text-zinc-600">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <span>Slack: #assetflow-support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span>Email: support@assetflow.com</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Matrix */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
            <Key className="h-4 w-4 mr-2 text-zinc-400" /> Keyboard Shortcuts Matrix
          </h3>
          <div className="space-y-2 text-xs font-semibold text-zinc-600">
            <div className="flex justify-between items-center py-1 border-b border-zinc-200/50">
              <span>Command Palette Search</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded font-mono text-[9px]">⌘ + K</kbd>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-zinc-200/50">
              <span>Close Active Modal</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded font-mono text-[9px]">ESC</kbd>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Toggle Side Navigation</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded font-mono text-[9px]">⌘ + B</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion FAQ manual list */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
          <BookOpen className="h-4 w-4 mr-2 text-zinc-400" /> Frequently Asked Questions
        </h3>

        <div className="divide-y divide-zinc-100 text-xs">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4 space-y-2">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center font-bold text-zinc-900 hover:text-zinc-950 cursor-pointer text-left focus:outline-none"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {openFaq === idx && (
                <p className="text-zinc-500 leading-relaxed pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
