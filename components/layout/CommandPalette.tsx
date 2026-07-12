"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Package, Calendar, Wrench, Shield, Building2, 
  BarChart3, User, Settings, HelpCircle, Activity, Star, History, ArrowRight, ShieldAlert
} from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { searchEnterprise, SearchResult } from "@/actions/search";

interface CommandPaletteProps {
  role: string | undefined;
}

export default function CommandPalette({ role }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Db search results
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [searchingDb, setSearchingDb] = useState(false);

  // Favorites & Recents in LocalStorage
  const [favorites, setFavorites] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<SearchResult[]>([]);

  // Load favorites & recents on mount/open
  useEffect(() => {
    if (typeof window !== "undefined") {
      const favs = localStorage.getItem("af_fav_searches");
      const recs = localStorage.getItem("af_recent_searches");
      if (favs) setFavorites(JSON.parse(favs));
      if (recs) setRecents(JSON.parse(recs));
    }
  }, [isOpen]);

  // Define commands matching sidebar links
  const allCommands: SearchResult[] = [
    { id: "ov", type: "ROUTE", title: "Overview Dashboard", subtitle: "Main system overview metrics", href: "/dashboard" },
    { id: "ad", type: "ROUTE", title: "Asset Directory", subtitle: "Physical inventory records register", href: "/dashboard/assets" },
    { id: "bs", type: "ROUTE", title: "Bookings Scheduler", subtitle: "Shared vehicle & space reservation bookings", href: "/dashboard/bookings" },
    { id: "mk", type: "ROUTE", title: "Maintenance Kanban", subtitle: "Active repairs ticket board", href: "/dashboard/maintenance" },
    { id: "aa", type: "ROUTE", title: "Asset Audits", subtitle: "Inventory verification cycles auditing console", href: "/dashboard/audits" },
    { id: "oh", type: "ROUTE", title: "Organization Headcounts", subtitle: "Manage departments, categories & employees directory", href: "/dashboard/admin/org" },
    { id: "sl", type: "ROUTE", title: "System Activity Logs", subtitle: "Immutable historical operation audit logs grid", href: "/dashboard/admin/logs" },
    { id: "ra", type: "ROUTE", title: "Reports & Analytics", subtitle: "Valuation trends, categories & utilization center", href: "/dashboard/reports" },
    { id: "mp", type: "ROUTE", title: "My Profile Card", subtitle: "Configure details & profile bio settings", href: "/dashboard/profile" },
    { id: "as", type: "ROUTE", title: "Account Settings", subtitle: "Manage security passwords & alerts", href: "/dashboard/settings" },
    { id: "hg", type: "ROUTE", title: "Help Guides & FAQ", subtitle: "ERP keyboard shortcut helpers & documentation", href: "/dashboard/help" },
  ];

  // Filter commands by permissions
  const filteredCommands = allCommands.filter((cmd) => {
    if (cmd.href === "/dashboard" || cmd.href === "/dashboard/profile" || cmd.href === "/dashboard/settings" || cmd.href === "/dashboard/help") {
      return cmd.title.toLowerCase().includes(search.toLowerCase());
    }
    // Check permission matrices
    let resource = "";
    let action = "";
    if (cmd.href === "/dashboard/assets") { resource = "ASSETS"; action = "READ"; }
    else if (cmd.href === "/dashboard/bookings") { resource = "BOOKINGS"; action = "READ"; }
    else if (cmd.href === "/dashboard/maintenance") { resource = "MAINTENANCE"; action = "READ"; }
    else if (cmd.href === "/dashboard/audits") { resource = "AUDITS"; action = "READ"; }
    else if (cmd.href === "/dashboard/admin/org") { resource = "DEPARTMENTS"; action = "CREATE"; }
    else if (cmd.href === "/dashboard/admin/logs") { resource = "LOGS"; action = "READ"; }
    else if (cmd.href === "/dashboard/reports") { resource = "REPORTS"; action = "READ"; }

    return (
      (role && resource && action && hasPermission(role, resource as any, action as any)) &&
      cmd.title.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Debounced DB Search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setSearchingDb(true);
        try {
          const list = await searchEnterprise(search.trim());
          setDbResults(list || []);
        } catch (err) {
          console.error(err);
        } finally {
          setSearchingDb(false);
        }
      } else {
        setDbResults([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Combined selectable items list
  let combinedItems: SearchResult[] = [];
  if (search.trim() === "") {
    // Show Favorites and Recents
    combinedItems = [
      ...favorites.map(f => ({ ...f, isFavorite: true })),
      ...recents.map(r => ({ ...r, isRecent: true }))
    ].slice(0, 10);
    // If empty, fallback to basic commands shortcuts
    if (combinedItems.length === 0) {
      combinedItems = filteredCommands.slice(0, 5);
    }
  } else {
    combinedItems = [...filteredCommands, ...dbResults];
  }

  // Keyboard events cmd+k
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

  const handleSelect = (item: SearchResult) => {
    router.push(item.href);
    setIsOpen(false);

    // Save to recents in LocalStorage
    const updatedRecents = [item, ...recents.filter((r) => r.id !== item.id)].slice(0, 5);
    setRecents(updatedRecents);
    localStorage.setItem("af_recent_searches", JSON.stringify(updatedRecents));
  };

  // Keyboard navigation listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % Math.max(1, combinedItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = combinedItems[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [isOpen, combinedItems, selectedIndex]);


  const toggleFavorite = (e: React.MouseEvent, item: SearchResult) => {
    e.stopPropagation();
    let updated;
    const isFav = favorites.some((f) => f.id === item.id);
    if (isFav) {
      updated = favorites.filter((f) => f.id !== item.id);
    } else {
      updated = [item, ...favorites].slice(0, 5);
    }
    setFavorites(updated);
    localStorage.setItem("af_fav_searches", JSON.stringify(updated));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ASSET": return Package;
      case "EMPLOYEE": return User;
      case "DEPARTMENT": return Building2;
      case "BOOKING": return Calendar;
      case "MAINTENANCE": return Wrench;
      case "AUDIT": return Shield;
      case "NOTIFICATION": return ShieldAlert;
      case "LOG": return Activity;
      default: return ArrowRight;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) setIsOpen(false); }}
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-[550px] bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans select-none animate-in zoom-in-95 duration-100">
        
        {/* Search header bar */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-zinc-100">
          <Search className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search assets, employees, bookings, settings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm focus:outline-none text-zinc-900"
            autoFocus
          />
          {searchingDb && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent shrink-0" />
          )}
          <kbd className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded font-mono text-[9px] text-zinc-400 select-none">
            ESC
          </kbd>
        </div>

        {/* Results grid list */}
        <div className="max-h-[320px] overflow-y-auto p-2 divide-y divide-zinc-50">
          {combinedItems.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs italic">
              No matching records or commands.
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const Icon = getIcon(item.type);
              const isSelected = idx === selectedIndex;
              const isFav = favorites.some((f) => f.id === item.id);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-650 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-white" />
                    <div className="truncate text-left">
                      <div className="font-bold truncate">{item.title}</div>
                      <div className={`text-[9px] font-normal truncate ${isSelected ? "text-zinc-350" : "text-zinc-400"}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[8px] uppercase tracking-wider font-mono ${isSelected ? "text-zinc-400" : "text-zinc-300"}`}>
                      {item.type}
                    </span>
                    <button 
                      onClick={(e) => toggleFavorite(e, item)}
                      className={`p-1 cursor-pointer hover:scale-110 transition-transform ${
                        isFav ? "text-amber-500" : isSelected ? "text-zinc-500" : "text-zinc-200"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-zinc-50 px-4 py-2 border-t border-zinc-100 text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between">
          <span>Use arrows to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
