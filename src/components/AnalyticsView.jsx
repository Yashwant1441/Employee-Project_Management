import React, { useState, useEffect, useCallback, useRef } from "react";
import API_BASE_URL from "../api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Layers,
  Code2,
  Database,
  Building2,
  FolderKanban,
  ChevronRight,
  UserCheck,
  UserX,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Curated vibrant color palettes for high-contrast dark and light modes
const STATUS_COLORS = {
  "Completed": "#10b981",    // Emerald
  "In Progress": "#6366f1",  // Indigo
  "Pending": "#f59e0b",      // Amber
  "Delayed": "#ef4444",      // Rose / Red
  "Planning": "#06b6d4",     // Cyan
  "Testing": "#8b5cf6",      // Violet
  "On Hold": "#94a3b8",      // Slate
};

const PALETTE = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#64748b", // Slate
];

// In-memory cache across tab navigation (no re-fetching when switching tabs)
let analyticsDataCache = {
  data: null,
  timestamp: 0,
};
let activeAnalyticsFetchPromise = null;

// Custom Theme-Aware Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const name = data.name || label;
    const color = data.color || data.payload?.fill || "#6366f1";

    return (
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1 z-50">
        <div className="font-semibold text-foreground flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="truncate max-w-[200px]">{name}</span>
        </div>
        <div className="text-muted-foreground flex items-center justify-between gap-4 font-mono">
          <span>Total:</span>
          <span className="font-bold text-foreground">
            {value.toLocaleString()} {unit}
          </span>
        </div>
        {data.payload?.percentage !== undefined && (
          <div className="text-[11px] text-muted-foreground flex items-center justify-between gap-4 font-mono">
            <span>Share:</span>
            <span className="text-primary font-semibold">
              {data.payload.percentage}%
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function AnalyticsView({ currentUser, navigate }) {
  const [analyticsData, setAnalyticsData] = useState(() => analyticsDataCache.data || null);
  const [isLoading, setIsLoading] = useState(() => !analyticsDataCache.data);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date(analyticsDataCache.timestamp || Date.now()));
  const hasMountedRef = useRef(false);

  // Dedicated data loader consuming the single MongoDB Aggregation Pipeline endpoint
  const loadAnalyticsData = useCallback(async (isManualRefresh = false) => {
    // If not an explicit manual refresh and we already have cached data, reuse it without making an API call
    if (!isManualRefresh && analyticsDataCache.data) {
      setAnalyticsData(analyticsDataCache.data);
      setIsLoading(false);
      return;
    }

    // If a fetch is already in flight and this isn't an explicit user refresh, await the ongoing request
    if (!isManualRefresh && activeAnalyticsFetchPromise) {
      try {
        const cached = await activeAnalyticsFetchPromise;
        if (cached) {
          setAnalyticsData(cached);
          setIsLoading(false);
        }
      } catch (err) {
        // Handled in original execution
      }
      return;
    }

    const token = localStorage.getItem("app_token");
    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!analyticsDataCache.data) {
      setIsLoading(true);
    }

    const fetchPromise = (async () => {
      // Single ultra-fast call to the backend MongoDB Aggregation Pipeline
      const res = await fetch(`${API_BASE_URL}/api/analytics`, { headers: authHeaders });
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.statusText}`);
      }
      const data = await res.json();

      const now = Date.now();
      analyticsDataCache = {
        data,
        timestamp: now,
      };


      return data;
    })();

    activeAnalyticsFetchPromise = fetchPromise;

    try {
      const data = await fetchPromise;
      setAnalyticsData(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load analytics aggregation:", err);
    } finally {
      activeAnalyticsFetchPromise = null;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch full data on initial mount ONLY if cache is completely empty
  useEffect(() => {
    if (analyticsDataCache.data) {
      setAnalyticsData(analyticsDataCache.data);
      setIsLoading(false);
      return;
    }

    if (hasMountedRef.current) return;
    hasMountedRef.current = true;

    loadAnalyticsData(false);
  }, [loadAnalyticsData]);

  // Loading Skeleton State for initial fetch
  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6 w-full max-w-[1920px] mx-auto pb-12 animate-pulse">
        <div className="rounded-2xl border border-border bg-card p-8 h-36 flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-6 w-64 bg-muted rounded-md" />
            <div className="h-4 w-96 bg-muted/60 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-xs text-muted-foreground font-mono">Running MongoDB Aggregations…</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 h-36 space-y-3">
              <div className="h-4 w-28 bg-muted rounded-md" />
              <div className="h-8 w-20 bg-muted/70 rounded-md" />
              <div className="h-2 w-full bg-muted/40 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-6 h-80" />
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 h-80" />
        </div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || {
    totalProj: 0,
    totalEmp: 0,
    completedCount: 0,
    inProgressCount: 0,
    pendingCount: 0,
    delayedCount: 0,
    totalAllottedHours: 0,
    overdueCount: 0,
    assignedEmpCount: 0,
    unassignedEmpCount: 0,
    completionRate: 0,
    utilizationRate: 0,
    avgHours: 0,
  };

  const statusChartData = (analyticsData?.statusChartData || []).map((s, idx) => ({
    ...s,
    color: STATUS_COLORS[s.name] || PALETTE[idx % PALETTE.length],
  }));

  const departmentChartData = (analyticsData?.departmentChartData || []).map((d, idx) => ({
    ...d,
    color: PALETTE[idx % PALETTE.length],
  }));

  const languageChartData = (analyticsData?.languageChartData || []).map((l, idx) => ({
    ...l,
    fill: PALETTE[idx % PALETTE.length],
  }));

  const databaseChartData = (analyticsData?.databaseChartData || []).map((db, idx) => ({
    ...db,
    fill: PALETTE[(idx + 3) % PALETTE.length],
  }));

  const topHoursProjects = (analyticsData?.topHoursProjects || []).map((p, idx) => ({
    ...p,
    fill: PALETTE[idx % PALETTE.length],
  }));

  const topContributors = analyticsData?.topContributors || [];
  const unassignedEmployees = analyticsData?.unassignedEmployees || [];

  return (
    <div className="space-y-6 2xl:space-y-8 w-full max-w-[1920px] 2xl:max-w-none mx-auto pb-12 animate-in fade-in duration-300">
      {/* ==================== HERO & CONTROL BAR ==================== */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" /> High-Performance Aggregation
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Analytics & Insights Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Cross-portfolio analytics, workforce allocation metrics, and technical stack distribution powered by MongoDB Aggregations.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono h-8 px-3">
              {kpis.totalProj.toLocaleString()} Projects • {kpis.totalEmp.toLocaleString()} Employees
            </Badge>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalyticsData(true)}
              disabled={isRefreshing}
              className="h-8 text-xs font-medium"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              {isRefreshing ? "Syncing…" : "Sync"}
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== 4 TOP KPI CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Total & Active Projects */}
        <Card className="relative overflow-hidden hover:border-primary/50 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Projects
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {kpis.totalProj.toLocaleString()}
              </div>
              <Badge variant="outline" className="text-[11px] font-mono border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                {kpis.completionRate}% Done
              </Badge>
            </div>
            {/* Progress Bar with all 4 project statuses */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${kpis.totalProj > 0 ? (kpis.completedCount / kpis.totalProj) * 100 : 0}%` }}
                title={`Completed: ${kpis.completedCount}`}
              />
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${kpis.totalProj > 0 ? (kpis.inProgressCount / kpis.totalProj) * 100 : 0}%` }}
                title={`In Progress: ${kpis.inProgressCount}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${kpis.totalProj > 0 ? (kpis.pendingCount / kpis.totalProj) * 100 : 0}%` }}
                title={`Pending: ${kpis.pendingCount}`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${kpis.totalProj > 0 ? (kpis.delayedCount / kpis.totalProj) * 100 : 0}%` }}
                title={`Delayed: ${kpis.delayedCount}`}
              />
            </div>
            {/* Status Breakdown distinguishing all 4 types (Done, Active, Pending, Delayed) */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5 truncate" title={`Done: ${kpis.completedCount}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="truncate">{kpis.completedCount} Done</span>
              </span>
              <span className="flex items-center gap-1.5 truncate" title={`In Progress: ${kpis.inProgressCount}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block shrink-0" />
                <span className="truncate">{kpis.inProgressCount} Active</span>
              </span>
              <span className="flex items-center gap-1.5 truncate" title={`Pending: ${kpis.pendingCount}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                <span className="truncate">{kpis.pendingCount} Pending</span>
              </span>
              <span className="flex items-center gap-1.5 truncate" title={`Delayed: ${kpis.delayedCount}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                <span className="truncate">{kpis.delayedCount} Delayed</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Workforce Allocation */}
        <Card className="relative overflow-hidden hover:border-primary/50 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workforce Capacity
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {kpis.totalEmp.toLocaleString()}
              </div>
              <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {kpis.utilizationRate}% Staffed
              </Badge>
            </div>
            {/* Progress */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${kpis.utilizationRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-emerald-500" />
                {kpis.assignedEmpCount.toLocaleString()} Assigned
              </span>
              <span className="flex items-center gap-1">
                <UserX className="h-3 w-3 text-amber-500" />
                {kpis.unassignedEmpCount.toLocaleString()} Available
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Allotted Hours */}
        <Card className="relative overflow-hidden hover:border-primary/50 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Budgeted Hours
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {kpis.totalAllottedHours.toLocaleString()}
                <span className="text-sm font-sans font-normal text-muted-foreground ml-1">hrs</span>
              </div>
              <Badge variant="secondary" className="text-[11px] font-mono">
                ~{kpis.avgHours} hrs/proj
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Cumulative time committed across client contracts
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Overdue & Deadline Risk */}
        <Card className="relative overflow-hidden hover:border-primary/50 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Deadline Risk & Overdue
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                kpis.overdueCount > 0
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {kpis.overdueCount > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div
                className={`text-3xl font-extrabold tracking-tight font-mono ${
                  kpis.overdueCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                }`}
              >
                {kpis.overdueCount.toLocaleString()}
              </div>
              <Badge
                variant={kpis.overdueCount > 0 ? "destructive" : "secondary"}
                className="text-[11px]"
              >
                {kpis.overdueCount > 0 ? "Needs Review" : "Healthy"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {kpis.overdueCount > 0
                ? `${kpis.overdueCount} active project(s) past scheduled delivery date`
                : "All in-flight projects are currently on track"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ==================== ROW 2: PRIMARY CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Status Donut Chart (5 Cols) */}
        <Card className="lg:col-span-5 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Project Status Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of all {kpis.totalProj.toLocaleString()} projects by current lifecycle phase
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <FolderKanban className="h-8 w-8 mb-2 opacity-30" />
                No project status data available
              </div>
            ) : (
              <div className="h-72 w-full flex flex-col justify-between">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip unit="projects" />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom Legend Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-muted-foreground font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-foreground shrink-0 ml-2">
                        {item.value.toLocaleString()}{" "}
                        <span className="text-[10px] text-muted-foreground font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Headcount Bar Chart (7 Cols) */}
        <Card className="lg:col-span-7 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  Workforce by Department
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of {kpis.totalEmp.toLocaleString()} employees across organizational units
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {departmentChartData.length} Departments
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {departmentChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Building2 className="h-8 w-8 mb-2 opacity-30" />
                No department data available
              </div>
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<CustomChartTooltip unit="employees" />} />
                    <Bar
                      dataKey="count"
                      name="Headcount"
                      radius={[6, 6, 0, 0]}
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`dept-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== ROW 3: TECH STACK & HOURS WORKLOAD ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Programming Languages (6 Cols) */}
        <Card className="lg:col-span-6 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-indigo-500" />
                  Primary Programming Languages
                </CardTitle>
                <CardDescription className="text-xs">
                  Frequency of languages adopted across project codebases
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {languageChartData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Code2 className="h-8 w-8 mb-2 opacity-30" />
                No language data specified in projects yet
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={languageChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={80}
                      className="text-muted-foreground font-medium"
                    />
                    <Tooltip content={<CustomChartTooltip unit="projects" />} />
                    <Bar
                      dataKey="count"
                      name="Projects"
                      radius={[0, 6, 6, 0]}
                    >
                      {languageChartData.map((entry, index) => (
                        <Cell key={`lang-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Technologies (6 Cols) */}
        <Card className="lg:col-span-6 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Database className="h-4 w-4 text-cyan-500" />
                  Database Architectures
                </CardTitle>
                <CardDescription className="text-xs">
                  Data storage engines configured across projects
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {databaseChartData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Database className="h-8 w-8 mb-2 opacity-30" />
                No database data specified in projects yet
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={databaseChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={80}
                      className="text-muted-foreground font-medium"
                    />
                    <Tooltip content={<CustomChartTooltip unit="projects" />} />
                    <Bar
                      dataKey="count"
                      name="Projects"
                      radius={[0, 6, 6, 0]}
                    >
                      {databaseChartData.map((entry, index) => (
                        <Cell key={`db-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== ROW 4: TOP ALLOCATED PROJECTS & CONTRIBUTORS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Projects by Allocated Hours (7 Cols) */}
        <Card className="lg:col-span-7 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  Highest Budgeted Workloads
                </CardTitle>
                <CardDescription className="text-xs">
                  Key projects ranked by total committed hours
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1 text-primary"
                onClick={() => navigate("/projects")}
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topHoursProjects.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Clock className="h-8 w-8 mb-2 opacity-30" />
                No allotted hours logged for active projects
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topHoursProjects}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      unit="h"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1">
                              <div className="font-bold text-foreground">{data.fullName}</div>
                              <div className="text-muted-foreground">Client: {data.client}</div>
                              <div className="text-muted-foreground">Status: {data.status}</div>
                              <div className="text-primary font-mono font-bold pt-1">
                                {data.hours.toLocaleString()} Allotted Hours
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      name="Hours"
                      radius={[6, 6, 0, 0]}
                    >
                      {topHoursProjects.map((entry, index) => (
                        <Cell key={`proj-h-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Assigned Workforce Leaders (5 Cols) */}
        <Card className="lg:col-span-5 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  Key Resource Contributors
                </CardTitle>
                <CardDescription className="text-xs">
                  Team members leading the highest volume of client projects
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1 text-primary"
                onClick={() => navigate("/employees")}
              >
                Directory <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topContributors.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-xs">
                <Users className="h-8 w-8 mb-2 opacity-30" />
                No employee assignments found
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {topContributors.map((emp, index) => (
                  <div
                    key={emp.id || index}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-xs overflow-hidden">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (emp.name || "EM")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {emp.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                          <span>{emp.employeeId || `EMP-${index + 1}`}</span>
                          <span>•</span>
                          <span className="text-primary/90">{emp.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge
                        variant={emp.assignedCount > 0 ? "secondary" : "outline"}
                        className="font-mono text-xs"
                      >
                        {emp.assignedCount} {emp.assignedCount === 1 ? "project" : "projects"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== ROW 5: UNASSIGNED EMPLOYEES ==================== */}
      {unassignedEmployees.length > 0 && (
        <Card className="border-dashed shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                  <UserX className="h-4 w-4 text-amber-500" />
                  Available Workforce Members ({kpis.unassignedEmpCount.toLocaleString()} Unassigned)
                </CardTitle>
                <CardDescription className="text-xs">
                  Team members currently with zero active assignments who can be staffed on new projects
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => navigate("/employees")}
              >
                Assign Staff
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {unassignedEmployees.map((emp, idx) => (
                <div
                  key={emp.id || idx}
                  className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-center flex flex-col items-center hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate("/employees")}
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground mb-1.5 overflow-hidden border border-border">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name} className="h-full w-full object-cover" />
                    ) : (
                      (emp.name || "U").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="text-xs font-medium text-foreground truncate w-full">{emp.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate w-full">{emp.department}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default AnalyticsView;
