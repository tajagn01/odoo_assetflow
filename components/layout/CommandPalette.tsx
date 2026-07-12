"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Calendar, Wrench, Shield, Building2, BarChart3, User, Settings, HelpCircle, Activity } from "lucide-react";
import { hasPermission } from "@/lib/permissions";

interface CommandPaletteProps {
  role: string | undefined;
}

export default function CommandPalette({ role }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Define commands matching sidebar links
  const allCommands = [
    {
      title: "Overview Dashboard",
      href: "/dashboard",
      icon: Shield,
      free: true,
    },
    {
      title: "Asset Directory",
      href: "/dashboard/assets",
      icon: Package,
      resource: "ASSETS",
      action: "READ",
    },
    {
      title: "Bookings Scheduler",
      href: "/dashboard/bookings",
      icon: Calendar,
      resource: "BOOKINGS",
      action: "READ",
    },
    {
      title: "Maintenance Kanban",
      href: "/dashboard/maintenance",
      icon: Wrench,
      resource: "MAINTENANCE",
      action: "READ",
    },
    {
      title: "Asset Audits",
      href: "/dashboard/audits",
      icon: Shield,
      resource: "AUDITS",
      action: "READ",
    },
    {
      title: "Organization Headcounts",
      href: "/dashboard/admin/org",
      icon: Building2,
      resource: "DEPARTMENTS",
      action: "CREATE",
    },
    {
      title: "System Activity Logs",
      href: "/dashboard/admin/logs",
      icon: Activity,
      resource: "LOGS",
      action: "READ",
    },
    {
      title: "Reports & Analytics",
      href: "/dashboard/reports",
      icon: BarChart3,
      resource: "REPORTS",
      action: "READ",
    },
    {
      title: "My Profile Card",
      href: "/dashboard/profile",
      icon: User,
      free: true,
    },
    {
      title: "Account Settings",
      href: "/dashboard/settings",
      icon: Settings,
      free: true,
    },
    {
      title: "Help Guides & FAQ",
      href: "/dashboard/help",
      icon: HelpCircle,
      free: true,
    },
  ];

  // Filter commands by permissions
  const filteredCommands = allCommands.filter(
    (cmd) =>
      (cmd.free || (role && cmd.resource && cmd.action && hasPermission(role, cmd.resource as any, cmd.action as any))) &&
      cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  // Monitor toggle trigger (cmd+k / ctrl+k)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation logic
  useEffect(() => {
    if (!isOpen) return;

    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          router.push(selected.href);
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [isOpen, filteredCommands, selectedIndex]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (backdropRef.current === e.target) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[550px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans select-none animate-in zoom-in-95 duration-100">
        
        {/* Search input header */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or jump to page..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm focus:outline-none text-zinc-900 dark:text-white"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-[9px] text-zinc-400 select-none">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[320px] overflow-y-auto p-2 divide-y divide-zinc-50 dark:divide-zinc-800">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs italic">
              No matching pages or action shortcuts.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.title}
                  onClick={() => {
                    router.push(cmd.href);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{cmd.title}</span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider ${isSelected ? "text-zinc-400" : "text-zinc-300"}`}>
                    Jump to
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-zinc-50 dark:bg-zinc-850 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between">
          <span>Use arrows to navigate</span>
          <span>↵ to select</span>
        </div>

      </div>
    </div>
  );
}
