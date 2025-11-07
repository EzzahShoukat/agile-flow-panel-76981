import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useProjectStats } from "@/hooks/useProjectStats";

export const Projects = () => {
  const navigate = useNavigate();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { userRole } = useAuth();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const canCreateProject = userRole === "admin" || userRole === "manager";

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground mt-1">{canCreateProject ? "Manage and track all your projects" : "View and track project progress"}</p>
            </div>
            {canCreateProject && (
              <Button onClick={() => setCreateProjectOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCardWithStats
                key={project.id}
                project={project}
                onClick={() => navigate(`/project/${project.id}`)}
              />
            ))}
          </div>

          {projects.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No projects yet. Create your first project to get started!</p>
            </Card>
          )}

          <CreateProjectDialog open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
        </div>
      </div>
    </div>
  );
};

const ProjectCardWithStats = ({ project, onClick }: { project: any; onClick: () => void }) => {
  const stats = useProjectStats(project.id);
  
  return (
    <div onClick={onClick} className="cursor-pointer">
      <ProjectCard project={project} stats={stats} />
    </div>
  );
};
