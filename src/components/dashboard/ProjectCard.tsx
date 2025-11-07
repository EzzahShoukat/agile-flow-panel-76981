import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface ProjectCardProps {
  project: Project;
  stats?: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
}

export const ProjectCard = ({ project, stats = { todo: 0, inProgress: 0, review: 0, done: 0 } }: ProjectCardProps) => {
  const total = stats.todo + stats.inProgress + stats.review + stats.done;
  const completionRate = total > 0 ? Math.round((stats.done / total) * 100) : 0;

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
          />
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
  );
};
