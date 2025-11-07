import { useTasks } from "./useTasks";

export const useProjectStats = (projectId: string) => {
  const { tasks } = useTasks(projectId);
  
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
};
