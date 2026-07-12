"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Sparkles, Search, ShieldAlert, Award, Clock, ArrowRight,
  TrendingUp, AlertTriangle, CheckCircle, Info, RefreshCw, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getAIDashboardSummary, getAIMaintenancePredictions, 
  getAISmartSearch, getAIRecommendations, AIInsight, MaintenancePrediction 
} from "@/actions/ai";
import Link from "next/link";

export default function AIHubPage() {
  const { data: session } = useSession();

  // AI states
  const [summary, setSummary] = useState("");
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [recommendations, setRecommendations] = useState<AIInsight[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [msgError, setMsgError] = useState("");

  const loadAIData = async () => {
    setLoading(true);
    setMsgError("");
    try {
      const [sum, preds, recs] = await Promise.all([
        getAIDashboardSummary(),
        getAIMaintenancePredictions(),
        getAIRecommendations()
      ]);
      setSummary(sum);
      setPredictions(preds);
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
      setMsgError("Failed to connect with the AI synthesis servers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAIData();
    }
  }, [session]);

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await getAISmartSearch(searchQuery.trim());
      setSearchResults(results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
      </div>
    );
  }

  const isPowerUser = session && ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="border-b border-zinc-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-indigo-500 fill-indigo-200 animate-pulse" />
            Enterprise AI Hub
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Preventative maintenance predictions, natural language search filters, and real-time portfolio optimization recommendations.
          </p>
        </div>
        <Button 
          onClick={loadAIData}
          className="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs py-2 px-4 cursor-pointer font-bold flex items-center gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload Synthesis
        </Button>
      </div>

      {msgError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 select-none">
          {msgError}
        </div>
      )}

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main content columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Executive Summary Card */}
          <div className="rounded-xl border border-indigo-250 bg-indigo-50/20 p-6 space-y-3 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 fill-current" /> AI Portfolio Synthesis
            </h3>
            <p className="text-xs text-zinc-700 leading-relaxed font-semibold italic">
              "{summary}"
            </p>
          </div>

          {/* Natural Language Smart Search */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="h-4 w-4" /> Natural Language Smart Search
            </h3>

            <form onSubmit={handleSmartSearch} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g. Find laptops in poor condition, show available vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Button 
                type="submit" 
                disabled={searching || !searchQuery.trim()}
                className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg text-xs py-2 px-4 cursor-pointer font-bold"
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="divide-y divide-zinc-150 pt-2 text-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Smart Filter Matches</span>
                {searchResults.map((asset) => (
                  <div key={asset.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-950 block">{asset.name}</span>
                      <span className="text-zinc-400 font-mono text-[10px]">Tag: {asset.tag} · Loc: {asset.location} · Cond: {asset.condition}</span>
                    </div>
                    <Link 
                      href={`/dashboard/assets/${asset.id}`}
                      className="text-[10px] font-bold text-zinc-950 border border-zinc-200 hover:bg-zinc-50 rounded-lg px-3 py-1.5"
                    >
                      Audit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predictive Maintenance list */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> AI Preventative Maintenance Predictions
            </h3>

            {predictions.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-xs italic">
                All tracked inventory items reflect optimal physical health metrics.
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.slice(0, 5).map((pred) => {
                  const barColor = pred.riskLevel === "CRITICAL" || pred.riskLevel === "HIGH" ? "bg-red-500" : "bg-amber-500";
                  return (
                    <div key={pred.assetId} className="border border-zinc-200 p-4 rounded-xl text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Link href={`/dashboard/assets/${pred.assetId}`} className="font-bold text-zinc-950 hover:underline">{pred.name}</Link>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">Tag: {pred.tag}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          pred.riskLevel === "CRITICAL" || pred.riskLevel === "HIGH" 
                            ? "bg-red-50 text-red-700 border-red-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {pred.riskLevel} RISK ({pred.riskScore}%)
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-zinc-500">
                          <span>Predicted Failure Window</span>
                          <span>Within {pred.estimatedBreakdownDays} Days</span>
                        </div>
                        <div className="w-full bg-zinc-150 h-2 rounded-full overflow-hidden border border-zinc-200">
                          <div className={`h-full ${barColor}`} style={{ width: `${pred.riskScore}%` }} />
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      <div className="pt-2 border-t border-zinc-100 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Risk Factors</span>
                        <ul className="list-disc pl-4 text-zinc-550 space-y-0.5">
                          {pred.factors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Recommendations & Insights */}
        <div className="space-y-6">
          
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> AI Recommendations & Insights
            </h3>

            {recommendations.length === 0 ? (
              <div className="py-4 text-center text-zinc-400 text-xs italic">
                No active optimization recommendations formulated.
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold">
                {recommendations.map((rec, i) => {
                  const iconColor = rec.type === "WARNING" ? "text-red-500" : rec.type === "RECOMMENDATION" ? "text-indigo-500" : "text-zinc-500";
                  const bgClass = rec.type === "WARNING" ? "bg-red-50/50 border-red-200" : rec.type === "RECOMMENDATION" ? "bg-indigo-50/30 border-indigo-200" : "bg-zinc-50/50 border-zinc-200";

                  return (
                    <div key={i} className={`p-4 border rounded-xl space-y-2 ${bgClass}`}>
                      <div className="flex items-center space-x-2 font-bold text-zinc-950">
                        <Sparkles className={`h-4 w-4 shrink-0 ${iconColor}`} />
                        <span>{rec.title}</span>
                      </div>
                      <p className="text-zinc-550 text-[11px] leading-relaxed font-normal">
                        {rec.message}
                      </p>
                      {rec.actionableLink && (
                        <Link 
                          href={rec.actionableLink}
                          className="inline-flex items-center text-[10px] font-black text-zinc-950 uppercase tracking-wider hover:underline"
                        >
                          {rec.actionableLabel || "Learn More"} <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Info className="h-4 w-4 text-zinc-400" /> LLM Configuration
            </h3>
            <p className="text-xs text-zinc-400 leading-normal">
              To connect these features to real Gemini models, save your `OPENAI_API_KEY` or `GEMINI_API_KEY` inside `.env` configs. The abstraction layer in `actions/ai.ts` is fully prepared.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
