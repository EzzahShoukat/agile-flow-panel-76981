-- Drop the existing restrictive SELECT policy on projects
DROP POLICY IF EXISTS "Users can view projects in their teams" ON public.projects;

-- Create a new policy that allows all authenticated users to view all projects
CREATE POLICY "All users can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);