import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPast, subDays, format, differenceInDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = {
  primary: '#3b82f6',
  done: '#10b981',
  inProgress: '#f59e0b',
  destructive: '#ef4444',
  muted: '#9ca3af',
  chart2: '#8b5cf6'
};

export const Dashboard = () => {
  const { projects, isLoading: projectsLoading } = useProjects();
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
          projects(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["all-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      
      if (error) throw error;
      return data;
    },
  });

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 1. Project Completion %
  const projectCompletionData = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completed = projectTasks.filter(t => t.status === "done").length;
    const total = projectTasks.length;
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
      total,
      completed
    };
  });

  // 2. Tasks Completed vs Pending
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const completionComparisonData = [
    { name: "Completed", value: completedTasks },
    { name: "Pending", value: pendingTasks }
  ];

  // 3. Overdue Tasks Trend (last 7 days)
  const overdueTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const overdue = tasks.filter(t => 
      t.due_date && 
      isPast(new Date(t.due_date)) && 
      t.status !== "done" &&
      new Date(t.due_date) <= date
    ).length;
    return {
      date: format(date, "MMM dd"),
      overdue
    };
  });

  // 4. Task Aging Analysis
  const todoTasks = tasks.filter(t => t.status === "todo");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const reviewTasks = tasks.filter(t => t.status === "review");

  const agingData = [
    { 
      status: "To Do", 
      avg: todoTasks.length > 0 ? Math.round(todoTasks.reduce((acc, t) => acc + differenceInDays(new Date(), new Date(t.created_at)), 0) / todoTasks.length) : 0
    },
    { 
      status: "In Progress", 
      avg: inProgressTasks.length > 0 ? Math.round(inProgressTasks.reduce((acc, t) => acc + differenceInDays(new Date(), new Date(t.created_at)), 0) / inProgressTasks.length) : 0
    },
    { 
      status: "Review", 
      avg: reviewTasks.length > 0 ? Math.round(reviewTasks.reduce((acc, t) => acc + differenceInDays(new Date(), new Date(t.created_at)), 0) / reviewTasks.length) : 0
    },
  ];

  // 5. Tasks Completed per Member
  const memberCompletionData = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assignee_id === member.id);
    const completed = memberTasks.filter(t => t.status === "done").length;
    return {
      name: member.full_name?.substring(0, 12) || 'Unknown',
      completed
    };
  }).filter(m => m.completed > 0).sort((a, b) => b.completed - a.completed).slice(0, 10);

  // 6. Average Task Completion Time
  const completedTasksWithTime = tasks.filter(t => t.status === "done" && t.created_at && t.updated_at);
  const avgCompletionTime = completedTasksWithTime.length > 0
    ? Math.round(completedTasksWithTime.reduce((acc, t) => acc + differenceInDays(new Date(t.updated_at), new Date(t.created_at)), 0) / completedTasksWithTime.length)
    : 0;

  // 7. Task Assignment Load
  const assignmentLoadData = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assignee_id === member.id);
    return {
      name: member.full_name?.substring(0, 10) || 'Unknown',
      inProgress: memberTasks.filter(t => t.status === "in_progress").length,
      completed: memberTasks.filter(t => t.status === "done").length,
    };
  }).filter(m => m.inProgress > 0 || m.completed > 0).slice(0, 8);

  // 8. Active vs Idle Members
  const activeMembersCount = teamMembers.filter(member => 
    tasks.some(t => t.assignee_id === member.id && t.status !== "done")
  ).length;
  const idleMembersCount = teamMembers.length - activeMembersCount;
  const engagementData = [
    { name: "Active", value: activeMembersCount },
    { name: "Idle", value: idleMembersCount }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Comprehensive insights into your projects and team performance</p>
      </div>

      {/* Task Progress Analytics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📊 Task Progress Analytics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Completion % */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Completion %</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectCompletionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="completion" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tasks Completed vs Pending */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tasks Completed vs Pending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={completionComparisonData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  label
                >
                  <Cell fill={COLORS.done} />
                  <Cell fill={COLORS.inProgress} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Overdue Tasks Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Overdue Tasks Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overdueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="overdue" stroke={COLORS.destructive} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Task Aging Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Task Aging Analysis (Avg Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis dataKey="status" type="category" style={{ fontSize: '12px' }} width={100} />
                <Tooltip />
                <Bar dataKey="avg" fill={COLORS.chart2} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Team Performance Metrics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">👥 Team Performance Metrics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Completed per Member */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tasks Completed per Member</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberCompletionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" style={{ fontSize: '12px' }} width={100} />
                <Tooltip />
                <Bar dataKey="completed" fill={COLORS.done} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Average Task Completion Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Average Task Completion Time</h3>
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-4">{avgCompletionTime}</div>
                <div className="text-xl text-muted-foreground">Days on average</div>
              </div>
            </div>
          </Card>

          {/* Task Assignment Load */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Task Assignment Load</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assignmentLoadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="inProgress" fill={COLORS.inProgress} stackId="a" name="In Progress" />
                <Bar dataKey="completed" fill={COLORS.done} stackId="a" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Active vs Idle Members */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active vs Idle Members</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={engagementData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  label
                >
                  <Cell fill={COLORS.primary} />
                  <Cell fill={COLORS.muted} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};