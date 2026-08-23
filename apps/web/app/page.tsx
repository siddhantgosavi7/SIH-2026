"use client";

import React, { useState } from "react";
import {
  Search,
  Send,
  Building2,
  GraduationCap,
  Landmark,
  Briefcase,
  Library,
  HeartPulse,
  Wifi,
  Trophy,
  ShieldCheck,
  Building,
  ArrowRight,
} from "lucide-react";

// Types
type Category = "Hostel" | "Exam Cell" | "Academics" | "Admin" | "IT Services" | "Library";

interface DemoResult {
  priority: string;
  prioritySub: string;
  routedTo: string;
  routedSub: string;
  related: string;
  relatedSub: string;
}

type BenchmarkTab = "Accuracy" | "Latency" | "Coverage";

interface ChartGroup {
  label: string;
  giop: number;
  helpdesk: number;
  manual: number;
  suffix?: string;
}

// Data mapping for Demo Card
const demoResultsMap: Record<Category, DemoResult> = {
  Hostel: {
    priority: "Priority: High",
    prioritySub: "3 related reports · affects 40+ students",
    routedTo: "Routed to: Hostel Administration",
    routedSub: "Auto-assigned, SLA 24h",
    related: "Related complaint found",
    relatedSub: "Block A water outage, reported 6h ago",
  },
  "Exam Cell": {
    priority: "Priority: Critical",
    prioritySub: "24 related reports · affects 120+ students",
    routedTo: "Routed to: Controller of Examinations",
    routedSub: "High priority queue, SLA 4h",
    related: "Related complaint found",
    relatedSub: "Hall ticket portal download timeout, reported 1h ago",
  },
  Academics: {
    priority: "Priority: Normal",
    prioritySub: "1 related report · affects 15 students",
    routedTo: "Routed to: Academic Affairs Committee",
    routedSub: "Standard review queue, SLA 48h",
    related: "Related complaint found",
    relatedSub: "Elective course registration overlap, reported 12h ago",
  },
  Admin: {
    priority: "Priority: High",
    prioritySub: "5 related reports · affects 50+ students",
    routedTo: "Routed to: Central Registrar Office",
    routedSub: "Auto-routed, SLA 12h",
    related: "Related complaint found",
    relatedSub: "Annual fee receipt verification pending, reported 24h ago",
  },
  "IT Services": {
    priority: "Priority: Urgent",
    prioritySub: "18 related reports · affects 300+ students",
    routedTo: "Routed to: Network Infrastructure Team",
    routedSub: "Immediate escalation, SLA 2h",
    related: "Related complaint found",
    relatedSub: "East Campus Wi-Fi gateway down, reported 30m ago",
  },
  Library: {
    priority: "Priority: Normal",
    prioritySub: "2 related reports · affects 8 students",
    routedTo: "Routed to: Library Digital Access Desk",
    routedSub: "Standard queue, SLA 36h",
    related: "Related complaint found",
    relatedSub: "E-journal proxy portal authentication glitch, reported 4h ago",
  },
};

// Data mapping for Benchmarks
const benchmarkDataMap: Record<BenchmarkTab, ChartGroup[]> = {
  Accuracy: [
    { label: "Routing accuracy", giop: 95, helpdesk: 44, manual: 22, suffix: "%" },
    { label: "Duplicate catch", giop: 88, helpdesk: 30, manual: 8, suffix: "%" },
    { label: "SLA compliance", giop: 90, helpdesk: 52, manual: 19, suffix: "%" },
  ],
  Latency: [
    { label: "Triage speed", giop: 98, helpdesk: 40, manual: 15, suffix: "%" },
    { label: "First response", giop: 92, helpdesk: 35, manual: 12, suffix: "%" },
    { label: "Resolution speed", giop: 85, helpdesk: 45, manual: 20, suffix: "%" },
  ],
  Coverage: [
    { label: "Dept coverage", giop: 100, helpdesk: 60, manual: 35, suffix: "%" },
    { label: "Intake channels", giop: 94, helpdesk: 50, manual: 25, suffix: "%" },
    { label: "Audit compliance", giop: 99, helpdesk: 65, manual: 40, suffix: "%" },
  ],
};

