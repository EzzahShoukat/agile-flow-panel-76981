
-- Migration: 20251107122213

-- Migration: 20251106182513

-- Migration: 20251106164339

-- Migration: 20251106150121

-- Migration: 20251104124132
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(team_id, user_id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_tags table
CREATE TABLE public.task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, tag_name)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Create function to get user's team for a project
CREATE OR REPLACE FUNCTION public.get_project_team(_project_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.projects WHERE id = _project_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teams
CREATE POLICY "Users can view teams they are members of"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), id)
  );

CREATE POLICY "Admins can manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Admins and managers can manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their teams"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
  );

CREATE POLICY "Admins and managers can manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their team projects"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), public.get_project_team(project_id)) OR
    assignee_id = auth.uid()
  );

CREATE POLICY "Managers and admins can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Employees can create tasks for themselves"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    assignee_id = auth.uid()
  );

CREATE POLICY "Managers and admins can update all tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Employees can update their own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (assignee_id = auth.uid());

CREATE POLICY "Managers and admins can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments on tasks they can see"
  ON public.task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        public.is_team_member(auth.uid(), public.get_project_team(tasks.project_id)) OR
        tasks.assignee_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on tasks they can see"
  ON public.task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        public.is_team_member(auth.uid(), public.get_project_team(tasks.project_id)) OR
        tasks.assignee_id = auth.uid()
      )
    )
  );

-- RLS Policies for task_tags
CREATE POLICY "Users can view tags on tasks they can see"
  ON public.task_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        public.is_team_member(auth.uid(), public.get_project_team(tasks.project_id)) OR
        tasks.assignee_id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers and admins can manage tags"
  ON public.task_tags FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default role as employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Migration: 20251104124527
-- Create enum for user roles (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for task status
DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for task priority
DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(team_id, user_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_tags table
CREATE TABLE IF NOT EXISTS public.task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, tag_name)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Create function to get user's team for a project
CREATE OR REPLACE FUNCTION public.get_project_team(_project_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.projects WHERE id = _project_id
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Admins and managers can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view projects in their teams" ON public.projects;
DROP POLICY IF EXISTS "Admins and managers can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view tasks in their team projects" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees can create tasks for themselves" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can update all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view comments on tasks they can see" ON public.task_comments;
DROP POLICY IF EXISTS "Users can create comments on tasks they can see" ON public.task_comments;
DROP POLICY IF EXISTS "Users can view tags on tasks they can see" ON public.task_tags;
DROP POLICY IF EXISTS "Managers and admins can manage tags" ON public.task_tags;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teams
CREATE POLICY "Users can view teams they are members of"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), id)
  );

CREATE POLICY "Admins can manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Admins and managers can manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their teams"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
  );

CREATE POLICY "Admins and managers can manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their team projects"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_team_member(auth.uid(), public.get_project_team(project_id)) OR
    assignee_id = auth.uid()
  );

CREATE POLICY "Managers and admins can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Employees can create tasks for themselves"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    assignee_id = auth.uid()
  );

CREATE POLICY "Managers and admins can update all tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Employees can update their own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (assignee_id = auth.uid());

CREATE POLICY "Managers and admins can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments on tasks they can see"
  ON public.task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        public.is_team_member(auth.uid(), public.get_project_team(tasks.project_id)) OR
        tasks.assignee_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on tasks they can see"
  ON public.task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        public.is_team_member(auth.uid(), public.get_project_team(tasks.project_id)) OR
        tasks.assignee_id = auth.uid()
      )
    )
  );

