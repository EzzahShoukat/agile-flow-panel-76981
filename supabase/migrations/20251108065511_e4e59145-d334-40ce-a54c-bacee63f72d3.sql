-- Drop policy that allows employees to create tasks for themselves
DROP POLICY IF EXISTS "Employees can create tasks for themselves" ON public.tasks;

-- The existing policies already restrict:
-- - Task deletion to managers and admins ("Managers and admins can delete tasks")
-- - Project deletion to managers and admins ("Admins and managers can delete projects")
-- - Team member management to managers and admins ("Admins and managers can manage team members")