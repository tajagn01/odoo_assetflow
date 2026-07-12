"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X, User, Tag, Shield, Calendar, Wrench, Info, History, ArrowRight } from "lucide-react";
import { globalSearch, SearchItem } from "@/actions/intelligence";

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("af_recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  // Save query to recent searches
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((x) => x.toLowerCase() !== searchTerm.toLowerCase());
      const next = [searchTerm, ...filtered].slice(0, 5);
      localStorage.setItem("af_recent_searches", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem("af_recent_searches");
    setRecentSearches([]);
  }, []);

  // Listen to Cmd+K or Ctrl+K shortcut keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Set focus on input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setActiveIndex(0);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Execute typeahead search with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const filters = filterType !== "all" ? { type: filterType } : undefined;
        const data = await globalSearch(trimmed, filters);
        setResults(data || []);
        setActiveIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query, filterType]);

  // Handle navigate item click
  const handleItemSelect = useCallback((item: SearchItem) => {
    saveRecentSearch(query || item.title);
    setIsOpen(false);
    router.push(item.href);
  }, [query, router, saveRecentSearch]);

  // Keyboard navigation inside suggestions list
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) {
        handleItemSelect(results[activeIndex]);
      }
    }
  }, [results, activeIndex, handleItemSelect]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Asset": return <Tag className="h-4 w-4" />;
      case "Employee": return <User className="h-4 w-4" />;
      case "Department": return <Shield className="h-4 w-4" />;
      case "Booking": return <Calendar className="h-4 w-4" />;
      case "Maintenance": return <Wrench className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <>
      {/* Search Trigger Button (Navbar layout indicator) */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full max-w-xs h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 rounded-lg text-zinc-500 select-none cursor-pointer font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4 text-zinc-400" />
          Quick Search...
        </span>
        <kbd className="hidden sm:inline-block bg-white border border-zinc-200 text-[10px] text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Floating search command palette overlay via React Portal */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div 
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-start pt-[10vh] p-4 backdrop-blur-xs select-none"
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl border border-zinc-200 max-w-xl w-full shadow-2xl flex flex-col max-h-[70vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Input Bar */}
            <div className="flex items-center px-4 border-b border-zinc-100 h-14 shrink-0 gap-3">
              <Search className="h-5 w-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search assets, departments, employees, bookings, tickets..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm bg-transparent outline-none text-zinc-950 placeholder-zinc-400 h-full font-semibold"
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="text-zinc-400 hover:text-zinc-650 cursor-pointer p-1 rounded-full hover:bg-zinc-50"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg font-bold text-zinc-600 cursor-pointer shrink-0"
              >
                ESC
              </button>
            </div>

            {/* Filter category badges */}
            <div className="flex gap-1.5 px-4 py-3 bg-zinc-50/50 border-b border-zinc-100 overflow-x-auto scrollbar-none shrink-0 text-[11px] font-bold">
              {[
                { type: "all", label: "All Items" },
                { type: "assets", label: "Assets" },
                { type: "employees", label: "Employees" },
                { type: "maintenance", label: "Maintenance" },
                { type: "bookings", label: "Bookings" },
                { type: "departments", label: "Departments" },
                { type: "categories", label: "Categories" },
              ].map((filter) => (
                <button
                  key={filter.type}
                  onClick={() => setFilterType(filter.type)}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    filterType === filter.type
                      ? "bg-zinc-950 border-zinc-950 text-white shadow-sm"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Content panel */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0 text-xs">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                </div>
              )}

              {!loading && !query && (
                <div className="p-4 space-y-5">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        <span>Recent Searches</span>
                        <button 
                          onClick={clearRecentSearches} 
                          className="hover:underline cursor-pointer lowercase"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => setQuery(term)}
                            className="flex items-center w-full px-3 py-2 bg-zinc-50 border border-zinc-200/50 hover:bg-zinc-100 rounded-xl font-bold text-zinc-700 text-left gap-2 cursor-pointer transition-colors"
                          >
                            <History className="h-3.5 w-3.5 text-zinc-400" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions block */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Search Suggestions</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                      {[
                        { term: "AF-000001", label: "Asset Tag Search" },
                        { term: "Laptop", label: "Electronics Category" },
                        { term: "Under Maintenance", label: "Asset Status" },
                        { term: "Auditor", label: "Auditor Roles" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(item.term)}
                          className="flex items-center justify-between p-3 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-left cursor-pointer transition-all"
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded font-mono">{item.term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="text-center py-12 text-zinc-400 italic font-semibold">
                  No records matched your search query. Try another term.
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-0.5">
                  {results.map((item, idx) => {
                    const isSelected = activeIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all border ${
                          isSelected 
                            ? "bg-zinc-950 border-zinc-950 text-white shadow-sm" 
                            : "bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                            {getIcon(item.type)}
                          </div>
                          <div className="min-w-0">
                            <span className={`font-bold block text-xs ${isSelected ? "text-white" : "text-zinc-950"}`}>{item.title}</span>
                            <span className={`text-[10px] block truncate font-medium mt-0.5 ${isSelected ? "text-zinc-300" : "text-zinc-450"}`}>{item.subtitle}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 select-none">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            isSelected 
                              ? "bg-white/15 text-white" 
                              : "bg-zinc-150 text-zinc-600 border border-zinc-200"
                          }`}>
                            {item.type}
                          </span>
                          <ArrowRight className={`h-4 w-4 transition-transform ${isSelected ? "text-white translate-x-0.5" : "text-zinc-300"}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex justify-between items-center px-4 py-2 border-t border-zinc-150 bg-zinc-50/50 shrink-0 text-[10px] font-bold text-zinc-400 select-none">
              <span className="flex items-center gap-1">
                <span>↑↓</span> to navigate
                <span className="ml-2">↵</span> to select
              </span>
              <span>
                Cmd+K to toggle Search
              </span>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
