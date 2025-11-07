import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateProjectDialog = ({ open: controlledOpen, onOpenChange }: CreateProjectDialogProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("hsl(215, 85%, 55%)");
  const [teamId, setTeamId] = useState<string>("");
  const { createProject } = useProjects();
  const { teams } = useTeams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("You must be logged in to create a project");
      return;
    }
    
    await createProject.mutateAsync({
      name,
      description,
      color,
      team_id: teamId || null,
      created_by: userData.user.id,
    });
    setName("");
    setDescription("");
    setColor("hsl(215, 85%, 55%)");
    setTeamId("");
    setOpen(false);
  };

  const colorOptions = [
    { value: "hsl(215, 85%, 55%)", label: "Blue" },
    { value: "hsl(145, 65%, 45%)", label: "Green" },
    { value: "hsl(35, 90%, 55%)", label: "Orange" },
    { value: "hsl(280, 65%, 60%)", label: "Purple" },
    { value: "hsl(350, 85%, 60%)", label: "Red" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: option.value }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="team">Team (Optional)</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Create Project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
