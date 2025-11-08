import { Task } from "@/hooks/useTasks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const priorityStyles = {
  high: "bg-priority-high-bg text-priority-high border-priority-high/20",
  medium: "bg-priority-medium-bg text-priority-medium border-priority-medium/20",
  low: "bg-priority-low-bg text-priority-low border-priority-low/20",
};

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {task.title}
          </h4>
          {task.status !== "done" && (
            <Badge
              variant="outline"
              className={cn("text-xs shrink-0", priorityStyles[task.priority])}
            >
              {task.priority}
            </Badge>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.due_date && (
              <div className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.due_date), "MMM d")}</span>
              </div>
            )}
          </div>

          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {task.assignee.full_name[0]}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
};
