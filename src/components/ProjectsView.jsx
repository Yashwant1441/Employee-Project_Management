import React, { useState } from "react";
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
} from "lucide-react";

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

export function ProjectsView({
  projects,
  setProjects,
  employees = [],
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    startDate: "",
    endDate: "",
    allottedHours: "",
    employeeCount: "",
    assignedEmployees: "",
    theme: "",
    database: "",
    language: "",
    extraRequirements: "",
    deploymentLocation: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState(null);

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
      employeeCount: "",
      assignedEmployees: "",
      theme: "",
      database: "",
      language: "",
      extraRequirements: "",
      deploymentLocation: "",
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

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    const startStr = formatDateForInput(project.startDate);
    const endStr = formatDateForInput(project.endDate);
    const details = calculateWorkingHoursDetails(startStr, endStr);
    setCalculationDetails(details);

    setFormData({
      name: project.name || "",
      clientName: project.clientName || "",
      startDate: startStr,
      endDate: endStr,
      allottedHours: project.allottedHours || "",
      employeeCount: project.employeeCount || "",
      assignedEmployees: Array.isArray(project.assignedEmployees)
        ? project.assignedEmployees.join(", ")
        : project.assignedEmployees || "",
      theme: project.theme || "",
      database: project.database || "",
      language: project.language || "",
      extraRequirements: project.extraRequirements || "",
      deploymentLocation: project.deploymentLocation || "",
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
          `${API_BASE_URL}/api/projects/${editingProject._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
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
          prev.map((p) => (p._id === data._id ? data : p))
        );
        if (selectedProject && selectedProject._id === data._id) {
          setSelectedProject(data);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/projects/${deletingProject._id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== deletingProject._id));
        if (selectedProject && selectedProject._id === deletingProject._id) {
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
            <Badge variant="secondary" className="font-mono text-xs">
              9 Cards / Page
            </Badge>
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
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 border border-border bg-card flex flex-col justify-between"
              >
                {/* Visual Accent Header Bar */}
                {/* <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/40 group-hover:from-primary group-hover:to-primary transition-all" /> */}

                <CardHeader className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground group-hover:border-primary/40">
                      Click to expand
                    </Badge>
                  </div>

                  {/* ONLY Project Name and Client Name on Collapsed Card */}
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

      {/* EXPANDED PROJECT DETAILS DIALOG MODAL */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-6 md:p-8">
          {selectedProject && (() => {
            const metrics = calculateCostMetrics(selectedProject);
            const assignedList = Array.isArray(selectedProject.assignedEmployees)
              ? selectedProject.assignedEmployees
              : selectedProject.assignedEmployees
                ? selectedProject.assignedEmployees.split(",").map((s) => s.trim())
                : [];

            return (
              <>
                <DialogHeader className="border-b border-border pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2 text-xs font-mono">
                        Project Details
                      </Badge>
                      <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                        {selectedProject.name}
                      </DialogTitle>
                      <DialogDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Building2 className="h-4 w-4 text-primary" /> Client:{" "}
                        <span className="text-foreground font-semibold">
                          {selectedProject.clientName}
                        </span>
                      </DialogDescription>
                    </div>

                    <div className="shrink-0">
                      {getDeploymentBadge(selectedProject.deploymentLocation)}
                    </div>
                  </div>
                </DialogHeader>

                {/* All Detailed Inputs Displayed cleanly */}
                <div className="space-y-6 py-4 text-sm">
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
                        <div className="text-xs text-muted-foreground font-medium">Target Completion (End Date)</div>
                        <div className="font-semibold text-foreground">
                          {formatDateForDisplay(selectedProject.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hours & Cost Per Employee Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    <div className="p-3.5 rounded-xl border border-border bg-card bg-primary/5">
                      <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-1">
                        <DollarSign className="h-3.5 w-3.5" /> Hours / Employee
                      </div>
                      <div className="text-xl font-bold font-mono text-primary">
                        {metrics.hoursPerEmp} hrs
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        ~${metrics.estimatedCostPerEmp.toLocaleString()} cost/emp
                      </div>
                    </div>
                  </div>

                  {/* Assigned Employees */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" /> Assigned Team ({assignedList.length})
                    </div>
                    {assignedList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedList.map((empName, i) => (
                          <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs font-normal">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                            {empName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No team members assigned yet.</div>
                    )}
                  </div>

                  {/* Tech Stack & History Info Grid */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Technical Stack & History Metadata
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border border-border/70 bg-card">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <Code2 className="h-3 w-3 text-sky-500" /> Programming Language
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {selectedProject.language || "Not specified"}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-border/70 bg-card">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <Database className="h-3 w-3 text-emerald-500" /> Database Used
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {selectedProject.database || "Not specified"}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-border/70 bg-card">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                          <Palette className="h-3 w-3 text-violet-500" /> Project Theme
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {selectedProject.theme || "Standard Default"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extra Client Requirements */}
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" /> Extra Client Requirements
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                      {selectedProject.extraRequirements || "No special client instructions recorded."}
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(selectedProject)}
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Project
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingProject(selectedProject)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedProject(null)}>
                    Close Details
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT PROJECT DIALOG FORM */}
      <Dialog open={showFormModal} onOpenChange={(open) => setShowFormModal(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project Details" : "Add New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project specification and team assignments below."
                : "Fill in all 12 project attributes to store in your portfolio."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
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

              <div className="grid gap-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  placeholder="e.g. Apex Dynamics"
                  value={formData.clientName}
                  onChange={handleFormChange}
                  required
                />
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="allottedHours">Allotted Hours (Total)</Label>
                  {calculationDetails && (
                    <span className="text-[10px] font-mono text-primary font-semibold">
                      Auto-Calculated
                    </span>
                  )}
                </div>
                <Input
                  id="allottedHours"
                  name="allottedHours"
                  type="number"
                  placeholder="e.g. 480"
                  value={formData.allottedHours}
                  onChange={handleFormChange}
                />
                {calculationDetails && (
                  <div className="text-[11px] text-muted-foreground bg-primary/5 p-2.5 rounded-lg border border-primary/20 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        <strong className="text-primary">{calculationDetails.workingDays} working days</strong> × 8 hrs/day = <strong className="text-primary">{calculationDetails.totalHours} hrs</strong>
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pl-5">
                      Excluded {calculationDetails.weekendDays} weekend days (Sat/Sun) & {calculationDetails.holidayDays} public holidays.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="employeeCount">No. of Employees Allotted</Label>
                <Input
                  id="employeeCount"
                  name="employeeCount"
                  type="number"
                  placeholder="e.g. 4"
                  value={formData.employeeCount}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignedEmployees">
                Assigned Employee Names (Comma separated)
              </Label>
              <Input
                id="assignedEmployees"
                name="assignedEmployees"
                list="employee-suggestions-list"
                placeholder="e.g. Alex Morgan, Sarah Jenkins, David Miller"
                value={formData.assignedEmployees}
                onChange={handleFormChange}
              />
              <datalist id="employee-suggestions-list">
                {employees.map((emp) => (
                  <option key={emp._id || emp.employeeId} value={emp.name}>
                    {emp.name} ({emp.department || emp.employeeId})
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="theme">Theme to Use</Label>
                <Input
                  id="theme"
                  name="theme"
                  placeholder="e.g. Dark Glassmorphism"
                  value={formData.theme}
                  onChange={handleFormChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="database">Database Used</Label>
                <Input
                  id="database"
                  name="database"
                  placeholder="e.g. MongoDB / PostgreSQL"
                  value={formData.database}
                  onChange={handleFormChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="language">Language / Tech Stack</Label>
                <Input
                  id="language"
                  name="language"
                  placeholder="e.g. React & Node.js"
                  value={formData.language}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deploymentLocation">Where Deployed?</Label>
              <Input
                id="deploymentLocation"
                name="deploymentLocation"
                placeholder="e.g. Azure Cloud / AWS / Vercel / Render"
                value={formData.deploymentLocation}
                onChange={handleFormChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="extraRequirements">Extra Client Requirements</Label>
              <Input
                id="extraRequirements"
                name="extraRequirements"
                placeholder="e.g. SSO OAuth2, WebSocket integration, special compliance"
                value={formData.extraRequirements}
                onChange={handleFormChange}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingProject
                    ? "Save Changes"
                    : "Add Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
