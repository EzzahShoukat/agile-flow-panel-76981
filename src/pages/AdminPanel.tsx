import { Shield } from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MainSidebar } from "@/components/layout/MainSidebar";

export const AdminPanel = () => {
  const { userRole } = useAuth();

  // Only admins can access this page
  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />
      <div className="flex flex-1 w-full overflow-hidden">
        <MainSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-muted-foreground">Manage users and system settings</p>
              </div>
            </div>

            <UserManagement />
          </div>
        </main>
      </div>
    </div>
  );
};
