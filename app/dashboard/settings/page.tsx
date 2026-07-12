"use client";

import React, { useState, useEffect } from "react";
import { Settings, Lock, Eye, EyeOff, Check, X, Bell, Moon, Sun, Monitor, AlertCircle, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getProfileData, updateProfileData, updateUserPassword } from "@/actions/profile";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "appearance" | "notifications" | "preferences">("general");

  // General profile state variables
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Security password state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Preference state variables
  const [theme, setTheme] = useState("light");
  const [emailAlerts, setEmailAlerts] = useState(true);

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
        setSuccess(res.message || "General settings saved.");
        await loadSettings();
      } else {
        setError(res.message || "Failed to update configurations.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordFormValid) {
      setError("Please satisfy all password safety criteria.");
      return;
    }

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
      <div className="flex border-b border-zinc-200 select-none">
        <button
          onClick={() => {
            setActiveTab("general");
            setError("");
            setSuccess("");
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "general" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          General
        </button>
        <button
          onClick={() => {
            setActiveTab("security");
            setError("");
            setSuccess("");
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "security" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Security
        </button>
        <button
          onClick={() => {
            setActiveTab("appearance");
            setError("");
            setSuccess("");
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "appearance" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Appearance
        </button>
        <button
          onClick={() => {
            setActiveTab("notifications");
            setError("");
            setSuccess("");
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "notifications" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Notifications
        </button>
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
                <Input id="genName" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-lg h-10" />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="genPhone">Phone Number</Label>
                <Input id="genPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0199" className="rounded-lg h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genEmail">Work Email Address</Label>
                <Input id="genEmail" value={profile.email} disabled className="bg-zinc-50 rounded-lg text-zinc-500 h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genId">Employee ID (System Generated)</Label>
                <Input id="genId" value={profile.employeeId} disabled className="bg-zinc-50 font-mono rounded-lg text-zinc-500 h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genRole">User Role (Read Only)</Label>
                <Input id="genRole" value={profile.role.replace("_", " ")} disabled className="bg-zinc-50 rounded-lg text-zinc-500 h-10" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genDept">Department (Read Only)</Label>
                <Input id="genDept" value={profile.department?.name || "Unassigned"} disabled className="bg-zinc-50 rounded-lg text-zinc-500 h-10" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="genBio">Profile Bio</Label>
                <textarea
                  id="genBio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your team duties..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer">
              <Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSave} className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
              Update Security Password
            </span>

            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="secCurrent">Current Login Password</Label>
                <Input
                  id="secCurrent"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="rounded-lg h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="secNew">New Secure Password</Label>
                <Input
                  id="secNew"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  icon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  className="rounded-lg h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="secConfirm">Confirm New Password</Label>
                <Input
                  id="secConfirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="rounded-lg h-10"
                />
              </div>

              {/* Password strength guide */}
              {newPassword && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[10px] space-y-1.5">
                  <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Security Matrix</span>
                  
                  <div className="flex items-center space-x-1.5">
                    {hasMinLength ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasMinLength ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least 8 characters</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasUppercase && hasLowercase ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasUppercase && hasLowercase ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>Upper & lowercase letters</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasNumber ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasNumber ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least one numeric digit</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasSpecial ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={hasSpecial ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>At least one special character</span>
                  </div>

                  <div className="flex items-center space-x-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-1.5 mt-1.5">
                    {passwordsMatch ? <Check className="h-3 w-3 text-zinc-950 dark:text-white" /> : <X className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />}
                    <span className={passwordsMatch ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>Passwords match</span>
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

      {/* TAB 3: APPEARANCE */}
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

    </div>
  );
}
