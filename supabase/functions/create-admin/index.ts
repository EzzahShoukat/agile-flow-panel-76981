import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting admin user creation...");
    
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

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === "admin@gmail.com");
    
    if (existingUser) {
      console.log("Admin user already exists, updating role...");
      
      // Just update the role to admin
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", existingUser.id);

      if (roleError) {
        console.error("Role update error:", roleError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin user already exists and role updated",
          email: "admin@gmail.com",
          user_id: existingUser.id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new admin user
    console.log("Creating new admin user...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@gmail.com",
      password: "admin1234",
      email_confirm: true,
      user_metadata: {
        full_name: "Admin User",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin user created, updating role...");
    
    // Update user role to admin
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", authData.user.id);

    if (roleError) {
      console.error("Role error:", roleError);
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin user created successfully!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user created successfully",
        email: "admin@gmail.com",
        user_id: authData.user.id
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
