import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/layout/Navbar";
import { MainSidebar } from "@/components/layout/MainSidebar";
import { TaskColumn } from "@/components/tasks/TaskColumn";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { useProjects } from "@/hooks/useProjects";
import { useTasks, Task } from "@/hooks/useTasks";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { QuickAddDialog } from "@/components/tasks/QuickAddDialog";
import { useAuth } from "@/contexts/AuthContext";

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { teams } = useTeams();
  const { userRole } = useAuth();

  const canManage = userRole === "admin" || userRole === "manager";

  const project = projects.find((p) => p.id === id);
  const projectTasks = tasks.filter((task) => task.project_id === id);
  const team = teams.find((t) => t.id === project?.team_id);
  const { members } = useTeamMembers(project?.team_id || undefined);

  const todoTasks = projectTasks.filter((t) => t.status === "todo");
  const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress");
  const reviewTasks = projectTasks.filter((t) => t.status === "review");
  const doneTasks = projectTasks.filter((t) => t.status === "done");

  const completionRate = projectTasks.length > 0
    ? Math.round((doneTasks.length / projectTasks.length) * 100)
    : 0;

  if (projectsLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate("/projects")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <MainSidebar />
        
        <div className="flex-1 p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground mt-1">{project.description}</p>
              )}
            </div>
            {canManage && (
              <Button onClick={() => setCreateTaskOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={completionRate} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {doneTasks.length} of {projectTasks.length} tasks completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.profiles?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 5 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs font-medium">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Task Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To Do</span>
                  <span className="font-medium">{todoTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress</span>
                  <span className="font-medium">{inProgressTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Review</span>
                  <span className="font-medium">{reviewTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Done</span>
                  <span className="font-medium">{doneTasks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TaskColumn tasks={todoTasks} status="todo" onTaskClick={setSelectedTask} />
            <TaskColumn tasks={inProgressTasks} status="in_progress" onTaskClick={setSelectedTask} />
            <TaskColumn tasks={reviewTasks} status="review" onTaskClick={setSelectedTask} />
            <TaskColumn tasks={doneTasks} status="done" onTaskClick={setSelectedTask} />
          </div>
        </div>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      <QuickAddDialog 
        open={createTaskOpen} 
        onOpenChange={setCreateTaskOpen}
        defaultProjectId={id}
      />
    </div>
  );
};
