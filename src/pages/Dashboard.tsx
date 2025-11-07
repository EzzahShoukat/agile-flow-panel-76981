import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, FolderKanban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, isLoading: projectsLoading } = useProjects();
  
  // Only fetch recent tasks for dashboard overview
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
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Track your projects and tasks</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{totalTasks}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {inProgressTasks} in progress
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
            <TrendingUp className="h-5 w-5 text-status-done" />
          </div>
          <p className="text-3xl font-bold">{completedTasks}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {completionRate}% completion rate
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Projects</h3>
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-bold">{projects.length}</p>
          <p className="text-sm text-muted-foreground mt-1">
            All projects active
          </p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button
          variant="outline"
          className="h-24 flex items-center justify-start gap-4 text-left"
          onClick={() => navigate("/projects")}
        >
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Projects</h3>
            <p className="text-sm text-muted-foreground">{projects.length} active projects</p>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex items-center justify-start gap-4 text-left"
          onClick={() => navigate("/teams")}
        >
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Teams</h3>
            <p className="text-sm text-muted-foreground">View teams</p>
          </div>
        </Button>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Projects</h2>
          <Button variant="ghost" onClick={() => navigate("/projects")}>View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(0, 3).map((project) => (
            <div key={project.id} onClick={() => navigate(`/project/${project.id}`)} className="cursor-pointer">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
