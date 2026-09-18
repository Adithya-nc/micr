import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.7-plus";

const QWEN_SYSTEM_PROMPT = `You are SK-04 Resolution Proposal for ResolveSphere AI.
You are a bounded reasoning component. You have NO write authority and MUST NOT claim that an action was executed.
Given the Case Twin, authoritative Evidence Ledger summary, and applicable policy, propose the next resolution contract.
Return ONLY strict JSON matching this exact shape:
{"case_id":string,"problem":string,"evidence_ids":string[],"proposed_action":{"type":"REFUND_PAYMENT"|"REQUEST_CUSTOMER_INFO"|"ESCALATE_CASE","target_id":string,"amount":number,"currency":string},"policy_reference":string,"risk_level":"LOW"|"MEDIUM"|"HIGH","authorization_required":boolean,"expected_state":{"entity":string,"target_id":string,"status":string},"verification_target":string,"escalation_required":boolean,"customer_message_intent":string}
Rules:
- Use only evidence_ids supplied in the user context.
- Do not invent records, amounts, statuses, policies, tools, approvals, or contract hashes.
- If evidence is insufficient or contradictory, propose REQUEST_CUSTOMER_INFO or ESCALATE_CASE; never invent a successful refund.
- The control plane, not you, decides authorization, executes writes, and verifies the result.`;

const ALLOWED: Record<string, string[]> = {
  NEW: ["ROUTED", "FAILED"],
  ROUTED: ["CONTEXT_BUILT", "ESCALATED", "FAILED"],
  CONTEXT_BUILT: ["INVESTIGATING", "ESCALATED", "FAILED"],
  INVESTIGATING: ["EVIDENCE_GAP", "CONTRADICTION", "EVIDENCE_READY", "ESCALATED", "FAILED"],
  EVIDENCE_GAP: ["INVESTIGATING", "ESCALATED", "FAILED"],
  CONTRADICTION: ["INVESTIGATING", "ESCALATED", "FAILED"],
  EVIDENCE_READY: ["DECISION_READY", "INVESTIGATING", "ESCALATED", "FAILED"],
  DECISION_READY: ["APPROVAL_REQUIRED", "ACTION_EXECUTING", "EVIDENCE_GAP", "CONTRADICTION", "ESCALATED", "FAILED"],
  APPROVAL_REQUIRED: ["ACTION_EXECUTING", "ESCALATED", "FAILED"],
  ACTION_EXECUTING: ["VERIFYING", "ESCALATED", "FAILED"],
  VERIFYING: ["RESOLVED", "REOPENED", "ESCALATED", "FAILED"],
  REOPENED: ["INVESTIGATING", "ESCALATED", "FAILED"],
  RESOLVED: [],
  ESCALATED: [],
  FAILED: [],
};

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
  expected_state: z.object({ entity: z.string(), target_id: z.string(), status: z.string() }),
  verification_target: z.string(),
  escalation_required: z.boolean(),
  customer_message_intent: z.string(),
});

async function contractHash(contract: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(contract));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function freshnessOf(observedAt: string, sourceType: string) {
  if (sourceType === "POLICY") return "FRESH";
  const seconds = (Date.now() - new Date(observedAt).getTime()) / 1000;
  if (seconds <= 300) return "FRESH";
  if (seconds <= 600) return "STALE";
  return "EXPIRED";
}

function sufficiencyOf(evidence: { field_name: string; value: unknown; authority_level: string; status: string; observed_at: string; source_type: string }[]) {
  const active = evidence.filter((e) => e.status === "ACTIVE");
  const gaps: string[] = [];
  const payment = active.find((e) => e.field_name === "payment_status");
  const order = active.find((e) => e.field_name === "order_status");
  if (!payment || payment.value !== "SUCCESS") gaps.push("MISSING_PAYMENT_STATE");
  else if (freshnessOf(payment.observed_at, payment.source_type) !== "FRESH") gaps.push("STALE_PAYMENT_STATE");
  if (!order || !["FAILED", "MISSING"].includes(order.value as string)) gaps.push("MISSING_ORDER_STATE");
  if (evidence.some((e) => e.status === "CONTRADICTED")) gaps.push("CONTRADICTION_DETECTED");
  if (!evidence.some((e) => e.authority_level === "AUTHORITATIVE")) gaps.push("MISSING_AUTHORITATIVE_EVIDENCE");
  const result = gaps.includes("CONTRADICTION_DETECTED") ? "BLOCKED" : gaps.length ? "INSUFFICIENT" : "SUFFICIENT";
  return { result, gaps };
}

function riskOf(amount: number, gaps: string[], urgency: string, retries: number) {
  let score = 0;
  if (amount > 5000) score += 40;
  if (gaps.includes("CONTRADICTION_DETECTED")) score += 100;
  if (gaps.some((g) => g.startsWith("STALE"))) score += 20;
  if (gaps.includes("MISSING_AUTHORITATIVE_EVIDENCE")) score += 30;
  if (retries > 0) score += 20;
  if (urgency === "HIGH") score += 10;
  const level = score > 70 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  return { score, level };
}

function authorize(policyId: string, score: number, sufficient: string) {
  if (sufficient === "BLOCKED" || score > 70 || policyId === "POL-003" || policyId === "POL-004") return "ESCALATE";
  if (sufficient !== "SUFFICIENT") return "ASK_CUSTOMER";
  if (score >= 30 || policyId === "POL-002") return "HUMAN_APPROVAL_REQUIRED";
  return "AUTO_ALLOWED";
}

function idKey(caseId: string, actionType: string, targetId: string) {
  return `${caseId}:${actionType}:${targetId}:v1`;
}

const SPECIALISTS: Record<string, string> = {
  Billing: "Billing & Payments Agent",
  Order: "Orders & Fulfillment Agent",
  Technical: "Technical Support Agent",
  Account: "Account & Security Agent",
  Other: "Orders & Fulfillment Agent",
};

function classify(text: string, category?: string) {
  const t = text.toLowerCase();
  const domain = category && SPECIALISTS[category] ? category
    : /refund|charg|payment|billed|money/.test(t) ? "Billing"
    : /order|deliver|shipment|package/.test(t) ? "Order"
    : /login|password|account|security|hacked/.test(t) ? "Account"
    : /error|crash|bug|not working|broken/.test(t) ? "Technical"
    : "Other";
  const urgency = /urgent|immediately|asap|twice|again|still/.test(t) || /refund|charg/.test(t) ? "HIGH" : "MEDIUM";
  const sentiment = /frustrat|angry|terrible|worst|unacceptable|twice|still/.test(t) ? "FRUSTRATED" : "NEUTRAL";
  const primary = /refund/.test(t) && /not|missing|never/.test(t) ? "refund_not_received"
    : /charg/.test(t) && /order/.test(t) ? "payment_success_order_missing"
    : domain === "Account" ? "account_access_issue"
    : domain === "Technical" ? "technical_failure"
    : "general_support_request";
  return { domain, urgency, sentiment, primary, specialist: SPECIALISTS[domain] };
}

