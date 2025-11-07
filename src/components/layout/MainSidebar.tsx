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
    <aside className="w-16 border-r border-border bg-card h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-2 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-center p-3 rounded-lg transition-colors group relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
