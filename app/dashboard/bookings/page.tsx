"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Plus, Trash2, ShieldAlert, Check, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookings, createBooking, cancelBooking } from "@/actions/bookings";
import { getAssets } from "@/actions/assets";

export default function BookingsPage() {
  const { data: session } = useSession();

  // Resource lists
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Booking Form States
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  // Weekly grid navigation offset
  const [weekOffset, setWeekOffset] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load Bookable Shared Resources
  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      try {
        const assets = await getAssets();
        // Filter shared resources
        const bookables = assets.filter((a) => a.isSharedResource && a.status !== "RETIRED");
        setResources(bookables);
        if (bookables.length > 0) {
          setSelectedResourceId(bookables[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, []);

  // Load bookings for selected resource
  const loadBookings = async () => {
    if (!selectedResourceId) return;
    setListLoading(true);
    try {
      const data = await getBookings(selectedResourceId);
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [selectedResourceId]);

  const handleBook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await createBooking({
        assetId: selectedResourceId,
        startTime,
        endTime,
      });

      if (res.success) {
        setSuccess(res.message || "Booking confirmed.");
        setStartTime("");
        setEndTime("");
        await loadBookings();
      } else {
        setError(res.message || "Failed to confirm booking.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await cancelBooking(bookingId);
      if (res.success) {
        setSuccess("Booking cancelled.");
        await loadBookings();
      } else {
        setError(res.message || "Failed to cancel booking.");
      }
    } catch (err) {
      setError("Failed to cancel.");
    }
  };

  // Helper: compute current week dates
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });

  const hourSlots = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const getBookingForSlot = (day: Date, hour: number) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return bookings.find((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  // Pre-fill time fields when clicking an empty cell
  const handleCellClick = (day: Date, hour: number) => {
    const formatDateTimeLocal = (date: Date, hr: number) => {
      const d = new Date(date);
      d.setHours(hr, 0, 0, 0);
      // adjust for local timezone offset
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60 * 1000);
      return local.toISOString().slice(0, 16);
    };

    setStartTime(formatDateTimeLocal(day, hour));
    setEndTime(formatDateTimeLocal(day, hour + 1));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  const activeResource = resources.find((r) => r.id === selectedResourceId);

  return (
    <div className="space-y-6 font-sans select-none">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Resource Scheduler</h1>
        <p className="text-sm text-zinc-500 mt-1">Book shared facilities, meeting rooms, vehicles, and specialized machinery.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950 flex items-center space-x-2">
          <Check className="h-4 w-4 shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-400 max-w-lg mx-auto mt-12 shadow-sm">
          <Calendar className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <h2 className="text-sm font-bold text-zinc-900">No bookable resources configured.</h2>
          <p className="text-xs text-zinc-500 mt-1">Mark assets as "Shared Resource" during registration to expose them for scheduling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left panel: Form and resource selector */}
          <div className="space-y-6 h-fit lg:col-span-1">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-950 mb-4">Select Shared Resource</h2>
              <div className="space-y-1">
                <Label htmlFor="resource">Available Resources</Label>
                <select
                  id="resource"
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer"
                >
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      [{res.tag}] {res.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeResource && (
                <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1">
                  <div><span className="font-semibold text-zinc-700">Location:</span> {activeResource.location}</div>
                  <div><span className="font-semibold text-zinc-700">Status:</span> {activeResource.status}</div>
                  {activeResource.status !== "AVAILABLE" && (
                    <div className="text-red-600 font-bold mt-1 text-[10px] uppercase flex items-center">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1 inline shrink-0" />
                      Unavailable for booking
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-950 mb-4">Reserve Time Slot</h2>
              <form onSubmit={handleBook} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="start">Start Time</Label>
                  <input
                    id="start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="end">End Time</Label>
                  <input
                    id="end"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-zinc-900"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2.5 disabled:opacity-40 cursor-pointer"
                  disabled={submitting || (activeResource && activeResource.status !== "AVAILABLE")}
                >
                  {submitting
                    ? "Booking..."
                    : activeResource && activeResource.status !== "AVAILABLE"
                    ? "Resource Unavailable"
                    : "Confirm Schedule"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right panel: Active Bookings calendar grid */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Week navigation control header */}
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="h-8 px-3 flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer"
                  >
                    Today
                  </button>
                )}
              </div>

              <span className="text-xs font-bold text-zinc-900 uppercase tracking-tight">
                Week: {weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" })} – {weekDays[6].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </span>

              <button
                onClick={loadBookings}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 cursor-pointer"
                title="Refresh Calendar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Interactive Grid Board */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
              {listLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                </div>
              ) : (
                <table className="w-full border-collapse min-w-[700px]">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-black text-zinc-500 uppercase tracking-wider w-20 border-r border-zinc-200 font-sans">Time</th>
                      {weekDays.map((day, idx) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        return (
                          <th key={idx} className={`px-4 py-3 text-center border-r border-zinc-200 last:border-r-0 ${isToday ? "bg-zinc-100/55 font-black text-zinc-950" : ""}`}>
                            <span className="text-xs font-black text-zinc-950 block">
                              {day.toLocaleDateString([], { weekday: "short" })}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                              {day.toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-xs">
                    {hourSlots.map((hour) => (
                      <tr key={hour} className="hover:bg-zinc-50/20">
                        <td className="px-3 py-4 text-center font-mono font-bold text-zinc-400 border-r border-zinc-200 bg-zinc-50/30">
                          {hour}:00
                        </td>
                        {weekDays.map((day, idx) => {
                          const booking = getBookingForSlot(day, hour);
                          const isOwner = booking && booking.userId === session?.user?.id;
                          const isPowerUser = ["ADMIN", "ASSET_MANAGER"].includes(session?.user?.role || "");

                          return (
                            <td
                              key={idx}
                              onClick={() => !booking && handleCellClick(day, hour)}
                              className={`p-1.5 border-r border-zinc-200 last:border-r-0 h-16 vertical-top relative ${
                                !booking ? "cursor-pointer hover:bg-zinc-50/50" : ""
                              }`}
                            >
                              {booking ? (
                                <div className={`h-full w-full rounded-lg p-2 flex flex-col justify-between transition-all border ${
                                  isOwner
                                    ? "bg-zinc-950 text-white border-transparent shadow-sm"
                                    : "bg-zinc-100 text-zinc-800 border-zinc-200"
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <span className="font-bold text-[10px] truncate max-w-[80px]">
                                      {booking.user.name}
                                    </span>
                                    {(isOwner || isPowerUser) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancel(booking.id);
                                        }}
                                        className={`rounded hover:bg-zinc-200/20 p-0.5 cursor-pointer ${
                                          isOwner ? "text-zinc-300 hover:text-white" : "text-zinc-400 hover:text-red-500"
                                        }`}
                                        title="Cancel booking"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <span className={`text-[8px] font-semibold leading-none ${isOwner ? "text-zinc-400" : "text-zinc-500"}`}>
                                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-300 font-black opacity-0 hover:opacity-100 transition-opacity">
                                  + Reserve
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
