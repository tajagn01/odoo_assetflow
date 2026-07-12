import Link from "next/link";
import {
  Package,
  CalendarDays,
  Wrench,
  ShieldCheck,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Building2,
  Zap,
  Lock,
  Activity,
  Globe,
  ChevronRight,
  Star,
  Clock,
  AlertTriangle,
  Layers,
  Database,
  Cpu,
  FileSearch,
  Bell,
  QrCode,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased select-none">

      {/* ── NAVIGATION ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white font-black text-sm tracking-tight">
                AF
              </div>
              <span className="text-sm font-black tracking-wider text-zinc-950 uppercase">
                ASSET<span className="text-zinc-400 font-medium">FLOW</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {["Features", "Modules", "Roles", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-950 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider hover:bg-zinc-800 transition-colors"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/0 via-zinc-50/60 to-zinc-50" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">

            {/* ── Left: Text Content ── */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 mb-8 shadow-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Enterprise Asset Management ERP
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-950 leading-[1.05]">
                Manage Every
                <br />
                Asset.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Flawlessly.</span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-zinc-200 -z-0 skew-x-[-2deg]" />
                </span>
              </h1>

              <p className="mt-6 text-base text-zinc-500 font-medium leading-relaxed max-w-xl">
                AssetFlow replaces your spreadsheets and paper logs with a
                production-grade ERP. Track asset lifecycles, manage bookings,
                automate workflows, and audit everything — in one unified platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-950/10"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                >
                  View Live Demo
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {["SOC 2 Ready", "RBAC Security", "Immutable Audit Logs", "99.9% Uptime"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Compact Dashboard Mockup ── */}
            <div className="w-full lg:w-[520px] shrink-0">
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/8 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                  </div>
                  <div className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[9px] text-zinc-400 font-mono max-w-[200px] mx-auto text-center">
                    app.assetflow.io/dashboard
                  </div>
                </div>
                {/* KPI Cards */}
                <div className="p-4 bg-zinc-50">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Total Assets", value: "2,847", icon: Package, delta: "+12%" },
                      { label: "Allocated", value: "1,204", icon: Users, delta: "+5%" },
                      { label: "Bookings", value: "38", icon: CalendarDays, delta: "Active" },
                      { label: "Maintenance", value: "7", icon: Wrench, delta: "Today" },
                      { label: "Returns Due", value: "14", icon: Clock, delta: "This week" },
                      { label: "Audits Open", value: "2", icon: ShieldCheck, delta: "In Progress" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <card.icon className="h-3 w-3 text-zinc-400" />
                          <span className="text-[8px] font-black text-zinc-400 bg-zinc-100 rounded-full px-1 py-0.5">{card.delta}</span>
                        </div>
                        <div className="text-base font-black text-zinc-950">{card.value}</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5 truncate">{card.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini asset table */}
                  <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                    <div className="grid grid-cols-4 gap-2 border-b border-zinc-100 px-3 py-2 bg-zinc-50">
                      {["Tag", "Asset", "Holder", "Status"].map((h) => (
                        <div key={h} className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">{h}</div>
                      ))}
                    </div>
                    {[
                      ["AF-000001", "MacBook Pro", "S. Jenkins", "Allocated"],
                      ["AF-000002", "Dell Monitor", "Marcus Lee", "Available"],
                      ["AF-000003", "Conf. Room A", "—", "Reserved"],
                      ["AF-000004", "HP LaserJet", "IT Dept", "Maintenance"],
                    ].map(([tag, name, holder, status]) => (
                      <div key={tag} className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-zinc-50 last:border-0">
                        <span className="text-[8px] font-black text-zinc-950 font-mono">{tag}</span>
                        <span className="text-[8px] font-semibold text-zinc-700 truncate">{name}</span>
                        <span className="text-[8px] text-zinc-500 truncate">{holder}</span>
                        <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded-full w-fit ${
                          status === "Allocated" ? "bg-zinc-950 text-white" :
                          status === "Available" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          status === "Reserved" ? "bg-zinc-100 text-zinc-600" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ─────────────────────────────────────── */}
      <section className="py-24 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">The Problem</div>
              <h2 className="text-4xl font-black text-zinc-950 leading-tight">
                Spreadsheets are killing<br />your asset operations.
              </h2>
              <p className="mt-4 text-zinc-500 font-medium leading-relaxed">
                Most organizations still track thousands of assets across disconnected Excel sheets,
                paper logs, and email chains. The result is chaos.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  { icon: AlertTriangle, text: "Assets go lost with zero accountability trail" },
                  { icon: Users, text: "Double-allocation causes operational conflicts" },
                  { icon: FileSearch, text: "No audit history when compliance is needed" },
                  { icon: Bell, text: "Missed maintenance leads to costly breakdowns" },
                  { icon: CalendarDays, text: "Resource booking conflicts waste team time" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-600">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">The Solution</div>
              <h2 className="text-4xl font-black text-zinc-950 leading-tight">
                One platform.<br />Complete control.
              </h2>
              <p className="mt-4 text-zinc-500 font-medium leading-relaxed">
                AssetFlow centralizes every asset operation in a single enterprise-grade system
                with full audit trails, role-based access, and automated workflows.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Real-time asset lifecycle tracking with QR codes",
                  "Conflict-free resource booking with calendar view",
                  "Automated maintenance workflows and reminders",
                  "Immutable audit logs for compliance and reporting",
                  "Role-based access control across all operations",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-700">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-zinc-200 bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "10,000+", label: "Assets Tracked Daily" },
              { value: "99.9%", label: "Platform Uptime" },
              { value: "4 Roles", label: "Granular RBAC System" },
              { value: "Zero", label: "Double Allocations" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black tracking-tight">{stat.value}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Platform Modules</div>
            <h2 className="text-4xl font-black text-zinc-950">Everything you need.<br />Nothing you don&apos;t.</h2>
            <p className="mt-4 text-zinc-500 font-medium">
              Eight tightly integrated modules covering the entire asset and resource management lifecycle.
            </p>
          </div>

          <div id="modules" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Package, title: "Asset Directory",
                desc: "Tag, categorize, and track every asset with auto-generated IDs, QR codes, serial numbers, and full lifecycle states.",
                tags: ["AF-000001 Tags", "QR Codes", "Lifecycle States"],
              },
              {
                icon: Users, title: "Asset Allocation",
                desc: "Assign assets to employees with conflict detection. Prevent double-allocation. Enforce one-asset-one-holder rules.",
                tags: ["Conflict Detection", "Transfer Workflow", "History"],
              },
              {
                icon: CalendarDays, title: "Resource Booking",
                desc: "Book shared resources—rooms, vehicles, equipment—with calendar view, overlap prevention, and automated reminders.",
                tags: ["Calendar View", "Time Slots", "No Overlaps"],
              },
              {
                icon: Wrench, title: "Maintenance",
                desc: "Full maintenance request lifecycle: request → approve → assign → resolve → close. Asset auto-locked during maintenance.",
                tags: ["6-Stage Workflow", "Auto-Status", "Immutable History"],
              },
              {
                icon: ShieldCheck, title: "Audit Module",
                desc: "Create audit cycles, assign auditors, verify assets, and generate discrepancy reports. Closed cycles are read-only.",
                tags: ["Cycle-Based", "Auditor Roles", "PDF Reports"],
              },
              {
                icon: BarChart3, title: "Analytics & Reports",
                desc: "Asset utilization, department allocation heatmaps, maintenance trends, idle assets, and retirement forecasts.",
                tags: ["Utilization", "CSV/PDF Export", "Heatmaps"],
              },
              {
                icon: Bell, title: "Notifications",
                desc: "Automated alerts for allocations, overdue returns, booking reminders, maintenance updates, and audit assignments.",
                tags: ["10+ Event Types", "Unread State", "Real-Time"],
              },
              {
                icon: Activity, title: "Activity Logs",
                desc: "Every critical action is logged immutably with user, entity, before/after values, and timestamp for full traceability.",
                tags: ["Immutable", "Full Diff", "Searchable"],
              },
            ].map((mod) => (
              <div key={mod.title} className="group rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-950/5 transition-all">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white group-hover:scale-110 transition-transform">
                  <mod.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-zinc-950 mb-2">{mod.title}</h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">{mod.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mod.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ──────────────────────────────────────────────────── */}
      <section id="roles" className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Role-Based Access Control</div>
            <h2 className="text-4xl font-black text-zinc-950">Four roles.<br />Perfect hierarchy.</h2>
            <p className="mt-4 text-zinc-500 font-medium">
              Every user has precisely the permissions they need — no more, no less.
              Admins promote users. Employees cannot self-assign privileges.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                role: "Admin", level: "01",
                cardClass: "bg-zinc-950 text-white border-zinc-950",
                desc: "Full platform control. Manages org setup, departments, employees, role assignments, categories, and audit cycles.",
                perms: ["Organization Setup", "Role Assignment", "Audit Cycles", "Analytics"],
              },
              {
                role: "Asset Manager", level: "02",
                cardClass: "bg-zinc-800 text-white border-zinc-800",
                desc: "Owns asset operations. Registers, allocates, transfers, approves maintenance, and manages full asset lifecycles.",
                perms: ["Asset Registration", "Allocation", "Transfer Approval", "Maintenance"],
              },
              {
                role: "Dept Head", level: "03",
                cardClass: "bg-white text-zinc-950 border-zinc-300",
                desc: "Department-scoped visibility. Approves department allocations, transfers, and manages resource bookings for the team.",
                perms: ["Dept Assets", "Allocation Approval", "Booking", "Transfer Review"],
              },
              {
                role: "Employee", level: "04",
                cardClass: "bg-white text-zinc-950 border-zinc-200",
                desc: "Personal asset management. Views assigned assets, books shared resources, raises maintenance, and requests transfers.",
                perms: ["View My Assets", "Resource Booking", "Maintenance Request", "Transfer Request"],
              },
            ].map((r) => (
              <div key={r.role} className={`rounded-2xl border-2 ${r.cardClass} p-6 flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[9px] font-black opacity-50 uppercase tracking-widest mb-1">Level {r.level}</div>
                    <h3 className="text-base font-black">{r.role}</h3>
                  </div>
                  <span className="text-2xl font-black opacity-10">{r.level}</span>
                </div>
                <p className="text-xs font-medium opacity-70 leading-relaxed">{r.desc}</p>
                <ul className="space-y-1.5 mt-auto">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider opacity-70">
                      <span className="h-1 w-1 rounded-full bg-current opacity-60" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASSET LIFECYCLE ────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Asset Lifecycle Engine</div>
              <h2 className="text-4xl font-black text-zinc-950 leading-tight">
                Every state.<br />Every transition.<br />Recorded forever.
              </h2>
              <p className="mt-6 text-zinc-500 font-medium leading-relaxed">
                Assets travel through clearly defined lifecycle states. Every transition is recorded
                in an immutable history table — giving you a complete picture of where every asset has been.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "QR Code Tracking", icon: QrCode },
                  { label: "Auto-Generated Tags", icon: Layers },
                  { label: "State Machine", icon: Cpu },
                  { label: "Full Audit Trail", icon: Database },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <Icon className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-6">Asset State Machine</div>
              <div className="space-y-2">
                {[
                  { state: "Available", cls: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-400", arrow: true },
                  { state: "Allocated", cls: "bg-zinc-950 border-zinc-950 text-white", dot: "bg-white", arrow: true },
                  { state: "Reserved", cls: "bg-zinc-100 border-zinc-200 text-zinc-600", dot: "bg-zinc-400", arrow: true },
                  { state: "Under Maintenance", cls: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400", arrow: true },
                  { state: "Retired", cls: "bg-zinc-50 border-zinc-200 text-zinc-500", dot: "bg-zinc-300", arrow: true },
                  { state: "Disposed", cls: "bg-red-50 border-red-200 text-red-600", dot: "bg-red-400", arrow: false },
                  { state: "Lost (Terminal)", cls: "bg-red-950 border-red-900 text-red-200", dot: "bg-red-500", arrow: false },
                ].map((s) => (
                  <div key={s.state} className="flex items-center gap-3">
                    <div className={`flex items-center gap-2.5 flex-1 rounded-lg border px-4 py-2.5 ${s.cls}`}>
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      <span className="text-xs font-black">{s.state}</span>
                    </div>
                    {s.arrow && <div className="text-zinc-300 font-black text-lg leading-none">↓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORGANIZATION TYPES ─────────────────────────────────────── */}
      <section className="py-24 bg-zinc-950 text-white border-t border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Universal Platform</div>
            <h2 className="text-4xl font-black text-white leading-tight">Built for any<br />organization.</h2>
            <p className="mt-4 text-zinc-400 font-medium">
              No hardcoded logic. No industry-specific assumptions. AssetFlow is architected to
              serve any type of organization out of the box.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {[
              { org: "Schools", icon: Building2 },
              { org: "Colleges", icon: Building2 },
              { org: "Companies", icon: Cpu },
              { org: "Hospitals", icon: Activity },
              { org: "Factories", icon: Layers },
              { org: "Government", icon: Globe },
              { org: "NGOs", icon: Users },
            ].map(({ org, icon: Icon }) => (
              <div key={org} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 flex flex-col items-center gap-3 text-center hover:border-zinc-600 hover:bg-zinc-800 transition-all group">
                <Icon className="h-6 w-6 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">{org}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE PILLARS ───────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Engineering Excellence</div>
            <h2 className="text-4xl font-black text-zinc-950">Production-grade<br />from day one.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Lock, title: "Strong RBAC", desc: "Four-tier role hierarchy with granular permission control. No privilege escalation. Admin-only role assignment." },
              { icon: Database, title: "Normalized Schema", desc: "UUID primary keys, soft deletes, immutable history tables for allocations, bookings, maintenance, and audits." },
              { icon: Layers, title: "Service Layer Architecture", desc: "Business logic lives in the service layer — never in controllers. Repository pattern for clean data access." },
              { icon: ShieldCheck, title: "Immutable Audit Logs", desc: "Every action creates an immutable log with user, entity, previous value, new value, and timestamp." },
              { icon: Zap, title: "Real-Time KPIs", desc: "Dashboard surfaces live metrics: assets available, allocated, under maintenance, overdue, and pending." },
              { icon: Globe, title: "Future-Ready", desc: "Architecture supports RFID, barcode scanning, multi-tenancy, vendor management, and AI recommendations." },
            ].map((pillar) => (
              <div key={pillar.title} className="flex gap-4 rounded-2xl border border-zinc-200 p-6 hover:border-zinc-400 hover:shadow-md transition-all group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 group-hover:bg-zinc-950 group-hover:border-zinc-950 transition-all">
                  <pillar.icon className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-950 mb-1.5">{pillar.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-50 border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">What Teams Say</div>
            <h2 className="text-4xl font-black text-zinc-950">Trusted by operations<br />teams worldwide.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                quote: "AssetFlow completely replaced our inventory spreadsheets. The double-allocation checker and resource calendars work flawlessly.",
                author: "Sarah Jenkins", role: "VP of Operations, TechCorp", stars: 5,
              },
              {
                quote: "The maintenance workflow alone saved us hours every week. Assets automatically lock during maintenance — no more accidental allocations.",
                author: "Marcus Chen", role: "IT Director, City Hospital", stars: 5,
              },
              {
                quote: "RBAC is exactly right. Our employees can request transfers but can't approve them. Admin assigns roles — that's enterprise-grade security.",
                author: "Priya Nair", role: "Asset Manager, State University", stars: 5,
              },
            ].map((t) => (
              <div key={t.author} className="rounded-2xl border border-zinc-200 bg-white p-7 flex flex-col gap-5 shadow-sm">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-zinc-950 text-zinc-950" />
                  ))}
                </div>
                <blockquote className="text-sm font-medium text-zinc-700 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="border-t border-zinc-100 pt-4">
                  <div className="text-xs font-black text-zinc-950">{t.author}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-xl mb-16 mx-auto text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Pricing</div>
            <h2 className="text-4xl font-black text-zinc-950">Simple, transparent pricing.</h2>
            <p className="mt-4 text-zinc-500 font-medium">Start free. Scale when you&apos;re ready.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                plan: "Starter", price: "Free", sub: "Forever",
                desc: "Perfect for small teams getting started with asset management.",
                cta: "Get Started Free", featured: false,
                features: ["Up to 100 assets", "3 user accounts", "Basic asset tracking", "Resource booking", "Email notifications"],
              },
              {
                plan: "Professional", price: "$49", sub: "per month",
                desc: "For growing organizations with real asset management needs.",
                cta: "Start Free Trial", featured: true,
                features: ["Unlimited assets", "25 user accounts", "Full lifecycle management", "Maintenance workflows", "Audit module", "Analytics & reports", "CSV/PDF export", "Priority support"],
              },
              {
                plan: "Enterprise", price: "Custom", sub: "contact us",
                desc: "For large enterprises requiring custom deployment and SLAs.",
                cta: "Contact Sales", featured: false,
                features: ["Unlimited everything", "SSO & SAML", "Custom RBAC", "Multi-org support", "On-premise deploy", "SLA guarantee", "Dedicated support"],
              },
            ].map((tier) => (
              <div key={tier.plan} className={`rounded-2xl p-8 flex flex-col gap-6 ${tier.featured ? "bg-zinc-950 text-white border-2 border-zinc-950 shadow-2xl shadow-zinc-950/20 scale-[1.02]" : "border border-zinc-200 bg-white"}`}>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest mb-2 text-zinc-400">{tier.plan}</div>
                  <div className={`text-4xl font-black ${tier.featured ? "text-white" : "text-zinc-950"}`}>{tier.price}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${tier.featured ? "text-zinc-500" : "text-zinc-400"}`}>{tier.sub}</div>
                  <p className={`text-xs font-medium mt-3 leading-relaxed ${tier.featured ? "text-zinc-400" : "text-zinc-500"}`}>{tier.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${tier.featured ? "text-white" : "text-zinc-500"}`} />
                      <span className={`text-xs font-semibold ${tier.featured ? "text-zinc-300" : "text-zinc-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.plan === "Enterprise" ? "#" : "/signup"}
                  className={`w-full rounded-xl py-3 text-center text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${tier.featured ? "bg-white text-zinc-950 hover:bg-zinc-100" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 -m-24" />
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Get Started Today</div>
              <h2 className="text-5xl font-black text-white leading-tight">
                Stop managing assets<br />with spreadsheets.
              </h2>
              <p className="mt-6 text-lg text-zinc-400 font-medium leading-relaxed">
                Join organizations that have replaced their manual processes with AssetFlow&apos;s enterprise ERP platform.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-zinc-950 hover:bg-zinc-100 transition-all active:scale-95 shadow-lg">
                  Start Free — No Credit Card
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-8 py-4 text-sm font-black text-white hover:border-zinc-500 hover:bg-zinc-900 transition-all active:scale-95">
                  View Live Demo
                </Link>
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                Free forever · No setup fees · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 font-black text-sm">AF</div>
                <span className="text-sm font-black tracking-wider text-white uppercase">
                  ASSET<span className="text-zinc-500 font-medium">FLOW</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs">
                Enterprise-grade asset and resource management ERP. Built for any organization.
                Trusted by operations teams worldwide.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">All systems operational</span>
              </div>
            </div>
            {[
              { title: "Platform", links: ["Dashboard", "Asset Directory", "Resource Booking", "Maintenance", "Audit Module", "Reports"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Security", "Privacy Policy", "Terms of Service"] },
              { title: "Support", links: ["Documentation", "API Reference", "Status Page", "Community", "Contact Sales"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">{col.title}</div>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              © 2026 AssetFlow ERP. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["SOC 2", "ISO 27001", "GDPR Ready"].map((badge) => (
                <span key={badge} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-600">
                  <ShieldCheck className="h-3 w-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

