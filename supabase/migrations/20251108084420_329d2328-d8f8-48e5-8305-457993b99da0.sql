-- Drop the restrictive SELECT policy on tasks
DROP POLICY IF EXISTS "Users can view tasks in their team projects" ON public.tasks;

-- Create a new policy allowing all authenticated users to view tasks
CREATE POLICY "All authenticated users can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

-- Ensure projects SELECT policy allows all authenticated users (already exists but confirming)
-- No changes needed for projects as it already has "All users can view all projects" with USING (true)