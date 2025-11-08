import { useState } from "react";
import { useTeamMembers } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserPlus, X } from "lucide-react";

interface ManageTeamMembersDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageTeamMembersDialog = ({
  teamId,
  open,
  onOpenChange,
}: ManageTeamMembersDialogProps) => {
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
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profiles?.full_name?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles?.full_name || "Unknown User"}</p>
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
