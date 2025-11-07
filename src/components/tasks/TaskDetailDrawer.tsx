import { Task, TaskStatus, TaskPriority } from "@/hooks/useTasks";
import { X, Calendar, Flag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  todo: { label: "To Do", color: "bg-status-todo" },
  in_progress: { label: "In Progress", color: "bg-status-in-progress" },
  review: { label: "Review", color: "bg-status-review" },
  done: { label: "Done", color: "bg-status-done" },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-priority-low" },
  medium: { label: "Medium", color: "bg-priority-medium" },
  high: { label: "High", color: "bg-priority-high" },
};

export const TaskDetailDrawer = ({ task, open, onOpenChange }: TaskDetailDrawerProps) => {
  if (!task || !open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-card border-l border-border z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold text-foreground pr-8">{task.title}</h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Status and Priority */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Status
              </label>
              <Select defaultValue={task.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Priority
              </label>
              <Select defaultValue={task.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Flag className={cn("h-3 w-3", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Description
            </label>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {task.description || "No description provided"}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <User className="h-3 w-3" />
                Assignee
              </label>
              {task.assignee ? (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={task.assignee.avatar_url || undefined} />
                    <AvatarFallback>{task.assignee.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{task.assignee.full_name}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Unassigned</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Due Date
              </label>
              <p className="text-sm font-medium mt-2">
                {task.due_date ? format(new Date(task.due_date), "PPP") : "No due date"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
