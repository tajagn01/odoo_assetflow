"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckSquare, BellOff, Info, Clock, AlertTriangle, ShieldCheck, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/features/notifications/actions/notificationActions";

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    try {
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-[760px] mx-auto space-y-6 font-sans pb-12">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Notification Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit active approvals, resource bookings, and system actions.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            className="mt-3 sm:mt-0 flex items-center border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs py-2 px-4 cursor-pointer shadow-sm"
          >
            <CheckSquare className="h-4 w-4 mr-2" /> Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-3 select-none">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-zinc-200 bg-white rounded-2xl p-8 text-center space-y-3">
            <BellOff className="h-10 w-10 text-zinc-300" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">No alerts active</span>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              All clear! You don't have any unread system alerts, allocation approvals, or schedule reminders.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            // Pick icon based on type
            const categoryColors = n.isRead ? "bg-zinc-100 text-zinc-500" : "bg-zinc-950 text-white";
            
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`p-4 rounded-xl border flex gap-4 transition-all ${
                  n.isRead
                    ? "border-zinc-200 bg-white hover:bg-zinc-50/50"
                    : "border-zinc-300 bg-zinc-50/20 hover:bg-zinc-50 cursor-pointer shadow-sm"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors}`}>
                  <Bell className="h-4 w-4" />
                </div>

                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${n.isRead ? "text-zinc-600" : "text-zinc-950"}`}>
                      {n.title}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-semibold flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className={`leading-relaxed ${n.isRead ? "text-zinc-500" : "text-zinc-700 font-medium"}`}>
                    {n.message}
                  </p>

                  {!n.isRead && (
                    <span className="text-[9px] font-black text-zinc-950 uppercase tracking-widest block pt-1 hover:underline">
                      ✓ Mark as read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
