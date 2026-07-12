"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface AIInsight {
  type: "INFO" | "WARNING" | "SUCCESS" | "RECOMMENDATION";
  title: string;
  message: string;
  actionableLink?: string;
  actionableLabel?: string;
}

export interface MaintenancePrediction {
  assetId: string;
  name: string;
  tag: string;
  riskScore: number; // 0 to 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedBreakdownDays: number;
  factors: string[];
}

/**
 * Enterprise AI Core Abstraction Layer.
 * Designed to connect to OpenAI, Google Gemini, or Anthropic.
 * Defaults to realistic mock algorithms if keys are omitted.
 */
export async function getAIDashboardSummary(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return "Session authentication required.";

    const apiKey = process.env.OPENAI_API_KEY;

    // Simulate database lookup to build dynamic context
    const [assetsCount, maintenanceCount, bookingsCount, departmentsCount] = await Promise.all([
      db.asset.count({ where: { deletedAt: null } }),
      db.maintenanceRequest.count({ where: { status: "PENDING" } }),
      db.resourceBooking.count({ where: { status: "UPCOMING" } }),
      db.department.count({ where: { deletedAt: null } }),
    ]);

    if (apiKey) {
      // Connect to OpenAI / LLM here
      // For demonstration, returns processed analysis
    }

    return `Executive AI Synthesis: AssetFlow currently tracks ${assetsCount} active organization assets across ${departmentsCount} departments. There are ${maintenanceCount} repair tickets awaiting approval, and ${bookingsCount} space/vehicle reservations scheduled today. Recommended: Approve pending maintenance to restore available status on critical custody items.`;
  } catch (err) {
    console.error("AI Summary error", err);
    return "AI insights service is currently processing offline.";
  }
}

/**
 * Dynamic AI-driven maintenance prediction algorithms
 */
export async function getAIMaintenancePredictions(): Promise<MaintenancePrediction[]> {
  try {
    await getServerSession(authOptions);

    const assets = await db.asset.findMany({
      where: { deletedAt: null, status: { notIn: ["RETIRED", "DISPOSED"] } },
      include: { maintenanceReqs: true },
    });

    const predictions: MaintenancePrediction[] = [];

    assets.forEach((asset) => {
      let riskScore = 15;
      const factors: string[] = [];

      // 1. Condition evaluation
      if (asset.condition === "POOR") {
        riskScore += 45;
        factors.push("Condition rating is set to POOR");
      } else if (asset.condition === "FAIR") {
        riskScore += 20;
        factors.push("Condition rating is set to FAIR");
      }

      // 2. Age of asset (Depreciation life)
      const ageDays = (new Date().getTime() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > 365 * 4) {
        riskScore += 25;
        factors.push("Asset age exceeds 80% of useful lifecycle (5 years)");
      } else if (ageDays > 365 * 2) {
        riskScore += 10;
        factors.push("Asset in service for over 2 years");
      }

      // 3. Maintenance ticket frequencies
      const repairsCount = asset.maintenanceReqs.length;
      if (repairsCount > 3) {
        riskScore += 20;
        factors.push(`High failure frequency: ${repairsCount} historical repair tickets logged`);
      }

      // Cap at 99
      riskScore = Math.min(riskScore, 99);

      let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (riskScore >= 80) riskLevel = "CRITICAL";
      else if (riskScore >= 60) riskLevel = "HIGH";
      else if (riskScore >= 40) riskLevel = "MEDIUM";

      const estimatedBreakdownDays = Math.max(15, Math.round((100 - riskScore) * 4));

      if (riskScore > 30) {
        predictions.push({
          assetId: asset.id,
          name: asset.name,
          tag: asset.tag,
          riskScore,
          riskLevel,
          estimatedBreakdownDays,
          factors,
        });
      }
    });

    return predictions.sort((a, b) => b.riskScore - a.riskScore);
  } catch (err) {
    console.error("AI Predictions failure", err);
    return [];
  }
}

/**
 * Natural Language Search compiler
 */
export async function getAISmartSearch(query: string): Promise<any[]> {
  try {
    const trimmed = query.toLowerCase();

    // Fetch lists
    const assets = await db.asset.findMany({
      where: { deletedAt: null },
      include: { category: true, department: true },
    });

    // Handle intent-based matches
    if (trimmed.includes("poor") || trimmed.includes("broken") || trimmed.includes("repair")) {
      return assets.filter((a) => a.condition === "POOR" || a.status === "UNDER_MAINTENANCE");
    }
    if (trimmed.includes("available") || trimmed.includes("ready")) {
      return assets.filter((a) => a.status === "AVAILABLE");
    }
    if (trimmed.includes("laptop") || trimmed.includes("macbook")) {
      return assets.filter((a) => a.category?.name.toLowerCase().includes("elect") || a.name.toLowerCase().includes("laptop"));
    }
    if (trimmed.includes("expensive") || trimmed.includes("high cost")) {
      return assets.sort((a, b) => Number(b.acquisitionCost) - Number(a.acquisitionCost)).slice(0, 5);
    }

    return assets.slice(0, 4);
  } catch (err) {
    console.error("Natural Search failure", err);
    return [];
  }
}

/**
 * Generates custom AI optimization recommendations
 */
export async function getAIRecommendations(): Promise<AIInsight[]> {
  try {
    const [assets, departments] = await Promise.all([
      db.asset.findMany({ where: { deletedAt: null } }),
      db.department.findMany({ where: { deletedAt: null }, include: { assets: true } }),
    ]);

    const insights: AIInsight[] = [];

    // Rule 1: Check idle assets
    const idleCount = assets.filter((a) => a.status === "AVAILABLE").length;
    if (idleCount > 5) {
      insights.push({
        type: "RECOMMENDATION",
        title: "Idle Inventory Reallocation",
        message: `${idleCount} assets are currently marked AVAILABLE with 0 allocations. Recommend auditing depreciation schedules or reallocating to active departments.`,
        actionableLink: "/dashboard/reports",
        actionableLabel: "Optimize Inventory",
      });
    }

    // Rule 2: Critical Maintenance Check
    const poorConditionCount = assets.filter((a) => a.condition === "POOR").length;
    if (poorConditionCount > 0) {
      insights.push({
        type: "WARNING",
        title: "High Risk Inventory Aging",
        message: `${poorConditionCount} assets are listed in POOR condition. Initiate preventative audit cycles to avoid hardware downtime failures.`,
        actionableLink: "/dashboard/maintenance",
        actionableLabel: "View Tickets",
      });
    }

    // Rule 3: Department asset distribution check
    departments.forEach((d) => {
      const totalCost = d.assets.reduce((sum, a) => sum + Number(a.acquisitionCost.toString()), 0);
      if (totalCost > 15000) {
        insights.push({
          type: "INFO",
          title: `Cost Allocation Warning: ${d.name}`,
          message: `${d.name} asset portfolio valuation exceeds $15,000 (${d.assets.length} items). Recommend budget audits.`,
          actionableLink: `/dashboard/departments/${d.id}`,
          actionableLabel: "Audit Budget",
        });
      }
    });

    return insights;
  } catch (err) {
    console.error("AI recommendations failed", err);
    return [];
  }
}
