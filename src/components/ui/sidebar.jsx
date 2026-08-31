import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SidebarContext = createContext({
  isOpen: true,
  setIsOpen: () => {},
  toggleSidebar: () => {},
});

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function Sidebar({ className, children, ...props }) {
  const { isOpen } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => {}}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        data-slot="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:static md:z-auto",
          !isOpen && "-translate-x-full md:translate-x-0 md:w-16 md:overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({ className, children, ...props }) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex h-16 items-center border-b border-sidebar-border px-4 font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ className, children, ...props }) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex-1 overflow-y-auto p-3 space-y-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({ className, children, ...props }) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("border-t border-sidebar-border p-3 mt-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarGroup({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-group" className={cn("space-y-1", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroupLabel({ className, children, ...props }) {
  const { isOpen } = useSidebar();
  if (!isOpen) return null;

  return (
    <div
      data-slot="sidebar-group-label"
      className={cn("px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 my-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({ className, children, ...props }) {
  return (
    <ul data-slot="sidebar-menu" className={cn("space-y-1", className)} {...props}>
      {children}
    </ul>
  );
}

export function SidebarMenuItem({ className, children, ...props }) {
  return (
    <li data-slot="sidebar-menu-item" className={cn("list-none", className)} {...props}>
      {children}
    </li>
  );
}

export function SidebarMenuButton({
  className,
  isActive = false,
  children,
  ...props
}) {
  return (
    <button
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarTrigger({ className, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
