-- Drop existing restrictive SELECT policies for teams
DROP POLICY IF EXISTS "Managers and users can view teams they are members of" ON public.teams;

-- Create new policy allowing all authenticated users to view all teams
CREATE POLICY "All users can view all teams"
ON public.teams
FOR SELECT
TO authenticated
USING (true);

-- Drop existing restrictive SELECT policy for team_members
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;

-- Create new policy allowing all authenticated users to view all team members
CREATE POLICY "All users can view all team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (true);