"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, CheckSquare, BellOff, Info, Clock, AlertTriangle, ShieldCheck, Mail, AlertCircle,
  Pin, Archive, Trash2, Settings, ShieldAlert, Sparkles, Star, UserCheck, CheckCircle2,
  Search, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  getNotificationsAction, markAsReadAction, markAllAsReadAction,
  togglePinAction, toggleArchiveAction, deleteNotificationAction
} from "@/features/notifications/actions/notificationActions";
import { triggerSmartReminders } from "@/actions/reports";

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // UI settings filter
  const [filterTab, setFilterTab] = useState<"inbox" | "pinned" | "archived">("inbox");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Notification preferences
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefBrowser, setPrefBrowser] = useState(false);
  const [prefReminders, setPrefReminders] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Trigger background reminders compilation scan
      await triggerSmartReminders();

      const res = await getNotificationsAction();
      if (res.success && res.data) {
        setNotifications(res.data);
      } else {
        setError(res.message || "Failed to load notifications.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markAsReadAction(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setSuccess("Notification marked as read.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await markAllAsReadAction();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setSuccess(res.message || "All notifications marked as read.");
      } else {
        setError(res.message || "Failed to mark all as read.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleTogglePin = async (id: string, currentVal: boolean) => {
    try {
      const res = await togglePinAction(id, !currentVal);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  metadata: {
                    ...(n.metadata as Record<string, any>),
                    isPinned: !currentVal,
                  },
                }
              : n
          )
        );
        setSuccess(!currentVal ? "Notification pinned to top." : "Notification unpinned.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (id: string, currentVal: boolean) => {
    try {
      const res = await toggleArchiveAction(id, !currentVal);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  metadata: {
                    ...(n.metadata as Record<string, any>),
                    isArchived: !currentVal,
                  },
                }
              : n
          )
        );
        setSuccess(!currentVal ? "Notification archived." : "Notification restored to inbox.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification record?")) return;
    try {
      const res = await deleteNotificationAction(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setSuccess("Notification removed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const enableBrowserAlerts = async () => {
    if (!("Notification" in window)) {
      setError("Browser notifications are not supported by this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPrefBrowser(true);
      new Notification("AssetFlow Alerts Enabled", {
        body: "Real-time browser notifications are now configured.",
        icon: "/favicon.ico",
      });
      setSuccess("Browser notifications configured successfully.");
    } else {
      setError("Browser permission denied.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  // Parse filters
  const processedNotifications = notifications.filter((n) => {
    const meta = (n.metadata as Record<string, any>) || {};
    const isPinned = !!meta.isPinned;
    const isArchived = !!meta.isArchived;

    // 1. Tab filtering
    if (filterTab === "pinned" && !isPinned) return false;
    if (filterTab === "archived" && !isArchived) return false;
    if (filterTab === "inbox" && isArchived) return false; // inbox hides archived items

    // 2. Category filters (Asset, Booking, Maintenance, Audit, Approval, Transfer, System)
    const category = meta.category || n.type || "SYSTEM";
    if (selectedCategory !== "ALL" && category !== selectedCategory) return false;

    // 3. Priority filters
    const priority = meta.priority || "MEDIUM";
    if (selectedPriority !== "ALL" && priority !== selectedPriority) return false;

    // 4. Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sort pinned to the top of inbox
  const sortedNotifications = [...processedNotifications].sort((a, b) => {
    const aPinned = !!((a.metadata as Record<string, any>)?.isPinned);
    const bPinned = !!((b.metadata as Record<string, any>)?.isPinned);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = notifications.filter((n) => !n.isRead && !((n.metadata as Record<string, any>) || {}).isArchived).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Notification Center</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Centrally audit approvals, resource reminders, and security alert dispatches.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            className="flex items-center border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs py-2.5 px-4 cursor-pointer shadow-sm font-bold animate-pulse"
          >
            <CheckSquare className="h-4 w-4 mr-2" /> Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center space-x-2 animate-bounce">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-900" />
          <span>{success}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column Filters and settings pane */}
        <div className="space-y-6">
          
          {/* Navigation filters */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Inbox Divisions</h3>
            <div className="flex flex-col gap-2 text-xs">
              <button 
                onClick={() => setFilterTab("inbox")}
                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between font-bold cursor-pointer transition-all ${
                  filterTab === "inbox" ? "bg-zinc-950 text-white" : "text-zinc-650 hover:bg-zinc-50"
                }`}
              >
                <span>Active Alerts</span>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${filterTab === "inbox" ? "bg-white text-zinc-950" : "bg-zinc-100 text-zinc-900"}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setFilterTab("pinned")}
                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between font-bold cursor-pointer transition-all ${
                  filterTab === "pinned" ? "bg-zinc-950 text-white" : "text-zinc-650 hover:bg-zinc-50"
                }`}
              >
                <span>Pinned Alerts</span>
              </button>

              <button 
                onClick={() => setFilterTab("archived")}
                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between font-bold cursor-pointer transition-all ${
                  filterTab === "archived" ? "bg-zinc-950 text-white" : "text-zinc-650 hover:bg-zinc-50"
                }`}
              >
                <span>Archived Log</span>
              </button>
            </div>
          </div>

          {/* Categories and Priorities */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Alert Filters</h3>
            
            <div className="space-y-1">
              <Label className="text-[10px] text-zinc-400 font-bold uppercase">Category</Label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="ASSET">Asset Alerts</option>
                <option value="BOOKING">Booking Alerts</option>
                <option value="MAINTENANCE">Maintenance Alerts</option>
                <option value="AUDIT">Audit Alerts</option>
                <option value="APPROVAL">Approval Alerts</option>
                <option value="TRANSFER">Transfer Alerts</option>
                <option value="SYSTEM">System Alerts</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-zinc-400 font-bold uppercase">Priority Severity</Label>
              <select 
                value={selectedPriority} 
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>
            </div>
          </div>

        </div>

        {/* Middle Column notifications list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Real-time search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search notifications title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="space-y-3">
            {sortedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] border border-zinc-200 bg-white rounded-2xl p-8 text-center space-y-3">
                <BellOff className="h-10 w-10 text-zinc-300 animate-none" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">All Clear!</span>
                <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                  No alerts matching the selected filters were found.
                </p>
              </div>
            ) : (
              sortedNotifications.map((n) => {
                const meta = (n.metadata as Record<string, any>) || {};
                const isPinned = !!meta.isPinned;
                const isArchived = !!meta.isArchived;
                const priority = meta.priority || "MEDIUM";
                const categoryColors = n.isRead ? "bg-zinc-100 text-zinc-500" : "bg-zinc-950 text-white";

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border flex gap-4 transition-all relative ${
                      n.isRead
                        ? "border-zinc-200 bg-white hover:bg-zinc-50/50"
                        : "border-zinc-350 bg-zinc-50/10 hover:bg-zinc-50 shadow-xs"
                    }`}
                  >
                    {/* Category Icon indicator */}
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors}`}>
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-1 text-xs pr-16">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${n.isRead ? "text-zinc-650" : "text-zinc-950"}`}>
                          {n.title}
                        </span>
                        
                        {/* Priority Badge */}
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                          priority === "HIGH" 
                            ? "bg-red-50 text-red-700 border-red-100" 
                            : priority === "MEDIUM" 
                            ? "bg-zinc-100 text-zinc-800 border-zinc-200" 
                            : "bg-zinc-50 text-zinc-500 border-zinc-100"
                        }`}>
                          {priority}
                        </span>
                      </div>

                      <p className={`leading-relaxed ${n.isRead ? "text-zinc-500" : "text-zinc-700 font-medium"}`}>
                        {n.message}
                      </p>

                      <div className="flex items-center space-x-3 text-[10px] text-zinc-400 font-semibold pt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!n.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-zinc-950 uppercase font-black hover:underline cursor-pointer"
                          >
                            ✓ Mark Read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick action buttons absolute sidebar */}
                    <div className="absolute right-4 top-4 flex space-x-1">
                      <button 
                        onClick={() => handleTogglePin(n.id, isPinned)}
                        className={`p-1 rounded hover:bg-zinc-100 cursor-pointer ${isPinned ? "text-zinc-950" : "text-zinc-300 hover:text-zinc-650"}`}
                        title={isPinned ? "Unpin notification" : "Pin notification"}
                      >
                        <Pin className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button 
                        onClick={() => handleToggleArchive(n.id, isArchived)}
                        className={`p-1 rounded hover:bg-zinc-100 cursor-pointer ${isArchived ? "text-zinc-950" : "text-zinc-300 hover:text-zinc-650"}`}
                        title={isArchived ? "Restore to inbox" : "Archive notification"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(n.id)}
                        className="p-1 rounded hover:bg-zinc-100 text-zinc-300 hover:text-red-650 cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Preferences Settings console */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-4 w-4" /> Preferences Settings & Alert Queues
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 block">Email Notifications Queue</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Receive digest summaries of pending approvals</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefEmail} 
                  onChange={(e) => setPrefEmail(e.target.checked)}
                  className="rounded border-zinc-300 focus:ring-zinc-950 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                <div>
                  <span className="font-bold text-zinc-900 block">Browser Push Notifications</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Trigger immediate browser warnings on allocations</span>
                </div>
                <button 
                  onClick={enableBrowserAlerts}
                  className={`text-[10px] font-bold border rounded-lg px-2.5 py-1.5 cursor-pointer ${
                    prefBrowser 
                      ? "bg-zinc-100 text-zinc-600 border-zinc-250" 
                      : "bg-zinc-950 text-white border-zinc-900 hover:bg-zinc-900"
                  }`}
                >
                  {prefBrowser ? "Enabled" : "Authorize"}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                <div>
                  <span className="font-bold text-zinc-900 block">Auto Smart Reminders Engine</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Automatically triggers 24h/1h returns notifications</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefReminders} 
                  onChange={(e) => setPrefReminders(e.target.checked)}
                  className="rounded border-zinc-300 focus:ring-zinc-950 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
