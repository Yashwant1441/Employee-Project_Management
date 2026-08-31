import "./App.css";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  LogOut,
  Search,
  Building2,
  Home,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ProjectsView } from "@/components/ProjectsView";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("home");
  const [assigningEmployeeProjects, setAssigningEmployeeProjects] = useState(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const companyInfo = {
    name: "ApexTech Global",
    tagline: "Enterprise Portal",
    code: "APEX-ORG",
  };

  const ITEMS_PER_PAGE = 5;
  const filteredEmployees = employees.filter((employee) =>
    employee.name ? employee.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) : false
  );

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const fetchEmployees = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/employees");
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.log("Failed to fetch employees:", error);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/projects");
        const data = await response.json();
        if (Array.isArray(data)) {
          setProjects(data);
        }
      } catch (error) {
        console.log("Failed to fetch projects:", error);
      }
    };

    fetchEmployees();
    fetchProjects();
  }, [isLoggedIn]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoggedIn(true);
        setActiveTab("home");
      } else {
        setLoginError(data.message);
      }
    } catch (error) {
      setLoginError("Something went wrong. Please try again.");
      console.log("Login failed:", error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setLoginError("");
    setActiveTab("home");
  };

  const handleAddEmployee = async () => {
    setFormError("");
    try {
      const response = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          name,
          department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Failed to add employee");
        return;
      }

      setEmployees((previousEmployees) => [...previousEmployees, data]);
      setEmployeeId("");
      setName("");
      setDepartment("");
      setFormError("");
      setShowAddForm(false);
    } catch (error) {
      setFormError("Something went wrong. Please try again.");
      console.log("Failed to add employee:", error);
    }
  };

  const handleDeleteEmployee = async (id) => {
    const targetId = id || deletingEmployee?._id;
    if (!targetId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${targetId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setEmployees((previousEmployees) =>
        previousEmployees.filter((employee) => employee._id !== targetId)
      );

      setDeletingEmployee(null);
    } catch (error) {
      console.log("Failed to delete employee:", error);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setFormError("");
    setEmployeeId(employee.employeeId);
    setName(employee.name);
    setDepartment(employee.department);
    setShowAddForm(true);
  };

  const handleUpdateEmployee = async () => {
    setFormError("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${editingEmployee._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId,
            name,
            department,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Failed to update employee");
        return;
      }

      setEmployees((previousEmployees) =>
        previousEmployees.map((employee) =>
          employee._id === data._id ? data : employee
        )
      );

      setEmployeeId("");
      setName("");
      setDepartment("");
      setFormError("");
      setEditingEmployee(null);
      setShowAddForm(false);
    } catch (error) {
      setFormError("Something went wrong. Please try again.");
      console.log("Failed to update employee:", error);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setEmployeeId("");
    setName("");
    setDepartment("");
    setFormError("");
    setShowAddForm(true);
  };

  const isEmployeeAssigned = (project, employee) => {
    if (!project || !employee) return false;
    const assignedList = Array.isArray(project.assignedEmployees)
      ? project.assignedEmployees
      : typeof project.assignedEmployees === "string"
      ? project.assignedEmployees.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const empNameLower = (employee.name || "").trim().toLowerCase();
    const empIdLower = (employee.employeeId || "").trim().toLowerCase();

    return assignedList.some((n) => {
      const nLower = (n || "").trim().toLowerCase();
      if (!nLower) return false;
      return (
        nLower === empNameLower ||
        nLower === empIdLower ||
        (empNameLower && (nLower.includes(empNameLower) || empNameLower.includes(nLower)))
      );
    });
  };

  const handleToggleProjectAssignment = async (project, employee) => {
    if (!project || !employee) return;
    setIsAssigning(true);

    const empName = employee.name;
    const empNameLower = (employee.name || "").trim().toLowerCase();
    const empIdLower = (employee.employeeId || "").trim().toLowerCase();

    const currentAssigned = Array.isArray(project.assignedEmployees)
      ? project.assignedEmployees
      : typeof project.assignedEmployees === "string"
      ? project.assignedEmployees.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const isCurrentlyAssigned = isEmployeeAssigned(project, employee);

    let updatedAssigned;

    if (isCurrentlyAssigned) {
      updatedAssigned = currentAssigned.filter((n) => {
        const nLower = (n || "").trim().toLowerCase();
        return (
          nLower !== empNameLower &&
          nLower !== empIdLower &&
          !nLower.includes(empNameLower) &&
          !empNameLower.includes(nLower)
        );
      });
    } else {
      updatedAssigned = [...currentAssigned, empName];
    }

    const updatedCount = updatedAssigned.length;

    const payload = {
      name: project.name,
      clientName: project.clientName,
      startDate: project.startDate,
      endDate: project.endDate,
      allottedHours: project.allottedHours,
      employeeCount: updatedCount,
      assignedEmployees: updatedAssigned,
      theme: project.theme,
      database: project.database,
      language: project.language,
      extraRequirements: project.extraRequirements,
      deploymentLocation: project.deploymentLocation,
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${project._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((p) => (p._id === data._id ? data : p))
        );
      } else {
        console.error("Failed to update project assignment:", data.message);
      }
    } catch (error) {
      console.error("Error toggling project assignment:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoggedIn) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          {/* Main shadcn Sidebar */}
          <Sidebar>
            <SidebarHeader className="gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-base font-bold text-foreground tracking-tight">
                  {companyInfo.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {companyInfo.tagline}
                </span>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "home"}
                      onClick={() => setActiveTab("home")}
                    >
                      <Home className="h-4 w-4" />
                      <span className="flex-1">Home</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">
                        Main
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "employees"}
                      onClick={() => setActiveTab("employees")}
                    >
                      <Users className="h-4 w-4" />
                      <span className="flex-1">Employees</span>
                      <Badge variant="secondary" className="text-[10px] py-0 h-4 font-mono">
                        {employees.length}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "projects"}
                      onClick={() => setActiveTab("projects")}
                    >
                      <Briefcase className="h-4 w-4" />
                      <span className="flex-1">Projects</span>
                      <Badge variant="secondary" className="text-[10px] py-0 h-4 font-mono">
                        {projects.length}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-semibold text-xs text-muted-foreground border border-border">
                    AD
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">Admin Account</span>
                    <span className="text-[10px] text-muted-foreground">{email || "admin@apex.com"}</span>
                  </div>
                </div>
                <ModeToggle />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
              </Button>
            </SidebarFooter>
          </Sidebar>

          {/* Main Body Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Navigation Header */}
            <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-muted-foreground hidden sm:inline">{companyInfo.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                  <span className="capitalize font-semibold text-foreground">
                    {activeTab === "home"
                      ? "Home Dashboard"
                      : activeTab === "projects"
                      ? "Project Portfolio"
                      : "Employee Management"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === "employees" && (
                  <Button onClick={handleOpenAddModal} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </header>

            {/* Main Dynamic View Content */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">

              {/* HOME PAGE VIEW */}
              {activeTab === "home" && (
                <div className="space-y-8 max-w-5xl mx-auto">
                  {/* Hero Header */}
                  <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                          <Building2 className="h-8 w-8" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                              {companyInfo.name}
                            </h1>
                            <Badge variant="outline" className="font-mono text-xs">
                              {companyInfo.code}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Welcome to your centralized organization dashboard.
                          </p>
                        </div>
                      </div>

                      <Button onClick={() => setActiveTab("employees")} size="sm">
                        <Users className="mr-2 h-4 w-4" /> Manage Employees
                      </Button>
                    </div>
                  </div>

                  {/* Main Metric Cards: Total Employees & Projects */}
                  <div>
                    <h2 className="text-lg font-bold mb-4 tracking-tight">Organization Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Stat Card: Employees */}
                      <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab("employees")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">
                            Number of Employees
                          </CardTitle>
                          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-extrabold tracking-tight">{employees.length}</div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            Total active workforce members registered
                          </p>
                        </CardContent>
                        <CardFooter className="pt-2 text-xs text-primary font-medium flex items-center justify-between border-t border-border/50">
                          <span>Open Employee Directory</span>
                          <ChevronRight className="h-4 w-4" />
                        </CardFooter>
                      </Card>

                      {/* Stat Card: Projects */}
                      <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab("projects")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">
                            Active Projects
                          </CardTitle>
                          <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Briefcase className="h-5 w-5" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-extrabold tracking-tight">{projects.length}</div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            Client projects in portfolio database
                          </p>
                        </CardContent>
                        <CardFooter className="pt-2 text-xs text-primary font-medium flex items-center justify-between border-t border-border/50">
                          <span>Explore Project Portfolio</span>
                          <ChevronRight className="h-4 w-4" />
                        </CardFooter>
                      </Card>

                      {/* Info Card: Company Overview */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">
                            Company Status
                          </CardTitle>
                          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-xs border-b border-border/60 pb-1.5">
                            <span className="text-muted-foreground">Company Name:</span>
                            <span className="font-semibold">{companyInfo.name}</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-border/60 pb-1.5">
                            <span className="text-muted-foreground">System Status:</span>
                            <span className="font-semibold text-emerald-600 flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Active & Operational
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-0.5">
                            <span className="text-muted-foreground">Total Workforce:</span>
                            <span className="font-semibold">{employees.length} Active Members</span>
                          </div>
                        </CardContent>
                      </Card>

                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                      <CardDescription>Shortcut to employee and project tools</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="justify-between"
                        onClick={() => {
                          setActiveTab("employees");
                          handleOpenAddModal();
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Add New Employee
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-between"
                        onClick={() => setActiveTab("projects")}
                      >
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> View Projects ({projects.length})
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-between"
                        onClick={() => setActiveTab("employees")}
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" /> View Employees ({employees.length})
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* PROJECTS PAGE VIEW */}
              {activeTab === "projects" && (
                <ProjectsView
                  projects={projects}
                  setProjects={setProjects}
                  employees={employees}
                />
              )}

              {/* EMPLOYEES PAGE VIEW */}
              {activeTab === "employees" && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  {/* Header Bar */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Employee Management
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage your team members, track departments, and update records.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={handleOpenAddModal}>
                        <Plus className="mr-2 h-4 w-4" /> Add Employee
                      </Button>
                    </div>
                  </div>

                  {/* Employee Directory Table Card */}
                  <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
                      <div>
                        <CardTitle className="text-xl">Employees</CardTitle>
                        <CardDescription className="mt-1">
                          A list of all active employees in your workspace.
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="pl-9 text-sm"
                          />
                        </div>
                        <Badge variant="secondary" className="font-mono self-start sm:self-auto">
                          Total: {filteredEmployees.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg my-4">
                          <Users className="h-10 w-10 text-muted-foreground mb-3" />
                          <h3 className="font-semibold text-lg text-foreground">
                            {searchQuery ? "No matching employees found" : "No employees found"}
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                            {searchQuery
                              ? `No employee names match "${searchQuery}".`
                              : "Get started by adding a new employee to your organization directory."}
                          </p>
                          {searchQuery ? (
                            <Button variant="outline" onClick={() => setSearchQuery("")} size="sm">
                              Clear Search
                            </Button>
                          ) : (
                            <Button onClick={handleOpenAddModal} size="sm">
                              <Plus className="mr-2 h-4 w-4" /> Add Employee
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[140px]">Employee ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Assign Projects</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedEmployees.map((employee) => {
                                const employeeProjects = projects.filter((proj) =>
                                  isEmployeeAssigned(proj, employee)
                                );

                                return (
                                  <TableRow key={employee._id}>
                                    <TableCell className="font-mono">
                                      <Badge variant="outline">{employee.employeeId}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">
                                      {employee.name}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{employee.department}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {employeeProjects.slice(0, 2).map((proj) => (
                                          <Badge
                                            key={proj._id}
                                            variant="outline"
                                            className="text-[11px] bg-primary/5 text-primary border-primary/20 font-normal"
                                          >
                                            {proj.name}
                                          </Badge>
                                        ))}
                                        {employeeProjects.length > 2 && (
                                          <Badge variant="secondary" className="text-[10px]">
                                            +{employeeProjects.length - 2} more
                                          </Badge>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs px-2.5 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                                          onClick={() => {
                                            setAssigningEmployeeProjects(employee);
                                            setProjectSearchQuery("");
                                          }}
                                        >
                                          <Briefcase className="h-3 w-3" />
                                          {employeeProjects.length === 0 ? "Assign Projects" : "Manage Projects"}
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditEmployee(employee)}
                                        >
                                          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => setDeletingEmployee(employee)}
                                        >
                                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>

                          {/* Pagination Controls */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4 mt-4">
                            <div className="text-xs text-muted-foreground">
                              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} employees
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
                    </CardContent>
                  </Card>
                </div>
              )}

            </main>
          </div>
        </div>

        {/* Add / Edit Employee Dialog Modal */}
        <Dialog open={showAddForm} onOpenChange={(open) => setShowAddForm(open)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? "Update the details for this employee below."
                  : "Enter the details below to add a new employee."}
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive font-medium">
                {formError}
              </div>
            )}

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  placeholder="e.g. EMP-001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
              >
                {editingEmployee ? "Save Changes" : "Add Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog Modal */}
        <Dialog
          open={!!deletingEmployee}
          onOpenChange={(open) => !open && setDeletingEmployee(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription className="pt-1">
                This action cannot be undone. This will permanently delete employee{" "}
                <span className="font-semibold text-foreground">
                  {deletingEmployee?.employeeId} ({deletingEmployee?.name})
                </span>{" "}
                from your database.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeletingEmployee(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteEmployee()}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Projects Dialog Modal */}
        <Dialog
          open={!!assigningEmployeeProjects}
          onOpenChange={(open) => {
            if (!open) {
              setAssigningEmployeeProjects(null);
              setProjectSearchQuery("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Assign Projects to {assigningEmployeeProjects?.name}
              </DialogTitle>
              <DialogDescription>
                Select projects to assign or remove for this employee.
              </DialogDescription>
            </DialogHeader>

            <div className="relative my-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by name or client..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 max-h-[380px]">
              {projects
                .filter((project) => {
                  const q = projectSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (project.name && project.name.toLowerCase().includes(q)) ||
                    (project.clientName && project.clientName.toLowerCase().includes(q))
                  );
                })
                .map((project) => {
                  const assignedList = Array.isArray(project.assignedEmployees)
                    ? project.assignedEmployees
                    : typeof project.assignedEmployees === "string"
                    ? project.assignedEmployees.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];
                  const isAssigned = isEmployeeAssigned(project, assigningEmployeeProjects);

                  return (
                    <div
                      key={project._id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isAssigned
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="space-y-1 max-w-[320px]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {project.name}
                          </span>
                          {isAssigned && (
                            <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-600">
                              Assigned
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Client: {project.clientName}</span>
                          <span>•</span>
                          <span>
                            {assignedList.length > 0 ? assignedList.length : (project.employeeCount || 0)} Employees
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isAssigned ? "destructive" : "default"}
                        disabled={isAssigning}
                        onClick={() =>
                          handleToggleProjectAssignment(project, assigningEmployeeProjects)
                        }
                        className="shrink-0"
                      >
                        {isAssigned ? (
                          <>Remove</>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Assign
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}

              {projects.length === 0 && (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  No projects available in database. Create a project in the Projects tab first.
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setAssigningEmployeeProjects(null);
                  setProjectSearchQuery("");
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    );
  }

  // Official shadcn/ui Login Card layout
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background text-foreground font-sans">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full" type="button">
              Sign Up
            </Button>
            {loginError && (
              <div className="rounded-md border border-rose-800/30 bg-white-200 p-3 text-center text-xs font-medium text-red-600 w-full">
                {loginError}
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default App;