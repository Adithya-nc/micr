import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";
const ENTER_PROJECT_ID = "70c32d0a6eb24783a12e5edabe9d40c7";

type Check = {
  component: string;
  status: string;
  message: string;
  required_action: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const checks: Check[] = [];
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceKey) {
    return json({
      overall_connected: false,
      database_connected: false,
      auth_connected: true,
      backend_functions_connected: false,
      workflows_connected: false,
      agent_connected: false,
      skills_connected: false,
      knowledge_connected: false,
      qwen_connected: false,
      seed_loaded: false,
      verification_connected: false,
      realtime_or_polling_connected: true,
      mock_mode: true,
      checks: [{
        component: "database",
        status: "PENDING",
        message: "Supabase runtime environment variables are missing.",
        required_action: "Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      }],
      last_checked_at: new Date().toISOString(),
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let databaseConnected = false;
  let seedLoaded = false;

  try {
    const [
      { count: caseCount, error: caseErr },
      { count: policyCount, error: policyErr },
      { count: customerCount, error: customerErr },
      { count: paymentCount, error: paymentErr },
    ] = await Promise.all([
      supabase.from("rs_cases").select("case_id", { count: "exact", head: true }),
      supabase.from("rs_policies").select("policy_id", { count: "exact", head: true }),
      supabase.from("rs_synthetic_customers").select("customer_id", { count: "exact", head: true }),
      supabase.from("rs_synthetic_payments").select("payment_id", { count: "exact", head: true }),
    ]);

    databaseConnected = !caseErr && !policyErr && !customerErr && !paymentErr;
    seedLoaded = databaseConnected
      && (caseCount ?? 0) >= 3
      && (policyCount ?? 0) >= 7
      && (customerCount ?? 0) >= 3
      && (paymentCount ?? 0) >= 3;

    checks.push({
      component: "database",
      status: databaseConnected ? "CONNECTED" : "PENDING",
      message: databaseConnected
        ? "ResolveSphere tables are reachable in Supabase Postgres."
        : "One or more ResolveSphere tables are not queryable.",
      required_action: databaseConnected ? "None" : "Apply the existing ResolveSphere migrations.",
    });

    checks.push({
      component: "seed_data",
      status: seedLoaded ? "CONNECTED" : "PENDING",
      message: seedLoaded
        ? "Required demo customers, payments, cases and policies are present."
        : "Required demo seed records are incomplete.",
      required_action: seedLoaded ? "None" : "Run the existing ResolveSphere demo seed.",
    });
  } catch (error) {
    checks.push({
      component: "database",
      status: "PENDING",
      message: `Database check failed: ${error instanceof Error ? error.message : String(error)}`,
      required_action: "Check Supabase credentials and apply the existing schema/seed.",
    });
  }

  // This is a real deployment/reachability check for the existing engine function.
  let backendFunctionsConnected = false;
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/resolvesphere-engine`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "list_knowledge" }),
    });
    backendFunctionsConnected = response.ok;
    checks.push({
      component: "backend_functions",
      status: backendFunctionsConnected ? "CONNECTED" : "PENDING",
      message: backendFunctionsConnected
        ? "resolvesphere-engine is deployed and reachable."
        : `resolvesphere-engine returned HTTP ${response.status}.`,
      required_action: backendFunctionsConnected ? "None" : "Deploy/fix resolvesphere-engine.",
    });
  } catch (error) {
    checks.push({
      component: "backend_functions",
      status: "PENDING",
      message: `resolvesphere-engine is not reachable: ${error instanceof Error ? error.message : String(error)}`,
      required_action: "Deploy resolvesphere-engine.",
    });
  }

  const { count: verifiedCount } = await supabase
    .from("rs_verifications")
    .select("verification_id", { count: "exact", head: true })
    .eq("result", "VERIFIED");

  const { count: completedActionCount } = await supabase
    .from("rs_actions")
    .select("action_id", { count: "exact", head: true })
    .eq("status", "COMPLETED");

  const verificationConnected = (verifiedCount ?? 0) > 0;
  const workflowActivity = (completedActionCount ?? 0) > 0;
  const workflowsConnected = backendFunctionsConnected;

  checks.push({
    component: "verification_engine",
    status: verificationConnected ? "CONNECTED" : "PENDING",
    message: verificationConnected
      ? "The verification ledger contains a VERIFIED receipt."
      : "No VERIFIED receipt exists yet; deployment is present but Scenario 1 has not completed verification.",
    required_action: verificationConnected ? "None" : "Run Scenario 1 / run_autonomous.",
  });

  checks.push({
    component: "workflows",
    status: workflowsConnected ? "CONNECTED" : "PENDING",
    message: workflowsConnected
      ? workflowActivity
        ? "The engine workflow is reachable and has completed at least one recorded action."
        : "The engine workflow route is reachable; no completed action is recorded yet."
      : "The engine workflow route is not reachable.",
    required_action: workflowsConnected ? (workflowActivity ? "None" : "Run Scenario 1 / run_autonomous.") : "Deploy resolvesphere-engine.",
  });

  // A token alone is not treated as proof that Qwen works.
  // We mark Qwen CONNECTED only after the engine has successfully accepted a real proposal.
  const aiToken = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2") ?? "";
  const { count: qwenSuccessCount } = await supabase
    .from("rs_case_events")
    .select("event_id", { count: "exact", head: true })
    .eq("event_type", "QWEN_PROPOSAL_ACCEPTED");

  const qwenConnected = aiToken.length > 0 && (qwenSuccessCount ?? 0) > 0;

  checks.push({
    component: "qwen_model",
    status: qwenConnected ? "CONNECTED" : aiToken.length > 0 ? "PENDING" : "PENDING",
    message: qwenConnected
      ? `${QWEN_MODEL} has successfully returned and passed a Resolution Contract validation.`
      : aiToken.length > 0
        ? `${QWEN_MODEL} is configured, but runtime connectivity has not been proven by a successful proposal yet.`
        : "Qwen capability token is not configured.",
    required_action: qwenConnected
      ? "None"
      : aiToken.length > 0
        ? "Run Scenario 1 / run_autonomous and confirm QWEN_PROPOSAL_ACCEPTED."
        : "Configure AI_API_TOKEN_70c32d0a6eb2.",
  });

  const authConnected = true;
  checks.push({
    component: "auth",
    status: "CONNECTED",
    message: "Demo role-based access is active for the current ResolveSphere environment.",
    required_action: "None",
  });

  const agentConnected = backendFunctionsConnected;
  const skillsConnected = backendFunctionsConnected;
  const knowledgeConnected = databaseConnected && seedLoaded;

  checks.push({
    component: "agent_and_skills",
    status: agentConnected ? "CONNECTED" : "PENDING",
    message: agentConnected
      ? "ResolveSphere orchestration, specialist routing and SK-01..SK-07 control logic are available through the engine."
      : "Agent routing is unavailable because the engine is not reachable.",
    required_action: agentConnected ? "None" : "Deploy resolvesphere-engine.",
  });

  checks.push({
    component: "knowledge",
    status: knowledgeConnected ? "CONNECTED" : "PENDING",
    message: knowledgeConnected
      ? "Policy records are available to the control plane and Qwen proposal context."
      : "Policy knowledge is not fully seeded.",
    required_action: knowledgeConnected ? "None" : "Seed rs_policies.",
  });

  // The existing frontend uses polling; no frontend modification is required here.
  const realtimeOrPollingConnected = true;
  checks.push({
    component: "realtime_or_polling",
    status: "CONNECTED",
    message: "ResolveSphere status is compatible with the existing 3-second polling flow.",
    required_action: "None",
  });

  const overallConnected =
    databaseConnected &&
    seedLoaded &&
    backendFunctionsConnected &&
    verificationConnected &&
    agentConnected &&
    skillsConnected &&
    knowledgeConnected &&
    authConnected &&
    qwenConnected;

  const mockMode = !(databaseConnected && seedLoaded && backendFunctionsConnected);

  return json({
    overall_connected: overallConnected,
    database_connected: databaseConnected,
    auth_connected: authConnected,
    backend_functions_connected: backendFunctionsConnected,
    workflows_connected: workflowsConnected,
    agent_connected: agentConnected,
    skills_connected: skillsConnected,
    knowledge_connected: knowledgeConnected,
    qwen_connected: qwenConnected,
    seed_loaded: seedLoaded,
    verification_connected: verificationConnected,
    realtime_or_polling_connected: realtimeOrPollingConnected,
    mock_mode: mockMode,
    checks,
    last_checked_at: new Date().toISOString(),
  });
});
