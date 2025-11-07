import { LayoutDashboard, FolderKanban, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const MainSidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: FolderKanban, label: "Projects", path: "/projects" },
    { icon: Users, label: "Teams", path: "/teams" },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
