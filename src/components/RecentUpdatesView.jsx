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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  RefreshCw,
  ListFilter,
  LayoutGrid,
  Eye,
  FileText,
  History,
  Check,
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
  const itemsPerPage = 8; // Fetch 8 projects per page to yield ~15-25 flat log rows per page
  const [viewMode, setViewMode] = useState("table"); // Option A: Log Table is the primary, default view
  const [activeLogModal, setActiveLogModal] = useState(null); // For clicking "View" on any log row
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

  // Infinite Scroll Project Dropdown States
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectDropdownOptions, setProjectDropdownOptions] = useState([]);
  const [projectDropdownPage, setProjectDropdownPage] = useState(1);
  const [hasMoreProjectOptions, setHasMoreProjectOptions] = useState(true);
  const [isLoadingProjectOptions, setIsLoadingProjectOptions] = useState(false);
  const [projectDropdownSearch, setProjectDropdownSearch] = useState("");
  const [debouncedProjectDropdownSearch, setDebouncedProjectDropdownSearch] = useState("");
  const [totalProjectOptionsCount, setTotalProjectOptionsCount] = useState(0);
  const projectDropdownRef = useRef(null);
  const isFetchingOptionsRef = useRef(false);
  const hasLoadedInitialOptionsRef = useRef(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target)
      ) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  // Debounce search within project dropdown
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProjectDropdownSearch(projectDropdownSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [projectDropdownSearch]);

  // Fetch paginated project dropdown options from dedicated endpoint
  const fetchProjectDropdownOptions = async (page = 1, search = "", append = false) => {
    if (isFetchingOptionsRef.current) return;
    isFetchingOptionsRef.current = true;
    setIsLoadingProjectOptions(true);

    try {
      const token = localStorage.getItem("app_token");
      const url = new URL(`${API_BASE_URL}/api/projects/dropdown-options`);
      url.searchParams.append("page", String(page));
      url.searchParams.append("limit", "25");
      if (search.trim()) {
        url.searchParams.append("search", search.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTotalProjectOptionsCount(data.totalCount || 0);
        setHasMoreProjectOptions(!!data.hasMore);
        setProjectDropdownPage(page);

        if (append) {
          setProjectDropdownOptions((prev) => {
            const seen = new Set(prev.map((o) => o.id));
            const newItems = (data.options || []).filter((o) => !seen.has(o.id));
            return [...prev, ...newItems];
          });
        } else {
          setProjectDropdownOptions(data.options || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch project dropdown options:", err);
    } finally {
      setIsLoadingProjectOptions(false);
      isFetchingOptionsRef.current = false;
    }
  };

  // Fetch only when dropdown is opened for the first time
  useEffect(() => {
    if (isProjectDropdownOpen && !hasLoadedInitialOptionsRef.current) {
      hasLoadedInitialOptionsRef.current = true;
      fetchProjectDropdownOptions(1, debouncedProjectDropdownSearch, false);
    }
  }, [isProjectDropdownOpen, debouncedProjectDropdownSearch]);

  // When search changes while dropdown is open, re-fetch search results
  useEffect(() => {
    if (isProjectDropdownOpen && hasLoadedInitialOptionsRef.current) {
      fetchProjectDropdownOptions(1, debouncedProjectDropdownSearch, false);
    }
  }, [debouncedProjectDropdownSearch, isProjectDropdownOpen]);

  // Scroll handler: fetch next batch when user scrolls near the bottom of dropdown list
  const handleProjectDropdownScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop - clientHeight < 35 &&
      hasMoreProjectOptions &&
      !isLoadingProjectOptions
    ) {
      fetchProjectDropdownOptions(
        projectDropdownPage + 1,
        debouncedProjectDropdownSearch,
        true
      );
    }
  };

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

  // Helper to compute relative time (e.g. "5m ago", "2h ago", "3d ago")
  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return `${Math.floor(diffSec / 604800)}w ago`;
  };

  // Option A: Flatten every timely update into an individual log row for the Log Table
  const flatLogs = useMemo(() => {
    const list = [];
    (feedProjects || []).forEach((project) => {
      const updates = Array.isArray(project.timelyUpdates) ? project.timelyUpdates : [];
      if (updates.length === 0) {
        if (selectedCategory === "no-updates") {
          list.push({
            id: `no-update-${project._id || project.id}`,
            projectId: project._id || project.id,
            projectName: project.name,
            clientName: project.clientName,
            projectStatus: project.status,
            title: "No Updates Logged",
            description: "No timely observations or system updates recorded yet for this project.",
            category: "no-updates",
            date: project.createdAt || project.updatedAt,
            loggedBy: "System",
            isPlaceholder: true,
          });
        }
      } else {
        updates.forEach((u, idx) => {
          if (selectedCategory !== "all" && selectedCategory !== "no-updates") {
            if (String(u.category || "").toLowerCase() !== selectedCategory.toLowerCase()) {
              return;
            }
          }
          list.push({
            id: u._id || u.id || `${project._id || project.id}-${idx}`,
            projectId: project._id || project.id,
            projectName: project.name,
            clientName: project.clientName,
            projectStatus: project.status,
            title: u.title || "Untitled Log Entry",
            description: u.description || "",
            category: u.category || "observation",
            date: u.date || u.createdAt,
            loggedBy: u.loggedBy || "Staff Member",
            rawUpdate: u,
          });
        });
      }
    });

    // Sort strictly chronological: newest log first
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [feedProjects, selectedCategory]);

  // Process current page projects to prepare updates and latest update timestamp
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

  // Label to display on the Project filter button
  const selectedProjectLabel = useMemo(() => {
    if (selectedProject === "all") {
      const count = totalProjectOptionsCount || feedStats.totalProjects || totalProjectsCount;
      return count > 0 ? `All Projects (${count})` : "All Projects";
    }
    const found = projectDropdownOptions.find((p) => p.id === selectedProject);
    if (found) return found.name;
    const fromProps = (projects || []).find((p) => (p.id || p._id) === selectedProject);
    if (fromProps) return fromProps.name;
    return selectedProject;
  }, [selectedProject, projectDropdownOptions, totalProjectOptionsCount, feedStats.totalProjects, totalProjectsCount, projects]);

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
      <Card className="p-4 space-y-3 overflow-visible">
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

            {/* Project Dropdown with Infinite Scroll */}
            <div className="flex items-center gap-1.5 relative" ref={projectDropdownRef}>
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                <Briefcase className="w-3.5 h-3.5" /> Project:
              </span>

              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground hover:bg-muted/40 transition-colors flex items-center justify-between gap-2 max-w-[220px] min-w-[170px] cursor-pointer"
                title={selectedProjectLabel}
              >
                <span className="truncate text-left font-medium">
                  {selectedProjectLabel}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isProjectDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Popover Menu with Infinite Scroll & Search */}
              {isProjectDropdownOpen && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-80 sm:w-96 rounded-xl border border-border/80 dark:border-zinc-700 bg-card dark:bg-zinc-950 text-foreground shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in-50 zoom-in-95">
                  {/* Search within dropdown */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      value={projectDropdownSearch}
                      onChange={(e) => setProjectDropdownSearch(e.target.value)}
                      className="h-8 pl-8 pr-2.5 text-xs bg-muted/50 dark:bg-zinc-900 border-border/70 dark:border-zinc-700 focus-visible:ring-1"
                      autoFocus
                    />
                  </div>

                  {/* Scrollable Project List */}
                  <div
                    onScroll={handleProjectDropdownScroll}
                    className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin"
                  >
                    {/* "All Projects" Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProject("all");
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                        selectedProject === "all"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                          : "hover:bg-muted/70 dark:hover:bg-zinc-800 text-foreground"
                      }`}
                    >
                      <span className="truncate font-medium">All Projects</span>
                      {selectedProject === "all" && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-1.5" />
                      )}
                    </button>

                    {/* Loaded Project Options */}
                    {projectDropdownOptions.map((p) => {
                      const isSelected = selectedProject === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProject(p.id);
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                            isSelected
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                              : "hover:bg-muted/70 dark:hover:bg-zinc-800 text-foreground"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-medium text-foreground">{p.name}</div>
                            {p.clientName && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                Client: {p.clientName}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-1.5" />
                          )}
                        </button>
                      );
                    })}

                    {/* Loading indicator on scroll */}
                    {isLoadingProjectOptions && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                        <span>Loading more projects...</span>
                      </div>
                    )}

                    {/* Reached end indicator */}
                    {!isLoadingProjectOptions && !hasMoreProjectOptions && projectDropdownOptions.length > 0 && (
                      <div className="text-center py-2 text-[10.5px] text-muted-foreground/70 border-t border-border/40 mt-1">
                        All {totalProjectOptionsCount} projects loaded
                      </div>
                    )}

                    {/* Empty search results */}
                    {!isLoadingProjectOptions && projectDropdownOptions.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        No projects match "{projectDropdownSearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills Bar & View Mode Switcher */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 flex-wrap">
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
                className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* View Mode Switcher: Option A Log Table vs Project Cards */}
          <div className="flex items-center gap-1 border border-border/80 p-0.5 rounded-lg bg-muted/40 shrink-0">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-6 text-[11px] px-2.5 gap-1.5 rounded-md"
              title="Dedicated Log Table View"
            >
              <ListFilter className="w-3 h-3" />
              <span>Log Table</span>
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-6 text-[11px] px-2.5 gap-1.5 rounded-md"
              title="Project Cards View"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </Button>
          </div>
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
          {viewMode === "table" ? (
            /* Option A: Dedicated Activity & Observation Log Table */
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-border/70 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <ListFilter className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      Timely Updates & Observation Logs
                      <Badge variant="outline" className="text-[10.5px] font-mono py-0 h-4 px-1.5 bg-background">
                        {flatLogs.length} on this page
                      </Badge>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Chronological stream of individual updates, observations, and cases logged across projects.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Click any row for full log details</span>
                </div>
              </div>

              {flatLogs.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold">No Log Entries Found</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No timely updates match the current filter or category on this page.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent border-border/70">
                        <TableHead className="w-[180px] text-xs font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            Date & Time
                          </div>
                        </TableHead>
                        <TableHead className="w-[130px] text-xs font-bold text-foreground">
                          Category
                        </TableHead>
                        <TableHead className="min-w-[280px] text-xs font-bold text-foreground">
                          Update Title & Summary
                        </TableHead>
                        <TableHead className="w-[220px] text-xs font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                            Project & Client
                          </div>
                        </TableHead>
                        <TableHead className="w-[180px] text-xs font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            Logged By
                          </div>
                        </TableHead>
                        <TableHead className="w-[90px] text-right text-xs font-bold text-foreground">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flatLogs.map((log) => {
                        const relativeTime = getTimeAgo(log.date);
                        return (
                          <TableRow
                            key={log.id}
                            onClick={() => !log.isPlaceholder && setActiveLogModal(log)}
                            className={`border-border/60 transition-colors ${
                              log.isPlaceholder
                                ? "opacity-60 bg-muted/10 cursor-default"
                                : "cursor-pointer hover:bg-muted/50"
                            }`}
                          >
                            {/* Date & Time Column */}
                            <TableCell className="align-top py-3 font-mono text-[11px]">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground/90 whitespace-nowrap">
                                  {formatDate(log.date)}
                                </span>
                                {relativeTime && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {relativeTime}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Category Badge Column */}
                            <TableCell className="align-top py-3">
                              {log.isPlaceholder ? (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground py-0 h-4">
                                  No Logs
                                </Badge>
                              ) : (
                                getCategoryBadge(log.category)
                              )}
                            </TableCell>

                            {/* Title & Description Column */}
                            <TableCell className="align-top py-3">
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <span className="line-clamp-1">{log.title}</span>
                                </div>
                                {log.description && (
                                  <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {log.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            {/* Project & Client Column */}
                            <TableCell className="align-top py-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-foreground line-clamp-1" title={log.projectName}>
                                  {log.projectName}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                  <span className="truncate max-w-[120px]">{log.clientName || "N/A"}</span>
                                  <span>•</span>
                                  {getStatusBadge(log.projectStatus)}
                                </div>
                              </div>
                            </TableCell>

                            {/* Logged By Column */}
                            <TableCell className="align-top py-3 text-xs">
                              <div className="flex items-center gap-1.5 text-foreground/90 font-medium truncate max-w-[170px]" title={log.loggedBy}>
                                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {(log.loggedBy || "U").charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate">{log.loggedBy || "User"}</span>
                              </div>
                            </TableCell>

                            {/* Action Button */}
                            <TableCell className="align-top py-3 text-right">
                              {!log.isPlaceholder ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveLogModal(log);
                                  }}
                                  className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </Button>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          ) : (
            /* Cards View */
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
          )}

          {/* Server-Side Pagination Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6 mt-6">
            <div className="text-xs text-muted-foreground">
              Showing projects <span className="font-semibold text-foreground">{totalProjectsCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, totalProjectsCount)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{totalProjectsCount}</span> total (Page {currentPage} of {totalPagesCount})
              {viewMode === "table" && (
                <span className="ml-2 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  • {flatLogs.length} updates on this page
                </span>
              )}
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

      {/* Log Details Modal (Option A) */}
      <Dialog open={!!activeLogModal} onOpenChange={(open) => !open && setActiveLogModal(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {activeLogModal && (
            <>
              <DialogHeader className="space-y-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(activeLogModal.category)}
                  <Badge variant="outline" className="text-[10.5px] font-mono">
                    {formatDate(activeLogModal.date)}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {activeLogModal.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update logged for project <strong className="text-foreground">{activeLogModal.projectName}</strong>
                </DialogDescription>
              </DialogHeader>

              {/* Full Description & Metadata */}
              <div className="py-3 space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Log Entry Description
                  </h4>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans">
                    {activeLogModal.description || "No detailed description provided for this log entry."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-card border border-border/70 text-xs">
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Project</span>
                    <strong className="text-foreground font-medium truncate block">{activeLogModal.projectName}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Client</span>
                    <strong className="text-foreground font-medium truncate block">{activeLogModal.clientName || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Author / Logged By</span>
                    <strong className="text-foreground font-medium truncate block">{activeLogModal.loggedBy || "Staff"}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-muted-foreground block">Project Status</span>
                    <div className="pt-0.5">{getStatusBadge(activeLogModal.projectStatus)}</div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveLogModal(null);
                    navigate && navigate("/projects");
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span>Open in Projects</span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveLogModal(null)}
                  className="text-xs px-4"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RecentUpdatesView;
