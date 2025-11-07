import { TaskStatus } from "@/types/task";
import { Task } from "@/hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusConfig = {
  todo: {
    label: "To Do",
    color: "bg-status-todo-bg border-status-todo/20",
    badgeColor: "bg-status-todo text-white",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-status-in-progress-bg border-status-in-progress/20",
    badgeColor: "bg-status-in-progress text-white",
  },
  review: {
    label: "Review",
    color: "bg-status-review-bg border-status-review/20",
    badgeColor: "bg-status-review text-white",
  },
  done: {
    label: "Done",
    color: "bg-status-done-bg border-status-done/20",
    badgeColor: "bg-status-done text-white",
  },
};

export const TaskColumn = ({ status, tasks, onTaskClick }: TaskColumnProps) => {
  const config = statusConfig[status];

  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className={cn("px-3 py-1.5 rounded-md text-xs font-semibold", config.badgeColor)}>
          {config.label}
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {tasks.length}
        </span>
      </div>

      <div className={cn("flex-1 rounded-lg border-2 border-dashed p-3 space-y-3", config.color)}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
};
