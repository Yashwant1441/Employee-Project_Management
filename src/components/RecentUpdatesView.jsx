import React, { useState, useMemo, useEffect, useRef } from "react";
import API_BASE_URL from "../api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Search,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Users,
  ChevronRight,
  ChevronDown,
  Filter,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpRight,
  Activity,
  Tag,
  Loader2,
  RefreshCw
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Module-level persistent cache across route changes and in-flight promise deduplication
const feedPageCache = new Map();
const activeFeedFetchPromises = new Map();
const CACHE_TTL_MS = 60 * 1000; // Cache for 60 seconds

export const invalidateRecentUpdatesCache = () => {
  feedPageCache.clear();
  activeFeedFetchPromises.clear();
};

export const updateRecentUpdatesProjectTimelyUpdates = (projectId, timelyUpdates) => {
  feedPageCache.forEach((entry) => {
    if (entry && Array.isArray(entry.projects)) {
      entry.projects = entry.projects.map((p) =>
        String(p._id || p.id) === String(projectId)
          ? { ...p, timelyUpdates }
          : p
      );
      entry.timestamp = Date.now();
    }
  });
};

export function RecentUpdatesView({ projects = [], employees = [], navigate }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // User requirement: strictly 4 projects timely update per page
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(1);
  const [feedStats, setFeedStats] = useState({
    totalProjects: 0,
    projectsWithUpdates: 0,
    totalUpdates: 0,
    mostRecentDate: null,
  });
  const [serverProjectOptions, setServerProjectOptions] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [expandedProjects, setExpandedProjects] = useState({});

  const [feedProjects, setFeedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search input by 400ms to avoid flooding requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const prevFiltersRef = useRef({
    search: debouncedSearch,
    category: selectedCategory,
    employee: selectedEmployee,
    project: selectedProject,
  });

  const fetchRecentUpdatesFeed = async (page = currentPage, force = false) => {
    const searchVal = debouncedSearch.trim();
    const cacheKey = `${page}_${itemsPerPage}_${searchVal.toLowerCase()}_${selectedCategory}_${selectedEmployee}_${selectedProject}`;
    const cached = feedPageCache.get(cacheKey);
    const isCacheValid = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

    if (!force && isCacheValid) {
      setFeedProjects(cached.projects);
      setTotalProjectsCount(cached.pagination?.totalProjects || 0);
      setTotalPagesCount(cached.pagination?.totalPages || 1);
      if (cached.stats) setFeedStats(cached.stats);
      if (cached.projectOptions && cached.projectOptions.length > 0) {
        setServerProjectOptions(cached.projectOptions);
      }
      setIsLoading(false);
      return;
    }

    if (force) {
      setIsRefreshing(true);
    } else if (!cached) {
      setIsLoading(true);
    }

    try {
      if (!activeFeedFetchPromises.has(cacheKey) || force) {
        const fetchPromise = (async () => {
          const token = localStorage.getItem("app_token");
          const queryParams = new URLSearchParams({
            page: String(page),
            limit: String(itemsPerPage),
            search: searchVal,
            category: selectedCategory,
            employee: selectedEmployee,
            project: selectedProject,
          });

          const res = await fetch(`${API_BASE_URL}/api/projects/recent-updates-feed?${queryParams.toString()}`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const data = await res.json();
          if (res.ok && data.projects) {
            const entry = {
              projects: data.projects,
              pagination: data.pagination || {
                totalProjects: data.projects.length,
                totalPages: 1,
                currentPage: page,
                limit: itemsPerPage,
              },
              stats: data.stats || null,
              projectOptions: data.projectOptions || [],
              timestamp: Date.now(),
            };
            feedPageCache.set(cacheKey, entry);
            return entry;
          }
          return null;
        })().finally(() => {
          activeFeedFetchPromises.delete(cacheKey);
        });

        activeFeedFetchPromises.set(cacheKey, fetchPromise);
      }

      const result = await activeFeedFetchPromises.get(cacheKey);
      if (result) {
        setFeedProjects(result.projects);
        setTotalProjectsCount(result.pagination?.totalProjects || 0);
        setTotalPagesCount(result.pagination?.totalPages || 1);
        if (result.stats) setFeedStats(result.stats);
        if (result.projectOptions && result.projectOptions.length > 0) {
          setServerProjectOptions(result.projectOptions);
        }
      }
    } catch (err) {
      console.error("Failed to fetch recent updates feed:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filterChanged =
      prev.search !== debouncedSearch ||
      prev.category !== selectedCategory ||
      prev.employee !== selectedEmployee ||
      prev.project !== selectedProject;

    if (filterChanged) {
      prevFiltersRef.current = {
        search: debouncedSearch,
        category: selectedCategory,
        employee: selectedEmployee,
        project: selectedProject,
      };
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    fetchRecentUpdatesFeed(currentPage);
  }, [currentPage, debouncedSearch, selectedCategory, selectedEmployee, selectedProject]);

  const toggleExpand = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const getUpdateTimestamp = (u) => {
    if (!u) return 0;
    const now = Date.now();
    let cTime = u.createdAt ? new Date(u.createdAt).getTime() : 0;
    let dTime = u.date ? new Date(u.date).getTime() : 0;
    if (cTime > now) cTime = now - 60000;
    if (dTime > now) dTime = now - 60000;
    return Math.max(cTime, dTime);
  };

  // Process current page projects (strictly 4) to prepare updates and latest update timestamp
  const processedProjects = useMemo(() => {
    return (feedProjects || []).map((project) => {
      const updates = Array.isArray(project.timelyUpdates) ? project.timelyUpdates : [];
      // Index 0 is always the newest update (unshifted on creation)
      const latestUpdateObj = updates.length > 0 ? updates[0] : null;
      const latestTimestamp = latestUpdateObj ? getUpdateTimestamp(latestUpdateObj) : 0;

      return {
        ...project,
        updatesList: updates,
        latestTimestamp,
        latestUpdateObj,
        hasUpdates: updates.length > 0,
      };
    });
  }, [feedProjects]);

  // Server-side query has already filtered and sorted the projects
  const filteredProjects = processedProjects;

  // Extract unique employee names for filtering strictly from registered employees
  const employeeOptions = useMemo(() => {
    const names = (employees || [])
      .map((e) => (e && e.name ? e.name.trim() : ""))
      .filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [employees]);

  // Extract unique projects for filtering from server project options & props
  const projectOptions = useMemo(() => {
    const map = new Map();
    (serverProjectOptions || []).forEach((p) => {
      if (p && p.name) {
        map.set(p.name, { id: p.id || p._id || p.name, name: p.name });
      }
    });
    (projects || []).forEach((p) => {
      if (p && p.name && !map.has(p.name)) {
        map.set(p.name, { id: p.id || p._id || p.name, name: p.name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [serverProjectOptions, projects]);

  const getPageNumbers = () => {
    if (totalPagesCount <= 7) {
      return Array.from({ length: totalPagesCount }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "ellipsis-end", totalPagesCount);
    } else if (currentPage >= totalPagesCount - 3) {
      pages.push(1, "ellipsis-start", totalPagesCount - 4, totalPagesCount - 3, totalPagesCount - 2, totalPagesCount - 1, totalPagesCount);
    } else {
      pages.push(1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPagesCount);
    }
    return pages;
  };

  const formatDate = (item) => {
    if (!item) return "N/A";
    let d;
    if (typeof item === "object") {
      const ts = getUpdateTimestamp(item);
      d = ts ? new Date(ts) : new Date(item.createdAt || item.date);
    } else {
      d = new Date(item);
    }
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryBadge = (category) => {
    const cat = (category || "observation").toLowerCase();
    switch (cat) {
      case "case":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold gap-1">
            <AlertCircle className="w-3 h-3" /> Case / Issue
          </Badge>
        );
      case "system":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[11px] font-semibold gap-1">
            <Sparkles className="w-3 h-3" /> System Log
          </Badge>
        );
      default:
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[11px] font-semibold gap-1">
            <MessageSquare className="w-3 h-3" /> Observation
          </Badge>
        );
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || "Pending").toLowerCase();
    if (st.includes("completed")) {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
          Completed
        </Badge>
      );
    }
    if (st.includes("progress")) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">
          In Progress
        </Badge>
      );
    }
    if (st.includes("delayed")) {
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs">
          Delayed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 text-xs">
        {status || "Pending"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 2xl:space-y-8 w-full max-w-[1920px] 2xl:max-w-none mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner shrink-0">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Recent Timely Updates
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs">
                  Live Feed
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                View all projects ordered by their most recent timely updates, observations, and cases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecentUpdatesFeed(true)}
              disabled={isRefreshing}
              className="gap-1.5 h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              title="Refresh updates feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate && navigate("/projects")}
              className="gap-2 h-8 text-xs"
            >
              <Briefcase className="w-4 h-4 text-primary" /> Manage Projects
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">
                {feedStats.projectsWithUpdates} / {feedStats.totalProjects || totalProjectsCount}
              </div>
              <div className="text-xs text-muted-foreground">Projects with Updates Logged</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{feedStats.totalUpdates}</div>
              <div className="text-xs text-muted-foreground">Total Timely Log Entries</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">
                {feedStats.mostRecentDate
                  ? formatDate(feedStats.mostRecentDate)
                  : processedProjects.find((p) => p.hasUpdates)?.latestUpdateObj
                  ? formatDate(processedProjects.find((p) => p.hasUpdates).latestUpdateObj.date)
                  : "No recent updates"}
              </div>
              <div className="text-xs text-muted-foreground">Most Recent Log Activity</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects or updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Employee & Project Dropdown Filters */}
          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
            {/* Employee Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                <Users className="w-3.5 h-3.5" /> Employee:
              </span>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="all">All Employees ({employeeOptions.length})</option>
                {employeeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                <Briefcase className="w-3.5 h-3.5" /> Project:
              </span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">All Projects ({projectOptions.length})</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="h-7 text-xs px-2.5 rounded-full"
          >
            All Logs
          </Button>
          <Button
            variant={selectedCategory === "observation" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("observation")}
            className="h-7 text-xs px-2.5 rounded-full"
          >
            Observations
          </Button>
          <Button
            variant={selectedCategory === "case" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("case")}
            className="h-7 text-xs px-2.5 rounded-full"
          >
            Cases / Issues
          </Button>
          <Button
            variant={selectedCategory === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("system")}
            className="h-7 text-xs px-2.5 rounded-full"
          >
            System
          </Button>
          <Button
            variant={selectedCategory === "no-updates" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("no-updates")}
            className="h-7 text-xs px-2.5 rounded-full text-muted-foreground"
          >
            No Updates Yet
          </Button>

          {(searchQuery || selectedCategory !== "all" || selectedEmployee !== "all" || selectedProject !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedEmployee("all");
                setSelectedProject("all");
              }}
              className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 ml-auto"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Projects List Feed */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs text-muted-foreground font-medium">
              Fetching latest project timely updates...
            </p>
          </div>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">No Projects Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              No project match your search criteria or category filter. Try clearing your filter or search query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedEmployee("all");
                setSelectedProject("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
            {filteredProjects.map((project) => {
            const isExpanded = !!expandedProjects[project.id || project._id];
            const latest = project.latestUpdateObj;

            return (
              <Card
                key={project.id || project._id}
                className={`transition-all border-border/80 hover:border-border flex flex-col justify-between overflow-hidden h-full ${
                  project.hasUpdates ? "bg-card shadow-sm" : "bg-card/50 opacity-90"
                }`}
              >
                <div>
                  {/* Project Header */}
                  <div className="p-4 border-b border-border/50 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                          <Briefcase className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate" title={project.name}>
                            {project.name}
                          </h3>
                          <div className="text-[11px] text-muted-foreground truncate">
                            Client: <strong className="text-foreground/90">{project.clientName || "N/A"}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(project.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 text-[11px] text-muted-foreground">
                      <span>Total Updates: <strong className="text-foreground/90">{project.updatesList.length}</strong></span>
                      {project.hasUpdates ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 font-mono py-0 h-4">
                          <Clock className="w-2.5 h-2.5" /> Latest: {formatDate(latest)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono py-0 h-4">
                          No Updates
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Latest Update Content */}
                  {project.hasUpdates && latest && (
                    <div className="p-4 bg-muted/40 border-l-4 border-l-emerald-500 space-y-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getCategoryBadge(latest.category)}
                          <span className="text-xs font-bold text-foreground">
                            {latest.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono shrink-0">
                          <Calendar className="w-2.5 h-2.5" /> {formatDate(latest)}
                        </span>
                      </div>

                      {latest.description && (
                        <p className="text-xs text-foreground/80 leading-relaxed bg-card/70 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {latest.description}
                        </p>
                      )}

                      <div className="text-[10.5px] text-muted-foreground pt-0.5 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-2.5 h-2.5 text-primary shrink-0" /> Logged by: <strong className="text-foreground/90 truncate">{latest.loggedBy || "User"}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No Updates Placeholder */}
                  {!project.hasUpdates && (
                    <div className="p-4 text-xs text-muted-foreground space-y-2 bg-muted/20">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold text-foreground/80">No Timely Updates Logged</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Observations or cases logged for this project will appear here automatically.
                      </p>
                    </div>
                  )}

                  {/* Historical Updates List (Expanded inside card) */}
                  {isExpanded && project.hasUpdates && (
                    <div className="p-3 bg-card border-t border-border/60 space-y-2.5 animate-in fade-in duration-200">
                      <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-primary" /> Log History ({project.updatesList.length})
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {project.updatesList.map((item, idx) => (
                          <div
                            key={item._id || item.id || idx}
                            className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1 hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                {getCategoryBadge(item.category)}
                                <span className="font-semibold text-foreground">{item.title}</span>
                              </div>
                              <span className="text-[9.5px] text-muted-foreground font-mono">
                                {formatDate(item)}
                              </span>
                            </div>

                            {item.description && (
                              <p className="text-muted-foreground text-[11px] leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            <div className="text-[9.5px] text-muted-foreground/80 flex items-center gap-1 pt-0.5">
                              <User className="w-2.5 h-2.5" /> Logged by: {item.loggedBy || "User"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-2 mt-auto">
                  {project.hasUpdates ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(project.id || project._id)}
                      className="text-xs gap-1 h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <>
                          Hide History <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                        </>
                      ) : (
                        <>
                          History ({project.updatesList.length}) <ChevronDown className="w-3 h-3 transition-transform" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">No logs yet</span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate && navigate("/projects")}
                    className="text-xs gap-1 h-7 px-2.5"
                  >
                    Open Project <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Server-Side Pagination Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6 mt-6">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{totalProjectsCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-semibold text-foreground">
              {Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, totalProjectsCount)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalProjectsCount}</span> projects (Page {currentPage} of {totalPagesCount})
          </div>

          {totalPagesCount > 1 && (
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {getPageNumbers().map((pageItem, index) => {
                  if (pageItem === "ellipsis-start" || pageItem === "ellipsis-end" || pageItem === "ellipsis") {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return (
                    <PaginationItem key={pageItem}>
                      <PaginationLink
                        isActive={pageItem === currentPage}
                        onClick={() => setCurrentPage(pageItem)}
                        className="cursor-pointer"
                      >
                        {pageItem}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPagesCount))}
                    disabled={currentPage === totalPagesCount}
                    className={currentPage === totalPagesCount ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </>
      )}
    </div>
  );
}

export default RecentUpdatesView;
