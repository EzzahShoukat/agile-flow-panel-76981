import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserRole = "admin" | "manager" | "team_lead" | "employee";

export interface UserWithRole {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  created_at: string;
  role: UserRole;
}

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_users_with_roles");
      if (error) throw error;
      return data as UserWithRole[];
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase.rpc("update_user_role", {
        target_user_id: userId,
        new_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User name updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Remove from team_members first
      const { error: teamError } = await supabase
        .from("team_members")
        .delete()
        .eq("user_id", userId);
      if (teamError) throw teamError;

      // Remove user roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (roleError) throw roleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    users,
    isLoading,
    updateUserRole,
    updateUserProfile,
    deleteUser,
  };
};
