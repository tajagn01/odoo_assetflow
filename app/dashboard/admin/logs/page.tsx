"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, Search, FileSpreadsheet, ArrowLeftRight, Clock, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActivityLogs } from "@/actions/logs";
import { exportToCSV } from "@/utils/csv";

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs({
        search,
        action: actionFilter || undefined,
      });
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadLogs();
    }
  }, [session, search, actionFilter]);

  const handleExport = () => {
    const formatted = logs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Action: log.action,
      Actor: log.user?.name || "System",
      ActorEmail: log.user?.email || "",
      EntityType: log.entityType,
      EntityID: log.entityId,
    }));
    exportToCSV(formatted, "System_Audit_Logs");
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-zinc-200 bg-white rounded-2xl p-8 text-center space-y-4 shadow-sm select-none font-sans">
        <Shield className="h-12 w-12 text-zinc-400" />
        <h2 className="text-lg font-black text-zinc-950 uppercase tracking-tight">Access Denied</h2>
        <p className="text-xs text-zinc-500 max-w-sm">
          You do not have administrative privileges to view raw system audit ledgers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Activity Logs</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit organizational activity logs and system configuration changes.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs py-2 px-4 cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" /> Export Audit Log
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by action, actor, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border border-zinc-200 rounded-lg h-10 text-xs"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 h-10 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950"
        >
          <option value="">All Actions Types</option>
          <option value="CREATE_ASSET">Create Asset</option>
          <option value="ALLOCATE_ASSET">Allocate Asset</option>
          <option value="RETURN_ASSET">Return Asset</option>
          <option value="CREATE_BOOKING">Create Booking</option>
          <option value="RAISE_MAINTENANCE">Raise Repair</option>
          <option value="UPDATE_PROFILE">Update Profile</option>
          <option value="RESET_PASSWORD">Reset Password</option>
          <option value="PROMOTE_USER">Promote Headcount</option>
        </select>
      </div>

      {/* Table grid */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs italic">
            No activity log events matching criteria found.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 font-black text-zinc-500 uppercase">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor Details</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Entity reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/20">
                  <td className="px-6 py-4 text-zinc-500 font-mono flex items-center space-x-2">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-zinc-600" />
                      </div>
                      <div>
                        <span className="font-bold text-zinc-950 block">{log.user?.name || "System"}</span>
                        <span className="text-[10px] text-zinc-400 block">{log.user?.email || "internal_event"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {log.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-mono">
                    <span className="font-semibold text-zinc-500">{log.entityType}</span>: {log.entityId.slice(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
