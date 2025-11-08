import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, FolderKanban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projects, isLoading: projectsLoading } = useProjects();
  
  // Only fetch recent tasks for dashboard overview with realtime updates
  const { data: recentTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50); // Only fetch last 50 tasks for dashboard

      if (error) throw error;
      return data as any[];
    },
  });

  // Set up realtime subscription for dashboard stats
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalTasks = recentTasks.length;
  const completedTasks = recentTasks.filter((task) => task.status === "done").length;
  const inProgressTasks = recentTasks.filter((task) => task.status === "in_progress").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Welcome back! Here's your overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground">{totalTasks}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {inProgressTasks} in progress
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground">{completedTasks}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {completionRate}% completion rate
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Projects</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground">{projects.length}</p>
          <p className="text-sm text-muted-foreground mt-2">
            All projects active
          </p>
        </div>
      </div>
    </div>
  );
};
