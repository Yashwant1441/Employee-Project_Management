import React, { useState, useRef, useEffect } from "react";
import API_BASE_URL from "../api";
import { KanbanBoard } from "./KanbanBoard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { NotificationModal } from "@/components/ui/NotificationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Users,
  Database,
  Code2,
  Palette,
  Cloud,
  FileText,
  Plus,
  Search,
  Maximize2,
  Edit3,
  Trash2,
  DollarSign,
  UserCheck,
  Server,
  Layers,
  ChevronRight,
  ChevronDown,
  Rocket,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Settings,
  Package,
  Terminal,
  Cpu,
  Folder,
  FolderPlus,
  FolderOpen,
  File,
  Upload,
  Download,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Check,
  Bot,
  Sparkles,
  GitBranch,
  Flame,
  Workflow,
  LayoutGrid,
  Kanban,
} from "lucide-react";

const PROJECT_ICON_PRESETS = [
  { key: "briefcase", label: "Briefcase", icon: Briefcase, color: "text-blue-500" },
  { key: "rocket", label: "Rocket", icon: Rocket, color: "text-amber-500" },
  { key: "bot", label: "AI / Bot", icon: Bot, color: "text-emerald-500" },
  { key: "code", label: "Code", icon: Code2, color: "text-indigo-500" },
  { key: "sparkles", label: "Innovation", icon: Sparkles, color: "text-purple-500" },
  { key: "globe", label: "Web", icon: Globe, color: "text-sky-500" },
  { key: "mobile", label: "Mobile", icon: Smartphone, color: "text-rose-500" },
  { key: "database", label: "Database", icon: Database, color: "text-cyan-500" },
  { key: "server", label: "Backend", icon: Server, color: "text-teal-500" },
  { key: "cloud", label: "Cloud", icon: Cloud, color: "text-blue-400" },
  { key: "git", label: "DevOps / Git", icon: GitBranch, color: "text-orange-500" },
  { key: "workflow", label: "Pipelines", icon: Workflow, color: "text-violet-500" },
  { key: "flame", label: "Priority", icon: Flame, color: "text-red-500" },
  { key: "shield", label: "Security", icon: Shield, color: "text-green-500" },
  { key: "zap", label: "Fast / API", icon: Zap, color: "text-yellow-500" },
  { key: "palette", label: "Design", icon: Palette, color: "text-pink-500" },
  { key: "package", label: "Product", icon: Package, color: "text-amber-600" },
  { key: "terminal", label: "CLI / System", icon: Terminal, color: "text-emerald-400" },
  { key: "layers", label: "Architecture", icon: Layers, color: "text-fuchsia-500" },
  { key: "cpu", label: "Hardware / Core", icon: Cpu, color: "text-blue-600" },
  { key: "folder", label: "General", icon: Folder, color: "text-slate-500" },
];

const renderProjectIcon = (iconStr, className = "h-5 w-5") => {
  if (!iconStr) return <Briefcase className={className} />;
  
  if (
    iconStr.startsWith("data:") ||
    iconStr.startsWith("http://") ||
    iconStr.startsWith("https://") ||
    iconStr.startsWith("/avatars/")
  ) {
    return <img src={iconStr} alt="Project Icon" className={`${className} object-cover rounded-md`} />;
  }

  const preset = PROJECT_ICON_PRESETS.find((p) => p.key === iconStr);
  if (preset) {
    const IconComp = preset.icon;
    return <IconComp className={`${className} ${preset.color || ""}`} />;
  }

  return <Briefcase className={className} />;
};

// Standard Public Holidays list (YYYY-MM-DD format)
const PUBLIC_HOLIDAYS = [
  // 2025
  "2025-01-01", "2025-01-26", "2025-03-14", "2025-03-31", "2025-04-18",
  "2025-05-01", "2025-08-15", "2025-10-02", "2025-10-20", "2025-11-05", "2025-12-25",
  // 2026
  "2026-01-01", "2026-01-26", "2026-03-04", "2026-03-20", "2026-04-03",
  "2026-04-14", "2026-05-01", "2026-08-15", "2026-10-02", "2026-10-20",
  "2026-11-08", "2026-12-25",
  // 2027
  "2027-01-01", "2027-01-26", "2027-03-22", "2027-03-26", "2027-05-01",
  "2027-08-15", "2027-10-02", "2027-10-29", "2027-12-25"
];

const getStatusBadge = (status) => {
  if (!status) return null;
  switch (status) {
    case "Completed":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 font-semibold text-[11px] px-2 py-0.5">
          ✓ Completed
        </Badge>
      );
    case "Delayed":
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400 font-semibold text-[11px] px-2 py-0.5">
          ⚠ Delayed
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400 font-semibold text-[11px] px-2 py-0.5">
          ⏱ Pending
        </Badge>
      );
    case "In Progress":
      return (
        <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 font-semibold text-[11px] px-2 py-0.5">
          ⚡ In Progress
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-semibold text-[11px] px-2 py-0.5">
          {status}
        </Badge>
      );
  }
};