class Engine {
  supabase;
  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async transition(caseId: string, current: string, target: string, eventType: string, payload: Record<string, unknown> = {}) {
    if (!ALLOWED[current]?.includes(target)) throw new Error(`illegal transition ${current} -> ${target}`);
    const { error: updateError } = await this.supabase
      .from("rs_cases")
      .update({ status: target, updated_at: new Date().toISOString() })
      .eq("case_id", caseId);
    if (updateError) throw new Error(`state transition failed: ${updateError.message}`);

    const { error: eventError } = await this.supabase.from("rs_case_events").insert({
      event_id: crypto.randomUUID(), case_id: caseId, event_type: eventType, payload,
    });
    if (eventError) throw new Error(`state event failed: ${eventError.message}`);
    return target;
  }

  async getCaseStatus(caseId: string) {
    const { data } = await this.supabase.from("rs_cases").select("status").eq("case_id", caseId).maybeSingle();
    return data?.status ?? "NEW";
  }

  async insertEvidence(row: Record<string, unknown>) {
    const { error } = await this.supabase.from("rs_evidence_ledger").insert(row);
    if (error) throw new Error(`evidence insert failed: ${error.message}`);
  }

  async handoff(caseId: string, from: string, to: string, message: string) {
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "AGENT_HANDOFF", payload: { from, to, message } });
  }

  async knowledge(caseId: string, policyIds: string[]) {
    const { data } = await this.supabase.from("rs_policies").select("*").in("policy_id", policyIds);
    const now = new Date().toISOString();
    for (const policy of data ?? []) {
      await this.insertEvidence({ evidence_id: `EV-${crypto.randomUUID().slice(0, 8)}`, case_id: caseId, source_system: "Knowledge Base", source_record_id: policy.policy_id, source_type: "POLICY", field_name: "policy_rule", value: policy.rule_text, authority_level: "SECONDARY", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "search_policy", relevance: `Policy ${policy.policy_id} v${policy.version} applies to this case type`, status: "ACTIVE" });
    }
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "KNOWLEDGE_RETRIEVED", payload: { policies: policyIds } });
    return data ?? [];
  }

  async qwenResolutionProposal(
    caseId: string,
    twin: Record<string, unknown>,
    evidenceSummary: Record<string, unknown>,
    policySummary: Record<string, unknown>,
  ) {
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
            "X-Enter-Project-ID": "70c32d0a6eb24783a12e5edabe9d40c7",
          },
          body: JSON.stringify({
            model: QWEN_MODEL,
            stream: false,
            temperature: 0,
            messages: [
              { role: "system", content: QWEN_SYSTEM_PROMPT },
              {
                role: "user",
                content: `CASE_TWIN=${JSON.stringify(twin)}\nEVIDENCE_LEDGER=${JSON.stringify(evidenceSummary)}\nPOLICY=${JSON.stringify(policySummary)}`,
              },
            ],
          }),
        });

        const rawBody = await response.text();
        if (!response.ok) throw new Error(`Qwen HTTP ${response.status}: ${rawBody.slice(0, 500)}`);

        const data = JSON.parse(rawBody);
        const content = String(data.choices?.[0]?.message?.content ?? "").trim();
        if (!content) throw new Error("Qwen returned an empty proposal");

        const cleaned = content
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const parsed = ContractSchema.parse(JSON.parse(cleaned));

        if (parsed.case_id !== caseId) throw new Error("Qwen proposal case_id does not match the active case");
        const allowedEvidence = new Set((evidenceSummary.evidence_ids as string[]) ?? []);
        if (parsed.evidence_ids.some((id) => !allowedEvidence.has(id))) {
          throw new Error("Qwen proposal referenced evidence outside the supplied ledger");
        }

        await this.supabase.from("rs_case_events").insert({
          event_id: crypto.randomUUID(),
          case_id: caseId,
          event_type: "QWEN_PROPOSAL_ACCEPTED",
          payload: { model: QWEN_MODEL, attempt },
        });

        return { contract: parsed, qwen_used: true, qwen_attempts: attempt, qwen_error: "" };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        await this.supabase.from("rs_case_events").insert({
          event_id: crypto.randomUUID(),
          case_id: caseId,
          event_type: "QWEN_PROPOSAL_ATTEMPT",
          payload: { model: QWEN_MODEL, attempt, error: lastError.slice(0, 1000) },
        });
      }
    }

    return { contract: null, qwen_used: false, qwen_attempts: 2, qwen_error: lastError };
  }

  async finish(caseId: string, rootCause: string, response: string) {
    const { error: caseError } = await this.supabase
      .from("rs_cases")
      .update({ root_cause: rootCause, customer_response: response })
      .eq("case_id", caseId);
    if (caseError) throw new Error(`case completion update failed: ${caseError.message}`);

    const { error: eventError } = await this.supabase.from("rs_case_events").insert({
      event_id: crypto.randomUUID(), case_id: caseId, event_type: "CUSTOMER_RESPONSE_GENERATED", payload: { response },
    });
    if (eventError) throw new Error(`customer response event failed: ${eventError.message}`);
  }

  async submitCase(input: { customer_id: string; customer_name?: string; customer_email?: string; complaint: string; reference_id?: string; category?: string }) {
    const caseId = `CASE-${Date.now().toString().slice(-6)}`;
    const routed = classify(input.complaint, input.category);
    await this.supabase.from("rs_cases").insert({
      case_id: caseId, customer_id: input.customer_id, raw_complaint: input.complaint, status: "NEW",
      customer_name: input.customer_name ?? null, customer_email: input.customer_email ?? null,
      category: routed.domain, reference_id: input.reference_id ?? null, urgency: routed.urgency, sentiment: routed.sentiment,
      primary_intent: routed.primary, domain: [routed.domain.toLowerCase()], assigned_agent: routed.specialist, label: "DEMO",
    });
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "CASE_CREATED", payload: { channel: "web_form" } });

    const { count: history } = await this.supabase.from("rs_cases").select("case_id", { count: "exact", head: true }).eq("customer_id", input.customer_id);
    let status = await this.transition(caseId, "NEW", "ROUTED", "INTENT_CLASSIFIED", { primary_intent: routed.primary, urgency: routed.urgency, sentiment: routed.sentiment, domain: routed.domain, prior_cases: (history ?? 1) - 1 });
    await this.handoff(caseId, "ResolveSphere Orchestrator", routed.specialist, `Routed ${routed.primary} (${routed.urgency} urgency) to ${routed.specialist}`);
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "DOMAIN_ROUTED", payload: { specialist: routed.specialist } });

    status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    const ref = input.reference_id?.trim();
    const [{ data: payment0 }, { data: order0 }, { data: refund0 }] = await Promise.all([
      ref ? this.supabase.from("rs_synthetic_payments").select("*").eq("payment_id", ref).maybeSingle() : Promise.resolve({ data: null }),
      ref ? this.supabase.from("rs_synthetic_orders").select("*").eq("order_id", ref).maybeSingle() : Promise.resolve({ data: null }),
      ref ? this.supabase.from("rs_synthetic_refunds").select("*").eq("refund_id", ref).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    let payment = payment0;
    let order = order0;
    const refund = refund0;
    if (payment && !order) {
      const { data } = await this.supabase.from("rs_synthetic_orders").select("*").eq("payment_id", payment.payment_id).maybeSingle();
      order = data;
    }
    if (order && !payment && order.payment_id) {
      const { data } = await this.supabase.from("rs_synthetic_payments").select("*").eq("payment_id", order.payment_id).maybeSingle();
      payment = data;
    }
    if (refund && !payment && refund.payment_id) {
      const { data } = await this.supabase.from("rs_synthetic_payments").select("*").eq("payment_id", refund.payment_id).maybeSingle();
      payment = data;
    }
    const twin = {
      case_id: caseId, customer_ref: `[REDACTED:${input.customer_id}]`, primary_intent: routed.primary,
      domain: [routed.domain.toLowerCase()], urgency: routed.urgency, sla_state: "WITHIN_SLA",
      context: { relevant_payments: payment ? [payment.payment_id] : [], relevant_orders: order ? [order.order_id] : [], relevant_refunds: refund ? [refund.refund_id] : [] },
    };
    await this.supabase.from("rs_case_twins").upsert({ case_id: caseId, twin });
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");

    const now = new Date().toISOString();
    const evidenceIds: string[] = [];
    if (payment) {
      const id = `EV-${crypto.randomUUID().slice(0, 8)}`;
      evidenceIds.push(id);
      await this.insertEvidence({ evidence_id: id, case_id: caseId, source_system: "Payment System", source_record_id: payment.payment_id, source_type: "TRANSACTIONAL", field_name: "payment_status", value: payment.status, authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_payment", relevance: "Confirms whether the customer was charged", status: "ACTIVE" });
      await this.handoff(caseId, routed.specialist, "Billing & Payments Agent", `Requested payment context for ${payment.payment_id}`);
    }
    if (order) {
      const id = `EV-${crypto.randomUUID().slice(0, 8)}`;
      evidenceIds.push(id);
      await this.insertEvidence({ evidence_id: id, case_id: caseId, source_system: "Order System", source_record_id: order.order_id, source_type: "TRANSACTIONAL", field_name: "order_status", value: order.status, authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_order", relevance: "Confirms whether fulfilment completed", status: "ACTIVE" });
    }
    if (refund) {
      const id = `EV-${crypto.randomUUID().slice(0, 8)}`;
      evidenceIds.push(id);
      await this.insertEvidence({ evidence_id: id, case_id: caseId, source_system: "Refund System", source_record_id: refund.refund_id, source_type: "TRANSACTIONAL", field_name: "refund_status", value: refund.status, authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_refund", relevance: "Confirms refund progress", status: "ACTIVE" });
    }
    if (evidenceIds.length) {
      await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "EVIDENCE_RETRIEVED", payload: { evidence_ids: evidenceIds } });
    }
    await this.knowledge(caseId, ["POL-001", "POL-005"]);
    await this.handoff(caseId, routed.specialist, "Knowledge & Policy Agent", "Requested applicable refund and evidence policy");

    const gapCodes: string[] = [];
    if (!payment) gapCodes.push("MISSING_PAYMENT_STATE");
    if (!order) gapCodes.push("MISSING_ORDER_STATE");
    const canAutoResolve = payment?.status === "SUCCESS" && order && ["FAILED", "MISSING"].includes(order.status) && Number(payment.amount) <= 5000;

    if (canAutoResolve) {
      await this.handoff(caseId, routed.specialist, "ResolveSphere Orchestrator", "Evidence sufficient, requesting authorization for refund");
      return { case_id: caseId, status, next: "autonomous", specialist: routed.specialist };
    }

    const { score, level } = riskOf(Number(payment?.amount ?? 0), gapCodes.length ? ["MISSING_AUTHORITATIVE_EVIDENCE"] : [], routed.urgency, 0);
    const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;
    const authState = gapCodes.length ? "ASK_CUSTOMER" : "ESCALATE";
    await this.supabase.from("rs_decisions").insert({ decision_id: decisionId, case_id: caseId, contract_hash: "n/a", contract_version: "1.0", evidence_ids: evidenceIds, policy_id: "POL-005", policy_version: "1.0", risk_score: score, risk_factors: { gaps: gapCodes, level }, auth_state: authState, decision: authState, reason_codes: gapCodes.length ? gapCodes : ["MANUAL_REVIEW_REQUIRED"] });

    if (gapCodes.length) {
      status = await this.transition(caseId, status, "EVIDENCE_GAP", "EVIDENCE_GAP_FOUND", { gap_codes: gapCodes });
      const question = !payment && !order
        ? "Could you share the order or payment reference for this request?"
        : !payment ? "Could you share the payment reference or the last 4 digits of the card used?"
        : "Could you confirm the order number linked to this payment?";
      await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "QUESTION_ASKED", payload: { question } });
      await this.finish(caseId, "Insufficient transactional records to confirm the reported problem.", `Thanks for reaching out. We have opened case ${caseId} and started checking your account records. To continue we need one detail: ${question}`);
      await this.supabase.from("rs_cases").update({ authorization_state: authState, risk_level: level }).eq("case_id", caseId);
      return { case_id: caseId, status, next: "awaiting_customer", specialist: routed.specialist };
    }

    await this.handoff(caseId, routed.specialist, "Escalation Intelligence Agent", "Evidence does not authorize an autonomous action");
    status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: "MANUAL_REVIEW_REQUIRED" });
    await this.supabase.from("rs_cases").update({ escalation_reason: "MANUAL_REVIEW_REQUIRED", risk_level: level, authorization_state: authState }).eq("case_id", caseId);
    await this.finish(caseId, "Records do not support an automatic resolution for this request.", `Thanks for reaching out. Case ${caseId} has been passed to a support specialist with the full record of what we checked. They will follow up with next steps.`);
    return { case_id: caseId, status, next: "escalated", specialist: routed.specialist };
  }

  async runAutonomous(caseId: string) {
    let status = await this.getCaseStatus(caseId);
    const { data: caseRow, error: caseError } = await this.supabase.from("rs_cases").select("*").eq("case_id", caseId).single();
    if (caseError || !caseRow) throw new Error(`Case ${caseId} was not found`);

    if (status === "NEW") {
      status = await this.transition(caseId, status, "ROUTED", "INTENT_CLASSIFIED", {
        primary_intent: caseRow.primary_intent ?? "payment_success_order_missing",
        domain: caseRow.category ?? "Billing",
        urgency: caseRow.urgency ?? "HIGH",
        sentiment: caseRow.sentiment ?? "FRUSTRATED",
      });
    }
    if (status === "ROUTED") {
      const specialist = caseRow.assigned_agent ?? "Billing & Payments Agent";
      await this.supabase.from("rs_cases").update({
        category: caseRow.category ?? "Billing",
        assigned_agent: specialist,
        reference_id: caseRow.reference_id ?? "PAY-7001",
      }).eq("case_id", caseId);
      await this.handoff(caseId, "ResolveSphere Orchestrator", specialist, "Routed case to the specialist responsible for the relevant domain");
      status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    }
    if (status === "CONTEXT_BUILT") {
      status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");
    }
    if (status === "REOPENED") {
      status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_RESUMED");
    }
    if (status !== "INVESTIGATING") {
      return { case_id: caseId, status, message: "Case is not eligible for autonomous execution from its current state." };
    }

    const referenceId = String(caseRow.reference_id ?? "PAY-7001");
    const [{ data: paymentById }, { data: refundById }] = await Promise.all([
      this.supabase.from("rs_synthetic_payments").select("*").eq("payment_id", referenceId).maybeSingle(),
      this.supabase.from("rs_synthetic_refunds").select("*").eq("refund_id", referenceId).maybeSingle(),
    ]);

    let payment = paymentById;
    const refund = refundById;
    if (refund?.payment_id && !payment) {
      const { data } = await this.supabase.from("rs_synthetic_payments").select("*").eq("payment_id", refund.payment_id).maybeSingle();
      payment = data;
    }

    let order = null;
    if (payment) {
      const { data } = await this.supabase.from("rs_synthetic_orders").select("*").eq("payment_id", payment.payment_id).maybeSingle();
      order = data;
    }

    const twin = {
      case_id: caseId,
      customer_ref: `[REDACTED:${caseRow.customer_id}]`,
      primary_intent: caseRow.primary_intent ?? "payment_success_order_missing",
      domain: [String(caseRow.category ?? "Billing").toLowerCase()],
      urgency: caseRow.urgency ?? "HIGH",
      sla_state: "WITHIN_SLA",
      context: {
        relevant_payments: payment ? [payment.payment_id] : [],
        relevant_orders: order ? [order.order_id] : [],
        relevant_refunds: refund ? [refund.refund_id] : [],
      },
    };
    await this.supabase.from("rs_case_twins").upsert({ case_id: caseId, twin });

    const now = new Date().toISOString();
    const existing = (await this.supabase.from("rs_evidence_ledger").select("evidence_id,field_name,value,authority_level,status,observed_at,source_type").eq("case_id", caseId).eq("status", "ACTIVE")).data ?? [];
    const evidenceIds: string[] = existing.map((e) => e.evidence_id);

    const addEvidence = async (fieldName: string, value: unknown, sourceRecordId: string, relevance: string, retrievalMethod: string) => {
      const already = existing.find((e) => e.field_name === fieldName);
      if (already) return already.evidence_id;
      const id = `EV-${crypto.randomUUID().slice(0, 8)}`;
      evidenceIds.push(id);
      await this.insertEvidence({
        evidence_id: id, case_id: caseId, source_system: fieldName === "payment_status" ? "Payment System" : fieldName === "order_status" ? "Order System" : "Refund System",
        source_record_id: sourceRecordId, source_type: "TRANSACTIONAL", field_name: fieldName, value,
        authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH",
        retrieval_method: retrievalMethod, relevance, status: "ACTIVE",
      });
      return id;
    };

    if (payment) await addEvidence("payment_status", payment.status, payment.payment_id, "Authoritative payment state", "get_payment");
    if (order) await addEvidence("order_status", order.status, order.order_id, "Authoritative order state", "get_order");
    if (refund) await addEvidence("refund_status", refund.status, refund.refund_id, "Authoritative refund state", "get_refund");

    await this.supabase.from("rs_case_events").insert({
      event_id: crypto.randomUUID(), case_id: caseId, event_type: "EVIDENCE_RETRIEVED", payload: { evidence_ids: evidenceIds },
    });

    const policies = await this.knowledge(caseId, ["POL-001", "POL-005"]);
    await this.handoff(caseId, caseRow.assigned_agent ?? "Billing & Payments Agent", "Knowledge & Policy Agent", "Retrieved applicable policy before proposing a resolution");

    const evidenceRows = (await this.supabase.from("rs_evidence_ledger").select("evidence_id,field_name,value,authority_level,status,observed_at,source_type").eq("case_id", caseId).eq("status", "ACTIVE")).data ?? [];
    const { result: sufficient, gaps } = sufficiencyOf(evidenceRows as { field_name: string; value: unknown; authority_level: string; status: string; observed_at: string; source_type: string }[]);

    if (sufficient !== "SUFFICIENT") {
      const { score, level } = riskOf(Number(payment?.amount ?? 0), gaps, caseRow.urgency ?? "MEDIUM", caseRow.reopened_count ?? 0);
      const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;
      const authState = authorize("POL-005", score, sufficient);

      await this.supabase.from("rs_decisions").insert({
        decision_id: decisionId, case_id: caseId, contract_hash: "n/a", contract_version: "1.0",
        evidence_ids: evidenceIds, policy_id: "POL-005", policy_version: "1.0", risk_score: score,
        risk_factors: { gaps, level }, auth_state: authState, decision: authState, reason_codes: gaps,
      });

      if (sufficient === "BLOCKED") {
        status = await this.transition(caseId, status, "CONTRADICTION", "CONTRADICTION_DETECTED", { gaps });
        status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: "CONTRADICTION_DETECTED" });
        await this.supabase.from("rs_cases").update({ escalation_reason: "CONTRADICTION_DETECTED", risk_level: level, authorization_state: "ESCALATE" }).eq("case_id", caseId);
        return { case_id: caseId, status, decision: "ESCALATE", qwen_used: false, reason: "CONTRADICTION_DETECTED" };
      }

      status = await this.transition(caseId, status, "EVIDENCE_GAP", "EVIDENCE_GAP_FOUND", { gap_codes: gaps });
      const question = !payment
        ? "Could you share the payment reference or order number for this request?"
        : !order
          ? "Could you confirm the order number linked to this payment?"
          : "Could you provide the missing transaction detail needed to continue?";
      await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "QUESTION_ASKED", payload: { question } });
      await this.supabase.from("rs_cases").update({ authorization_state: "ASK_CUSTOMER", risk_level: level }).eq("case_id", caseId);
      return { case_id: caseId, status, next: "awaiting_customer", question, qwen_used: false };
    }

    status = await this.transition(caseId, status, "EVIDENCE_READY", "EVIDENCE_READY", { evidence_ids: evidenceIds });

    const evidenceSummary = {
      evidence_ids: evidenceIds,
      payment_status: payment?.status,
      payment_id: payment?.payment_id,
      amount: Number(payment?.amount ?? 0),
      currency: payment?.currency ?? "INR",
      order_status: order?.status,
      order_id: order?.order_id,
    };
    const policySummary = (policies ?? []).map((p) => ({
      policy_id: p.policy_id, version: p.version, rule_text: p.rule_text,
    }));

    const qwen = await this.qwenResolutionProposal(caseId, twin, evidenceSummary, policySummary);
    let qwenUsed = qwen.qwen_used;
    let qwenError = qwen.qwen_error;
    let contract: z.infer<typeof ContractSchema>;

    if (qwen.contract) {
      contract = qwen.contract;
      const targetMatches = contract.proposed_action.type === "REFUND_PAYMENT"
        && contract.proposed_action.target_id === payment?.payment_id
        && Number(contract.proposed_action.amount) === Number(payment?.amount)
        && contract.proposed_action.currency === payment?.currency;

      if (!targetMatches) {
        qwenUsed = false;
        qwenError = "Qwen proposal failed deterministic target/amount/currency validation";
        contract = ContractSchema.parse({
          case_id: caseId, problem: "payment_success_order_missing", evidence_ids: evidenceIds,
          proposed_action: { type: "ESCALATE_CASE", target_id: caseId, amount: 0, currency: payment?.currency ?? "INR" },
          policy_reference: "POL-005", risk_level: "HIGH", authorization_required: true,
          expected_state: { entity: "case", target_id: caseId, status: "ESCALATED" },
          verification_target: "rs_cases", escalation_required: true, customer_message_intent: "human_review",
        });
      }
    } else {
      contract = ContractSchema.parse({
        case_id: caseId, problem: "payment_success_order_missing", evidence_ids: evidenceIds,
        proposed_action: { type: "REFUND_PAYMENT", target_id: payment!.payment_id, amount: Number(payment!.amount), currency: payment!.currency },
        policy_reference: "POL-001", risk_level: "LOW", authorization_required: false,
        expected_state: { entity: "refund", target_id: payment!.payment_id, status: "SUCCESS" },
        verification_target: "rs_synthetic_refunds", escalation_required: false, customer_message_intent: "refund_verified",
      });
      await this.supabase.from("rs_case_events").insert({
        event_id: crypto.randomUUID(), case_id: caseId, event_type: "QWEN_FALLBACK", payload: { error: qwenError },
      });
    }

    const hash = await contractHash(contract);
    status = await this.transition(caseId, status, "DECISION_READY", "DECISION_READY", {
      contract_hash: hash, qwen_used: qwenUsed, qwen_error: qwenError || null,
    });

    const { score, level } = riskOf(contract.proposed_action.amount, gaps, caseRow.urgency ?? "MEDIUM", caseRow.reopened_count ?? 0);
    const authState = authorize(contract.policy_reference, score, sufficient);
    const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;

    await this.supabase.from("rs_decisions").insert({
      decision_id: decisionId, case_id: caseId, contract_hash: hash, contract_version: "1.0",
      evidence_ids: evidenceIds, policy_id: contract.policy_reference, policy_version: "1.0",
      risk_score: score, risk_factors: { gaps, qwen_risk_level: contract.risk_level, level },
      auth_state: authState, decision: authState, reason_codes: gaps.length ? gaps : ["EVIDENCE_SUFFICIENT"],
    });
    await this.supabase.from("rs_case_events").insert([
      { event_id: crypto.randomUUID(), case_id: caseId, event_type: "POLICY_CHECKED", payload: { policy: contract.policy_reference } },
      { event_id: crypto.randomUUID(), case_id: caseId, event_type: "RISK_ASSESSED", payload: { score, level } },
    ]);

    if (authState !== "AUTO_ALLOWED" || contract.proposed_action.type !== "REFUND_PAYMENT") {
      if (authState === "HUMAN_APPROVAL_REQUIRED") {
        status = await this.transition(caseId, status, "APPROVAL_REQUIRED", "APPROVAL_REQUESTED", { decision_id: decisionId, contract_hash: hash });
        await this.supabase.from("rs_approvals").insert({
          approval_id: `APR-${crypto.randomUUID().slice(0, 8)}`, decision_id: decisionId, case_id: caseId,
          contract_hash: hash, action_type: contract.proposed_action.type, target_id: contract.proposed_action.target_id,
          amount: contract.proposed_action.amount, policy_version: "1.0", risk_score: score, approval_status: "PENDING",
        });
      } else {
        status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: authState });
        await this.supabase.from("rs_cases").update({ escalation_reason: authState, risk_level: level, authorization_state: authState }).eq("case_id", caseId);
      }
      return { case_id: caseId, status, decision: authState, contract_hash: hash, qwen_used: qwenUsed, qwen_error: qwenError || undefined };
    }

    status = await this.transition(caseId, status, "ACTION_EXECUTING", "ACTION_AUTHORIZED", { decision_id: decisionId, contract_hash: hash });
    const idempotencyKey = idKey(caseId, contract.proposed_action.type, contract.proposed_action.target_id);
    const { data: existingIdem } = await this.supabase.from("rs_idempotency_ledger").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();

    let actionId: string;
    let refundRow: Record<string, unknown>;
    if (existingIdem?.status === "COMPLETED") {
      actionId = existingIdem.action_id;
      refundRow = existingIdem.result_payload as Record<string, unknown>;
    } else {
      actionId = `ACT-${crypto.randomUUID().slice(0, 8)}`;
      await this.supabase.from("rs_idempotency_ledger").upsert({
        idempotency_key: idempotencyKey, case_id: caseId, action_type: contract.proposed_action.type,
        target_id: contract.proposed_action.target_id, contract_hash: hash, status: "PENDING", action_id: actionId,
      });
      await this.supabase.from("rs_actions").insert({
        action_id: actionId, case_id: caseId, contract_hash: hash, decision_id: decisionId,
        action_type: contract.proposed_action.type, target_id: contract.proposed_action.target_id,
        amount: contract.proposed_action.amount, currency: contract.proposed_action.currency,
        idempotency_key: idempotencyKey, status: "STARTED", simulated: true,
      });
      await this.supabase.from("rs_case_events").insert({
        event_id: crypto.randomUUID(), case_id: caseId, event_type: "ACTION_STARTED", payload: { action_id: actionId },
      });

      const refundId = `REF-${caseId}`;
      const refundPayload = {
        refund_id: refundId, payment_id: payment!.payment_id,
        amount: contract.proposed_action.amount, currency: contract.proposed_action.currency,
        status: "SUCCESS", label: "SIMULATED",
      };
      const { error: refundError } = await this.supabase.from("rs_synthetic_refunds").upsert(refundPayload);
      if (refundError) throw new Error(`Refund action failed: ${refundError.message}`);

      refundRow = refundPayload;
      await this.supabase.from("rs_actions").update({
        status: "COMPLETED", response_payload: refundPayload, completed_at: new Date().toISOString(),
      }).eq("action_id", actionId);
      await this.supabase.from("rs_idempotency_ledger").update({
        status: "COMPLETED", result_payload: refundPayload, updated_at: new Date().toISOString(),
      }).eq("idempotency_key", idempotencyKey);
      await this.supabase.from("rs_case_events").insert({
        event_id: crypto.randomUUID(), case_id: caseId, event_type: "ACTION_COMPLETED", payload: { action_id: actionId, simulated: true },
      });
    }

    status = await this.transition(caseId, status, "VERIFYING", "VERIFICATION_STARTED", { action_id: actionId });
    const { data: authoritativeRefund } = await this.supabase.from("rs_synthetic_refunds")
      .select("*").eq("payment_id", payment!.payment_id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    const observed = authoritativeRefund ?? refundRow;
    const predicateResults = {
      status: observed?.status === "SUCCESS",
      amount: Number(observed?.amount) === Number(contract.proposed_action.amount),
      payment_id: observed?.payment_id === contract.proposed_action.target_id,
    };
    const verified = Object.values(predicateResults).every(Boolean);
    const verificationId = `VER-${crypto.randomUUID().slice(0, 8)}`;

    await this.supabase.from("rs_verifications").insert({
      verification_id: verificationId, action_id: actionId, case_id: caseId,
      authoritative_source: "rs_synthetic_refunds", evidence_ids: evidenceIds,
      expected_postconditions: ["status==SUCCESS", "amount==contract.amount", "payment_id==contract.target"],
      observed_state: observed, predicate_results: predicateResults, result: verified ? "VERIFIED" : "FAILED",
    });
    await this.supabase.from("rs_case_events").insert({
      event_id: crypto.randomUUID(), case_id: caseId,
      event_type: verified ? "VERIFICATION_SUCCESS" : "VERIFICATION_FAILED",
      payload: { verification_id: verificationId, predicate_results: predicateResults },
    });

    if (verified) {
      status = await this.transition(caseId, status, "RESOLVED", "CASE_RESOLVED", { verification_id: verificationId });
      await this.supabase.from("rs_resolution_passports").upsert({
        passport_id: `PASS-${crypto.randomUUID().slice(0, 8)}`, case_id: caseId,
        reported_problem: caseRow.raw_complaint, actual_problem: contract.problem, evidence_ids: evidenceIds,
        decision_id: decisionId, policy_id: contract.policy_reference, risk_level: level,
        action_id: actionId, action_result: refundRow, verification_id: verificationId, final_state: "RESOLVED",
      });
      await this.supabase.from("rs_cases").update({
        action_status: "COMPLETED", verification_status: "VERIFIED", final_state: "RESOLVED",
        risk_level: level, authorization_state: authState,
      }).eq("case_id", caseId);
      await this.finish(
        caseId,
        "Payment succeeded but order creation failed downstream, leaving the customer charged with no order.",
        `We confirmed you were charged ${contract.proposed_action.currency} ${contract.proposed_action.amount} for an order that failed to create. A refund of ${contract.proposed_action.currency} ${contract.proposed_action.amount} has been issued to the original payment method and verified against the authoritative refund record. This demo uses a synthetic refund provider, so no real money movement occurred.`,
      );
      return { case_id: caseId, status, decision: authState, contract_hash: hash, verification: "VERIFIED", qwen_used: qwenUsed, qwen_error: qwenError || undefined };
    }

    const reopenedCount = (caseRow.reopened_count ?? 0) + 1;
    await this.supabase.from("rs_cases").update({ reopened_count: reopenedCount, verification_status: "FAILED" }).eq("case_id", caseId);
    if (reopenedCount >= 2) {
      status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { reason: "VERIFICATION_FAILED_TWICE" });
    } else {
      status = await this.transition(caseId, status, "REOPENED", "CASE_REOPENED", { verification_id: verificationId });
    }
    return { case_id: caseId, status, decision: authState, contract_hash: hash, verification: "FAILED", qwen_used: qwenUsed, qwen_error: qwenError || undefined };
  }

  async runEvidenceGap(caseId: string) {
    let status = await this.getCaseStatus(caseId);
    status = await this.transition(caseId, status, "ROUTED", "INTENT_CLASSIFIED", { primary_intent: "refund_not_received", domain: "Billing", urgency: "MEDIUM", sentiment: "NEUTRAL" });
    await this.supabase.from("rs_cases").update({ primary_intent: "refund_not_received", category: "Billing", assigned_agent: "Billing & Payments Agent", reference_id: "REF-9002" }).eq("case_id", caseId);
    await this.handoff(caseId, "ResolveSphere Orchestrator", "Billing & Payments Agent", "Routed missing-refund complaint to billing specialist");
    status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    await this.supabase.from("rs_case_twins").upsert({ case_id: caseId, twin: { case_id: caseId, customer_ref: "[REDACTED]", primary_intent: "refund_not_received", domain: ["billing"], urgency: "MEDIUM", sla_state: "WITHIN_SLA", context: { relevant_refunds: ["REF-9002"], relevant_payments: ["PAY-7002"] } } });
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");

    const now = new Date().toISOString();
    const { data: refund } = await this.supabase.from("rs_synthetic_refunds").select("*").eq("refund_id", "REF-9002").single();
    const evRef = `EV-${crypto.randomUUID().slice(0, 8)}`;
    await this.insertEvidence({ evidence_id: evRef, case_id: caseId, source_system: "Refund System", source_record_id: refund.refund_id, source_type: "TRANSACTIONAL", field_name: "refund_status", value: refund.status, authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_refund", relevance: "refund confirmation status", status: "ACTIVE" });
    await this.handoff(caseId, "Billing & Payments Agent", "Knowledge & Policy Agent", "Checked refund policy before contacting the customer");
    await this.knowledge(caseId, ["POL-007"]);

    status = await this.transition(caseId, status, "EVIDENCE_GAP", "EVIDENCE_GAP_FOUND", { gap_code: "MISSING_REFUND_CONFIRMATION" });
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "QUESTION_ASKED", payload: { question: "Did you receive a refund confirmation email or reference number?" } });

    const evAns = `EV-${crypto.randomUUID().slice(0, 8)}`;
    await this.insertEvidence({ evidence_id: evAns, case_id: caseId, source_system: "Customer", source_record_id: caseId, source_type: "CUSTOMER_STATEMENT", field_name: "refund_confirmation", value: "No confirmation email or reference received", authority_level: "CUSTOMER_STATEMENT", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "request_customer_info", relevance: "customer-reported confirmation status", status: "ACTIVE" });
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "ANSWER_RECEIVED", payload: { evidence_id: evAns } });
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED", { resumed: true });

    const gaps = ["MISSING_AUTHORITATIVE_EVIDENCE"];
    const { score } = riskOf(1200, gaps, "MEDIUM", 0);
    const authState = authorize("POL-007", score, "INSUFFICIENT");
    const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;
    await this.supabase.from("rs_decisions").insert({ decision_id: decisionId, case_id: caseId, contract_hash: "n/a", contract_version: "1.0", evidence_ids: [evRef, evAns], policy_id: "POL-007", policy_version: "1.0", risk_score: score, risk_factors: { gaps }, auth_state: authState, decision: authState, reason_codes: gaps });
    status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: "CUSTOMER_STATEMENT_INSUFFICIENT" });
    await this.supabase.from("rs_cases").update({ escalation_reason: "CUSTOMER_STATEMENT_INSUFFICIENT", risk_level: "MEDIUM", authorization_state: authState }).eq("case_id", caseId);
    await this.handoff(caseId, "Billing & Payments Agent", "Escalation Intelligence Agent", "Customer statement cannot authorize a refund under POL-007");
    await this.finish(caseId, "Refund was initiated but never confirmed by the payment provider, and no confirmation reference exists on either side.", `Thanks for confirming you have not received a refund confirmation. Your refund is still showing as pending in our payment records, so we have passed your case to a specialist who will chase the provider and update you directly.`);
    return { case_id: caseId, status, decision: authState };
  }

  async runContradiction(caseId: string) {
    let status = await this.getCaseStatus(caseId);
    status = await this.transition(caseId, status, "ROUTED", "INTENT_CLASSIFIED", { primary_intent: "refund_status_disputed", domain: "Billing", urgency: "HIGH", sentiment: "FRUSTRATED" });
    await this.supabase.from("rs_cases").update({ primary_intent: "refund_status_disputed", category: "Billing", assigned_agent: "Billing & Payments Agent", reference_id: "REF-9003" }).eq("case_id", caseId);
    await this.handoff(caseId, "ResolveSphere Orchestrator", "Billing & Payments Agent", "Routed disputed refund status to billing specialist");
    status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    await this.supabase.from("rs_case_twins").upsert({ case_id: caseId, twin: { case_id: caseId, customer_ref: "[REDACTED]", primary_intent: "refund_status_disputed", domain: ["billing"], urgency: "HIGH", sla_state: "WITHIN_SLA", context: { relevant_refunds: ["REF-9003"], relevant_payments: ["PAY-7003"] } } });
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");

    const now = new Date().toISOString();
    const { data: refund } = await this.supabase.from("rs_synthetic_refunds").select("*").eq("refund_id", "REF-9003").single();
    const evPayment = `EV-${crypto.randomUUID().slice(0, 8)}`;
    const evSupport = `EV-${crypto.randomUUID().slice(0, 8)}`;
    await this.insertEvidence({ evidence_id: evPayment, case_id: caseId, source_system: "Payment System", source_record_id: refund.refund_id, source_type: "TRANSACTIONAL", field_name: "refund_status", value: refund.status, authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_refund", relevance: "payment system refund status", status: "CONTRADICTED" });
    await this.insertEvidence({ evidence_id: evSupport, case_id: caseId, source_system: "Support System", source_record_id: refund.refund_id, source_type: "SUPPORT", field_name: "refund_status", value: refund.support_status, authority_level: "SECONDARY", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_ticket", relevance: "support system refund status", status: "CONTRADICTED" });
    await this.handoff(caseId, "Billing & Payments Agent", "Orders & Fulfillment Agent", "Cross-checked refund record across support and payment systems");
    await this.handoff(caseId, "Orders & Fulfillment Agent", "Billing & Payments Agent", `Support system reports ${refund.support_status}, payment system reports ${refund.status}`);
    await this.knowledge(caseId, ["POL-004"]);

    status = await this.transition(caseId, status, "CONTRADICTION", "CONTRADICTION_DETECTED", { source_a: { system: "Synthetic_Payment_DB", value: refund.status }, source_b: { system: "Synthetic_Support_DB", value: refund.support_status } });

    const gaps = ["CONTRADICTION_DETECTED"];
    const { score, level } = riskOf(Number(refund.amount), gaps, "HIGH", 0);
    const authState = authorize("POL-004", score, "BLOCKED");
    const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;
    await this.supabase.from("rs_decisions").insert({ decision_id: decisionId, case_id: caseId, contract_hash: "n/a", contract_version: "1.0", evidence_ids: [evPayment, evSupport], policy_id: "POL-004", policy_version: "1.0", risk_score: score, risk_factors: { gaps, level }, auth_state: authState, decision: authState, reason_codes: gaps });
    status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: "MATERIAL_CONTRADICTION" });
    await this.supabase.from("rs_cases").update({ escalation_reason: "MATERIAL_CONTRADICTION", risk_level: level, authorization_state: authState }).eq("case_id", caseId);
    await this.handoff(caseId, "Billing & Payments Agent", "Escalation Intelligence Agent", "Autonomous action blocked: systems disagree on refund state");
    await this.finish(caseId, "Support and payment systems hold conflicting refund states for the same record, so the true refund state is unconfirmed.", `We are looking into your refund. Our records currently disagree about its status, so a specialist is confirming the exact position with the payment provider before we take any action on your account. We will update you as soon as that is confirmed.`);
    return { case_id: caseId, status, decision: authState };
  }

  async runRadar() {
    const { data: historical } = await this.supabase.from("rs_historical_resolutions").select("problem_pattern, error_code");
    const counts = new Map<string, number>();
    for (const row of historical ?? []) {
      const key = `${row.problem_pattern}::${row.error_code}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const { data: events } = await this.supabase.from("rs_system_events").select("*").eq("event_type", "DEPLOYMENT");
    const facts = Array.from(counts.entries()).map(([key, count]) => {
      const [problem_pattern, error_code] = key.split("::");
      return { problem_pattern, error_code, count, label: "SYNTHETIC" };
    });
    const incidentCandidates = facts.filter((f) => f.count >= 10);
    const correlation = incidentCandidates.length && (events ?? []).length ? { incident_pattern: incidentCandidates[0], correlated_event: events![0], label: "SYNTHETIC" } : null;
    const hypothesis = correlation ? { statement: `${correlation.correlated_event.service} deployment (${correlation.correlated_event.event_id}) is a possible contributing factor to ${correlation.incident_pattern.error_code}`, confidence_label: "HYPOTHESIS" } : null;
    const recommendation = hypothesis ? { action: "Investigate the order-service deployment and add a compensation workflow for order creation timeouts.", confidence_label: "RECOMMENDATION" } : null;
    return { fact: facts, correlation, hypothesis, recommendation, incident_candidate: incidentCandidates.length > 0 };
  }

  async resetDemo() {
    const caseIds = ["CASE-1001", "CASE-1002", "CASE-1003"];
    const { data: submitted } = await this.supabase.from("rs_cases").select("case_id").eq("label", "DEMO");
    const submittedIds = (submitted ?? []).map((c) => c.case_id);
    const allIds = [...caseIds, ...submittedIds];
    for (const table of ["rs_resolution_passports", "rs_verifications", "rs_approvals", "rs_actions", "rs_idempotency_ledger", "rs_decisions", "rs_evidence_ledger", "rs_case_events", "rs_case_twins"]) {
      await this.supabase.from(table).delete().in("case_id", allIds);
    }
    if (submittedIds.length) await this.supabase.from("rs_cases").delete().in("case_id", submittedIds);
    await this.supabase.from("rs_synthetic_refunds").delete().like("refund_id", "REF-CASE-%");
    await this.supabase.from("rs_cases").update({ status: "NEW", reopened_count: 0, escalation_reason: null, risk_level: null, authorization_state: null, action_status: null, verification_status: null, final_state: null, root_cause: null, customer_response: null }).in("case_id", caseIds);
    for (const caseId of caseIds) {
      await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "CASE_CREATED", payload: {} });
    }
    return { reset: true, cases: caseIds };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const engine = new Engine(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action, case_id } = body;

    if (action === "get_or_create_customer") {
      const { auth_user_id, email, name } = body;
      if (!auth_user_id || !email) {
        return new Response(JSON.stringify({ ok: false, error: "auth_user_id and email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: existing } = await engine.supabase.from("rs_synthetic_customers").select("customer_id").eq("auth_user_id", auth_user_id).maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ ok: true, customer_id: existing.customer_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const customerId = `CUST-${Date.now().toString().slice(-6)}`;
      await engine.supabase.from("rs_synthetic_customers").insert({ customer_id, auth_user_id, name: name ?? email.split('@')[0], email, label: 'CUSTOMER' });
      return new Response(JSON.stringify({ ok: true, customer_id: customerId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "submit_case") {
      const result = await engine.submitCase(body.input ?? body);
      if (result.next === "autonomous") {
        const finalResult = await engine.runAutonomous(result.case_id);
        return new Response(JSON.stringify({ ok: true, result: { ...result, ...finalResult } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_customers") {
      const { data } = await engine.supabase.from("rs_synthetic_customers").select("*").order("customer_id");
      return new Response(JSON.stringify({ ok: true, customers: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_knowledge") {
      const { data } = await engine.supabase.from("rs_policies").select("*").order("policy_id");
      return new Response(JSON.stringify({ ok: true, policies: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "cx_analytics") {
      const [{ data: cases }, { data: historical }] = await Promise.all([
        engine.supabase.from("rs_cases").select("case_id, customer_id, customer_name, status, reopened_count, escalation_reason, primary_intent, category"),
        engine.supabase.from("rs_historical_resolutions").select("problem_pattern, error_code"),
      ]);
      const rows = cases ?? [];
      const byCustomer = new Map<string, { customer_id: string; name: string | null; escalations: number; reopens: number; cases: number }>();
      for (const c of rows) {
        const entry = byCustomer.get(c.customer_id) ?? { customer_id: c.customer_id, name: c.customer_name, escalations: 0, reopens: 0, cases: 0 };
        entry.cases += 1;
        if (c.status === "ESCALATED") entry.escalations += 1;
        entry.reopens += c.reopened_count ?? 0;
        byCustomer.set(c.customer_id, entry);
      }
      const intents = new Map<string, number>();
      for (const c of rows) if (c.primary_intent) intents.set(c.primary_intent, (intents.get(c.primary_intent) ?? 0) + 1);
      return new Response(JSON.stringify({
        ok: true,
        result: {
          total_cases: rows.length,
          escalated: rows.filter((c) => c.status === "ESCALATED").length,
          reopened: rows.filter((c) => (c.reopened_count ?? 0) > 0).length,
          recurring_issues: Array.from(intents.entries()).map(([intent, count]) => ({ intent, count })).sort((a, b) => b.count - a.count),
          friction_customers: Array.from(byCustomer.values()).filter((c) => c.escalations + c.reopens >= 1),
          historical_pattern_count: (historical ?? []).length,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_events") {
      const { data } = await engine.supabase.from("rs_case_events").select("*").order("created_at", { ascending: false }).limit(50);
      return new Response(JSON.stringify({ ok: true, events: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_approvals") {
      const { data } = await engine.supabase.from("rs_approvals").select("*").order("requested_at", { ascending: false });
      return new Response(JSON.stringify({ ok: true, approvals: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_cases") {
      const { data } = await engine.supabase.from("rs_cases").select("case_id, customer_id, customer_name, status, urgency, sentiment, raw_complaint, updated_at, escalation_reason, risk_level, assigned_agent, category, primary_intent").order("created_at", { ascending: true });
      const { data: people } = await engine.supabase.from("rs_synthetic_customers").select("customer_id, name, email");
      const byId = new Map((people ?? []).map((p) => [p.customer_id, p]));
      const merged = (data ?? []).map((c) => ({ ...c, customer_name: c.customer_name ?? byId.get(c.customer_id)?.name ?? null }));
      return new Response(JSON.stringify({ ok: true, cases: merged }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "get_case") {
      const [c, events, evidence, decisions, actions, verifications, approvals, passport, twin] = await Promise.all([
        engine.supabase.from("rs_cases").select("*").eq("case_id", case_id).maybeSingle(),
        engine.supabase.from("rs_case_events").select("*").eq("case_id", case_id).order("created_at", { ascending: true }),
        engine.supabase.from("rs_evidence_ledger").select("*").eq("case_id", case_id).order("created_at", { ascending: true }),
        engine.supabase.from("rs_decisions").select("*").eq("case_id", case_id).order("created_at", { ascending: true }),
        engine.supabase.from("rs_actions").select("*").eq("case_id", case_id).order("created_at", { ascending: true }),
        engine.supabase.from("rs_verifications").select("*").eq("case_id", case_id).order("verified_at", { ascending: true }),
        engine.supabase.from("rs_approvals").select("*").eq("case_id", case_id).order("requested_at", { ascending: true }),
        engine.supabase.from("rs_resolution_passports").select("*").eq("case_id", case_id).maybeSingle(),
        engine.supabase.from("rs_case_twins").select("*").eq("case_id", case_id).maybeSingle(),
      ]);
      let caseData = c.data;
      if (caseData && (!caseData.customer_name || !caseData.customer_email)) {
        const { data: person } = await engine.supabase.from("rs_synthetic_customers").select("name, email").eq("customer_id", caseData.customer_id).maybeSingle();
        caseData = { ...caseData, customer_name: caseData.customer_name ?? person?.name ?? null, customer_email: caseData.customer_email ?? person?.email ?? null };
      }
      return new Response(JSON.stringify({ ok: true, case: caseData, events: events.data, evidence: evidence.data, decisions: decisions.data, actions: actions.data, verifications: verifications.data, approvals: approvals.data, passport: passport.data, twin: twin.data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "run_autonomous") {
      const result = await engine.runAutonomous(case_id || "CASE-1001");
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "run_evidence_gap") {
      const result = await engine.runEvidenceGap(case_id || "CASE-1002");
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "run_contradiction") {
      const result = await engine.runContradiction(case_id || "CASE-1003");
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "run_radar") {
      const result = await engine.runRadar();
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "reset_demo") {
      const result = await engine.resetDemo();
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "get_customer_cases") {
      const { customer_id } = body;
      if (!customer_id) return new Response(JSON.stringify({ ok: false, error: "customer_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data } = await engine.supabase.from("rs_cases").select("case_id, status, primary_intent, raw_complaint, customer_response, updated_at").eq("customer_id", customer_id).order("created_at", { ascending: false });
      return new Response(JSON.stringify({ ok: true, cases: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "answer_question") {
      const { customer_id, answer } = body;
      if (!customer_id || !answer) return new Response(JSON.stringify({ ok: false, error: "customer_id and answer required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: caseData } = await engine.supabase.from("rs_cases").select("case_id, status").eq("customer_id", customer_id).eq("status", "EVIDENCE_GAP").maybeSingle();
      if (!caseData) return new Response(JSON.stringify({ ok: false, error: "No open case awaiting customer answer" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const now = new Date().toISOString();
      const evAns = `EV-${crypto.randomUUID().slice(0, 8)}`;
      await engine.supabase.from("rs_evidence_ledger").insert({ evidence_id: evAns, case_id: caseData.case_id, source_system: "Customer", source_record_id: caseData.case_id, source_type: "CUSTOMER_STATEMENT", field_name: "customer_answer", value: answer, authority_level: "CUSTOMER_STATEMENT", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "customer_chat", relevance: "Customer response to evidence gap question", status: "ACTIVE" });
      await engine.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseData.case_id, event_type: "ANSWER_RECEIVED", payload: { evidence_id: evAns, answer } });
      return new Response(JSON.stringify({ ok: true, result: { case_id: caseData.case_id, status: "INVESTIGATING" } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "approve_action") {
      const { approval_id } = body;
      if (!approval_id) return new Response(JSON.stringify({ ok: false, error: "approval_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: approval } = await engine.supabase.from("rs_approvals").select("*").eq("approval_id", approval_id).maybeSingle();
      if (!approval) return new Response(JSON.stringify({ ok: false, error: "Approval not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (approval.approval_status !== "PENDING") return new Response(JSON.stringify({ ok: false, error: `Approval already ${approval.approval_status}` }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await engine.supabase.from("rs_approvals").update({ approval_status: "GRANTED", approved_by: "admin", approved_at: new Date().toISOString() }).eq("approval_id", approval_id);
      await engine.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: approval.case_id, event_type: "APPROVAL_GRANTED", payload: { approval_id } });
      return new Response(JSON.stringify({ ok: true, result: { approval_id, status: "GRANTED" } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "reject_action") {
      const { approval_id, reason } = body;
      if (!approval_id) return new Response(JSON.stringify({ ok: false, error: "approval_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: approval } = await engine.supabase.from("rs_approvals").select("*").eq("approval_id", approval_id).maybeSingle();
      if (!approval) return new Response(JSON.stringify({ ok: false, error: "Approval not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (approval.approval_status !== "PENDING") return new Response(JSON.stringify({ ok: false, error: `Approval already ${approval.approval_status}` }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await engine.supabase.from("rs_approvals").update({ approval_status: "REJECTED", approved_by: "admin", approved_at: new Date().toISOString() }).eq("approval_id", approval_id);
      await engine.supabase.from("rs_cases").update({ status: "ESCALATED", escalation_reason: reason ?? "APPROVAL_REJECTED" }).eq("case_id", approval.case_id);
      await engine.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: approval.case_id, event_type: "APPROVAL_REJECTED", payload: { approval_id, reason } });
      return new Response(JSON.stringify({ ok: true, result: { approval_id, status: "REJECTED" } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false, error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
