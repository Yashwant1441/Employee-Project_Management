import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";

export function NotificationModal({
  isOpen,
  onClose,
  title,
  entityType = "Employee",
  actionType = "created", // 'created' or 'updated'
  id,
  name,
}) {
  if (!isOpen) return null;

  const isCreated = actionType === "created";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] text-center p-6 gap-4 border border-border/50 bg-background/95 backdrop-blur-md shadow-xl rounded-2xl">
        <DialogHeader className="flex flex-col items-center gap-2">
          {/* Animated/Glowing Success Icon */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5 mb-1">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {title || `${entityType} ${isCreated ? "Created" : "Updated"}`}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground text-sm">
            {isCreated
              ? `New ${entityType.toLowerCase()} has been successfully registered.`
              : `${entityType} details have been updated successfully.`}
          </DialogDescription>
        </DialogHeader>

        {/* Info Card displaying ID & Name */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/40 gap-2 my-1">
          {name && (
            <span className="font-semibold text-foreground text-base line-clamp-1">
              {name}
            </span>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{entityType} ID:</span>
            <Badge
              variant="secondary"
              className="px-3 py-1 text-sm font-mono font-bold tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg"
            >
              {id || "N/A"}
            </Badge>
          </div>
        </div>

        <DialogFooter className="sm:justify-center mt-2">
          <Button
            onClick={onClose}
            className="w-full sm:w-32 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl transition-all"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