export default function GIOPPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("Hostel");
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState<BenchmarkTab>("Accuracy");

  const currentDemo = demoResultsMap[selectedCategory];
  const currentChartGroups = benchmarkDataMap[activeBenchmarkTab];

  return (
    <div className="min-h-screen bg-white text-[#0B0B12] font-sans antialiased selection:bg-[#3D4FFF] selection:text-white">
      {/* 1. STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo mark + Wordmark */}
          <a
            href="#"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF] rounded-lg p-1"
          >
            <div className="w-6 h-6 rounded-md bg-[#3D4FFF] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              G
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#0B0B12]">
              GIOP
            </span>
          </a>

          {/* Center: Nav links (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-7">
            {["Product", "Departments", "Enterprise", "Blog", "Docs", "Pricing"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm font-medium text-[#3D4FFF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF] rounded-md px-1 transition-all"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-[#F1F0EC] hover:bg-gray-200 text-[#0B0B12] text-xs sm:text-sm font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF]"
            >
              Contact admin
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-[#0B0B12] hover:bg-black/80 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF]"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-16 text-center">
        {/* Decorative Floating Shapes & Cards (Desktop Only) */}
        <div className="hidden lg:block pointer-events-none select-none">
          {/* Top Left: Solid Blue Square */}
          <div
            className="absolute -left-12 top-10 w-20 h-20 bg-[#3D4FFF] rounded-2xl animate-float shadow-md"
            style={{ animationDelay: "0s" }}
          />
          {/* Below Top Left: Solid Dark Square */}
          <div
            className="absolute -left-16 top-36 w-16 h-16 bg-[#0B0B12] rounded-xl animate-float shadow-md"
            style={{ animationDelay: "1.8s" }}
          />
          {/* Mid Left: Gradient Blue-Lavender Rectangle */}
          <div
            className="absolute -left-8 top-64 w-20 h-28 bg-gradient-to-b from-[#3D4FFF] to-[#8B98FF] rounded-2xl animate-float shadow-lg"
            style={{ animationDelay: "3.5s" }}
          />
          {/* Bottom Left: Terracotta Gradient Square */}
          <div
            className="absolute -left-16 top-96 w-16 h-16 bg-gradient-to-br from-[#E2935A] to-[#B97A5C] rounded-2xl animate-float shadow-md"
            style={{ animationDelay: "2.2s" }}
          />

          {/* Floating Data Card 1: Priority Card (Top Left) */}
          <div
            className="absolute left-10 top-4 bg-white border border-black/10 rounded-xl p-3.5 shadow-xl w-32 text-left animate-float"
            style={{ animationDelay: "1s" }}
          >
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Priority
            </div>
            <div className="text-sm font-extrabold text-[#0B0B12] mt-0.5">
              High
            </div>
          </div>

          {/* Floating Data Card 2: JSON Code Card (Top Right) */}
          <div
            className="absolute right-12 top-28 bg-[#0B0B12] text-white border border-white/10 rounded-xl p-3.5 shadow-2xl w-40 text-left font-mono text-[11px] leading-relaxed animate-float"
            style={{ animationDelay: "2.5s" }}
          >
            <div>
              <span className="text-gray-400">route: </span>
              <span className="text-amber-300">&quot;hostel&quot;</span>
            </div>
            <div>
              <span className="text-gray-400">sla: </span>
              <span className="text-[#1E8A54] font-bold">24h</span>
            </div>
            <div>
              <span className="text-gray-400">status: </span>
              <span className="text-[#1E8A54] font-bold">open</span>
            </div>
          </div>

          {/* Top Right: Gradient Blue Square */}
          <div
            className="absolute -right-12 top-8 w-20 h-20 bg-gradient-to-b from-[#8B98FF] to-[#3D4FFF] rounded-2xl animate-float shadow-md"
            style={{ animationDelay: "0.8s" }}
          />
          {/* Mid Right: Solid Blue Rect */}
          <div
            className="absolute -right-10 top-56 w-16 h-24 bg-[#3D4FFF] rounded-2xl animate-float shadow-lg"
            style={{ animationDelay: "4s" }}
          />
          {/* Mid-low Right: Solid Dark Square */}
          <div
            className="absolute -right-16 top-84 w-16 h-16 bg-[#0B0B12] rounded-xl animate-float shadow-md"
            style={{ animationDelay: "1.2s" }}
          />
          {/* Bottom Right: Terracotta Square */}
          <div
            className="absolute -right-12 top-112 w-16 h-16 bg-gradient-to-br from-[#E2935A] to-[#B97A5C] rounded-2xl animate-float shadow-md"
            style={{ animationDelay: "3s" }}
          />
        </div>

        {/* Hero Text Column */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#0B0B12] tracking-tighter leading-[1.05] max-w-4xl mx-auto">
          The campus grievance system that understands itself.
        </h1>
        <p className="mt-6 text-base sm:text-xl text-[#8B8B9A] max-w-2xl mx-auto font-medium leading-relaxed">
          Classify, prioritize, and route every complaint across every department.
        </p>

        <div className="mt-8">
          <button
            type="button"
            className="inline-flex items-center justify-center px-7 py-3.5 bg-[#0B0B12] hover:bg-black/80 text-white text-sm font-bold rounded-full transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF] focus-visible:ring-offset-2"
          >
            Try the dashboard
          </button>
        </div>
      </section>

      {/* 3. INTERACTIVE DEMO CARD */}
      <section className="max-w-4xl mx-auto px-4 mb-24 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-black/10 p-6 sm:p-8 text-left transition-all">
          {/* Top row */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs sm:text-sm font-medium text-gray-500">
              Hostel water supply — Block A
            </span>
            <span className="bg-[#EAF7F0] text-[#1E8A54] text-xs font-semibold px-3 py-1 rounded-full border border-[#1E8A54]/20 flex items-center gap-1.5">
              confidence 96%
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/15 text-xs font-bold text-[#0B0B12] hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF]"
            >
              <Search className="w-3.5 h-3.5 text-[#0B0B12]" />
              Classify
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/15 text-xs font-bold text-[#0B0B12] hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF]"
            >
              <Send className="w-3.5 h-3.5 text-[#0B0B12]" />
              Route
            </button>
          </div>

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 mt-6 pt-6 border-t border-black/5">
            {/* Left Column: CATEGORY List */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
                CATEGORY
              </div>
              <div className="flex flex-col gap-1">
                {(
                  [
                    "Hostel",
                    "Exam Cell",
                    "Academics",
                    "Admin",
                    "IT Services",
                    "Library",
                  ] as Category[]
                ).map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF] ${
                        isSelected
                          ? "bg-[#0B0B12] text-white shadow-sm"
                          : "text-gray-500 hover:text-[#0B0B12] hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: RESULT Panel */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
                RESULT
              </div>
              <div className="divide-y divide-black/5 rounded-xl bg-gray-50/50 p-4 border border-black/5">
                {/* Result Item 1 */}
                <div className="pb-3.5">
                  <div className="font-extrabold text-sm text-[#0B0B12]">
                    {currentDemo.priority}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {currentDemo.prioritySub}
                  </div>
                </div>

                {/* Result Item 2 */}
                <div className="py-3.5">
                  <div className="font-extrabold text-sm text-[#0B0B12]">
                    {currentDemo.routedTo}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {currentDemo.routedSub}
                  </div>
                </div>

                {/* Result Item 3 */}
                <div className="pt-3.5">
                  <div className="font-extrabold text-sm text-[#0B0B12]">
                    {currentDemo.related}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {currentDemo.relatedSub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DEPARTMENTS SECTION */}
      <section className="max-w-6xl mx-auto px-4 mb-24 text-left">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B0B12] tracking-tight">
          Built to run across every department on campus.
        </h2>
        <div className="mt-3">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F1F0EC] hover:bg-gray-200 text-[#0B0B12] text-xs font-semibold rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF]"
          >
            See how routing works <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 5 columns x 2 rows Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-black/10 rounded-2xl overflow-hidden bg-white shadow-sm mt-8 divide-x divide-y divide-black/10">
          {[
            { name: "Hostel Admin", icon: Building2 },
            { name: "Academics / HOD", icon: GraduationCap },
            { name: "Exam Cell", icon: Landmark },
            { name: "Placement Cell", icon: Briefcase },
            { name: "Library", icon: Library },
            { name: "Health Center", icon: HeartPulse },
            { name: "IT Services", icon: Wifi },
            { name: "Sports Dept", icon: Trophy },
            { name: "Security", icon: ShieldCheck },
            { name: "Admin Office", icon: Building },
          ].map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.name}
                className="p-6 text-center flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-6 h-6 text-[#0B0B12]" />
                <span className="text-xs font-bold text-[#0B0B12]">
                  {dept.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BENCHMARKS SECTION (Full width, no page padding) */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-2">
        {/* Left Panel */}
        <div className="bg-[#0B0B12] text-white p-8 sm:p-12 lg:p-20 flex flex-col justify-center text-left">
          <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">
            BENCHMARKS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Faster resolution at every SLA tier
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-md">
            Illustrative pilot targets against the tools most departments run on today.
          </p>

          {/* Vertical Tab List */}
          <div className="divide-y divide-white/10 border-y border-white/10">
            {(["Accuracy", "Latency", "Coverage"] as BenchmarkTab[]).map(
              (tab) => {
                const isActive = activeBenchmarkTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveBenchmarkTab(tab)}
                    className={`w-full text-left py-4 px-4 text-base font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D4FFF] ${
                      isActive
                        ? "border-l-4 border-[#3D4FFF] text-white bg-white/5 pl-4"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-[#F1F0EC] p-8 sm:p-12 lg:p-20 flex items-center justify-center">
          <div className="bg-[#0B0B12] text-white rounded-2xl p-6 sm:p-8 w-full max-w-xl shadow-2xl border border-white/10 text-left">
            {/* Legend Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-300 mb-8 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#3D4FFF]" />
                <span>GIOP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#8B8B9A]" />
                <span>Generic helpdesk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#B97A5C]" />
                <span>Manual / email</span>
              </div>
            </div>

            {/* Bar Chart Clusters */}
            <div className="grid grid-cols-3 gap-4 items-end h-64">
              {currentChartGroups.map((group) => (
                <div
                  key={group.label}
                  className="flex flex-col items-center h-full justify-end"
                >
                  {/* Bars Container */}
                  <div className="flex items-end gap-1.5 sm:gap-2.5 w-full justify-center h-48">
                    {/* Bar 1: GIOP */}
                    <div className="flex flex-col items-center flex-1 max-w-[28px] h-full justify-end">
                      <span className="text-[10px] font-bold text-gray-300 mb-1">
                        {group.giop}
                        {group.suffix}
                      </span>
                      <div
                        className="w-full bg-[#3D4FFF] rounded-t-sm transition-all duration-500"
                        style={{ height: `${group.giop}%` }}
                      />
                    </div>

                    {/* Bar 2: Generic Helpdesk */}
                    <div className="flex flex-col items-center flex-1 max-w-[28px] h-full justify-end">
                      <span className="text-[10px] font-bold text-gray-400 mb-1">
                        {group.helpdesk}
                        {group.suffix}
                      </span>
                      <div
                        className="w-full bg-[#8B8B9A] rounded-t-sm transition-all duration-500"
                        style={{ height: `${group.helpdesk}%` }}
                      />
                    </div>

                    {/* Bar 3: Manual / Email */}
                    <div className="flex flex-col items-center flex-1 max-w-[28px] h-full justify-end">
                      <span className="text-[10px] font-bold text-gray-400 mb-1">
                        {group.manual}
                        {group.suffix}
                      </span>
                      <div
                        className="w-full bg-[#B97A5C] rounded-t-sm transition-all duration-500"
                        style={{ height: `${group.manual}%` }}
                      />
                    </div>
                  </div>

                  {/* Group Label */}
                  <div className="text-[11px] text-gray-400 font-semibold text-center mt-3 line-clamp-1">
                    {group.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLOSING CTA + FOOTER BAND */}
      <footer className="bg-[#3D4FFF] text-white w-full py-16 sm:py-20 px-6 sm:px-12 lg:px-20 text-left">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow + Headline */}
          <div className="text-xs font-extrabold text-white/80 tracking-widest uppercase mb-4">
            GIOP PLATFORM
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tighter leading-[1.08] max-w-2xl mb-12">
            Imagine grievances that resolve themselves.
          </h2>

          <div className="border-t border-white/20 my-10" />

          {/* 5-Column Link Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-sm">
            {/* Column 1: Product */}
            <div>
              <div className="font-bold text-white mb-4 text-sm">Product</div>
              {["Pricing", "Dashboard", "Intake API", "Analytics"].map(
                (item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-white/80 hover:text-white transition-colors block mb-2.5 text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                  >
                    {item}
                  </a>
                )
              )}
            </div>

            {/* Column 2: Institution */}
            <div>
              <div className="font-bold text-white mb-4 text-sm">
                Institution
              </div>
              {["About GIOP", "Careers", "Blog", "Changelog"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/80 hover:text-white transition-colors block mb-2.5 text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Column 3: Departments */}
            <div>
              <div className="font-bold text-white mb-4 text-sm">
                Departments
              </div>
              {["Hostel", "Exam Cell", "Academics", "Admin"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/80 hover:text-white transition-colors block mb-2.5 text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Column 4: Resources */}
            <div>
              <div className="font-bold text-white mb-4 text-sm">
                Resources
              </div>
              {["Research", "Trust Center", "Security", "Docs"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/80 hover:text-white transition-colors block mb-2.5 text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Column 5: Connect */}
            <div>
              <div className="font-bold text-white mb-4 text-sm">Connect</div>
              {["Contact", "Twitter", "LinkedIn", "GitHub"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/80 hover:text-white transition-colors block mb-2.5 text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center text-xs text-white/60 gap-4">
            <div>© 2026 GIOP Platform. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="hover:text-white transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
