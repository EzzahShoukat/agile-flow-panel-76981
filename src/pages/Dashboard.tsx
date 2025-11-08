import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, FolderKanban, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { isPast } from "date-fns";

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

  // Real-time subscription is now handled in useTasks hook
  // which invalidates both ["tasks"] and ["recent-tasks"] queries

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
  const todoTasks = recentTasks.filter((task) => task.status === "todo").length;
  const reviewTasks = recentTasks.filter((task) => task.status === "review").length;
  const overdueTasks = recentTasks.filter((task) => task.due_date && isPast(new Date(task.due_date)) && task.status !== "done").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityTasks = recentTasks.filter((task) => task.priority === "high" && task.status !== "done").length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Welcome back! Here's your overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Tasks</h3>
            <div className="p-2.5 bg-primary/15 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">{totalTasks}</p>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{inProgressTasks} in progress</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed</h3>
            <div className="p-2.5 bg-green-500/15 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">{completedTasks}</p>
          <div className="space-y-1">
            <Progress value={completionRate} className="h-2" />
            <p className="text-sm text-muted-foreground">{completionRate}% completion rate</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Projects</h3>
            <div className="p-2.5 bg-blue-500/15 rounded-lg">
              <FolderKanban className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">{projects.length}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            All projects active
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">High Priority</h3>
            <div className="p-2.5 bg-orange-500/15 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-foreground mb-2">{highPriorityTasks}</p>
          <p className="text-sm text-muted-foreground">
            {overdueTasks} overdue tasks
          </p>
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-status-todo-bg to-status-todo-bg/50 border border-status-todo/30 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">To Do</p>
              <p className="text-2xl font-bold text-foreground mt-1">{todoTasks}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-status-todo/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-status-todo"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-status-in-progress-bg to-status-in-progress-bg/50 border border-status-in-progress/30 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground mt-1">{inProgressTasks}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-status-in-progress/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-status-in-progress animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-status-review-bg to-status-review-bg/50 border border-status-review/30 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Review</p>
              <p className="text-2xl font-bold text-foreground mt-1">{reviewTasks}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-status-review/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-status-review"></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-status-done-bg to-status-done-bg/50 border border-status-done/30 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Done</p>
              <p className="text-2xl font-bold text-foreground mt-1">{completedTasks}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-status-done/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-status-done" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
