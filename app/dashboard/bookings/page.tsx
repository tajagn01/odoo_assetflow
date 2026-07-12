"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Calendar, Clock, Plus, Trash2, ShieldAlert, Check, 
  ChevronLeft, ChevronRight, RefreshCw, Search, Filter, 
  Edit3, Copy, X, User, ArrowRight, Settings, Info, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getBookings, getAllBookings, createBooking, 
  updateBooking, cancelBooking, duplicateBooking, getBookingDetails 
} from "@/actions/bookings";
import { getAssets } from "@/actions/assets";
import { getEmployees } from "@/actions/org";
import { BookingStatus } from "@prisma/client";

type CalendarView = "day" | "week" | "month" | "timeline" | "agenda";

export default function BookingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";

  // Data lists
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Layout View State
  const [currentView, setCurrentView] = useState<CalendarView>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  
  // Modals trigger
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Form Fields State
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [department, setDepartment] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load Initial Resources & Colleagues
  const initPageData = async () => {
    setLoading(true);
    try {
      const [assets, emps] = await Promise.all([getAssets(), getEmployees()]);
      const bookables = assets.filter((a) => a.isSharedResource && a.status !== "RETIRED");
      setResources(bookables);
      setEmployees(emps || []);
      if (bookables.length > 0) {
        setSelectedResourceId(bookables[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initPageData();
  }, []);

  // Fetch Bookings for Selected Resource
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

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await createBooking({
        assetId: selectedResourceId,
        startTime,
        endTime,
        purpose,
        notes,
        attendees,
        priority,
        department,
      });

      if (res.success) {
        setSuccess(res.message || "Booking reserved.");
        setShowAddModal(false);
        resetForm();
        await loadBookings();
      } else {
        setError(res.message || "Overlap or validation failed.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await updateBooking(selectedBooking.id, {
        startTime,
        endTime,
        purpose,
        notes,
        attendees,
        priority,
        department,
      });

      if (res.success) {
        setSuccess("Booking updated successfully.");
        setShowDetailsModal(false);
        await loadBookings();
      } else {
        setError(res.message || "Rescheduling failed.");
      }
    } catch (err: any) {
      setError(err.message || "Could not reschedule booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    setError("");
    try {
      const res = await cancelBooking(id);
      if (res.success) {
        setSuccess("Booking cancelled.");
        setShowDetailsModal(false);
        await loadBookings();
      } else {
        setError(res.message || "Failed to cancel.");
      }
    } catch (err) {
      setError("Cancellation request error.");
    }
  };

  const handleDuplicate = async (id: string) => {
    setError("");
    try {
      const res = await duplicateBooking(id, {
        startTime,
        endTime
      });
      if (res.success) {
        setSuccess("Booking duplicated successfully to new slot.");
        setShowDetailsModal(false);
        await loadBookings();
      } else {
        setError(res.message || "Duplicate overlap detected.");
      }
    } catch (err) {
      setError("Duplication operation failed.");
    }
  };

  const handleExtend = async (mins: number) => {
    if (!selectedBooking) return;
    const currentEnd = new Date(endTime);
    const newEnd = new Date(currentEnd.getTime() + mins * 60 * 1000);
    setEndTime(newEnd.toISOString().slice(0, 16));
  };

  const resetForm = () => {
    setStartTime("");
    setEndTime("");
    setPurpose("");
    setNotes("");
    setAttendees("");
    setPriority("MEDIUM");
    setDepartment("");
  };

  const openAddSlot = (startStr: string, endStr: string) => {
    resetForm();
    setStartTime(startStr);
    setEndTime(endStr);
    setShowAddModal(true);
  };

  const openDetails = (booking: any) => {
    setSelectedBooking(booking);
    setStartTime(new Date(booking.startTime).toISOString().slice(0, 16));
    setEndTime(new Date(booking.endTime).toISOString().slice(0, 16));
    setPurpose(booking.purpose || "");
    setNotes(booking.notes || "");
    setAttendees(booking.attendees || "");
    setPriority(booking.priority || "MEDIUM");
    setDepartment(booking.department || "");
    setShowDetailsModal(true);
  };

  // Switch Calendar dates
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (currentView === "day") d.setDate(d.getDate() - 1);
    else if (currentView === "week") d.setDate(d.getDate() - 7);
    else if (currentView === "month") d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    if (currentView === "day") d.setDate(d.getDate() + 1);
    else if (currentView === "week") d.setDate(d.getDate() + 7);
    else if (currentView === "month") d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  // Hour list from 08:00 to 18:00 (working hours)
  const hourSlots = Array.from({ length: 11 }, (_, i) => 8 + i);

  // Helper date lists
  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const startOfWeek = new Date(current.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // Sunday=0, Monday=1
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Align to Monday
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - offset);

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const activeResource = resources.find((r) => r.id === selectedResourceId);

  // Renders bookings positioned in weekly scheduler columns
  const getBookingForWeekCell = (day: Date, hr: number) => {
    const cellStart = new Date(day);
    cellStart.setHours(hr, 0, 0, 0);
    const cellEnd = new Date(day);
    cellEnd.setHours(hr + 1, 0, 0, 0);

    return bookings.find((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < cellEnd && bEnd > cellStart;
    });
  };

  // Filter Bookings by searches & states
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesPriority = !priorityFilter || b.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="border-b border-zinc-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Enterprise Resource Scheduler</h1>
          <p className="text-sm text-zinc-500 mt-1">Book shared facilities, meeting rooms, vehicles, and hardware vaults with automatic conflict checks.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          disabled={activeResource?.status !== "AVAILABLE"}
          className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer font-bold flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="h-4 w-4" /> Book Now
        </Button>
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
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-400 max-w-lg mx-auto shadow-xs">
          <Calendar className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <h2 className="text-sm font-bold text-zinc-900">No bookable resources configured.</h2>
          <p className="text-xs text-zinc-500 mt-1">Expose assets as "Shared Resource" to display them in this calendar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters & Resource list Panel */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Resource dropdown selector */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
              <div>
                <Label htmlFor="resourceSelect" className="text-[10px] uppercase font-bold text-zinc-400">Shared Resource</Label>
                <select
                  id="resourceSelect"
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 cursor-pointer mt-1"
                >
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      [{res.tag}] {res.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeResource && (
                <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-450">Location:</span>
                    <span className="font-semibold text-zinc-800">{activeResource.location || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-450">Condition:</span>
                    <span className="font-semibold text-zinc-800">{activeResource.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-450">Asset Status:</span>
                    <span className="font-semibold text-zinc-800">{activeResource.status}</span>
                  </div>
                  {activeResource.status !== "AVAILABLE" && (
                    <div className="text-red-600 font-bold mt-1 text-[9px] uppercase flex items-center bg-red-50 p-1.5 rounded border border-red-100">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1 shrink-0" />
                      Maintenance / Allocated (Blocked)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calendar Search & Filter Panel */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filter Calendar
              </h3>

              <div className="space-y-1">
                <Label htmlFor="search">Search Purpose/Id</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-450" />
                  <Input 
                    id="search"
                    placeholder="e.g. Client Demo"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="statusF">Booking Status</Label>
                <select
                  id="statusF"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="priorityF">Priority</Label>
                <select
                  id="priorityF"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

          </div>

          {/* Right Main Calendar Section */}
          <div className="lg:col-span-3 space-y-4">

            {/* Calendar Toolbar Control Bar */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
              
              {/* Toolbar prev/next switcher */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrevDate}
                  className="h-8 w-8 flex items-center justify-center border border-zinc-200 hover:bg-zinc-50 rounded-lg cursor-pointer text-zinc-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-black text-zinc-900 min-w-[120px] text-center uppercase tracking-wider">
                  {currentView === "month" 
                    ? selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : currentView === "week"
                    ? `Week of ${getWeekDates(selectedDate)[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  }
                </span>
                <button 
                  onClick={handleNextDate}
                  className="h-8 w-8 flex items-center justify-center border border-zinc-200 hover:bg-zinc-50 rounded-lg cursor-pointer text-zinc-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* View Selector Buttons */}
              <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[10px] font-bold uppercase select-none">
                {(["day", "week", "month", "timeline", "agenda"] as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCurrentView(v)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      currentView === v 
                        ? "bg-white text-zinc-950 shadow-xs font-black" 
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

            </div>

            {/* CALENDAR VIEWPORTS CONTAINER */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden min-h-[500px]">
              
              {/* Loader Overlay */}
              {listLoading && (
                <div className="p-3 bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-center text-zinc-500 flex items-center justify-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin text-zinc-450" /> Syncing schedule...
                </div>
              )}

              {/* DAY VIEWPORT */}
              {currentView === "day" && (
                <div className="divide-y divide-zinc-150">
                  {hourSlots.map((hr) => {
                    const booking = getBookingForWeekCell(selectedDate, hr);
                    const formattedHr = `${hr.toString().padStart(2, "0")}:00`;
                    
                    return (
                      <div key={hr} className="grid grid-cols-10 min-h-[60px] text-xs">
                        <div className="col-span-2 p-3 border-r border-zinc-150 bg-zinc-50/50 font-bold text-zinc-400 select-none text-right">
                          {formattedHr}
                        </div>
                        <div className="col-span-8 p-1 relative flex items-center">
                          {booking ? (
                            <div 
                              onClick={() => openDetails(booking)}
                              className={`w-full p-2 rounded-lg border text-left cursor-pointer transition-all select-none hover:brightness-95 ${
                                booking.status === "CANCELLED" 
                                  ? "bg-red-50/80 border-red-200 text-red-800" 
                                  : "bg-indigo-50/80 border-indigo-200 text-indigo-800"
                              }`}
                            >
                              <span className="font-bold block truncate">{booking.purpose || "No Purpose Details"}</span>
                              <span className="text-[10px] text-zinc-450 block truncate font-medium mt-0.5">Reserved by: {booking.user?.name} · {booking.priority} Priority</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const startStr = new Date(selectedDate.setHours(hr, 0, 0, 0)).toISOString().slice(0, 16);
                                const endStr = new Date(selectedDate.setHours(hr + 1, 0, 0, 0)).toISOString().slice(0, 16);
                                openAddSlot(startStr, endStr);
                              }}
                              disabled={activeResource?.status !== "AVAILABLE"}
                              className="w-full h-full text-left text-zinc-350 hover:bg-zinc-50/85 pl-4 flex items-center italic cursor-pointer"
                            >
                              + Click slot to reserve
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* WEEK VIEWPORT */}
              {currentView === "week" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/50 border-b border-zinc-200 text-[10px] font-black uppercase text-zinc-400 select-none">
                        <th className="p-3 text-right border-r border-zinc-150 w-20">Time</th>
                        {getWeekDates(selectedDate).map((day, idx) => (
                          <th key={idx} className="p-3 text-center border-r border-zinc-150 min-w-[110px]">
                            <div>{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                            <div className="text-zinc-950 font-black text-xs mt-0.5">{day.getDate()}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {hourSlots.map((hr) => (
                        <tr key={hr} className="h-[60px] text-xs">
                          <td className="p-3 text-right font-bold text-zinc-400 border-r border-zinc-150 bg-zinc-50/50 select-none">
                            {hr.toString().padStart(2, "0")}:00
                          </td>
                          {getWeekDates(selectedDate).map((day, dIdx) => {
                            const booking = getBookingForWeekCell(day, hr);
                            return (
                              <td key={dIdx} className="p-1 border-r border-zinc-150 relative">
                                {booking ? (
                                  <div
                                    onClick={() => openDetails(booking)}
                                    className={`p-1.5 rounded-lg border h-full text-left cursor-pointer select-none overflow-hidden hover:brightness-95 ${
                                      booking.status === "CANCELLED"
                                        ? "bg-red-50/85 border-red-200 text-red-800"
                                        : "bg-indigo-50/85 border-indigo-200 text-indigo-800"
                                    }`}
                                  >
                                    <span className="font-bold block truncate leading-none">{booking.purpose || "Demo Reservation"}</span>
                                    <span className="text-[9px] text-zinc-450 block truncate font-medium mt-1">By: {booking.user?.name}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const startStr = new Date(day.setHours(hr, 0, 0, 0)).toISOString().slice(0, 16);
                                      const endStr = new Date(day.setHours(hr + 1, 0, 0, 0)).toISOString().slice(0, 16);
                                      openAddSlot(startStr, endStr);
                                    }}
                                    disabled={activeResource?.status !== "AVAILABLE"}
                                    className="w-full h-full absolute inset-0 hover:bg-zinc-50/80 cursor-pointer"
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MONTH VIEWPORT */}
              {currentView === "month" && (
                <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200">
                  {/* Month header days */}
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                    <div key={i} className="p-3 text-center text-[10px] font-black text-zinc-400 uppercase select-none bg-zinc-50/50">
                      {d}
                    </div>
                  ))}
                  {/* Month Cells */}
                  {getMonthDates(selectedDate).map((day, idx) => {
                    const formattedDate = day.getDate();
                    const dayBookings = bookings.filter((b) => {
                      const bDate = new Date(b.startTime);
                      return bDate.getFullYear() === day.getFullYear() &&
                             bDate.getMonth() === day.getMonth() &&
                             bDate.getDate() === day.getDate();
                    });

                    return (
                      <div key={idx} className="min-h-[90px] p-2 space-y-1 text-xs flex flex-col justify-between border-b border-zinc-150">
                        <span className={`font-bold select-none text-zinc-500 block ${
                          day.getMonth() !== selectedDate.getMonth() ? "opacity-30" : ""
                        }`}>
                          {formattedDate}
                        </span>
                        
                        <div className="space-y-1 flex-1 overflow-y-auto max-h-[60px] scrollbar-none">
                          {dayBookings.slice(0, 3).map((b) => (
                            <div
                              key={b.id}
                              onClick={() => openDetails(b)}
                              className={`p-1 rounded text-[9px] border truncate cursor-pointer font-bold leading-none ${
                                b.status === "CANCELLED"
                                  ? "bg-red-50 border-red-150 text-red-700"
                                  : "bg-indigo-50 border-indigo-150 text-indigo-700"
                              }`}
                            >
                              {b.purpose || "Booking"}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <span className="text-[8px] font-black text-zinc-400 block pl-1">+{dayBookings.length - 3} More</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TIMELINE VIEWPORT */}
              {currentView === "timeline" && (
                <div className="overflow-x-auto divide-y divide-zinc-200">
                  {/* Timeline Header slots */}
                  <div className="grid grid-cols-12 bg-zinc-50/50 border-b border-zinc-200 text-[10px] font-black text-zinc-400 uppercase select-none">
                    <div className="col-span-2 p-3 border-r border-zinc-150">Resource</div>
                    {hourSlots.slice(0, 10).map((h) => (
                      <div key={h} className="p-3 text-center border-r border-zinc-150">
                        {h.toString().padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>

                  {resources.map((res) => (
                    <div key={res.id} className="grid grid-cols-12 text-xs min-h-[50px] items-center">
                      <div className="col-span-2 p-3 font-bold text-zinc-950 border-r border-zinc-150 truncate">
                        {res.name}
                      </div>
                      {hourSlots.slice(0, 10).map((h) => {
                        const cellStart = new Date(selectedDate);
                        cellStart.setHours(h, 0, 0, 0);
                        const cellEnd = new Date(selectedDate);
                        cellEnd.setHours(h + 1, 0, 0, 0);
                        
                        // Check if this resource has a booking here
                        const timelineBooking = bookings.find((b) => {
                          return b.assetId === res.id && 
                                 new Date(b.startTime) < cellEnd && 
                                 new Date(b.endTime) > cellStart;
                        });

                        return (
                          <div key={h} className="p-1 border-r border-zinc-150 h-full relative flex items-center">
                            {timelineBooking ? (
                              <div 
                                onClick={() => openDetails(timelineBooking)}
                                className="w-full h-full rounded border bg-indigo-50/80 border-indigo-200 text-[10px] font-bold text-indigo-800 text-center truncate flex items-center justify-center cursor-pointer hover:brightness-95"
                              >
                                Booked
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const startStr = new Date(selectedDate.setHours(h, 0, 0, 0)).toISOString().slice(0, 16);
                                  const endStr = new Date(selectedDate.setHours(h + 1, 0, 0, 0)).toISOString().slice(0, 16);
                                  setSelectedResourceId(res.id);
                                  openAddSlot(startStr, endStr);
                                }}
                                disabled={res.status !== "AVAILABLE"}
                                className="w-full h-full absolute inset-0 hover:bg-zinc-50/50 cursor-pointer"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* AGENDA VIEWPORT */}
              {currentView === "agenda" && (
                <div className="divide-y divide-zinc-200">
                  {filteredBookings.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 italic">No bookings match the current filter query.</div>
                  ) : (
                    filteredBookings.map((b) => (
                      <div 
                        key={b.id} 
                        onClick={() => openDetails(b)}
                        className="p-5 flex justify-between items-center hover:bg-zinc-50/50 cursor-pointer text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-zinc-950 text-sm">{b.purpose || "Resource Booking"}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${
                              b.priority === "HIGH" 
                                ? "bg-red-50 text-red-700 border-red-100" 
                                : b.priority === "LOW"
                                ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                              {b.priority}
                            </span>
                          </div>
                          <div className="text-zinc-500 font-medium">
                            Time: {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Resource: <span className="font-bold text-zinc-700">{b.asset?.name}</span> · Reserved by: <span className="font-bold text-zinc-700">{b.user?.name}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            b.status === "COMPLETED" 
                              ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                              : b.status === "CANCELLED"
                              ? "bg-red-50 text-red-750 border-red-150"
                              : "bg-indigo-50 text-indigo-750 border-indigo-150"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* MODAL: CREATE BOOKING */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 p-6 space-y-4 shadow-xl text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-black text-zinc-950 uppercase flex items-center gap-1">
                <Plus className="h-4 w-4" /> Reserve Slot
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              
              <div className="space-y-1">
                <Label htmlFor="purpose">Purpose / Reservation Title</Label>
                <Input 
                  id="purpose" 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)} 
                  placeholder="e.g. Weekly Standup, Client Review Meeting" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="start">Start Time</Label>
                  <Input 
                    id="start" 
                    type="datetime-local" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end">End Time</Label>
                  <Input 
                    id="end" 
                    type="datetime-local" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dept">Department Context</Label>
                  <select
                    id="dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none"
                  >
                    <option value="">No Department Context</option>
                    {employees.map((emp) => emp.department).filter((v, i, self) => v && self.indexOf(v) === i).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="attend">Attendees (comma-separated list)</Label>
                <Input 
                  id="attend" 
                  value={attendees} 
                  onChange={(e) => setAttendees(e.target.value)} 
                  placeholder="e.g. john@company.com, sarah@company.com" 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes">Special Requirements / Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Require projector setup, whiteboard markers, additional seat layouts..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                  disabled={submitting}
                >
                  Create Booking
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs"
                >
                  Cancel
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOKING DETAILS, RESCHEDULE & ACTIONS */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 p-6 space-y-4 shadow-xl text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-black text-zinc-950 uppercase">Booking Details Log</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Read-only summaries */}
            <div className="space-y-2 p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl leading-normal text-zinc-700">
              <div className="flex justify-between">
                <span className="font-bold text-zinc-400">Booking ID:</span>
                <span className="font-mono text-zinc-900 truncate max-w-[200px]">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-zinc-400">Created By:</span>
                <span className="font-bold text-zinc-900">{selectedBooking.user?.name || "System User"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-zinc-400">Resource:</span>
                <span className="font-bold text-zinc-900">{selectedBooking.asset?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-zinc-400">Initial Status:</span>
                <span className="font-bold text-zinc-900 uppercase">{selectedBooking.status}</span>
              </div>
            </div>

            {/* Action forms for edit */}
            <form onSubmit={handleUpdate} className="space-y-4">
              
              <div className="space-y-1">
                <Label htmlFor="uPurpose">Reservation Purpose</Label>
                <Input 
                  id="uPurpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="uStart">Start Time</Label>
                  <Input 
                    id="uStart"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="uEnd">End Time</Label>
                  <Input 
                    id="uEnd"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={() => handleExtend(30)} 
                  className="flex-1 border border-zinc-200 hover:bg-zinc-50 text-[10px] text-zinc-800"
                >
                  +30 Mins (Extend)
                </Button>
                <Button 
                  type="button" 
                  onClick={() => handleExtend(-30)} 
                  className="flex-1 border border-zinc-200 hover:bg-zinc-50 text-[10px] text-zinc-800"
                >
                  -30 Mins (Shorten)
                </Button>
              </div>

              <div className="space-y-1">
                <Label htmlFor="uNotes">Special Notes</Label>
                <textarea
                  id="uNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 focus:outline-none"
                />
              </div>

              {/* Duplicate slot picker option */}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  onClick={() => handleDuplicate(selectedBooking.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold"
                >
                  Duplicate Booking
                </Button>

                {selectedBooking.status !== "CANCELLED" && (
                  <Button
                    type="button"
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold"
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>

              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs"
                  disabled={submitting}
                >
                  Save Reschedule Updates
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDetailsModal(false)}
                  className="border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs"
                >
                  Close details
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
