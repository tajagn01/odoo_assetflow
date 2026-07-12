"use client";

import React, { useState, useEffect, startTransition } from "react";
import { User, Phone, MapPin, Globe, Clock, Shield, Calendar, Mail, FileText, CheckCircle, AlertCircle, Edit2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfileData, updateProfileData } from "@/actions/profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
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
        setAvatarUrl(data.avatarUrl || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Profile image must be less than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
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
        avatarUrl,
      });

      if (res.success) {
        setSuccess(res.message || "Profile updated successfully.");
        setIsEditing(false);
        await loadProfile();
      } else {
        setError(res.message || "Failed to update profile.");
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

  if (!profile) {
    return (
      <div className="text-center py-12 font-sans text-zinc-500">
        Profile data could not be loaded. Please ensure you are logged in.
      </div>
    );
  }

  return (
    <div className="max-w-[850px] mx-auto space-y-8 font-sans pb-12">
      {/* Title */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">My Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your identity card details and preferences.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-bold text-zinc-950 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-zinc-900" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative select-none">
        
        {/* Avatar Upload Container */}
        <div className="flex flex-col items-center space-y-3 relative shrink-0">
          <div className="w-24 h-24 rounded-full border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center relative group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-zinc-400" />
            )}
            
            {isEditing && (
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                Change
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          {isEditing && avatarUrl && (
            <button
              onClick={() => setAvatarUrl("")}
              className="text-[9px] font-bold text-zinc-400 hover:text-red-600 transition-colors uppercase"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Identity Details */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
              <h2 className="text-xl font-black text-zinc-950">{profile.name}</h2>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-950 text-white w-fit mx-auto md:mx-0">
                {profile.role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              {profile.jobTitle} • Employee ID: <span className="font-mono">{profile.employeeId}</span>
            </p>
          </div>

          <p className="text-xs text-zinc-600 italic max-w-lg leading-relaxed">
            {profile.bio || "No profile bio written yet. Click edit to customize your card."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-zinc-500">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{profile.phone || "No phone listed"}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{profile.location || "No location listed"}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{profile.timezone} • {profile.language.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Edit Button Trigger */}
        <div className="absolute top-6 right-6">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-800 bg-white rounded-lg px-3 cursor-pointer shadow-sm"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Profile
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsEditing(false);
                setError("");
              }}
              className="h-8 text-[10px] font-bold border border-zinc-200 hover:bg-zinc-50 text-zinc-500 bg-white rounded-lg px-3 cursor-pointer"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Profile Edit Form Card */}
      {isEditing && (
        <form onSubmit={handleSave} className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">
            Edit Information Card
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="profName">Full Name</Label>
              <Input
                id="profName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-lg h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profPhone">Phone Number</Label>
              <Input
                id="profPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                className="rounded-lg h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profLocation">Location</Label>
              <Input
                id="profLocation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, HQ"
                className="rounded-lg h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profTimezone">Timezone</Label>
              <select
                id="profTimezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 h-10 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="UTC">UTC (GMT+0)</option>
                <option value="EST">EST (GMT-5)</option>
                <option value="PST">PST (GMT-8)</option>
                <option value="IST">IST (GMT+5:30)</option>
                <option value="CET">CET (GMT+1)</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="profBio">Bio Description</Label>
              <textarea
                id="profBio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief sentence about your job focus..."
                rows={3}
                className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100">
            <Button
              type="submit"
              disabled={saving}
              className="h-10 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs py-2 px-5 font-bold cursor-pointer"
            >
              <Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Configurations"}
            </Button>
          </div>
        </form>
      )}

      {/* Custody History Log Ledger */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden select-none">
        <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight flex items-center">
            <FileText className="h-4 w-4 mr-2 text-zinc-400" /> Custody Ledger History
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
          {(!profile.allocations || profile.allocations.length === 0) ? (
            <div className="py-12 text-center text-zinc-400 italic">
              No historical allocations found for this profile.
            </div>
          ) : (
            profile.allocations.map((alloc: any) => (
              <div key={alloc.id} className="p-5 flex justify-between items-center hover:bg-zinc-50/30 transition-colors">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-950 block">{alloc.asset.name}</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">Serial: {alloc.asset.serialNumber} | Value: ${alloc.asset.acquisitionCost}</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                    {alloc.status}
                  </span>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">
                    Allocated: {new Date(alloc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
