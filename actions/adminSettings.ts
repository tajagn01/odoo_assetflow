"use server";

import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const CONFIG_PATH = path.join(process.cwd(), "config", "org_settings.json");

export interface OrgSettings {
  orgName: string;
  address: string;
  footer: string;
  logo: string;
  favicon: string;
  brandColor: string;
  accentColor: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSenderEmail: string;
  storageProvider: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  minPasswordLength: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  timezone: string;
  currency: string;
  language: string;
  backupFrequency: string;
  slackWebhook: string;
  apiKeys: { key: string; name: string; createdAt: string }[];
}

const DEFAULT_SETTINGS: OrgSettings = {
  orgName: "AssetFlow Enterprise ERP",
  address: "100 Innovation Way, Suite 400, Tech City",
  footer: "© 2026 AssetFlow Inc. All rights reserved.",
  logo: "",
  favicon: "",
  brandColor: "#09090b",
  accentColor: "#6366f1",
  smtpHost: "smtp.mailgun.org",
  smtpPort: 587,
  smtpUser: "postmaster@assetflow.io",
  smtpPass: "••••••••••••••••",
  smtpSenderEmail: "no-reply@assetflow.io",
  storageProvider: "LOCAL",
  s3Bucket: "assetflow-prod-vault",
  s3AccessKey: "AKIAIOSFODNN7EXAMPLE",
  s3SecretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  minPasswordLength: 8,
  sessionTimeout: 30,
  mfaRequired: false,
  timezone: "UTC",
  currency: "USD",
  language: "en",
  backupFrequency: "DAILY",
  slackWebhook: process.env.SLACK_WEBHOOK_URL || "",
  apiKeys: [
    { key: "af_live_d8b37c89f5a0e12d62b9", name: "Headless HR Sync API", createdAt: "2026-07-12T07:00:00Z" }
  ]
};

// Verify session role is strictly ADMIN
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized. Admin role credentials required.");
  }
  return session.user.id;
}

// Read settings
export async function getOrgSettings(): Promise<OrgSettings> {
  try {
    await verifyAdmin();

    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_PATH)) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return DEFAULT_SETTINGS;
    }

    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(data) as OrgSettings;
  } catch (err) {
    console.error("Failed to read org settings", err);
    return DEFAULT_SETTINGS;
  }
}

// Update settings
export async function saveOrgSettings(settings: Partial<OrgSettings>) {
  try {
    const adminId = await verifyAdmin();

    const current = await getOrgSettings();
    const updated = { ...current, ...settings };

    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));

    // Audit Log entry
    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "UPDATE_ORG_SETTINGS",
        entityType: "SystemConfig",
        entityId: "org_settings",
        previousValues: { orgName: current.orgName, timezone: current.timezone },
        newValues: { orgName: updated.orgName, timezone: updated.timezone },
      },
    });

    return { success: true, message: "Organization setup updated securely." };
  } catch (err: any) {
    console.error("Failed to save org settings", err);
    return { success: false, message: err.message || "Failed to update configurations." };
  }
}

// Generate new client key
export async function generateApiKey(name: string) {
  try {
    await verifyAdmin();

    const current = await getOrgSettings();
    const newKey = `af_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    
    const updatedKeys = [
      ...current.apiKeys,
      { key: newKey, name, createdAt: new Date().toISOString() }
    ];

    await saveOrgSettings({ apiKeys: updatedKeys });
    return { success: true, message: "API key generated successfully.", data: newKey };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// Revoke client key
export async function revokeApiKey(key: string) {
  try {
    await verifyAdmin();

    const current = await getOrgSettings();
    const updatedKeys = current.apiKeys.filter((k) => k.key !== key);

    await saveOrgSettings({ apiKeys: updatedKeys });
    return { success: true, message: "API key revoked successfully." };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
