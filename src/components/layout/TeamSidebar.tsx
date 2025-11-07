import { User } from "@/types/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamSidebarProps {
  users: User[];
  selectedUsers: string[];
  onToggleUser: (userId: string) => void;
}

export const TeamSidebar = ({ users, selectedUsers, onToggleUser }: TeamSidebarProps) => {
  return (
    <aside className="w-64 border-r border-border bg-card p-6 hidden lg:block">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Team Members</h3>
          <div className="space-y-2">
            {users.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <Button
                  key={user.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-2",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => onToggleUser(user.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              if (selectedUsers.length === users.length) {
                users.forEach((u) => onToggleUser(u.id));
              } else {
                users.forEach((u) => {
                  if (!selectedUsers.includes(u.id)) {
                    onToggleUser(u.id);
                  }
                });
              }
            }}
          >
            {selectedUsers.length === users.length ? "Clear filters" : "Select all"}
          </Button>
        </div>
      </div>
    </aside>
  );
};
