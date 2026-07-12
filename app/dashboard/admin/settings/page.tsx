"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Building2, Image as ImageIcon, Mail, Database, ShieldAlert, 
  Globe, RotateCcw, MessageSquare, Key, Save, AlertCircle, CheckCircle2,
  Trash2, Plus, RefreshCw, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getOrgSettings, saveOrgSettings, generateApiKey, revokeApiKey, OrgSettings 
} from "@/actions/adminSettings";

type TabType = "general" | "branding" | "smtp" | "storage" | "security" | "localization" | "backup" | "notifications" | "apikeys";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Settings State
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("general");

  // API Key creation
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getOrgSettings();
      if (data) {
        setSettings(data);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch organization settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard/forbidden");
        return;
      }
      loadSettings();
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await saveOrgSettings(settings);
      if (res.success) {
        setSuccess(res.message || "Settings updated successfully.");
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

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setError("");
    setSuccess("");
    try {
      const res = await generateApiKey(newKeyName.trim());
      if (res.success && res.data) {
        setGeneratedKey(res.data);
        setNewKeyName("");
        await loadSettings();
      } else {
        setError(res.message || "Failed to generate key.");
      }
    } catch (err) {
      setError("Failed to dispatch key generation.");
    }
  };

  const handleRevokeKey = async (key: string) => {
    if (!confirm("Are you sure you want to revoke this API credential key?")) return;

    setError("");
    setSuccess("");
    try {
      const res = await revokeApiKey(key);
      if (res.success) {
        setSuccess(res.message || "Key revoked successfully.");
        await loadSettings();
      } else {
        setError(res.message || "Failed to revoke key.");
      }
    } catch (err) {
      setError("Failed to dispatch key revocation.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="border-b border-zinc-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Organization Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure organization-wide branding guidelines, cloud storage, mail, and developers integration keys.</p>
        </div>
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

      {/* Tabs list (Glassmorphism layout) */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 scrollbar-none select-none">
        {(["general", "branding", "smtp", "storage", "security", "localization", "backup", "notifications", "apikeys"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(""); setSuccess(""); }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab 
                ? "border-zinc-950 text-zinc-950 font-black" 
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main form fields container */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> General Organization Details
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={settings.orgName}
                  onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                  placeholder="e.g. AssetFlow Inc."
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Address Headquarters</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="e.g. 100 Innovation Way, Suite 400"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="footer">Reports Footer Sign-off</Label>
                <Input
                  id="footer"
                  value={settings.footer}
                  onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
                  placeholder="e.g. © 2026 AssetFlow Inc. Confidential."
                  required
                />
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === "branding" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Palette className="h-4 w-4" /> Brand Assets & Colors
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="logo">Upload Brand Logo (URL/Base64)</Label>
                  <Input
                    id="logo"
                    value={settings.logo}
                    onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                    placeholder="e.g. https://domain.com/logo.png"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="favicon">Upload Favicon (URL/Base64)</Label>
                  <Input
                    id="favicon"
                    value={settings.favicon}
                    onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                    placeholder="e.g. https://domain.com/favicon.ico"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bColor">Brand Primary Theme Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bColor"
                      type="color"
                      value={settings.brandColor}
                      onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                      className="w-12 h-9 p-0.5 border border-zinc-250 rounded-lg cursor-pointer"
                    />
                    <Input
                      value={settings.brandColor}
                      onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="aColor">Brand Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="aColor"
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-12 h-9 p-0.5 border border-zinc-250 rounded-lg cursor-pointer"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMTP */}
          {activeTab === "smtp" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> Outgoing SMTP Server Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="smtpHost">SMTP Host Address</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    placeholder="user@smtp.com"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="smtpPass">SMTP Password</Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="smtpSender">Default Sender Email</Label>
                  <Input
                    id="smtpSender"
                    type="email"
                    value={settings.smtpSenderEmail}
                    onChange={(e) => setSettings({ ...settings, smtpSenderEmail: e.target.value })}
                    placeholder="no-reply@company.com"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE */}
          {activeTab === "storage" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="h-4 w-4" /> Cloud Storage Settings (Asset Documents & Gallery)
              </h3>

              <div className="space-y-1">
                <Label htmlFor="storeP">Storage Provider</Label>
                <select
                  id="storeP"
                  value={settings.storageProvider}
                  onChange={(e) => setSettings({ ...settings, storageProvider: e.target.value })}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="LOCAL">Local Server Storage</option>
                  <option value="S3">Amazon S3 Object Vault</option>
                </select>
              </div>

              {settings.storageProvider === "S3" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="bucket">S3 Bucket Name</Label>
                    <Input
                      id="bucket"
                      value={settings.s3Bucket}
                      onChange={(e) => setSettings({ ...settings, s3Bucket: e.target.value })}
                      placeholder="assetflow-storage-bucket"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="s3Key">S3 Access Key ID</Label>
                    <Input
                      id="s3Key"
                      value={settings.s3AccessKey}
                      onChange={(e) => setSettings({ ...settings, s3AccessKey: e.target.value })}
                      placeholder="AKIA..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="s3Secret">S3 Secret Access Key</Label>
                    <Input
                      id="s3Secret"
                      type="password"
                      value={settings.s3SecretKey}
                      onChange={(e) => setSettings({ ...settings, s3SecretKey: e.target.value })}
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === "security" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Global Security Guidelines
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="pwdLength">Min Password Length</Label>
                  <Input
                    id="pwdLength"
                    type="number"
                    value={settings.minPasswordLength}
                    onChange={(e) => setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) || 8 })}
                    placeholder="8"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sTimeout">Session Idle Timeout (Minutes)</Label>
                  <Input
                    id="sTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                    required
                  />
                </div>

                <div className="flex items-center justify-between sm:col-span-2 pt-2 border-t border-zinc-100">
                  <div>
                    <span className="font-bold text-zinc-900 text-xs block">Enforce Multi-Factor Auth (MFA)</span>
                    <span className="text-[10px] text-zinc-450 font-normal">Force all Employees and Managers to register authenticator tokens</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.mfaRequired}
                    onChange={(e) => setSettings({ ...settings, mfaRequired: e.target.checked })}
                    className="rounded border-zinc-300 focus:ring-zinc-950 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LOCALIZATION */}
          {activeTab === "localization" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> Localization & Currency Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="currency">Currency Code</Label>
                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lang">System Language</Label>
                  <select
                    id="lang"
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-2 py-1 focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BACKUP */}
          {activeTab === "backup" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 text-xs font-semibold">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" /> System Backup & Disaster Recovery
              </h3>

              <div className="space-y-1">
                <Label htmlFor="backupF">Automated Backup Frequency</Label>
                <select
                  id="backupF"
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="DAILY">Every 24 Hours (Daily)</option>
                  <option value="WEEKLY">Every 7 Days (Weekly)</option>
                  <option value="MONTHLY">Every 30 Days (Monthly)</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-100 space-y-2">
                <Label className="text-[10px] text-zinc-400 font-bold uppercase">Manual Restore / SQL Rollback</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 border border-dashed border-zinc-300 rounded-lg text-center text-zinc-400 cursor-pointer hover:bg-zinc-50">
                    Upload restore file (.json, .sql)
                  </div>
                  <Button type="button" onClick={() => alert("Upload database dump file to restore database.")} className="bg-zinc-950 text-white rounded-lg text-xs py-2 px-4 cursor-pointer font-bold">
                    Restore
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS WEBHOOKS */}
          {activeTab === "notifications" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Team Webhooks Integration
              </h3>

              <div className="space-y-1">
                <Label htmlFor="webhook">Slack Webhook URL (Alert dispatches)</Label>
                <Input
                  id="webhook"
                  value={settings.slackWebhook}
                  onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            </div>
          )}

          {/* TAB 9: DEVELOPER API KEYS */}
          {activeTab === "apikeys" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-4 w-4" /> Headless Integration API Keys
                </h3>

                <form onSubmit={handleGenerateKey} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="API Key Name (e.g. ERP Sync Service)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer font-bold">
                    Generate Key
                  </Button>
                </form>

                {generatedKey && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-emerald-800">New API Key generated. Copy this key now. It will not be shown again:</div>
                    <div className="font-mono bg-white p-2.5 rounded border border-emerald-100 text-zinc-800 break-all select-all font-black">
                      {generatedKey}
                    </div>
                  </div>
                )}
              </div>

              {/* Active list */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <Label className="text-[10px] text-zinc-400 font-bold uppercase">Active Integration Keys</Label>
                {settings.apiKeys && settings.apiKeys.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {settings.apiKeys.map((k) => (
                      <div key={k.key} className="flex justify-between items-center p-3 border border-zinc-200 bg-zinc-550/5 rounded-xl">
                        <div>
                          <div className="font-bold text-zinc-900">{k.name}</div>
                          <div className="text-zinc-400 font-mono text-[9px] mt-0.5">Prefix: {k.key.slice(0, 12)}... · Created: {new Date(k.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.key)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Revoke Key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-400 text-xs italic pl-1">No API keys generated.</div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Save button panel and instructions */}
        <div className="space-y-6">
          
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Save Changes</h3>
            <p className="text-xs text-zinc-400 leading-normal">
              Updating organization settings modifies outgoing mail queues, system localizations, and developers API access tokens.
            </p>
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg py-2.5 font-bold flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving changes..." : "Save Settings"}
            </Button>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-zinc-400" /> Admin Protection
            </h3>
            <p className="text-xs text-zinc-400 leading-normal">
              Organization controls are strictly restricted to system administrators. Operations are tracked under the Activity Audit timeline.
            </p>
          </div>

        </div>

      </form>
    </div>
  );
}
