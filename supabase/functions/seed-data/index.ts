import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const users = [
  { email: "sarah.johnson@company.com", password: "user1234", name: "Sarah Johnson" },
  { email: "mike.chen@company.com", password: "user1234", name: "Mike Chen" },
  { email: "emma.davis@company.com", password: "user1234", name: "Emma Davis" },
  { email: "james.wilson@company.com", password: "user1234", name: "James Wilson" },
  { email: "olivia.brown@company.com", password: "user1234", name: "Olivia Brown" },
  { email: "liam.martinez@company.com", password: "user1234", name: "Liam Martinez" },
  { email: "sophia.garcia@company.com", password: "user1234", name: "Sophia Garcia" },
  { email: "noah.rodriguez@company.com", password: "user1234", name: "Noah Rodriguez" },
  { email: "ava.lee@company.com", password: "user1234", name: "Ava Lee" },
  { email: "ethan.walker@company.com", password: "user1234", name: "Ethan Walker" },
  { email: "isabella.hall@company.com", password: "user1234", name: "Isabella Hall" },
  { email: "mason.allen@company.com", password: "user1234", name: "Mason Allen" },
  { email: "mia.young@company.com", password: "user1234", name: "Mia Young" },
  { email: "lucas.king@company.com", password: "user1234", name: "Lucas King" },
  { email: "charlotte.wright@company.com", password: "user1234", name: "Charlotte Wright" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const createdUsers = [];

    // Create users
    for (const user of users) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const exists = existingUsers?.users.find(u => u.email === user.email);
      
      if (!exists) {
        const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.name,
          },
        });

        if (!error && authData.user) {
          createdUsers.push({ id: authData.user.id, ...user });
        }
      } else {
        createdUsers.push({ id: exists.id, ...user });
      }
    }

    // Create 3 teams
    const teams = [
      { name: "Design Team", description: "UI/UX and Visual Design" },
      { name: "Development Team", description: "Frontend and Backend Development" },
      { name: "Marketing Team", description: "Marketing and Growth" },
    ];

    const createdTeams = [];
    for (const team of teams) {
      const { data: teamData, error } = await supabaseAdmin
        .from("teams")
        .insert([{ ...team, created_by: createdUsers[0].id }])
        .select()
        .single();

      if (!error && teamData) {
        createdTeams.push(teamData);
      }
    }

    // Assign team members (5 members per team)
    const teamAssignments = [
      { teamIndex: 0, memberIndices: [0, 1, 2, 3, 4] },
      { teamIndex: 1, memberIndices: [1, 5, 6, 7, 8] },
      { teamIndex: 2, memberIndices: [0, 9, 10, 11, 12] },
    ];

    for (const assignment of teamAssignments) {
      const team = createdTeams[assignment.teamIndex];
      for (const memberIndex of assignment.memberIndices) {
        const userId = createdUsers[memberIndex].id;
        await supabaseAdmin
          .from("team_members")
          .insert([{ team_id: team.id, user_id: userId, added_by: createdUsers[0].id }]);
      }
    }

    // Create projects linked to teams
    const projects = [
      {
        name: "Website Redesign",
        description: "Complete overhaul of company website",
        color: "hsl(215, 85%, 55%)",
        team_id: createdTeams[0].id,
        created_by: createdUsers[0].id,
      },
      {
        name: "Mobile App",
        description: "iOS and Android app development",
        color: "hsl(145, 65%, 45%)",
        team_id: createdTeams[1].id,
        created_by: createdUsers[1].id,
      },
      {
        name: "Marketing Campaign",
        description: "Q4 marketing initiatives",
        color: "hsl(35, 90%, 55%)",
        team_id: createdTeams[2].id,
        created_by: createdUsers[0].id,
      },
    ];

    const createdProjects = [];
    for (const project of projects) {
      const { data: projectData } = await supabaseAdmin
        .from("projects")
        .insert([project])
        .select()
        .single();

      if (projectData) {
        createdProjects.push(projectData);
      }
    }

    // Create tasks for projects
    const tasks = [
      {
        title: "Design new landing page",
        description: "Create mockups for the new homepage with updated branding",
        status: "in_progress",
        priority: "high",
        project_id: createdProjects[0].id,
        assignee_id: createdUsers[0].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Implement authentication",
        description: "Set up user login and registration flow",
        status: "review",
        priority: "high",
        project_id: createdProjects[0].id,
        assignee_id: createdUsers[1].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Write documentation",
        description: "API documentation for new endpoints",
        status: "todo",
        priority: "medium",
        project_id: createdProjects[0].id,
        assignee_id: createdUsers[2].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Fix mobile responsiveness",
        description: "Address layout issues on mobile devices",
        status: "done",
        priority: "high",
        project_id: createdProjects[0].id,
        assignee_id: createdUsers[0].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Setup analytics",
        description: "Integrate Google Analytics and event tracking",
        status: "in_progress",
        priority: "medium",
        project_id: createdProjects[0].id,
        assignee_id: createdUsers[3].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Design app icon",
        description: "Create icon assets for iOS and Android",
        status: "todo",
        priority: "low",
        project_id: createdProjects[1].id,
        assignee_id: createdUsers[5].id,
        created_by: createdUsers[1].id,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Database schema",
        description: "Design and implement database structure",
        status: "done",
        priority: "high",
        project_id: createdProjects[1].id,
        assignee_id: createdUsers[1].id,
        created_by: createdUsers[1].id,
        due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "User testing",
        description: "Conduct usability testing with beta users",
        status: "review",
        priority: "medium",
        project_id: createdProjects[1].id,
        assignee_id: createdUsers[6].id,
        created_by: createdUsers[1].id,
        due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Social media assets",
        description: "Create graphics for campaign launch",
        status: "in_progress",
        priority: "high",
        project_id: createdProjects[2].id,
        assignee_id: createdUsers[9].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Email campaign setup",
        description: "Configure email sequences in marketing platform",
        status: "todo",
        priority: "medium",
        project_id: createdProjects[2].id,
        assignee_id: createdUsers[10].id,
        created_by: createdUsers[0].id,
        due_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const task of tasks) {
      await supabaseAdmin.from("tasks").insert([task]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database seeded successfully",
        stats: {
          users: createdUsers.length,
          teams: createdTeams.length,
          projects: createdProjects.length,
          tasks: tasks.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
