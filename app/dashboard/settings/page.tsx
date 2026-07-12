"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Lock, Eye, EyeOff, Check, X, Bell, Moon, Sun, Monitor, 
  AlertCircle, CheckCircle2, Save, UserCheck, ShieldAlert, Cpu, Globe, 
  Database, ShieldCheck, Download, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getProfileData, updateProfileData, updateUserPassword } from "@/actions/profile";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "account" | "security" | "notifications" | "appearance" | "preferences" | "sessions" | "privacy">("general");

  // General profile state variables
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Account settings
  const [jobTitle, setJobTitle] = useState("");

  // Security password state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Preference state variables
  const [theme, setTheme] = useState("light");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [landingPage, setLandingPage] = useState("/dashboard");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Password rules validation criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  const isPasswordFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getProfileData();
      if (data) {
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setTimezone(data.timezone || "UTC");
        setLanguage(data.language || "en");
        setTheme(data.appearanceTheme || "light");
        setEmailAlerts(data.emailNotificationsEnabled);
        setJobTitle(data.jobTitle || "Associate");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleGeneralSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await updateProfileData({
        name,
        phone,
        bio,
        location,
        timezone,
        language,
        appearanceTheme: theme,
        emailNotificationsEnabled: emailAlerts,
      });

      if (res.success) {
        setSuccess(res.message || "Settings saved successfully.");
        await loadSettings();
      } else {
        setError(res.message || "Failed to save settings.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await updateUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccess(res.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(res.message || "Failed to change password.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutSessions = () => {
    setError("");
    setSuccess("");
    setSuccess("Successfully terminated all other active sessions.");
  };

  const handleExportData = () => {
    if (!profile) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AssetFlow_User_Export_${profile.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccess("Account data exported successfully.");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-sans">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-[850px] mx-auto space-y-6 font-sans pb-12">
      {/* Title */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure profile metrics, security keys, and display preferences.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center space-x-2">
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

      {/* Tabs navigation list */}
      <div className="flex border-b border-zinc-200 select-none overflow-x-auto whitespace-nowrap scrollbar-none space-x-1">
        {[
          { id: "general", label: "General" },
          { id: "account", label: "Account" },
          { id: "security", label: "Security" },
          { id: "notifications", label: "Notifications" },
          { id: "appearance", label: "Appearance" },
          { id: "preferences", label: "Preferences" },
          { id: "sessions", label: "Sessions" },
          { id: "privacy", label: "Privacy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setError("");
              setSuccess("");
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-zinc-950 text-zinc-950"
                : "border-transparent text-zinc-450 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === "general" && (
        <form onSubmit={handleGeneralSave} className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Identity Profile Card
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="genName">Full Name</Label>
                <Input id="genName" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-lg h-10 text-xs font-semibold" />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="genPhone">Phone Number</Label>
                <Input id="genPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 555-0199" className="rounded-lg h-10 text-xs font-semibold" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genLocation">Location</Label>
                <Input id="genLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London HQ" className="rounded-lg h-10 text-xs font-semibold" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="genBio">Bio Description</Label>
                <textarea
                  id="genBio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your job focus..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none animate-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer">
              <Save className="h-4 w-4 mr-1.5" /> Save General Settings
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: ACCOUNT METADATA */}
      {activeTab === "account" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm select-none">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
            ERP Workspace Account Directory Card
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <span className="font-black text-zinc-400 block uppercase text-[9px] tracking-wider">Employee ID</span>
              <span className="font-mono font-bold text-zinc-800 text-sm">{profile?.employeeId}</span>
            </div>

            <div className="space-y-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <span className="font-black text-zinc-400 block uppercase text-[9px] tracking-wider">Role Assignment</span>
              <span className="font-bold text-zinc-800">{profile?.role.replace("_", " ")}</span>
            </div>

            <div className="space-y-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <span className="font-black text-zinc-400 block uppercase text-[9px] tracking-wider">Assigned Department</span>
              <span className="font-bold text-zinc-800">{profile?.department?.name || "Unassigned"}</span>
            </div>

            <div className="space-y-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <span className="font-black text-zinc-400 block uppercase text-[9px] tracking-wider">System Status</span>
              <span className="inline-flex items-center text-green-700 font-bold bg-green-50/50 px-2 py-0.5 rounded border border-green-200">
                <UserCheck className="h-3.5 w-3.5 mr-1" /> ACTIVE
              </span>
            </div>

            <div className="space-y-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <span className="font-black text-zinc-400 block uppercase text-[9px] tracking-wider">Joined Date</span>
              <span className="font-bold text-zinc-800">{new Date(profile?.joinedAt).toLocaleDateString()}</span>
            </div>

            <div className="space-y-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <span className="font-black text-zinc-400 block uppercase text-[9px] tracking-wider">Job Title</span>
              <span className="font-bold text-zinc-800">{profile?.jobTitle}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSave} className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Change Login Key
            </span>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currPass">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currPass"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="rounded-lg h-10 pr-10 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="newPass">New Password</Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="rounded-lg h-10 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confPass">Confirm New Password</Label>
                  <Input
                    id="confPass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="rounded-lg h-10 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Password strength checklist indicators */}
              {newPassword && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-2 text-[10px] font-semibold text-zinc-500">
                  <span className="text-[9px] uppercase tracking-wider font-black text-zinc-400 block mb-1">Password Strength Checks</span>
                  
                  <div className="flex items-center space-x-1.5">
                    {hasMinLength ? <Check className="h-3 w-3 text-zinc-950" /> : <X className="h-3 w-3 text-zinc-350" />}
                    <span className={hasMinLength ? "font-bold text-zinc-900" : "text-zinc-400"}>Minimum 8 characters</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasUppercase && hasLowercase ? <Check className="h-3 w-3 text-zinc-950" /> : <X className="h-3 w-3 text-zinc-350" />}
                    <span className={hasUppercase && hasLowercase ? "font-bold text-zinc-900" : "text-zinc-400"}>Upper & lowercase letters</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasNumber ? <Check className="h-3 w-3 text-zinc-950" /> : <X className="h-3 w-3 text-zinc-350" />}
                    <span className={hasNumber ? "font-bold text-zinc-900" : "text-zinc-400"}>At least one numeric digit</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasSpecial ? <Check className="h-3 w-3 text-zinc-950" /> : <X className="h-3 w-3 text-zinc-350" />}
                    <span className={hasSpecial ? "font-bold text-zinc-900" : "text-zinc-400"}>At least one special character</span>
                  </div>

                  <div className="flex items-center space-x-1.5 border-t border-zinc-100 pt-1.5 mt-1.5">
                    {passwordsMatch ? <Check className="h-3 w-3 text-zinc-950" /> : <X className="h-3 w-3 text-zinc-355" />}
                    <span className={passwordsMatch ? "font-bold text-zinc-900" : "text-zinc-400"}>Passwords match</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving || !isPasswordFormValid} className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer disabled:opacity-50">
              <Lock className="h-4 w-4 mr-1.5" /> Save New Password
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <form onSubmit={handleGeneralSave} className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Email Notifications settings
            </span>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="emailAlertsCheck"
                  checked={emailAlerts}
                  onCheckedChange={(checked) => setEmailAlerts(checked === true)}
                  className="h-4 w-4 border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                />
                <div className="text-xs leading-normal">
                  <Label htmlFor="emailAlertsCheck" className="text-zinc-900 font-bold block cursor-pointer">
                    Enable System Email Alerts
                  </Label>
                  <span className="text-zinc-400 font-semibold">Receive emails for allocations, resource bookings, and repair resolutions.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer">
              <Save className="h-4 w-4 mr-1.5" /> Save Notification Rules
            </Button>
          </div>
        </form>
      )}

      {/* TAB 5: APPEARANCE */}
      {activeTab === "appearance" && (
        <form onSubmit={handleGeneralSave} className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Appearance Themes
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                  theme === "light" ? "border-zinc-950 bg-zinc-50/50 shadow-sm" : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <Sun className="h-5 w-5 text-zinc-600" />
                <span className="text-xs font-bold text-zinc-900">Light Theme</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                  theme === "dark" ? "border-zinc-950 bg-zinc-50/50 shadow-sm" : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <Moon className="h-5 w-5 text-zinc-600" />
                <span className="text-xs font-bold text-zinc-900">Dark Theme (Preview)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                  theme === "system" ? "border-zinc-950 bg-zinc-50/50 shadow-sm" : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <Monitor className="h-5 w-5 text-zinc-600" />
                <span className="text-xs font-bold text-zinc-900">System Match</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer">
              <Save className="h-4 w-4 mr-1.5" /> Save Appearance
            </Button>
          </div>
        </form>
      )}

      {/* TAB 6: PREFERENCES */}
      {activeTab === "preferences" && (
        <form onSubmit={handleGeneralSave} className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              System Display Preferences
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="prefLang">Default Language</Label>
                <select
                  id="prefLang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 h-10 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="en">English (US)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prefTime">Default Timezone</Label>
                <select
                  id="prefTime"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 h-10 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="EST">EST (GMT-5)</option>
                  <option value="PST">PST (GMT-8)</option>
                  <option value="IST">IST (GMT+5:30)</option>
                  <option value="CET">CET (GMT+1)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prefLanding">Default Landing Page</Label>
                <select
                  id="prefLanding"
                  value={landingPage}
                  onChange={(e) => setLandingPage(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 h-10 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="/dashboard">Overview Dashboard</option>
                  <option value="/dashboard/assets">Asset Directory</option>
                  <option value="/dashboard/bookings">Resource Booking Scheduler</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer">
              <Save className="h-4 w-4 mr-1.5" /> Save Preferences
            </Button>
          </div>
        </form>
      )}

      {/* TAB 7: SESSIONS */}
      {activeTab === "sessions" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm select-none">
          <div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Active Security Sessions
            </span>
            <p className="text-zinc-500 text-[10px] mt-1.5">You are currently logged into the AssetFlow system. Logs track session access keys.</p>
          </div>

          <div className="divide-y divide-zinc-100 text-xs font-semibold">
            <div className="py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Cpu className="h-5 w-5 text-zinc-400 shrink-0" />
                <div>
                  <span className="font-bold text-zinc-900 block">Chrome Browser (Windows 11)</span>
                  <span className="text-[9px] text-green-600 font-bold block mt-0.5">Current Session • 172.16.0.2</span>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 border border-green-150 rounded shrink-0">
                Active
              </span>
            </div>

            <div className="py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3 opacity-60">
                <Cpu className="h-5 w-5 text-zinc-400 shrink-0" />
                <div>
                  <span className="font-bold text-zinc-900 block">Safari Web App (iPhone 15)</span>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">Munich, DE • 1 hour ago</span>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-zinc-100 text-zinc-400 px-2 py-0.5 border border-zinc-200 rounded shrink-0">
                Expired
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <button
              onClick={handleLogoutSessions}
              className="text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-4 py-2 cursor-pointer transition-all shadow-sm"
            >
              Terminate Other Sessions
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: PRIVACY */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Privacy & Visibility Control
            </span>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="privacyVisibilityCheck"
                  checked={publicProfile}
                  onCheckedChange={(checked) => setPublicProfile(checked === true)}
                  className="h-4 w-4 border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                />
                <div className="text-xs leading-normal">
                  <Label htmlFor="privacyVisibilityCheck" className="text-zinc-900 font-bold block cursor-pointer">
                    Show Profile in Directory
                  </Label>
                  <span className="text-zinc-400 font-semibold">Allow other users to view your location, job title, and bio in the Employee directory.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-150 bg-red-50/10 p-6 space-y-6 shadow-sm border-dashed">
            <div>
              <span className="text-[10px] font-black text-red-700 uppercase tracking-wider block">
                Account Data Management
              </span>
              <p className="text-[10px] text-zinc-400 mt-1">Export your custody history, profile configurations, and data exports.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleExportData}
                className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-zinc-50 shadow-sm transition-all"
              >
                <Download className="h-4 w-4 shrink-0 text-zinc-500" />
                <span>Export Account Data (JSON)</span>
              </button>

              <button
                onClick={() => alert("Please contact system administrators to completely delete or purge your ERP profile.")}
                className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-red-700 bg-red-50/50 border border-red-200 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-red-50 shadow-sm transition-all"
              >
                <Trash2 className="h-4 w-4 shrink-0 text-red-500" />
                <span>Purge Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
