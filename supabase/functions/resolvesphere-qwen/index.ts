import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";
const ENTER_PROJECT_ID = "70c32d0a6eb24783a12e5edabe9d40c7";

const ContractSchema = z.object({
  case_id: z.string(),
  problem: z.string(),
  evidence_ids: z.array(z.string()).min(1),
  proposed_action: z.object({
    type: z.enum(["REFUND_PAYMENT", "REQUEST_CUSTOMER_INFO", "ESCALATE_CASE"]),
    target_id: z.string(),
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  policy_reference: z.string(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
  authorization_required: z.boolean(),
  expected_state: z.object({
    entity: z.string(),
    target_id: z.string(),
    status: z.string(),
  }),
  verification_target: z.string(),
  escalation_required: z.boolean(),
  customer_message_intent: z.string(),
});

const SYSTEM_PROMPT = `You are SK-04 Resolution Proposal for ResolveSphere AI.
You are a bounded reasoning component. You have NO write authority.
Return ONLY strict JSON matching the supplied Resolution Contract schema.
Use only the supplied Case Twin, Evidence Ledger and Policy.
Never invent evidence, amounts, statuses, tools, approvals or contract hashes.
If evidence is insufficient or contradictory, propose REQUEST_CUSTOMER_INFO or ESCALATE_CASE.
The control plane is authoritative for authorization, execution and verification.`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function propose(caseTwin: unknown, evidenceSummary: unknown, policySummary: unknown) {
  const token = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2");
  if (!token) throw new Error("AI_API_TOKEN_70c32d0a6eb2 is not configured");

  let lastError = "Qwen proposal failed";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Session-ID": crypto.randomUUID(),
          "X-Enter-Project-ID": ENTER_PROJECT_ID,
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          stream: false,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `CASE_TWIN=${JSON.stringify(caseTwin)}\nEVIDENCE_LEDGER=${JSON.stringify(evidenceSummary)}\nPOLICY=${JSON.stringify(policySummary)}`,
            },
          ],
        }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`Qwen HTTP ${response.status}: ${body.slice(0, 500)}`);

      const data = JSON.parse(body);
      const content = String(data.choices?.[0]?.message?.content ?? "").trim();
      if (!content) throw new Error("Qwen returned empty content");

      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const contract = ContractSchema.parse(JSON.parse(cleaned));

      const evidenceIds = new Set((evidenceSummary as { evidence_ids?: string[] })?.evidence_ids ?? []);
      if (contract.evidence_ids.some((id) => !evidenceIds.has(id))) {
        throw new Error("Qwen referenced an evidence id that was not supplied");
      }

      return { contract, model: QWEN_MODEL, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { case_twin, evidence_summary, policy_summary } = await req.json();
    const result = await propose(case_twin, evidence_summary, policy_summary ?? {});
    return json({ ok: true, ...result });
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      model: QWEN_MODEL,
    });
  }
});
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";
const ENTER_PROJECT_ID = "70c32d0a6eb24783a12e5edabe9d40c7";

const ContractSchema = z.object({
  case_id: z.string(),
  problem: z.string(),
  evidence_ids: z.array(z.string()).min(1),
  proposed_action: z.object({
    type: z.enum(["REFUND_PAYMENT", "REQUEST_CUSTOMER_INFO", "ESCALATE_CASE"]),
    target_id: z.string(),
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  policy_reference: z.string(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
  authorization_required: z.boolean(),
  expected_state: z.object({
    entity: z.string(),
    target_id: z.string(),
    status: z.string(),
  }),
  verification_target: z.string(),
  escalation_required: z.boolean(),
  customer_message_intent: z.string(),
});

const SYSTEM_PROMPT = `You are SK-04 Resolution Proposal for ResolveSphere AI.
You are a bounded reasoning component. You have NO write authority.
Return ONLY strict JSON matching the supplied Resolution Contract schema.
Use only the supplied Case Twin, Evidence Ledger and Policy.
Never invent evidence, amounts, statuses, tools, approvals or contract hashes.
If evidence is insufficient or contradictory, propose REQUEST_CUSTOMER_INFO or ESCALATE_CASE.
The control plane is authoritative for authorization, execution and verification.`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function propose(caseTwin: unknown, evidenceSummary: unknown, policySummary: unknown) {
  const token = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2");
  if (!token) throw new Error("AI_API_TOKEN_70c32d0a6eb2 is not configured");

  let lastError = "Qwen proposal failed";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Session-ID": crypto.randomUUID(),
          "X-Enter-Project-ID": ENTER_PROJECT_ID,
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          stream: false,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `CASE_TWIN=${JSON.stringify(caseTwin)}\nEVIDENCE_LEDGER=${JSON.stringify(evidenceSummary)}\nPOLICY=${JSON.stringify(policySummary)}`,
            },
          ],
        }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`Qwen HTTP ${response.status}: ${body.slice(0, 500)}`);

      const data = JSON.parse(body);
      const content = String(data.choices?.[0]?.message?.content ?? "").trim();
      if (!content) throw new Error("Qwen returned empty content");

      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const contract = ContractSchema.parse(JSON.parse(cleaned));

      const evidenceIds = new Set((evidenceSummary as { evidence_ids?: string[] })?.evidence_ids ?? []);
      if (contract.evidence_ids.some((id) => !evidenceIds.has(id))) {
        throw new Error("Qwen referenced an evidence id that was not supplied");
      }

      return { contract, model: QWEN_MODEL, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { case_twin, evidence_summary, policy_summary } = await req.json();
    const result = await propose(case_twin, evidence_summary, policy_summary ?? {});
    return json({ ok: true, ...result });
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      model: QWEN_MODEL,
    });
  }
});
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";
const ENTER_PROJECT_ID = "70c32d0a6eb24783a12e5edabe9d40c7";

