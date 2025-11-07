import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  project_id: string;
  due_date: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  assignee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const useTasks = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any as Task[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert([task as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};