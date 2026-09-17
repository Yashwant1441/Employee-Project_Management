import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Zap,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
  Maximize2,
  Database,
  Code2,
  Cloud,
  MoreVertical,
  Plus,
  Trash2,
  Layers,
  FolderKanban,
  HelpCircle,
} from "lucide-react";

// Standard preset styling maps for default columns
const COLUMN_PRESETS = {
  Pending: {
    icon: Clock,
    badgeBg: "bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400",
    headerBorder: "border-t-slate-400",
    accentColor: "text-slate-500",
  },
  "In Progress": {
    icon: Zap,
    badgeBg: "bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400",
    headerBorder: "border-t-sky-500",
    accentColor: "text-sky-500",
  },
  Delayed: {
    icon: AlertTriangle,
    badgeBg: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400",
    headerBorder: "border-t-rose-500",
    accentColor: "text-rose-500",
  },
  Completed: {
    icon: CheckCircle2,
    badgeBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    headerBorder: "border-t-emerald-500",
    accentColor: "text-emerald-500",
  },
};

// Fallback styles for user-created custom columns
const CUSTOM_COLUMN_STYLES = [
  { icon: Layers, badgeBg: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400", headerBorder: "border-t-purple-500", accentColor: "text-purple-500" },
  { icon: FolderKanban, badgeBg: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400", headerBorder: "border-t-amber-500", accentColor: "text-amber-500" },
  { icon: HelpCircle, badgeBg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400", headerBorder: "border-t-indigo-500", accentColor: "text-indigo-500" },
];

export function KanbanBoard({
  statuses = ["Pending", "In Progress", "Delayed", "Completed"],
  projects = [],
  onSelectProject,
  onUpdateStatus,
  onAddStatus,
  onDeleteStatus,
  renderProjectIcon,
  getStatusBadge,
}) {
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [addError, setAddError] = useState("");

  const [statusToDelete, setStatusToDelete] = useState(null);
  const [reassignTargetStatus, setReassignTargetStatus] = useState("");

  // Get style config for any column (default or custom)
  const getColumnConfig = (statusName, index) => {
    if (COLUMN_PRESETS[statusName]) {
      return { id: statusName, title: statusName, ...COLUMN_PRESETS[statusName] };
    }
    const customStyle = CUSTOM_COLUMN_STYLES[index % CUSTOM_COLUMN_STYLES.length];
    return {
      id: statusName,
      title: statusName,
      ...customStyle,
    };
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    if (onUpdateStatus) {
      onUpdateStatus(draggableId, newStatus);
    }
  };

  const handleCreateColumn = (e) => {
    e.preventDefault();
    if (!newStatusName.trim()) {
      setAddError("Please enter a column title.");
      return;
    }
    if (statuses.map(s => s.toLowerCase()).includes(newStatusName.trim().toLowerCase())) {
      setAddError("A column with this status name already exists.");
      return;
    }

    if (onAddStatus) {
      onAddStatus(newStatusName.trim());
    }
    setNewStatusName("");
    setAddError("");
    setShowAddModal(false);
  };

  const handleConfirmDeleteColumn = () => {
    if (!statusToDelete) return;
    if (onDeleteStatus) {
      onDeleteStatus(statusToDelete, reassignTargetStatus);
    }
    setStatusToDelete(null);
  };

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 pt-1 items-start min-h-[500px]">
          {statuses.map((statusName, colIdx) => {
            const column = getColumnConfig(statusName, colIdx);
            const columnProjects = projects.filter(
              (p) => (p.status || (statuses && statuses[0]) || "Pending") === column.id
            );
            const ColumnIcon = column.icon;

            return (
              <div
                key={column.id}
                className={`w-80 shrink-0 flex flex-col rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-border/70 flex items-center justify-between bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <ColumnIcon className={`h-4 w-4 shrink-0 ${column.accentColor}`} />
                    <h3 className="font-bold text-sm tracking-tight text-foreground truncate">
                      {column.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs px-2 py-0.5 font-bold ${column.badgeBg}`}
                    >
                      {columnProjects.length}
                    </Badge>

                    {/* Column Options Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          disabled={statuses.length <= 1}
                          onClick={() => {
                            setStatusToDelete(statusName);
                            // Default reassign target to first status that isn't the deleted one
                            const fallback = statuses.find((s) => s !== statusName) || "Pending";
                            setReassignTargetStatus(fallback);
                          }}
                          className="text-xs cursor-pointer text-rose-500 focus:text-rose-600 dark:focus:text-rose-400 flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Column
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Droppable Container */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[420px] flex flex-col gap-3 transition-colors duration-200 ${snapshot.isDraggingOver
                        ? "bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-b-xl"
                        : ""
                        }`}
                    >
                      {columnProjects.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/60 rounded-lg my-auto text-muted-foreground">
                          <ColumnIcon className="h-8 w-8 mb-2 opacity-30" />
                          <p className="text-xs font-medium">No projects in {column.title}</p>
                          <p className="text-[11px] opacity-70 mt-0.5">Drag projects here to update status</p>
                        </div>
                      ) : (
                        columnProjects.map((project, index) => {
                          const projectId = String(project.id || project._id);

                          return (
                            <Draggable
                              key={projectId}
                              draggableId={projectId}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`group relative rounded-xl border border-border bg-card transition-all duration-200 ${snapshot.isDragging
                                    ? "shadow-2xl ring-2 ring-primary border-primary scale-[1.03] z-50 bg-card"
                                    : "hover:border-primary/50 hover:shadow-md"
                                    }`}
                                >
                                  <Card className="border-0 shadow-none bg-transparent">
                                    <CardHeader className="p-4 pb-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all overflow-hidden">
                                            {renderProjectIcon
                                              ? renderProjectIcon(project.icon, "h-4 w-4")
                                              : null}
                                          </div>
                                          <div className="min-w-0">
                                            <h4
                                              onClick={() => onSelectProject && onSelectProject(project)}
                                              className="font-bold text-sm text-foreground line-clamp-1 hover:text-primary cursor-pointer transition-colors"
                                            >
                                              {project.name}
                                            </h4>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <Building2 className="h-3 w-3 shrink-0" />
                                              <span className="truncate">{project.clientName}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Quick Status Dropdown Menu */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 -mr-1"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-44">
                                            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                              Move Status
                                            </div>
                                            {statuses.map((colName) => (
                                              <DropdownMenuItem
                                                key={colName}
                                                disabled={colName === column.id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (onUpdateStatus) {
                                                    onUpdateStatus(projectId, colName);
                                                  }
                                                }}
                                                className="text-xs cursor-pointer flex items-center gap-2"
                                              >
                                                <Layers className="h-3.5 w-3.5 text-primary" />
                                                {colName}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </CardHeader>

                                    <CardContent className="px-4 pb-4 pt-1">
                                      {/* Tech Badges */}
                                      <div className="flex items-center gap-1.5 flex-wrap my-2.5">
                                        {project.language && (
                                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal flex items-center gap-1 bg-muted">
                                            <Code2 className="h-2.5 w-2.5 text-primary" />
                                            {project.language}
                                          </Badge>
                                        )}
                                        {project.database && (
                                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal flex items-center gap-1 bg-muted">
                                            <Database className="h-2.5 w-2.5 text-emerald-500" />
                                            {project.database}
                                          </Badge>
                                        )}
                                        {project.deploymentLocation && (
                                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal flex items-center gap-1 bg-muted">
                                            <Cloud className="h-2.5 w-2.5 text-sky-500" />
                                            {project.deploymentLocation}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Project Footer */}
                                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                          <Users className="h-3.5 w-3.5 text-primary" />
                                          <span className="font-medium text-[11px]">
                                            {project.employeeCount || (Array.isArray(project.assignedEmployees) ? project.assignedEmployees.length : 1)} assigned
                                          </span>
                                        </div>

                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectProject) onSelectProject(project);
                                          }}
                                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
                                        >
                                          <Maximize2 className="h-3 w-3" /> Details
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          {/* Add New Column Button Container */}
          <div className="w-72 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setAddError("");
                setShowAddModal(true);
              }}
              className="w-full h-14 border-dashed border-2 border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all"
            >
              <Plus className="h-4 w-4" /> Add Status Column
            </Button>
          </div>
        </div>
      </DragDropContext>

      {/* Add Column Dialog Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add New Status Column
            </DialogTitle>
            <DialogDescription>
              Create a new status stage for your project Kanban workflow.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateColumn} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="columnName">Status Column Title</Label>
              <Input
                id="columnName"
                placeholder="e.g. QA & Testing, Deployment, Code Review"
                value={newStatusName}
                onChange={(e) => {
                  setNewStatusName(e.target.value);
                  setAddError("");
                }}
                autoFocus
              />
              {addError && <p className="text-xs text-rose-500 font-medium">{addError}</p>}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Column</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Column Safeguard Modal */}
      <Dialog open={!!statusToDelete} onOpenChange={() => setStatusToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <Trash2 className="h-5 w-5" /> Delete Column "{statusToDelete}"?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this column?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {projects.filter((p) => (p.status || "In Progress") === statusToDelete).length > 0 ? (
              <div className="space-y-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold">
                  ⚠️ This column has {projects.filter((p) => (p.status || "In Progress") === statusToDelete).length} active project(s).
                </p>
                <p>Select a destination column to reassign these projects to before deleting:</p>
                <div className="space-y-1">
                  <Label htmlFor="reassignSelect" className="text-xs text-foreground">
                    Reassign Projects To:
                  </Label>
                  <select
                    id="reassignSelect"
                    value={reassignTargetStatus}
                    onChange={(e) => setReassignTargetStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {statuses
                      .filter((s) => s !== statusToDelete)
                      .map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                There are currently no active projects in this column. It will be removed immediately.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusToDelete(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteColumn}>
              Delete Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