const ContractSchema = z.object({
  case_id: z.string(),
  problem: z.string(),
  evidence_ids: z.array(z.string()).min(1),
  proposed_action: z.object({
    type: z.enum(["REFUND_PAYMENT", "REQUEST_CUSTOMER_INFO", "ESCALATE_CASE"]),
    target_id: z.string(),
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  policy_reference: z.string(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
  authorization_required: z.boolean(),
  expected_state: z.object({
    entity: z.string(),
    target_id: z.string(),
    status: z.string(),
  }),
  verification_target: z.string(),
  escalation_required: z.boolean(),
  customer_message_intent: z.string(),
});

const SYSTEM_PROMPT = `You are SK-04 Resolution Proposal for ResolveSphere AI.
You are a bounded reasoning component. You have NO write authority.
Return ONLY strict JSON matching the supplied Resolution Contract schema.
Use only the supplied Case Twin, Evidence Ledger and Policy.
Never invent evidence, amounts, statuses, tools, approvals or contract hashes.
If evidence is insufficient or contradictory, propose REQUEST_CUSTOMER_INFO or ESCALATE_CASE.
The control plane is authoritative for authorization, execution and verification.`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function propose(caseTwin: unknown, evidenceSummary: unknown, policySummary: unknown) {
  const token = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2");
  if (!token) throw new Error("AI_API_TOKEN_70c32d0a6eb2 is not configured");

  let lastError = "Qwen proposal failed";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Session-ID": crypto.randomUUID(),
          "X-Enter-Project-ID": ENTER_PROJECT_ID,
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          stream: false,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `CASE_TWIN=${JSON.stringify(caseTwin)}\nEVIDENCE_LEDGER=${JSON.stringify(evidenceSummary)}\nPOLICY=${JSON.stringify(policySummary)}`,
            },
          ],
        }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`Qwen HTTP ${response.status}: ${body.slice(0, 500)}`);

      const data = JSON.parse(body);
      const content = String(data.choices?.[0]?.message?.content ?? "").trim();
      if (!content) throw new Error("Qwen returned empty content");

      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const contract = ContractSchema.parse(JSON.parse(cleaned));

      const evidenceIds = new Set((evidenceSummary as { evidence_ids?: string[] })?.evidence_ids ?? []);
      if (contract.evidence_ids.some((id) => !evidenceIds.has(id))) {
        throw new Error("Qwen referenced an evidence id that was not supplied");
      }

      return { contract, model: QWEN_MODEL, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { case_twin, evidence_summary, policy_summary } = await req.json();
    const result = await propose(case_twin, evidence_summary, policy_summary ?? {});
    return json({ ok: true, ...result });
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      model: QWEN_MODEL,
    });
  }
});
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";
const ENTER_PROJECT_ID = "70c32d0a6eb24783a12e5edabe9d40c7";

const ContractSchema = z.object({
  case_id: z.string(),
  problem: z.string(),
  evidence_ids: z.array(z.string()).min(1),
  proposed_action: z.object({
    type: z.enum(["REFUND_PAYMENT", "REQUEST_CUSTOMER_INFO", "ESCALATE_CASE"]),
    target_id: z.string(),
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  policy_reference: z.string(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
  authorization_required: z.boolean(),
  expected_state: z.object({
    entity: z.string(),
    target_id: z.string(),
    status: z.string(),
  }),
  verification_target: z.string(),
  escalation_required: z.boolean(),
  customer_message_intent: z.string(),
});

const SYSTEM_PROMPT = `You are SK-04 Resolution Proposal for ResolveSphere AI.
You are a bounded reasoning component. You have NO write authority.
Return ONLY strict JSON matching the supplied Resolution Contract schema.
Use only the supplied Case Twin, Evidence Ledger and Policy.
Never invent evidence, amounts, statuses, tools, approvals or contract hashes.
If evidence is insufficient or contradictory, propose REQUEST_CUSTOMER_INFO or ESCALATE_CASE.
The control plane is authoritative for authorization, execution and verification.`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function propose(caseTwin: unknown, evidenceSummary: unknown, policySummary: unknown) {
  const token = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2");
  if (!token) throw new Error("AI_API_TOKEN_70c32d0a6eb2 is not configured");

  let lastError = "Qwen proposal failed";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Session-ID": crypto.randomUUID(),
          "X-Enter-Project-ID": ENTER_PROJECT_ID,
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          stream: false,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `CASE_TWIN=${JSON.stringify(caseTwin)}\nEVIDENCE_LEDGER=${JSON.stringify(evidenceSummary)}\nPOLICY=${JSON.stringify(policySummary)}`,
            },
          ],
        }),
      });

      const body = await response.text();
      if (!response.ok) throw new Error(`Qwen HTTP ${response.status}: ${body.slice(0, 500)}`);

      const data = JSON.parse(body);
      const content = String(data.choices?.[0]?.message?.content ?? "").trim();
      if (!content) throw new Error("Qwen returned empty content");

      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const contract = ContractSchema.parse(JSON.parse(cleaned));

      const evidenceIds = new Set((evidenceSummary as { evidence_ids?: string[] })?.evidence_ids ?? []);
      if (contract.evidence_ids.some((id) => !evidenceIds.has(id))) {
        throw new Error("Qwen referenced an evidence id that was not supplied");
      }

      return { contract, model: QWEN_MODEL, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { case_twin, evidence_summary, policy_summary } = await req.json();
    const result = await propose(case_twin, evidence_summary, policy_summary ?? {});
    return json({ ok: true, ...result });
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      model: QWEN_MODEL,
    });
  }
});
