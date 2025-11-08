import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPast, subDays, format, differenceInDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
      name: project.name,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
      total,
      completed
    };
  });

  // 2. Tasks Completed vs Pending
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const completionComparisonData = [
    { name: "Completed", value: completedTasks, fill: "hsl(var(--status-done))" },
    { name: "Pending", value: pendingTasks, fill: "hsl(var(--status-in-progress))" }
  ];

  // 3. Overdue Tasks Trend (last 7 days)
  const overdueTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const overdue = tasks.filter(t => 
      t.due_date && 
      isPast(new Date(t.due_date)) && 
      t.status !== "done" &&
      isPast(new Date(t.due_date)) &&
      new Date(t.due_date) <= date
    ).length;
    return {
      date: format(date, "MMM dd"),
      overdue
    };
  });

  // 4. Task Aging Analysis
  const agingData = [
    { status: "To Do", avg: Math.round(tasks.filter(t => t.status === "todo").reduce((acc, t) => acc + differenceInDays(new Date(), new Date(t.created_at)), 0) / (tasks.filter(t => t.status === "todo").length || 1)) },
    { status: "In Progress", avg: Math.round(tasks.filter(t => t.status === "in_progress").reduce((acc, t) => acc + differenceInDays(new Date(), new Date(t.created_at)), 0) / (tasks.filter(t => t.status === "in_progress").length || 1)) },
    { status: "Review", avg: Math.round(tasks.filter(t => t.status === "review").reduce((acc, t) => acc + differenceInDays(new Date(), new Date(t.created_at)), 0) / (tasks.filter(t => t.status === "review").length || 1)) },
  ];

  // 5. Tasks Completed per Member
  const memberCompletionData = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assignee_id === member.id);
    const completed = memberTasks.filter(t => t.status === "done").length;
    return {
      name: member.full_name,
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
      name: member.full_name,
      inProgress: memberTasks.filter(t => t.status === "in_progress").length,
      completed: memberTasks.filter(t => t.status === "done").length,
    };
  }).filter(m => m.inProgress > 0 || m.completed > 0).slice(0, 10);

  // 8. Active vs Idle Members
  const activeMembersCount = teamMembers.filter(member => 
    tasks.some(t => t.assignee_id === member.id && t.status !== "done")
  ).length;
  const idleMembersCount = teamMembers.length - activeMembersCount;
  const engagementData = [
    { name: "Active", value: activeMembersCount, fill: "hsl(var(--primary))" },
    { name: "Idle", value: idleMembersCount, fill: "hsl(var(--muted))" }
  ];

  const chartConfig = {
    completion: { label: "Completion %", color: "hsl(var(--primary))" },
    overdue: { label: "Overdue", color: "hsl(var(--destructive))" },
    completed: { label: "Completed", color: "hsl(var(--status-done))" },
    inProgress: { label: "In Progress", color: "hsl(var(--status-in-progress))" },
    avg: { label: "Avg Days", color: "hsl(var(--chart-2))" },
  };

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
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Tasks Completed vs Pending */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tasks Completed vs Pending</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionComparisonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {completionComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Overdue Tasks Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Overdue Tasks Trend (Last 7 Days)</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overdueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="overdue" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Task Aging Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Task Aging Analysis (Avg Days)</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="status" type="category" className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avg" fill="hsl(var(--chart-2))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
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
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberCompletionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="hsl(var(--status-done))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
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
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentLoadData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="inProgress" fill="hsl(var(--status-in-progress))" stackId="a" />
                  <Bar dataKey="completed" fill="hsl(var(--status-done))" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Active vs Idle Members */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active vs Idle Members</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={engagementData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};