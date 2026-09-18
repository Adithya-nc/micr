import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  const demoUsers = [
    { email: "priya@demo.com", password: "demo1234", role: "customer", customer_id: "CUST-1001" },
    { email: "arjun@demo.com", password: "demo1234", role: "customer", customer_id: "CUST-1002" },
    { email: "agent@demo.com", password: "demo1234", role: "support_agent" },
    { email: "manager@demo.com", password: "demo1234", role: "manager" },
    { email: "admin@demo.com", password: "demo1234", role: "admin" },
  ];

  const results = [];
  for (const user of demoUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role, customer_id: user.customer_id },
    });
    results.push({ email: user.email, success: !error, error: error?.message });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
