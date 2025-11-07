import { Shield, Users, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Profile = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const roleColors = {
    admin: "bg-red-500/10 text-red-500 border-red-500/20",
    manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    employee: "bg-green-500/10 text-green-500 border-green-500/20",
    team_lead: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const roleLabels = {
    admin: "Admin",
    manager: "Manager",
    employee: "Employee",
    team_lead: "Team Lead",
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your personal details and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
              <AvatarFallback className="text-2xl">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{user?.user_metadata?.full_name || "User"}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              {userRole && (
                <Badge variant="outline" className={roleColors[userRole]}>
                  {roleLabels[userRole]}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {userRole === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>Manage users and teams across the organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                User Management
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/teams">
                <Users className="h-4 w-4" />
                Team Management
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
