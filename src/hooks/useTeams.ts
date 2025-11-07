import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  added_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const useTeams = () => {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Team[];
    },
  });

  const createTeam = useMutation({
    mutationFn: async (team: { name: string; description?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("teams")
        .insert([{ ...team, created_by: userData.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    teams,
    isLoading,
    createTeam,
    updateTeam,
    deleteTeam,
  };
};

export const useTeamMembers = (teamId?: string) => {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from("team_members")
        .select(`
          *,
          profiles!team_members_user_id_fkey(full_name, avatar_url)
        `)
        .eq("team_id", teamId);

      if (error) throw error;
      return data as any as TeamMember[];
    },
    enabled: !!teamId,
  });

  const addMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Check if member already exists
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingMember) {
        throw new Error("User is already a member of this team");
      }

      const { data, error } = await supabase
        .from("team_members")
        .insert([{ team_id: teamId, user_id: userId, added_by: userData.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", variables.teamId] });
      toast.success("Member added successfully");
    },
    onError: (error: any) => {
      if (error.message.includes("already a member")) {
        toast.error("This user is already a member of the team");
      } else {
        toast.error(error.message || "Failed to add member");
      }
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
      return { teamId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", data.teamId] });
      toast.success("Member removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    members,
    isLoading,
    addMember,
    removeMember,
  };
};
