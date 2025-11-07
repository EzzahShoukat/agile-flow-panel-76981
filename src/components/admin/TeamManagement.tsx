import { useState } from "react";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Users, X, UserPlus } from "lucide-react";

export const TeamManagement = () => {
  const { teams, isLoading, createTeam, deleteTeam } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeam.mutateAsync({
      name: newTeamName,
      description: newTeamDescription,
    });
    setNewTeamName("");
    setNewTeamDescription("");
    setCreateDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage teams and their members
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Team Name</label>
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Enter team description..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeam.isPending}>
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{team.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {team.description}
                  </p>
                </div>
              </div>
            </div>
            
            <TeamMembersSection teamId={team.id} />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedTeamId(team.id)}
              >
                Manage Members
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteTeam.mutate(team.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedTeamId && (
        <ManageMembersDialog
          teamId={selectedTeamId}
          open={!!selectedTeamId}
          onOpenChange={(open) => !open && setSelectedTeamId(null)}
        />
      )}
    </div>
  );
};

const TeamMembersSection = ({ teamId }: { teamId: string }) => {
  const { members } = useTeamMembers(teamId);

  return (
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((member) => (
        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
          <AvatarImage src={member.profiles.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {member.profiles.full_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {members.length > 4 && (
        <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
          +{members.length - 4}
        </div>
      )}
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">No members yet</p>
      )}
    </div>
  );
};

const ManageMembersDialog = ({
  teamId,
  open,
  onOpenChange,
}: {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { members, addMember, removeMember } = useTeamMembers(teamId);
  const { users } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const availableUsers = users.filter(
    (user) => !members.some((member) => member.user_id === user.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    await addMember.mutateAsync({ teamId, userId: selectedUserId });
    setSelectedUserId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a user to add" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember} disabled={!selectedUserId || addMember.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Current Members</h4>
            {members.map((member) => (
              <Card key={member.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profiles.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(member.added_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember.mutate({ id: member.id, teamId })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members in this team yet
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
