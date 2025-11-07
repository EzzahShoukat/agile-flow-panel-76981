import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";

interface CreateTeamDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateTeamDialog = ({ open: controlledOpen, onOpenChange }: CreateTeamDialogProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { createTeam } = useTeams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeam.mutateAsync({ name, description });
    setName("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
            />
          </div>
          <Button type="submit" className="w-full">Create Team</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
