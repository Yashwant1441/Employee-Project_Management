import React, { useState, useRef, useEffect } from "react";
import API_BASE_URL from "../api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Upload,
  Loader2,
  Check,
  Bot,
  Sparkles,
  GitBranch,
  Flame,
  Workflow,
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
  const s = status || "In Progress";
  switch (s) {
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
    default:
      return (
        <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 font-semibold text-[11px] px-2 py-0.5">
          ⚡ In Progress
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
      <Label className="text-xs font-semibold text-foreground/90 flex items-center min-h-[20px] leading-tight truncate">{label}</Label>
      <div className="relative w-full min-w-0" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-10 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm ring-offset-background flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-ring transition-colors shadow-xs min-w-0"
        >
          {selectedItems.length > 0 ? (
            selectedItems.map((item, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 max-w-full min-w-0"
              >
                <span className="truncate max-w-[130px] inline-block">{item}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item);
                  }}
                  className="hover:text-destructive cursor-pointer ml-0.5 font-bold shrink-0"
                >
                  ×
                </span>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">{placeholder}</span>
          )}
          <div
            className={`ml-auto pointer-events-none text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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
  employees = [],
  currentUser = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const employeeDropdownRef = useRef(null);

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
    status: "In Progress",
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
      status: "In Progress",
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
      }
    } catch (err) {
      console.log("Failed to fetch project details:", err);
    }
  };

  const handleOpenEdit = async (project) => {
    setEditingProject(project);
    let fullProject = project;

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
      }
    } catch (err) {
      console.log("Failed to fetch project details for edit:", err);
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
        setProjects((prev) =>
          prev.map((p) => ((p.id || p._id) === (data.id || data._id) ? data : p))
        );
        if (selectedProject && (selectedProject.id || selectedProject._id) === (data.id || data._id)) {
          setSelectedProject(data);
        }
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
        setProjects((prev) => [data, ...prev]);
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
    <div className="space-y-6 max-w-7xl mx-auto">
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
          Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span> Total Projects
        </div>
      </div>

      {/* 9-Cards Paginated Grid View */}
      {filteredProjects.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((project) => (
              <Card
                key={project.id || project._id}
                onClick={() => setSelectedProject(project)}
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
        <SheetContent side="right" className="sm:max-w-md md:max-w-xl">
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
        <SheetContent side="right" className="sm:max-w-md md:max-w-xl">
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
                <Label className="text-sm font-semibold">Project Icon / Logo</Label>
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
                  <div className="flex items-center gap-2">
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
                      : "Choose a preset icon below or upload custom logo (Max 5MB)"}
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <span className="text-xs text-muted-foreground mb-2 block font-medium">Select Icon Preset:</span>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {PROJECT_ICON_PRESETS.map((preset) => {
                    const IconComp = preset.icon;
                    const isSelected = formData.icon === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: preset.key }))}
                        className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all ${isSelected ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30 scale-105" : "bg-card hover:bg-accent border-border hover:scale-105"}`}
                        title={preset.label}
                      >
                        <IconComp className={`h-4 w-4 ${isSelected ? "text-primary-foreground" : preset.color || "text-foreground"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
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
                  value={formData.status || "In Progress"}
                  onChange={handleFormChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
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
                <div className="grid gap-2">
                  <Label htmlFor="assignedEmployees">
                    Assigned Employees (Multi-Select)
                  </Label>
                  <div className="relative" ref={employeeDropdownRef}>
                    <div
                      onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                      className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-ring transition-colors shadow-xs"
                    >
                      {selectedNames.length > 0 ? (
                        selectedNames.map((empName, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                          >
                            <span>{empName}</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEmployee(empName);
                              }}
                              className="hover:text-destructive cursor-pointer ml-0.5 font-bold"
                            >
                              ×
                            </span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Select employees...
                        </span>
                      )}
                      <div className={`ml-auto pointer-events-none text-muted-foreground transition-transform duration-200 ${isEmployeeDropdownOpen ? "rotate-180" : ""}`}>
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
                // placeholder="Select or add deployment locations..."
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, deploymentLocation: val }))
                }
              />

              <div className="flex flex-col gap-1.5 min-w-0 w-full">
                <Label htmlFor="version" className="text-xs font-semibold text-foreground/90 flex items-center min-h-[20px] leading-tight truncate">Project Version</Label>
                <Input
                  id="version"
                  name="version"
                  placeholder="e.g. 1.0.0"
                  value={formData.version}
                  onChange={handleFormChange}
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
    </div>
  );
}