-- RLS Policies for task_tags
CREATE POLICY "Users can view tags on tasks they can see"
  ON public.task_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id
      AND (
        public.has_role(auth.uid(), 'admin') OR
        public.is_team_member(auth.uid(), public.get_project_team(tasks.project_id)) OR
        tasks.assignee_id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers and admins can manage tags"
  ON public.task_tags FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default role as employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251105120028
-- Fix search_path security issue by explicitly setting it on all functions

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update is_team_member function
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Update get_project_team function
CREATE OR REPLACE FUNCTION public.get_project_team(_project_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT team_id FROM public.projects WHERE id = _project_id
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default role as employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Migration: 20251106135534
-- Add team_lead role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team_lead';

-- Create a function to get user with role information
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    au.email,
    p.created_at,
    ur.role
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
$$;

-- Create a function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id uuid, new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update roles
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Update or insert the role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) 
  DO NOTHING;

  -- Remove old roles if different
  DELETE FROM user_roles 
  WHERE user_id = target_user_id 
  AND role != new_role;
END;
$$;


-- Migration: 20251106151053
-- Fix 1: Restrict user_roles visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Allow users to view only their own role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Add admin authorization to get_users_with_roles function
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE(id uuid, full_name text, avatar_url text, email text, created_at timestamp with time zone, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    au.email,
    p.created_at,
    ur.role
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;


-- Migration: 20251106172059
-- Fix profiles table RLS policy to restrict access to team members only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more secure policy that only allows viewing profiles of:
-- 1. The user's own profile
-- 2. Members of teams the user is in
-- 3. Admins can see all profiles
CREATE POLICY "Users can view their own and team members profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    INNER JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
  )
);

-- Add comment to trigger types regeneration
COMMENT ON TABLE public.profiles IS 'User profile information with team-based access control';


-- Migration: 20251106183214
-- Add a comment to trigger types regeneration
COMMENT ON TABLE profiles IS 'User profiles with additional information';
COMMENT ON TABLE projects IS 'Projects associated with teams';
COMMENT ON TABLE tasks IS 'Tasks within projects';
COMMENT ON TABLE teams IS 'Teams and their information';
COMMENT ON TABLE team_members IS 'Team membership relationships';
COMMENT ON TABLE user_roles IS 'User role assignments';

-- Migration: 20251106183308
-- Force types refresh by updating a timestamp trigger
-- This is a no-op migration that will trigger types regeneration

DO $$
BEGIN
  -- Verify all critical tables exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE EXCEPTION 'profiles table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
    RAISE EXCEPTION 'projects table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    RAISE EXCEPTION 'tasks table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams') THEN
    RAISE EXCEPTION 'teams table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members') THEN
    RAISE EXCEPTION 'team_members table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    RAISE EXCEPTION 'user_roles table does not exist';
  END IF;
  
  RAISE NOTICE 'All tables verified successfully';
END $$;

-- Migration: 20251107112920
-- Fix RLS policies for proper admin and manager permissions

-- Update teams policies: Only admins can manage teams, but admins and managers can view teams they're members of
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;

CREATE POLICY "Admins can manage all teams"
ON public.teams
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and users can view teams they are members of"
ON public.teams
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR is_team_member(auth.uid(), id));

CREATE POLICY "Managers can create teams"
ON public.teams
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Update team_members policies: Admins and managers can manage members
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Admins and managers can manage team members" ON public.team_members;

CREATE POLICY "Users can view team members of their teams"
ON public.team_members
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR is_team_member(auth.uid(), team_id));

CREATE POLICY "Admins and managers can manage team members"
ON public.team_members
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Update projects policies: Only admins and managers can create/delete
DROP POLICY IF EXISTS "Admins and managers can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects in their teams" ON public.projects;

CREATE POLICY "Users can view projects in their teams"
ON public.projects
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Admins and managers can create projects"
ON public.projects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update projects"
ON public.projects
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete projects"
ON public.projects
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Fix user_roles policies to ensure only admins can manage roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Fix profiles policies to allow admins to update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));


-- Migration: 20251107124042
-- Trigger types regeneration
-- This comment ensures the types file is regenerated with the current database schema
SELECT 1;

-- Migration: 20251107124643
-- Drop old foreign keys that point to auth.users
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_user_id_fkey,
DROP CONSTRAINT IF EXISTS team_members_added_by_fkey;

-- Add correct foreign keys pointing to profiles
ALTER TABLE public.team_members
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_added_by_fkey 
FOREIGN KEY (added_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Migration: 20251107124725
-- Fix all foreign keys to point to profiles instead of auth.users

-- Tasks table
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey,
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Projects table
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE public.projects
ADD CONSTRAINT projects_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Task comments table
ALTER TABLE public.task_comments
DROP CONSTRAINT IF EXISTS task_comments_user_id_fkey;

ALTER TABLE public.task_comments
ADD CONSTRAINT task_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