const calculateWorkingHoursDetails = (startDateStr, endDateStr, hoursPerDay = 8) => {
  if (!startDateStr || !endDateStr) return null;

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;

  let totalDays = 0;
  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;

  const current = new Date(start);
  while (current <= end) {
    totalDays++;
    const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
    const formattedDate = current.toISOString().split("T")[0];

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else if (PUBLIC_HOLIDAYS.includes(formattedDate)) {
      holidayDays++;
    } else {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  const totalHours = workingDays * hoursPerDay;

  return {
    totalDays,
    workingDays,
    weekendDays,
    holidayDays,
    totalHours,
  };
};

function MultiSelectDropdown({
  label,
  value = "",
  onChange,
  options = [],
  placeholder = "Select items...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedItems = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleItem = (item) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    let updated;
    if (selectedItems.includes(trimmed)) {
      updated = selectedItems.filter((i) => i !== trimmed);
    } else {
      updated = [...selectedItems, trimmed];
    }
    onChange(updated.join(", "));
  };

  const handleAddCustom = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const customVal = searchQuery.trim();
      if (customVal && !selectedItems.includes(customVal)) {
        toggleItem(customVal);
        setSearchQuery("");
      }
    }
  };

  const allAvailableOptions = Array.from(
    new Set([...options, ...selectedItems])
  );

  const filteredOptions = allAvailableOptions.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const isExactMatch = allAvailableOptions.some(
    (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  return (
    <div className="flex flex-col gap-1.5 min-w-0 w-full">
      {label && (
        <Label className="text-xs font-semibold text-foreground/90 block mb-0.5 truncate">
          {label}
        </Label>
      )}
      <div className="relative w-full min-w-0" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm ring-offset-background flex items-center gap-1.5 cursor-pointer hover:border-ring transition-colors shadow-xs min-w-0 overflow-hidden"
        >
          {selectedItems.length > 0 ? (
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5 flex-1">
              {selectedItems.map((item, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shrink-0 rounded-md font-medium"
                >
                  <span className="truncate max-w-[130px]">{item}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item);
                    }}
                    className="hover:text-destructive cursor-pointer ml-0.5 font-bold shrink-0 text-xs"
                  >
                    ×
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs truncate flex-1">{placeholder}</span>
          )}
          <div
            className={`ml-auto pointer-events-none text-muted-foreground transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl flex flex-col">
            <div className="p-2 border-b border-border bg-muted/30 flex gap-1.5">
              <Input
                type="text"
                placeholder="Search or type custom value..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleAddCustom}
                className="h-8 text-xs bg-background flex-1"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {searchQuery.trim() && !isExactMatch && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleAddCustom}
                  className="h-8 px-2.5 text-[11px] gap-1 shrink-0"
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              )}
            </div>

            <div className="overflow-y-auto max-h-44 p-1 space-y-0.5">
              {searchQuery.trim() && !isExactMatch && (
                <div
                  onClick={handleAddCustom}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer select-none bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors mb-1 border border-primary/20"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">Add "{searchQuery.trim()}"</span>
                </div>
              )}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = selectedItems.includes(opt);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItem(opt)}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-md cursor-pointer select-none transition-colors ${isSelected
                        ? "bg-primary/15 text-primary font-medium"
                        : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => { }}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer pointer-events-none"
                        />
                        <span>{opt}</span>
                      </div>
                      {isSelected && (
                        <span className="text-primary text-xs font-bold">✓</span>
                      )}
                    </div>
                  );
                })
              ) : !searchQuery.trim() ? (
                <div className="p-3 text-xs text-muted-foreground text-center">
                  No predefined options. Type to add custom value.
                </div>
              ) : null}
            </div>

            <div className="p-1.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between px-3">
              <span>Type custom name & press Enter or click Add</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectsView({
  projects,
  setProjects,
  statuses = ["Pending", "In Progress", "Delayed", "Completed"],
  setStatuses,
  employees = [],
  currentUser = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [activeFolder, setActiveFolder] = useState("/");
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [customFolders, setCustomFolders] = useState([]);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    if (selectedProject) {
      setActivities(selectedProject.activities || []);
    } else {
      setActivities([]);
    }
  }, [selectedProject]);

  const prevProjSearchRef = useRef("");

  useEffect(() => {
    if (!searchQuery.trim() && !prevProjSearchRef.current) return;

    const isClearing = !searchQuery.trim() && prevProjSearchRef.current;
    prevProjSearchRef.current = searchQuery.trim();

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      const token = localStorage.getItem("app_token");
      const authHeaders = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const url = searchQuery.trim()
          ? `${API_BASE_URL}/api/projects?search=${encodeURIComponent(searchQuery.trim())}`
          : `${API_BASE_URL}/api/projects`;

        const res = await fetch(url, {
          headers: authHeaders,
          signal: controller.signal,
        });
        const data = await res.json();
        if (data && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to search projects:", err);
        }
      }
    }, isClearing ? 0 : 1000);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, setProjects]);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getDocIcon = (fileType) => {
    if (!fileType) return <FileText className="h-4 w-4 text-primary shrink-0" />;
    const t = fileType.toLowerCase();
    if (t === "pdf") return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(t))
      return <FileText className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(t))
      return <Package className="h-4 w-4 text-amber-500 shrink-0" />;
    if (["js", "jsx", "ts", "tsx", "py", "html", "css", "json"].includes(t))
      return <Code2 className="h-4 w-4 text-sky-500 shrink-0" />;
    if (["doc", "docx"].includes(t))
      return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
    if (["xls", "xlsx", "csv"].includes(t))
      return <Database className="h-4 w-4 text-green-500 shrink-0" />;
    return <FileText className="h-4 w-4 text-primary shrink-0" />;
  };

  const handleUploadDocuments = async (filesList, relativeFolderPaths = []) => {
    if (!selectedProject || !filesList || filesList.length === 0) return;
    setIsUploadingDoc(true);

    try {
      const token = localStorage.getItem("app_token") || localStorage.getItem("token");
      const targetId = selectedProject._id || selectedProject.id;
      const uploadData = new FormData();

      Array.from(filesList).forEach((file) => {
        uploadData.append("files", file);
      });

      if (relativeFolderPaths && relativeFolderPaths.length > 0) {
        uploadData.append("folderPaths", JSON.stringify(relativeFolderPaths));
      }

      const res = await fetch(`${API_BASE_URL}/api/projects/${targetId}/documents`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.documents) {
        const updatedDocs = data.documents;
        setSelectedProject((prev) => ({ ...prev, documents: updatedDocs }));
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            String(p.id || p._id) === String(targetId)
              ? { ...p, documents: updatedDocs }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to upload documents:", err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const paths = Array.from(files).map(() => activeFolder);
    handleUploadDocuments(files, paths);
    e.target.value = "";
  };

  const handleFolderChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const folderPaths = Array.from(files).map((file) => {
      const relPath = file.webkitRelativePath || "";
      const pathParts = relPath.split("/").slice(0, -1);
      const folderRel = pathParts.join("/");
      let fullPath = activeFolder === "/" ? "/" + folderRel : activeFolder + "/" + folderRel;
      if (!fullPath.startsWith("/")) fullPath = "/" + fullPath;
      return fullPath;
    });

    handleUploadDocuments(files, folderPaths);
    e.target.value = "";
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDocument || !selectedProject) return;
    const docId = deletingDocument.id;
    const targetId = selectedProject._id || selectedProject.id;

    setDeletingDocument(null);

    const currentDocs = selectedProject.documents || [];
    const updatedDocs = currentDocs.filter((d) => String(d._id || d.id) !== String(docId));
    setSelectedProject((prev) => ({ ...prev, documents: updatedDocs }));
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        String(p.id || p._id) === String(targetId) ? { ...p, documents: updatedDocs } : p
      )
    );

    try {
      const token = localStorage.getItem("app_token") || localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/projects/${targetId}/documents/${docId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleCreateCustomFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folderTitle = newFolderName.trim().replace(/^\/+|\/+$/g, "");
    let newPath = activeFolder === "/" ? "/" + folderTitle : activeFolder + "/" + folderTitle;
    if (!customFolders.includes(newPath)) {
      setCustomFolders((prev) => [...prev, newPath]);
    }
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  const confirmDeleteFolder = async () => {
    if (!deletingFolder || !selectedProject) return;
    const { targetPath, docsInFolder } = deletingFolder;
    const targetId = selectedProject._id || selectedProject.id;

    setDeletingFolder(null);

    // Remove from customFolders state
    setCustomFolders((prev) =>
      prev.filter((p) => p !== targetPath && !p.startsWith(targetPath + "/"))
    );

    // Filter out documents inside this folder tree locally
    const currentDocs = selectedProject.documents || [];
    const updatedDocs = currentDocs.filter(
      (d) => !(d.folderPath === targetPath || (d.folderPath || "/").startsWith(targetPath + "/"))
    );

    setSelectedProject((prev) => ({ ...prev, documents: updatedDocs }));
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        String(p.id || p._id) === String(targetId) ? { ...p, documents: updatedDocs } : p
      )
    );

    // Delete matching documents from server
    if (docsInFolder && docsInFolder.length > 0) {
      for (const doc of docsInFolder) {
        const docId = doc._id || doc.id;
        try {
          const token = localStorage.getItem("app_token") || localStorage.getItem("token");
          await fetch(`${API_BASE_URL}/api/projects/${targetId}/documents/${docId}`, {
            method: "DELETE",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        } catch (err) {
          console.error("Failed to delete document inside folder:", err);
        }
      }
    }
  };



  const handleAddStatus = async (newStatusName) => {
    if (!newStatusName) return;
    const trimmed = newStatusName.trim();
    if (statuses.includes(trimmed)) return;

    // Optimistically update React state
    setStatuses((prev) => [...prev, trimmed]);

    try {
      const token = localStorage.getItem("app_token") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/statuses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.statuses)) {
          setStatuses(data.statuses);
        }
      }
    } catch (err) {
      console.error("Error adding status:", err);
    }
  };

  const handleDeleteStatus = async (statusToDelete, targetStatus) => {
    if (!statusToDelete) return;
    const fallback = targetStatus || statuses.find((s) => s !== statusToDelete) || "Pending";

    // Optimistically update statuses & reassign affected projects
    setStatuses((prev) => prev.filter((s) => s !== statusToDelete));
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        (p.status || "In Progress") === statusToDelete ? { ...p, status: fallback } : p
      )
    );

    try {
      const token = localStorage.getItem("app_token") || localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/statuses/${encodeURIComponent(statusToDelete)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ targetStatus: fallback }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.statuses)) {
          setStatuses(data.statuses);
        }
      }
    } catch (err) {
      console.error("Error deleting status:", err);
    }
  };

  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    const targetProject = (projects || []).find(
      (p) => String(p.id || p._id) === String(projectId)
    );
    if (!targetProject) return;

    const oldStatus = targetProject.status || "In Progress";
    if (oldStatus === newStatus) return;

    const optimisticActivity = {
      fromStatus: oldStatus,
      toStatus: newStatus,
      userEmail: currentUser?.email || "System User",
      createdAt: new Date().toISOString(),
    };
    const optimisticActivities = [...(targetProject.activities || []), optimisticActivity];

    // Optimistically update React state (both status AND activities)
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        String(p.id || p._id) === String(projectId)
          ? { ...p, status: newStatus, activities: optimisticActivities }
          : p
      )
    );

    if (selectedProject && String(selectedProject.id || selectedProject._id) === String(projectId)) {
      setSelectedProject((prev) => ({
        ...prev,
        status: newStatus,
        activities: optimisticActivities,
      }));
      setActivities(optimisticActivities);
    }

    try {
      const token = localStorage.getItem("app_token") || localStorage.getItem("token");
      const targetId = targetProject._id || targetProject.id;
      const response = await fetch(`${API_BASE_URL}/api/projects/${targetId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project status");
      }

      const updatedData = await response.json();
      const updatedStatus = updatedData.status || newStatus;
      const updatedActivities = updatedData.activities || optimisticActivities;

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          String(p.id || p._id) === String(projectId)
            ? { ...p, status: updatedStatus, activities: updatedActivities }
            : p
        )
      );

      if (selectedProject && String(selectedProject.id || selectedProject._id) === String(projectId)) {
        setSelectedProject((prev) => ({
          ...prev,
          status: updatedStatus,
          activities: updatedActivities,
        }));
        setActivities(updatedActivities);
      }
    } catch (error) {
      console.error("Error updating project status:", error);
      // Revert status on failure
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          String(p.id || p._id) === String(projectId)
            ? { ...p, status: oldStatus, activities: targetProject.activities || [] }
            : p
        )
      );
      if (selectedProject && String(selectedProject.id || selectedProject._id) === String(projectId)) {
        setSelectedProject((prev) => ({
          ...prev,
          status: oldStatus,
          activities: targetProject.activities || [],
        }));
        setActivities(targetProject.activities || []);
      }
      setNotificationModal({
        isOpen: true,
        title: "Status Update Failed",
        entityType: "Project",
        actionType: "updated",
        id: String(projectId),
        name: `${targetProject.name} (Could not sync with server)`,
      });
    }
  };

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [showIconPresets, setShowIconPresets] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const employeeDropdownRef = useRef(null);
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    title: "",
    entityType: "Project",
    actionType: "created",
    id: "",
    name: "",
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target)
      ) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    startDate: "",
    endDate: "",
    allottedHours: "",
    assignedEmployees: "",
    icon: "",
    theme: "",
    database: "",
    language: "",
    deploymentLocation: "",
    status: (statuses && statuses[0]) || "Pending",
    version: "1.0.0",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState(null);

  // Dynamic options gathered from defaults + existing projects data
  const dynamicClients = Array.from(
    new Set([
      "Apex Dynamics",
      "Global Tech Systems",
      "Nexus Solutions",
      "Starlight Media",
      "InnoCorp International",
      "Vertex Logistics",
      "Internal Project",
      ...(projects || []).map((p) => p.clientName).filter(Boolean),
    ])
  );

  const dynamicThemes = Array.from(
    new Set([
      "Dark Glassmorphism",
      "Light Modern",
      "Dark Mode",
      "Corporate Blue",
      "Minimal Slate",
      "Cyberpunk Glow",
      ...(projects || []).map((p) => p.theme).filter(Boolean),
    ])
  );

  const dynamicDatabases = Array.from(
    new Set([
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Firebase Firestore",
      "SQLite",
      "Redis",
      "Oracle DB",
      ...(projects || []).map((p) => p.database).filter(Boolean),
    ])
  );

  const dynamicLanguages = Array.from(
    new Set([
      "React & Node.js",
      "Next.js & TypeScript",
      "Vue.js & Express",
      "Angular & Java Spring",
      "Python & Django",
      "Python & FastAPI",
      "Flutter & Firebase",
      "PHP & Laravel",
      ...(projects || []).map((p) => p.language).filter(Boolean),
    ])
  );

  const dynamicDeployments = Array.from(
    new Set([
      "Vercel",
      "AWS (Amazon Web Services)",
      "Azure Cloud",
      "Google Cloud Platform (GCP)",
      "Netlify",
      "Render",
      "DigitalOcean",
      "On-Premise Server",
      ...(projects || []).map((p) => p.deploymentLocation).filter(Boolean),
    ])
  );

  const ITEMS_PER_PAGE = 9;

  // Filter projects by search
  const filteredProjects = projects.filter((project) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (project.name && project.name.toLowerCase().includes(q)) ||
      (project.clientName && project.clientName.toLowerCase().includes(q)) ||
      (project.language && project.language.toLowerCase().includes(q)) ||
      (project.deploymentLocation &&
        project.deploymentLocation.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleOpenAdd = () => {
    setEditingProject(null);
    setCalculationDetails(null);
    setFormData({
      name: "",
      clientName: "",
      startDate: "",
      endDate: "",
      allottedHours: "",
      assignedEmployees: "",
      icon: "",
      theme: "",
      database: "",
      language: "",
      deploymentLocation: "",
      status: (statuses && statuses[0]) || "Pending",
      version: "1.0.0",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const formatDateForInput = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const formatDateForDisplay = (dateVal) => {
    if (!dateVal) return "Not set";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSelectProject = async (project) => {
    if (!project) {
      setSelectedProject(null);
      return;
    }
    setSelectedProject(project);

    if (project.documents !== undefined && project.activities !== undefined) {
      return;
    }

    const projId = project.id || project._id;
    const token = localStorage.getItem("app_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const fullProj = await res.json();
        setSelectedProject(fullProj);
        setProjects((prev) =>
          prev.map((p) => ((p.id || p._id) === (fullProj.id || fullProj._id) ? fullProj : p))
        );
      }
    } catch (err) {
      console.log("Failed to fetch project details:", err);
    }
  };

  const handleOpenEdit = async (project) => {
    setEditingProject(project);
    let fullProject = project;

    if (project.documents !== undefined && project.activities !== undefined) {
      fullProject = project;
    } else {
      const projId = project.id || project._id;
      const token = localStorage.getItem("app_token");
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/${projId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          fullProject = await res.json();
          setEditingProject(fullProject);
          setProjects((prev) =>
            prev.map((p) => ((p.id || p._id) === (fullProject.id || fullProject._id) ? fullProject : p))
          );
        }
      } catch (err) {
        console.log("Failed to fetch project details for edit:", err);
      }
    }

    const startStr = formatDateForInput(fullProject.startDate);
    const endStr = formatDateForInput(fullProject.endDate);
    const details = calculateWorkingHoursDetails(startStr, endStr);
    setCalculationDetails(details);

    setFormData({
      name: fullProject.name || "",
      clientName: fullProject.clientName || "",
      startDate: startStr,
      endDate: endStr,
      allottedHours: fullProject.allottedHours || "",
      assignedEmployees: Array.isArray(fullProject.assignedEmployees)
        ? fullProject.assignedEmployees.join(", ")
        : fullProject.assignedEmployees || "",
      icon: fullProject.icon || "",
      theme: fullProject.theme || "",
      database: fullProject.database || "",
      language: fullProject.language || "",
      extraRequirements: fullProject.extraRequirements || "",
      deploymentLocation: fullProject.deploymentLocation || "",
      status: fullProject.status || "In Progress",
      version: fullProject.version || "1.0.0",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const nextForm = { ...prev, [name]: value };

      if (name === "startDate" || name === "endDate") {
        const startDate = name === "startDate" ? value : prev.startDate;
        const endDate = name === "endDate" ? value : prev.endDate;

        if (startDate && endDate) {
          const details = calculateWorkingHoursDetails(startDate, endDate);
          if (details) {
            setCalculationDetails(details);
            nextForm.allottedHours = String(details.totalHours);
          } else {
            setCalculationDetails(null);
          }
        } else {
          setCalculationDetails(null);
        }
      }

      return nextForm;
    });
  };

  const handleIconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Project icon size should be less than 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, icon: previewUrl }));
    setIsUploadingIcon(true);
    setFormError("");

    try {
      const token = localStorage.getItem("app_token");
      const uploadData = new FormData();
      uploadData.append("icon", file);

      const res = await fetch(`${API_BASE_URL}/api/upload/icon`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to upload project icon to Cloudinary.");
        setFormData((prev) => ({ ...prev, icon: editingProject?.icon || "" }));
      } else if (data.url) {
        setFormData((prev) => ({ ...prev, icon: data.url }));
      }
    } catch (err) {
      console.error("Project icon upload failed:", err);
      setFormError("Network error while uploading project icon to Cloudinary.");
      setFormData((prev) => ({ ...prev, icon: editingProject?.icon || "" }));
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.clientName.trim()) {
      setFormError("Project Name and Client Name are required.");
      return;
    }

    setIsSubmitting(true);

    const parsedAssigned = formData.assignedEmployees
      ? formData.assignedEmployees
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      : [];

    const token = localStorage.getItem("app_token");
    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const payload = {
      ...formData,
      allottedHours: Number(formData.allottedHours) || 0,
      employeeCount:
        formData.employeeCount !== "" && !isNaN(Number(formData.employeeCount)) && Number(formData.employeeCount) > 0
          ? Number(formData.employeeCount)
          : parsedAssigned.length || 1,
      assignedEmployees: parsedAssigned,
    };

    try {
      if (editingProject) {
        const res = await fetch(
          `${API_BASE_URL}/api/projects/${editingProject.id || editingProject._id}`,
          {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message || "Failed to update project");
          setIsSubmitting(false);
          return;
        }
        const targetId = editingProject.id || editingProject._id;
        let updatedActivities = editingProject.activities || [];
        if (editingProject.status && payload.status && editingProject.status !== payload.status) {
          const newActivity = {
            fromStatus: editingProject.status,
            toStatus: payload.status,
            userEmail: currentUser?.email || "System User",
            createdAt: new Date().toISOString(),
          };
          updatedActivities = [...updatedActivities, newActivity];
        }

        const updatedProject = {
          ...editingProject,
          ...payload,
          activities: updatedActivities,
        };

        setProjects((prev) =>
          prev.map((p) => ((p.id || p._id) === targetId ? updatedProject : p))
        );
        if (selectedProject && (selectedProject.id || selectedProject._id) === targetId) {
          setSelectedProject((prev) => (prev ? { ...prev, ...updatedProject } : updatedProject));
          setActivities(updatedActivities);
        }
        setNotificationModal({
          isOpen: true,
          title: "Project Updated Successfully",
          entityType: "Project",
          actionType: "updated",
          id: targetId,
          name: payload.name || editingProject.name,
        });
      } else {
        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message || "Failed to create project");
          setIsSubmitting(false);
          return;
        }
        const newProjectObj = {
          id: data.id || data._id,
          ...payload,
          activities: [
            {
              fromStatus: "Created",
              toStatus: payload.status || "Pending",
              userEmail: currentUser?.email || "System User",
              createdAt: new Date().toISOString(),
            }
          ]
        };
        setProjects((prev) => [newProjectObj, ...prev]);
        setNotificationModal({
          isOpen: true,
          title: "Project Created Successfully",
          entityType: "Project",
          actionType: "created",
          id: data.id || data._id,
          name: payload.name,
        });
      }

      setShowFormModal(false);
    } catch (err) {
      setFormError("Something went wrong. Please check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    const token = localStorage.getItem("app_token");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/projects/${deletingProject.id || deletingProject._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.ok) {
        const delId = deletingProject.id || deletingProject._id;
        setProjects((prev) => prev.filter((p) => (p.id || p._id) !== delId));
        if (selectedProject && (selectedProject.id || selectedProject._id) === delId) {
          setSelectedProject(null);
        }
        setDeletingProject(null);
      }
    } catch (err) {
      console.log("Delete failed:", err);
    }
  };

  // Helper for deployment badge style
  const getDeploymentBadge = (loc) => {
    if (!loc) return null;
    const lower = loc.toLowerCase();
    if (lower.includes("azure")) {
      return (
        <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-medium">
          <Cloud className="w-3 h-3 mr-1" /> {loc}
        </Badge>
      );
    }
    if (lower.includes("aws")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium">
          <Cloud className="w-3 h-3 mr-1" /> {loc}
        </Badge>
      );
    }
    if (lower.includes("vercel")) {
      return (
        <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-medium">
          <Cloud className="w-3 h-3 mr-1" /> {loc}
        </Badge>
      );
    }
    if (lower.includes("google") || lower.includes("gcp")) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
          <Cloud className="w-3 h-3 mr-1" /> {loc}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="font-medium">
        <Cloud className="w-3 h-3 mr-1" /> {loc}
      </Badge>
    );
  };

  // Hours / Cost per employee calculation helper
  const calculateCostMetrics = (project) => {
    const hours = Number(project.allottedHours) || 0;
    const assignedList = Array.isArray(project.assignedEmployees)
      ? project.assignedEmployees
      : typeof project.assignedEmployees === "string"
        ? project.assignedEmployees.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    const empCount =
      assignedList.length > 0
        ? assignedList.length
        : Number(project.employeeCount) || 0;

    const hoursPerEmp = empCount > 0 ? (hours / empCount).toFixed(1) : 0;
    // Standard estimated rate = $45/hr
    const estimatedCostPerEmp = Math.round(hoursPerEmp * 45);

    return {
      totalHours: hours,
      empCount,
      hoursPerEmp,
      estimatedCostPerEmp,
    };
  };

  return (
    <div className="space-y-6 2xl:space-y-8 w-full max-w-[1920px] 2xl:max-w-none mx-auto">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Project Portfolio
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of active client projects, team allotments, tech stack history, and cloud deployments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add New Project
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by project or client name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Switcher Toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 px-3 text-xs font-semibold gap-1.5 transition-all ${
                viewMode === "grid" ? "shadow-sm bg-background text-foreground" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid View
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className={`h-8 px-3 text-xs font-semibold gap-1.5 transition-all ${
                viewMode === "kanban" ? "shadow-sm bg-background text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" /> Kanban View
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span> Total Projects
          </div>
        </div>
      </div>

      {/* View Switcher: Kanban View vs 9-Cards Paginated Grid View */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          statuses={statuses}
          onAddStatus={handleAddStatus}
          onDeleteStatus={handleDeleteStatus}
          projects={filteredProjects}
          onSelectProject={handleSelectProject}
          onUpdateStatus={handleUpdateProjectStatus}
          renderProjectIcon={renderProjectIcon}
          getStatusBadge={getStatusBadge}
        />
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-card">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg text-foreground">No Projects Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
            {searchQuery
              ? `No projects match "${searchQuery}". Try clearing your filter.`
              : "Get started by adding your first project to the portfolio database."}
          </p>
          {searchQuery ? (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Clear Search Filter
            </Button>
          ) : (
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add New Project
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5 2xl:gap-7">
            {paginatedProjects.map((project) => (
              <Card
                key={project.id || project._id}
                onClick={() => handleSelectProject(project)}
                className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 border border-border bg-card flex flex-col justify-between"
              >
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all overflow-hidden">
                      {renderProjectIcon(project.icon, "h-5 w-5")}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                        v{project.version || "1.0.0"}
                      </Badge>
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <CardTitle className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium pt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="line-clamp-1">{project.clientName}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 pt-0">
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 group-hover:text-foreground transition-colors font-medium">
                      <Maximize2 className="h-3.5 w-3.5 text-primary" /> View Full Details
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6 mt-4">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredProjects.length)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{filteredProjects.length}</span> projects (Page {currentPage} of {totalPages})
            </div>

            {totalPages > 1 && (
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </>
      )}

      {/* PROJECT DETAILS RIGHT-SIDE SHEET DRAWER */}
      <Sheet
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-xl max-h-[100vh] overflow-y-auto p-4 sm:p-6">
          {selectedProject && (() => {
            const metrics = calculateCostMetrics(selectedProject);
            const assignedList = Array.isArray(selectedProject.assignedEmployees)
              ? selectedProject.assignedEmployees
              : selectedProject.assignedEmployees
                ? selectedProject.assignedEmployees.split(",").map((s) => s.trim())
                : [];

            return (
              <>
                <SheetHeader className="border-b border-border pb-4">
                  <div className="flex items-center gap-2 justify-start">
                    <Badge variant="outline" className="text-xs font-mono">
                      v{selectedProject.version || "1.0.0"}
                    </Badge>
                    {getStatusBadge(selectedProject.status)}
                  </div>
                  <div className="flex items-start gap-3 mt-2">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 overflow-hidden shadow-xs">
                      {renderProjectIcon(selectedProject.icon, "h-6 w-6")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-2xl font-bold tracking-tight text-foreground truncate">
                        {selectedProject.name}
                      </SheetTitle>
                      <SheetDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Building2 className="h-4 w-4 text-primary shrink-0" /> Client:{" "}
                        <span className="text-foreground font-semibold truncate">
                          {selectedProject.clientName}
                        </span>
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-6 py-6 text-sm">
                  {/* Timeline & Date Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">Starting Date</div>
                        <div className="font-semibold text-foreground">
                          {formatDateForDisplay(selectedProject.startDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">Target Completion</div>
                        <div className="font-semibold text-foreground">
                          {formatDateForDisplay(selectedProject.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hours & Team Size Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3.5 w-3.5 text-primary" /> Total Hours
                      </div>
                      <div className="text-xl font-bold font-mono">{metrics.totalHours} hrs</div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Users className="h-3.5 w-3.5 text-indigo-500" /> Team Size
                      </div>
                      <div className="text-xl font-bold font-mono">{metrics.empCount} Employees</div>
                    </div>
                  </div>

                  {/* Assigned Employees */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" /> Assigned Team ({assignedList.length})
                    </div>
                    {assignedList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedList.map((empName, i) => {
                          const matchedEmp = employees.find((e) => e.name === empName || e.employeeId === empName);
                          return (
                            <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs font-normal flex items-center gap-1.5">
                              {matchedEmp?.avatar ? (
                                <img src={matchedEmp.avatar} alt={empName} className="h-4 w-4 rounded-full object-cover shrink-0" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              )}
                              <span>{empName}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No team members assigned yet.</div>
                    )}
                  </div>

                  {/* Activity History & Audit Log Timeline */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" /> Activity History & Audit Log
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {activities.length} {activities.length === 1 ? "entry" : "entries"}
                      </Badge>
                    </div>

                    {isLoadingActivities ? (
                      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading activity logs...
                      </div>
                    ) : activities.length > 0 ? (
                      <div className="relative pl-4 space-y-3 border-l-2 border-primary/30 my-2">
                        {activities.map((act, index) => (
                          <div key={act._id || act.id || index} className="relative group">
                            {/* Timeline Node Dot */}
                            <div className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform flex items-center justify-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </div>

                            <div className="bg-muted/40 hover:bg-muted/70 p-3 rounded-lg border border-border/60 transition-colors space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                                  {!act.fromStatus || act.fromStatus === act.toStatus ? (
                                    <span>Created as <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0">{act.toStatus || "Pending"}</Badge></span>
                                  ) : (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="text-muted-foreground">{act.fromStatus}</span>
                                      <span className="text-primary font-bold">➔</span>
                                      <span className="font-bold text-foreground">{act.toStatus}</span>
                                    </div>
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {act.createdAt ? new Date(act.createdAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }) : "Just now"}
                                </span>
                              </div>

                              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/30">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  User: <span className="text-foreground font-medium">{act.userEmail || "System Admin"}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground">
                        No activity history logged for this project yet.
                      </div>
                    )}
                  </div>

                  {/* PROJECT DOCUMENTS & FOLDERS SECTION */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FolderOpen className="h-4 w-4 text-primary" /> Project Files & Folders ({selectedProject.documents?.length || 0})
                      </div>

                      {/* Upload Controls & Create Folder Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <input
                          type="file"
                          webkitdirectory=""
                          directory=""
                          multiple
                          ref={folderInputRef}
                          onChange={handleFolderChange}
                          className="hidden"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingDoc}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 text-xs px-2 gap-1 text-foreground"
                        >
                          <Upload className="h-3 w-3 text-primary" /> Upload File
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingDoc}
                          onClick={() => folderInputRef.current?.click()}
                          className="h-7 text-xs px-2 gap-1 text-foreground"
                        >
                          <FolderPlus className="h-3 w-3 text-amber-500" /> Upload Folder
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewFolderModal(true)}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" /> New Folder
                        </Button>
                      </div>
                    </div>

                    {isUploadingDoc && (
                      <div className="flex items-center justify-center p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Uploading documents to Cloudinary storage...
                      </div>
                    )}

                    {/* Breadcrumb Folder Bar */}
                    <div className="flex items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs">
                      <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveFolder("/")}
                          className={`h-6 px-2 text-xs font-semibold ${activeFolder === "/" ? "bg-background text-primary" : "text-muted-foreground"}`}
                        >
                          <Folder className="h-3.5 w-3.5 mr-1 text-amber-500" /> Root
                        </Button>

                        {activeFolder !== "/" &&
                          activeFolder
                            .split("/")
                            .filter(Boolean)
                            .map((folderSegment, idx, arr) => {
                              const buildPath = "/" + arr.slice(0, idx + 1).join("/");
                              const isLast = idx === arr.length - 1;
                              return (
                                <React.Fragment key={buildPath}>
                                  <span className="text-muted-foreground font-mono">/</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveFolder(buildPath)}
                                    className={`h-6 px-1.5 text-xs font-medium max-w-[120px] truncate ${isLast ? "bg-background font-bold text-foreground" : "text-muted-foreground"}`}
                                  >
                                    {folderSegment}
                                  </Button>
                                </React.Fragment>
                              );
                            })}
                      </div>

                      {activeFolder !== "/" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const parts = activeFolder.split("/").filter(Boolean);
                            parts.pop();
                            const parent = parts.length === 0 ? "/" : "/" + parts.join("/");
                            setActiveFolder(parent);
                          }}
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0 gap-1"
                        >
                          <ArrowLeft className="h-3 w-3" /> Back
                        </Button>
                      )}
                    </div>

                    {/* Document Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={`Search in ${activeFolder === "/" ? "Root" : activeFolder}...`}
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-background"
                      />
                    </div>

                    {/* Folders & Documents Explorer Grid */}
                    {(() => {
                      const allDocs = selectedProject.documents || [];

                      const subfolderNames = Array.from(
                        new Set([
                          ...customFolders
                            .filter((fPath) => {
                              if (fPath === activeFolder) return false;
                              if (activeFolder === "/") {
                                return fPath.startsWith("/") && fPath.split("/").filter(Boolean).length === 1;
                              }
                              return (
                                fPath.startsWith(activeFolder + "/") &&
                                fPath.slice(activeFolder.length + 1).split("/").filter(Boolean).length === 1
                              );
                            })
                            .map((fPath) => {
                              const remaining = activeFolder === "/" ? fPath.slice(1) : fPath.slice(activeFolder.length + 1);
                              return remaining.split("/")[0];
                            }),

                          ...allDocs
                            .map((d) => d.folderPath || "/")
                            .filter((fPath) => {
                              if (fPath === activeFolder) return false;
                              if (activeFolder === "/") {
                                return fPath.startsWith("/") && fPath.split("/").filter(Boolean).length >= 1;
                              }
                              return fPath.startsWith(activeFolder + "/");
                            })
                            .map((fPath) => {
                              const remaining = activeFolder === "/" ? fPath.slice(1) : fPath.slice(activeFolder.length + 1);
                              return remaining.split("/")[0];
                            })
                            .filter(Boolean),
                        ])
                      );

                      const currentDocs = allDocs.filter((doc) => {
                        const dPath = doc.folderPath || "/";
                        const matchesPath = dPath === activeFolder;
                        if (!matchesPath) return false;
                        if (!docSearchQuery.trim()) return true;
                        return doc.name.toLowerCase().includes(docSearchQuery.trim().toLowerCase());
                      });

                      const hasItems = subfolderNames.length > 0 || currentDocs.length > 0;

                      return !hasItems ? (
                        <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border/70 text-center space-y-1">
                          <Folder className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                          <p className="text-xs font-medium text-muted-foreground">
                            {docSearchQuery
                              ? `No files matching "${docSearchQuery}"`
                              : `This folder (${activeFolder}) is empty.`}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            Upload documents or folders to attach assets to this project.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Render Subfolders */}
                          {subfolderNames.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {subfolderNames.map((folderName) => {
                                const targetPath = activeFolder === "/" ? "/" + folderName : activeFolder + "/" + folderName;
                                const docsInSubfolder = allDocs.filter((d) => (d.folderPath || "/").startsWith(targetPath));

                                return (
                                  <div
                                    key={folderName}
                                    onClick={() => setActiveFolder(targetPath)}
                                    className="p-2.5 rounded-lg border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all flex items-center justify-between group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Folder className="h-4 w-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                                      <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                                        {folderName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                        {docsInSubfolder.length}
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={`Delete folder "${folderName}"`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingFolder({ targetPath, folderName, docsInFolder: docsInSubfolder });
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Render Documents File List */}
                          {currentDocs.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {currentDocs.map((doc) => {
                                const docId = doc._id || doc.id;
                                return (
                                  <div
                                    key={docId}
                                    className="p-2.5 rounded-lg border border-border/80 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        {getDocIcon(doc.fileType)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-foreground line-clamp-1">
                                          {doc.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                          <span className="font-mono">{formatFileSize(doc.size)}</span>
                                          <span>•</span>
                                          <span className="uppercase font-bold text-primary/80">{doc.fileType || "file"}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                      >
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                      </a>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingDocument({ id: docId, name: doc.name })}
                                        className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <SheetFooter className="gap-2 sm:gap-0 mt-6 border-t border-border pt-6">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenEdit(selectedProject)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingProject(selectedProject)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetFooter>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ADD / EDIT PROJECT RIGHT-SIDE SHEET DRAWER FORM */}
      <Sheet open={showFormModal} onOpenChange={(open) => setShowFormModal(open)}>
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-xl max-h-[100vh] overflow-y-auto p-4 sm:p-6">
          <SheetHeader>
            <SheetTitle>
              {editingProject ? "Edit Project Details" : "Add New Project"}
            </SheetTitle>
            <SheetDescription>
              {editingProject
                ? "Update the project specification and team assignments below."
                : "Fill in all 12 project attributes to store in your portfolio."}
            </SheetDescription>
          </SheetHeader>

          {formError && (
            <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive font-medium mt-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Enterprise Cloud Portal"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <MultiSelectDropdown
                label="Client Name *"
                value={formData.clientName}
                options={dynamicClients}
                placeholder="Select or add clients..."
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, clientName: val }))
                }
              />
            </div>

            {/* Project Icon Selector & Upload */}
            <div className="grid gap-2 border-t border-b border-border py-3 my-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground/90">Project Icon / Logo</Label>
                {formData.icon && formData.icon.includes("cloudinary.com") && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" /> Cloudinary Logo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-lg border border-border">
                <div className="relative h-12 w-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  {isUploadingIcon ? (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  ) : (
                    renderProjectIcon(formData.icon, "h-6 w-6")
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 py-1 border border-border shadow-xs transition-colors ${isUploadingIcon ? "opacity-50 pointer-events-none" : ""}`}>
                      {isUploadingIcon ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Custom Logo
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingIcon}
                        onChange={handleIconFileChange}
                      />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-border hover:bg-accent"
                      onClick={() => setShowIconPresets((prev) => !prev)}
                    >
                      <Palette className="h-3.5 w-3.5 text-primary" />
                      {showIconPresets ? "Hide Icon Presets" : "Choose Preset Icon"}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showIconPresets ? "rotate-180" : ""}`} />
                    </Button>

                    {formData.icon && !isUploadingIcon && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: "" }))}
                      >
                        Reset Icon
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isUploadingIcon
                      ? "Streaming logo directly to Cloudinary..."
                      : "Click 'Choose Preset Icon' or upload a custom logo (Max 5MB)"}
                  </p>
                </div>
              </div>

              {showIconPresets && (
                <div className="mt-2 p-3 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-xs font-semibold text-foreground/90">Select Preset Icon:</span>
                    <button
                      type="button"
                      onClick={() => setShowIconPresets(false)}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline"
                    >
                      Close Presets
                    </button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {PROJECT_ICON_PRESETS.map((preset) => {
                      const IconComp = preset.icon;
                      const isSelected = formData.icon === preset.key;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, icon: preset.key }));
                            setShowIconPresets(false);
                          }}
                          className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all ${isSelected ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30 scale-105" : "bg-background hover:bg-accent border-border hover:scale-105"}`}
                          title={preset.label}
                        >
                          <IconComp className={`h-4 w-4 ${isSelected ? "text-primary-foreground" : preset.color || "text-foreground"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Starting Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleFormChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date (Target Completion)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="allottedHours">Allotted Hours (Total)</Label>
                <Input
                  id="allottedHours"
                  name="allottedHours"
                  type="number"
                  placeholder="e.g. 480"
                  value={formData.allottedHours}
                  onChange={handleFormChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Project Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || statuses[0] || "In Progress"}
                  onChange={handleFormChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* MULTI-SELECT EMPLOYEE ASSIGNMENT DROPDOWN */}
            {(() => {
              const selectedNames = formData.assignedEmployees
                ? formData.assignedEmployees.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

              const toggleEmployee = (empName) => {
                let updated;
                if (selectedNames.includes(empName)) {
                  updated = selectedNames.filter((n) => n !== empName);
                } else {
                  updated = [...selectedNames, empName];
                }
                setFormData((prev) => ({
                  ...prev,
                  assignedEmployees: updated.join(", "),
                }));
              };

              const selectAllEmployees = () => {
                const allNames = employees.map((e) => e.name);
                setFormData((prev) => ({
                  ...prev,
                  assignedEmployees: allNames.join(", "),
                }));
              };

              const clearAllEmployees = () => {
                setFormData((prev) => ({
                  ...prev,
                  assignedEmployees: "",
                }));
              };

              const filteredEmpList = employees.filter((emp) => {
                const q = employeeSearchQuery.trim().toLowerCase();
                if (!q) return true;
                const nameMatch = emp.name && emp.name.toLowerCase().includes(q);
                const idMatch = emp.employeeId && emp.employeeId.toLowerCase().includes(q);
                const deptMatch = emp.department && emp.department.toLowerCase().includes(q);
                return nameMatch || idMatch || deptMatch;
              });

              return (
                <div className="grid gap-1.5">
                  <Label htmlFor="assignedEmployees" className="text-xs font-semibold text-foreground/90 block mb-0.5">
                    Assigned Employees (Multi-Select)
                  </Label>
                  <div className="relative" ref={employeeDropdownRef}>
                    <div
                      onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                      className="h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm ring-offset-background flex items-center gap-1.5 cursor-pointer hover:border-ring transition-colors shadow-xs min-w-0 overflow-hidden"
                    >
                      {selectedNames.length > 0 ? (
                        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5 flex-1">
                          {selectedNames.map((empName, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shrink-0 rounded-md font-medium"
                            >
                              <span className="truncate max-w-[130px]">{empName}</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEmployee(empName);
                                }}
                                className="hover:text-destructive cursor-pointer ml-0.5 font-bold shrink-0 text-xs"
                              >
                                ×
                              </span>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs truncate flex-1">
                          Select employees...
                        </span>
                      )}
                      <div className={`ml-auto pointer-events-none text-muted-foreground transition-transform duration-200 shrink-0 ${isEmployeeDropdownOpen ? "rotate-180" : ""}`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>

                    {isEmployeeDropdownOpen && (
                      <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl flex flex-col">
                        {/* Search and Action Buttons Bar */}
                        <div className="p-2 border-b border-border bg-muted/30 flex flex-col gap-2">
                          <Input
                            type="text"
                            placeholder="Filter employees..."
                            value={employeeSearchQuery}
                            onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                            className="h-8 text-xs bg-background"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
                            <span>Selected: {selectedNames.length} of {employees.length}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllEmployees();
                                }}
                                className="text-primary hover:underline font-medium"
                              >
                                Select All
                              </button>
                              <span>|</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearAllEmployees();
                                }}
                                className="text-destructive hover:underline font-medium"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Employees Checklist */}
                        <div className="overflow-y-auto max-h-44 p-1 space-y-0.5">
                          {filteredEmpList.length > 0 ? (
                            filteredEmpList.map((emp) => {
                              const isSelected = selectedNames.includes(emp.name);
                              return (
                                <div
                                  key={emp.id || emp._id || emp.employeeId}
                                  onClick={() => toggleEmployee(emp.name)}
                                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-md cursor-pointer select-none transition-colors ${isSelected
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => { }} // Controlled by div click
                                      className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer pointer-events-none"
                                    />
                                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                                      {emp.avatar ? (
                                        <img src={emp.avatar} alt={emp.name} className="h-full w-full object-cover" />
                                      ) : (
                                        emp.name ? emp.name.charAt(0).toUpperCase() : "E"
                                      )}
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                      {emp.employeeId || "EMP"}
                                    </Badge>
                                    <span className="font-medium">{emp.name}</span>
                                  </div>
                                  {emp.department && (
                                    <Badge variant="secondary" className="text-[10px] opacity-80">
                                      {emp.department}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-4 text-xs text-muted-foreground text-center">
                              No employees found matching filter.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start w-full">
              <MultiSelectDropdown
                label="Theme to Use"
                value={formData.theme}
                options={dynamicThemes}
                // placeholder="Select or add themes..."
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, theme: val }))
                }
              />

              <MultiSelectDropdown
                label="Database Used"
                value={formData.database}
                options={dynamicDatabases}
                // placeholder="Select or add databases..."
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, database: val }))
                }
              />

              <MultiSelectDropdown
                label="Language / Tech Stack"
                value={formData.language}
                options={dynamicLanguages}
                // placeholder="Select or add tech stack..."
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, language: val }))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start w-full">
              <MultiSelectDropdown
                label="Where Deployed?"
                value={formData.deploymentLocation}
                options={dynamicDeployments}
                placeholder="Select deployment..."
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, deploymentLocation: val }))
                }
              />

              <div className="flex flex-col gap-1.5 min-w-0 w-full">
                <Label htmlFor="version" className="text-xs font-semibold text-foreground/90 block mb-0.5 truncate">
                  Project Version
                </Label>
                <Input
                  id="version"
                  name="version"
                  placeholder="e.g. 1.0.0"
                  value={formData.version}
                  onChange={handleFormChange}
                  className="h-10"
                />
              </div>
            </div>

            <SheetFooter className="gap-2 sm:gap-0 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploadingIcon}>
                {isUploadingIcon
                  ? "Uploading Logo..."
                  : isSubmitting
                    ? "Saving..."
                    : editingProject
                      ? "Update Project"
                      : "Add Project"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Project Deletion</DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to delete project{" "}
              <span className="font-semibold text-foreground">
                "{deletingProject?.name}"
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE FOLDER CONFIRMATION MODAL */}
      <Dialog
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Folder Deletion</DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to delete folder{" "}
              <span className="font-semibold text-foreground">
                "{deletingFolder?.folderName}"
              </span>
              {deletingFolder?.docsInFolder?.length > 0 ? (
                <> and all <span className="font-semibold text-foreground">{deletingFolder.docsInFolder.length}</span> item(s) inside it?</>
              ) : (
                "?"
              )}{" "}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingFolder(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFolder}>
              Delete Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DOCUMENT CONFIRMATION MODAL */}
      <Dialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Document Deletion</DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to delete document{" "}
              <span className="font-semibold text-foreground">
                "{deletingDocument?.name}"
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingDocument(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDocument}>
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW FOLDER MODAL */}
      <Dialog
        open={showNewFolderModal}
        onOpenChange={(open) => {
          setShowNewFolderModal(open);
          if (!open) setNewFolderName("");
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription className="pt-1">
              Enter a name for the new folder in{" "}
              <span className="font-semibold text-foreground">{activeFolder}</span>:
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomFolder} className="space-y-4 pt-2">
            <div>
              <Input
                placeholder="Folder Name (e.g. Invoices, Wireframes)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={() => setNotificationModal((prev) => ({ ...prev, isOpen: false }))}
        title={notificationModal.title}
        entityType={notificationModal.entityType}
        actionType={notificationModal.actionType}
        id={notificationModal.id}
        name={notificationModal.name}
      />
    </div>
  );
}
