const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";

const SYSTEM_PROMPT = `You are SK-04 Resolution Proposal for ResolveSphere AI. You reason and propose only; you have no write authority. Given a redacted Case Twin and Evidence Ledger summary, return ONLY strict JSON matching this shape, no prose, no markdown fences:
{"case_id":string,"problem":string,"evidence_ids":string[],"proposed_action":{"type":"REFUND_PAYMENT"|"REQUEST_CUSTOMER_INFO"|"ESCALATE_CASE","target_id":string,"amount":number,"currency":string},"policy_reference":string,"risk_level":"LOW"|"MEDIUM"|"HIGH","authorization_required":boolean,"expected_state":{"entity":string,"target_id":string,"status":string},"verification_target":string,"escalation_required":boolean,"customer_message_intent":string}
Use only the provided evidence_ids. Do not invent facts, tools, or a contract hash.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2");
    if (!AI_API_TOKEN) throw new Error("AI_API_TOKEN is not configured");

    const { case_twin, evidence_summary } = await req.json();

    const call = async () => {
      const response = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_API_TOKEN}`,
          "Content-Type": "application/json",
          "X-Session-ID": crypto.randomUUID(),
          "X-Enter-Project-ID": "70c32d0a6eb24783a12e5edabe9d40c7",
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          stream: false,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Case Twin: ${JSON.stringify(case_twin)}\nEvidence: ${JSON.stringify(evidence_summary)}` },
          ],
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Qwen call failed: ${response.status} ${text}`);
      }
      const data = await response.json();
      const content: string = data.choices?.[0]?.message?.content ?? "";
      const cleaned = content.trim().replace(/^```json\s*|```$/g, "");
      return JSON.parse(cleaned);
    };

    let contract;
    let attempts = 0;
    let lastError = "";
    while (attempts < 2 && !contract) {
      attempts += 1;
      try {
        contract = await call();
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (!contract) {
      return new Response(JSON.stringify({ ok: false, error: lastError || "Qwen proposal failed schema validation twice." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, contract, model: QWEN_MODEL, attempts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
