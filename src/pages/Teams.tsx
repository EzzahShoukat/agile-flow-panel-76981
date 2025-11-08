import { useState } from "react";
import { Plus, Users as UsersIcon, ArrowLeft, UserPlus, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTeamDialog } from "@/components/dashboard/CreateTeamDialog";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ManageTeamMembersDialog } from "@/components/teams/ManageTeamMembersDialog";
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

export const Teams = () => {
  const navigate = useNavigate();
  const { teams, isLoading, deleteTeam } = useTeams();
  const { userRole } = useAuth();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const canManageTeams = userRole === "admin" || userRole === "manager";

  const handleDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam.mutate(teamToDelete);
      setTeamToDelete(null);
    }
  };

  if (isLoading) {
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
              <h1 className="text-3xl font-bold text-foreground">Teams</h1>
              <p className="text-muted-foreground mt-1">{canManageTeams ? "Manage your teams and members" : "View your teams"}</p>
            </div>
            {canManageTeams && (
              <Button onClick={() => setCreateTeamOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-primary" />
                      {team.name}
                    </CardTitle>
                    {canManageTeams && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setTeamToDelete(team.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {team.description && (
                    <CardDescription>{team.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <TeamMembersPreview teamId={team.id} canManageTeams={canManageTeams} />
                  {canManageTeams && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Manage Members
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {teams.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {canManageTeams 
                  ? "No teams yet. Create your first team to get started!" 
                  : "No teams available yet."}
              </p>
            </Card>
          )}

          <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
          
          {selectedTeamId && (
            <ManageTeamMembersDialog
              teamId={selectedTeamId}
              open={!!selectedTeamId}
              onOpenChange={(open) => !open && setSelectedTeamId(null)}
            />
          )}

          <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Team</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this team? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

const TeamMembersPreview = ({ teamId, canManageTeams }: { teamId: string; canManageTeams: boolean }) => {
  const { members, isLoading } = useTeamMembers(teamId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading members...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Team Members</span>
        <span className="font-medium">{members.length}</span>
      </div>
      
      {members.length > 0 && (
        <div className="space-y-2">
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
          
          {/* Show all member names for non-managers/admins */}
          {!canManageTeams && (
            <div className="pt-2 space-y-1">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.profiles?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{member.profiles?.full_name || "Unknown"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">No members yet</p>
      )}
    </div>
  );
};
