import { useState } from "react";
import { Plus, Users as UsersIcon, ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTeamDialog } from "@/components/dashboard/CreateTeamDialog";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ManageTeamMembersDialog } from "@/components/teams/ManageTeamMembersDialog";
import { useTeamMembers } from "@/hooks/useTeams";

export const Teams = () => {
  const navigate = useNavigate();
  const { teams, isLoading } = useTeams();
  const { userRole } = useAuth();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const canCreateTeam = userRole === "admin" || userRole === "manager";

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
              <p className="text-muted-foreground mt-1">{canCreateTeam ? "Manage your teams and members" : "View your teams"}</p>
            </div>
            {canCreateTeam && (
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
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-primary" />
                    {team.name}
                  </CardTitle>
                  {team.description && (
                    <CardDescription>{team.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <TeamMembersPreview teamId={team.id} />
                  {canCreateTeam && (
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
              <p className="text-muted-foreground">No teams yet. Create your first team to get started!</p>
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
        </div>
      </div>
    </div>
  );
};

const TeamMembersPreview = ({ teamId }: { teamId: string }) => {
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
      )}
      
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">No members yet</p>
      )}
    </div>
  );
};
