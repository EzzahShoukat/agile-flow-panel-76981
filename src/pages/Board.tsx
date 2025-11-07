import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TaskStatus } from "@/types/task";
import { TaskColumn } from "@/components/tasks/TaskColumn";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc } from "lucide-react";

export const Board = () => {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { tasks, isLoading } = useTasks();

  const statuses: TaskStatus[] = ["todo", "in_progress", "review", "done"];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Board View</h1>
            <p className="text-sm text-muted-foreground">
              Drag and drop tasks between columns
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full min-w-max">
          {statuses.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>
      </div>

      <TaskDetailDrawer 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => !open && setSelectedTask(null)} 
      />
    </div>
  );
};
