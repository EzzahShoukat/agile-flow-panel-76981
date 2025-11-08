import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, AlertCircle, Trash2, MoreVertical } from "lucide-react";
import { Project, useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  stats?: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
  onCardClick?: () => void;
}

export const ProjectCard = ({ project, stats = { todo: 0, inProgress: 0, review: 0, done: 0 }, onCardClick }: ProjectCardProps) => {
  const { userRole } = useAuth();
  const { deleteProject } = useProjects();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const total = stats.todo + stats.inProgress + stats.review + stats.done;
  const completionRate = total > 0 ? Math.round((stats.done / total) * 100) : 0;
  const canDelete = userRole === "admin" || userRole === "manager";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject.mutate(project.id);
    setShowDeleteDialog(false);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={onCardClick}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-status-done transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Circle className="h-4 w-4 text-status-todo" />
            <span className="text-muted-foreground">To Do:</span>
            <span className="font-medium">{stats.todo}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-status-in-progress" />
            <span className="text-muted-foreground">In Progress:</span>
            <span className="font-medium">{stats.inProgress}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-status-review" />
            <span className="text-muted-foreground">Review:</span>
            <span className="font-medium">{stats.review}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-status-done" />
            <span className="text-muted-foreground">Done:</span>
            <span className="font-medium">{stats.done}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{project.name}"? This will also delete all tasks in this project. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
