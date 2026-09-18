import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QWEN_MODEL = "alibaba/qwen-3.8-max";

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

class Engine {
  supabase;
  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async transition(caseId: string, current: string, target: string, eventType: string, payload: Record<string, unknown> = {}) {
    if (!ALLOWED[current]?.includes(target)) throw new Error(`illegal transition ${current} -> ${target}`);
    await this.supabase.from("rs_cases").update({ status: target, updated_at: new Date().toISOString() }).eq("case_id", caseId);
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: eventType, payload });
    return target;
  }

  async getCaseStatus(caseId: string) {
    const { data } = await this.supabase.from("rs_cases").select("status").eq("case_id", caseId).maybeSingle();
    return data?.status ?? "NEW";
  }

  async insertEvidence(row: Record<string, unknown>) {
    await this.supabase.from("rs_evidence_ledger").insert(row);
  }

  async runAutonomous(caseId: string) {
    let status = await this.getCaseStatus(caseId);
    status = await this.transition(caseId, status, "ROUTED", "INTENT_CLASSIFIED");
    status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    const { data: caseRow } = await this.supabase.from("rs_cases").select("*").eq("case_id", caseId).single();
    const twin = {
      case_id: caseId,
      customer_ref: `[REDACTED:${caseRow.customer_id}]`,
      primary_intent: "missing_order_after_payment",
      domain: ["billing", "order"],
      urgency: caseRow.urgency,
      sla_state: "WITHIN_SLA",
      context: { relevant_orders: ["ORD-5001"], relevant_payments: ["PAY-7001"] },
    };
    await this.supabase.from("rs_case_twins").upsert({ case_id: caseId, twin });
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");

    const now = new Date().toISOString();
    const { data: payment } = await this.supabase.from("rs_synthetic_payments").select("*").eq("payment_id", "PAY-7001").single();
    const { data: order } = await this.supabase.from("rs_synthetic_orders").select("*").eq("order_id", "ORD-5001").single();
    const evPay = `EV-${crypto.randomUUID().slice(0, 8)}`;
    const evOrd = `EV-${crypto.randomUUID().slice(0, 8)}`;
    await this.insertEvidence({ evidence_id: evPay, case_id: caseId, source_system: "Synthetic_Payment_DB", source_record_id: payment.payment_id, source_type: "TRANSACTIONAL", field_name: "payment_status", value: JSON.stringify(payment.status), authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_payment", relevance: "payment status for refund evidence", status: "ACTIVE" });
    await this.insertEvidence({ evidence_id: evOrd, case_id: caseId, source_system: "Synthetic_Order_DB", source_record_id: order.order_id, source_type: "TRANSACTIONAL", field_name: "order_status", value: JSON.stringify(order.status), authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_order", relevance: "order status for refund evidence", status: "ACTIVE" });
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "EVIDENCE_RETRIEVED", payload: { evidence_ids: [evPay, evOrd] } });

    const evidenceRows = [
      { field_name: "payment_status", value: payment.status, authority_level: "AUTHORITATIVE", status: "ACTIVE", observed_at: now, source_type: "TRANSACTIONAL" },
      { field_name: "order_status", value: order.status, authority_level: "AUTHORITATIVE", status: "ACTIVE", observed_at: now, source_type: "TRANSACTIONAL" },
    ];
    const { result: sufficient, gaps } = sufficiencyOf(evidenceRows);
    status = await this.transition(caseId, status, "EVIDENCE_READY", "RESOLUTION_PROPOSED", { sufficiency: sufficient, gaps });

    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_70c32d0a6eb2");
    let contract: z.infer<typeof ContractSchema> | null = null;
    let qwenUsed = false;
    let qwenError = "";
    if (AI_API_TOKEN) {
      for (let attempt = 0; attempt < 2 && !contract; attempt++) {
        try {
          const response = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${AI_API_TOKEN}`, "Content-Type": "application/json", "X-Session-ID": crypto.randomUUID(), "X-Enter-Project-ID": "70c32d0a6eb24783a12e5edabe9d40c7" },
            body: JSON.stringify({
              model: QWEN_MODEL,
              stream: false,
              temperature: 0,
              messages: [
                { role: "system", content: 'You are SK-04 Resolution Proposal for ResolveSphere AI. You reason and propose only; you have no write authority. Return ONLY strict JSON, no prose, no markdown fences, matching: {"case_id":string,"problem":string,"evidence_ids":string[],"proposed_action":{"type":"REFUND_PAYMENT"|"REQUEST_CUSTOMER_INFO"|"ESCALATE_CASE","target_id":string,"amount":number,"currency":string},"policy_reference":string,"risk_level":"LOW"|"MEDIUM"|"HIGH","authorization_required":boolean,"expected_state":{"entity":string,"target_id":string,"status":string},"verification_target":string,"escalation_required":boolean,"customer_message_intent":string}. Use only the given evidence_ids.' },
                { role: "user", content: `Case Twin: ${JSON.stringify(twin)}\nEvidence: payment ${payment.payment_id} status ${payment.status} amount ${payment.amount} ${payment.currency}; order ${order.order_id} status ${order.status}. evidence_ids: ["${evPay}","${evOrd}"]. Policy candidate POL-001.` },
              ],
            }),
          });
          if (!response.ok) throw new Error(`status ${response.status}`);
          const data = await response.json();
          const raw = (data.choices?.[0]?.message?.content ?? "").trim().replace(/^```json\s*|```$/g, "");
          contract = ContractSchema.parse(JSON.parse(raw));
          qwenUsed = true;
        } catch (err) {
          qwenError = err instanceof Error ? err.message : String(err);
        }
      }
    }
    if (!contract) {
      contract = ContractSchema.parse({
        case_id: caseId, problem: "payment_success_order_missing", evidence_ids: [evPay, evOrd],
        proposed_action: { type: "REFUND_PAYMENT", target_id: payment.payment_id, amount: Number(payment.amount), currency: payment.currency },
        policy_reference: "POL-001", risk_level: "LOW", authorization_required: false,
        expected_state: { entity: "refund", target_id: payment.payment_id, status: "SUCCESS" },
        verification_target: "rs_synthetic_refunds", escalation_required: false, customer_message_intent: "refund_verified",
      });
    }

    const hash = await contractHash(contract);
    status = await this.transition(caseId, status, "DECISION_READY", "RESOLUTION_PROPOSED", { contract_hash: hash, qwen_used: qwenUsed, qwen_error: qwenError || undefined });

    const { score, level } = riskOf(contract.proposed_action.amount, gaps, caseRow.urgency, caseRow.reopened_count ?? 0);
    const authState = authorize(contract.policy_reference, score, sufficient);
    const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;
    await this.supabase.from("rs_decisions").insert({ decision_id: decisionId, case_id: caseId, contract_hash: hash, contract_version: "1.0", evidence_ids: [evPay, evOrd], policy_id: contract.policy_reference, policy_version: "1.0", risk_score: score, risk_factors: { gaps }, auth_state: authState, decision: authState, reason_codes: gaps.length ? gaps : ["EVIDENCE_SUFFICIENT"] });
    await this.supabase.from("rs_case_events").insert([
      { event_id: crypto.randomUUID(), case_id: caseId, event_type: "POLICY_CHECKED", payload: { policy: contract.policy_reference } },
      { event_id: crypto.randomUUID(), case_id: caseId, event_type: "RISK_ASSESSED", payload: { score, level } },
    ]);

    if (authState !== "AUTO_ALLOWED") {
      if (authState === "HUMAN_APPROVAL_REQUIRED") {
        status = await this.transition(caseId, status, "APPROVAL_REQUIRED", "APPROVAL_REQUESTED", { decision_id: decisionId });
        await this.supabase.from("rs_approvals").insert({ approval_id: `APR-${crypto.randomUUID().slice(0, 8)}`, decision_id: decisionId, case_id: caseId, contract_hash: hash, action_type: contract.proposed_action.type, target_id: contract.proposed_action.target_id, amount: contract.proposed_action.amount, policy_version: "1.0", risk_score: score, approval_status: "PENDING" });
      } else {
        status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: authState });
        await this.supabase.from("rs_cases").update({ escalation_reason: authState }).eq("case_id", caseId);
      }
      return { case_id: caseId, status, decision: authState, contract_hash: hash, qwen_used: qwenUsed };
    }

    status = await this.transition(caseId, status, "ACTION_EXECUTING", "ACTION_AUTHORIZED", { decision_id: decisionId });
    const idempotencyKey = idKey(caseId, contract.proposed_action.type, contract.proposed_action.target_id);
    const { data: existingIdem } = await this.supabase.from("rs_idempotency_ledger").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
    let actionId: string;
    let refundRow: Record<string, unknown>;
    if (existingIdem && existingIdem.status === "COMPLETED") {
      actionId = existingIdem.action_id;
      refundRow = existingIdem.result_payload as Record<string, unknown>;
    } else {
      actionId = `ACT-${crypto.randomUUID().slice(0, 8)}`;
      await this.supabase.from("rs_idempotency_ledger").upsert({ idempotency_key: idempotencyKey, case_id: caseId, action_type: contract.proposed_action.type, target_id: contract.proposed_action.target_id, contract_hash: hash, status: "PENDING", action_id: actionId });
      await this.supabase.from("rs_actions").insert({ action_id: actionId, case_id: caseId, contract_hash: hash, decision_id: decisionId, action_type: contract.proposed_action.type, target_id: contract.proposed_action.target_id, amount: contract.proposed_action.amount, currency: contract.proposed_action.currency, idempotency_key: idempotencyKey, status: "STARTED", simulated: true });
      await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "ACTION_STARTED", payload: { action_id: actionId } });
      const refundId = `REF-${caseId}`;
      const refundPayload = { refund_id: refundId, payment_id: payment.payment_id, amount: contract.proposed_action.amount, currency: contract.proposed_action.currency, status: "SUCCESS", label: "SIMULATED" };
      await this.supabase.from("rs_synthetic_refunds").upsert(refundPayload);
      refundRow = refundPayload;
      await this.supabase.from("rs_actions").update({ status: "COMPLETED", response_payload: refundPayload, completed_at: new Date().toISOString() }).eq("action_id", actionId);
      await this.supabase.from("rs_idempotency_ledger").update({ status: "COMPLETED", result_payload: refundPayload, updated_at: new Date().toISOString() }).eq("idempotency_key", idempotencyKey);
      await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: "ACTION_COMPLETED", payload: { action_id: actionId, simulated: true } });
    }

    status = await this.transition(caseId, status, "VERIFYING", "VERIFICATION_STARTED", { action_id: actionId });
    const { data: authoritativeRefund } = await this.supabase.from("rs_synthetic_refunds").select("*").eq("payment_id", payment.payment_id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    const observed = authoritativeRefund ?? refundRow;
    const canonicalPostconditionStatus: Record<string, string> = { REFUND_PAYMENT: "SUCCESS" };
    const requiredStatus = canonicalPostconditionStatus[contract.proposed_action.type] ?? contract.expected_state.status;
    const predicateResults = {
      status: observed.status === requiredStatus,
      amount: Number(observed.amount) === Number(contract.proposed_action.amount),
      payment_id: observed.payment_id === contract.proposed_action.target_id,
    };
    const verified = Object.values(predicateResults).every(Boolean);
    const verificationId = `VER-${crypto.randomUUID().slice(0, 8)}`;
    await this.supabase.from("rs_verifications").insert({ verification_id: verificationId, action_id: actionId, case_id: caseId, authoritative_source: "rs_synthetic_refunds", evidence_ids: [evPay, evOrd], expected_postconditions: ["status==SUCCESS", "amount==contract.amount", "payment_id==contract.target"], observed_state: observed, predicate_results: predicateResults, result: verified ? "VERIFIED" : "FAILED" });
    await this.supabase.from("rs_case_events").insert({ event_id: crypto.randomUUID(), case_id: caseId, event_type: verified ? "VERIFICATION_SUCCESS" : "VERIFICATION_FAILED", payload: { verification_id: verificationId } });

    if (verified) {
      status = await this.transition(caseId, status, "RESOLVED", "CASE_RESOLVED", { verification_id: verificationId });
      await this.supabase.from("rs_resolution_passports").insert({ passport_id: `PASS-${crypto.randomUUID().slice(0, 8)}`, case_id: caseId, reported_problem: caseRow.raw_complaint, actual_problem: contract.problem, evidence_ids: [evPay, evOrd], decision_id: decisionId, policy_id: contract.policy_reference, risk_level: level, action_id: actionId, action_result: refundRow, verification_id: verificationId, final_state: "RESOLVED" });
    } else {
      const reopenedCount = (caseRow.reopened_count ?? 0) + 1;
      if (reopenedCount >= 2) {
        status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { reason: "VERIFICATION_FAILED_TWICE" });
      } else {
        status = await this.transition(caseId, status, "REOPENED", "CASE_REOPENED", { verification_id: verificationId });
      }
      await this.supabase.from("rs_cases").update({ reopened_count: reopenedCount }).eq("case_id", caseId);
    }

    return { case_id: caseId, status, decision: authState, contract_hash: hash, verification: verified ? "VERIFIED" : "FAILED", qwen_used: qwenUsed };
  }

  async runEvidenceGap(caseId: string) {
    let status = await this.getCaseStatus(caseId);
    status = await this.transition(caseId, status, "ROUTED", "INTENT_CLASSIFIED");
    status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");

    const now = new Date().toISOString();
    const { data: refund } = await this.supabase.from("rs_synthetic_refunds").select("*").eq("refund_id", "REF-9002").single();
    const evRef = `EV-${crypto.randomUUID().slice(0, 8)}`;
    await this.insertEvidence({ evidence_id: evRef, case_id: caseId, source_system: "Synthetic_Refund_DB", source_record_id: refund.refund_id, source_type: "TRANSACTIONAL", field_name: "refund_status", value: JSON.stringify(refund.status), authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_refund", relevance: "refund confirmation status", status: "ACTIVE" });

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
    await this.supabase.from("rs_cases").update({ escalation_reason: "CUSTOMER_STATEMENT_INSUFFICIENT" }).eq("case_id", caseId);
    return { case_id: caseId, status, decision: authState };
  }

  async runContradiction(caseId: string) {
    let status = await this.getCaseStatus(caseId);
    status = await this.transition(caseId, status, "ROUTED", "INTENT_CLASSIFIED");
    status = await this.transition(caseId, status, "CONTEXT_BUILT", "CONTEXT_RECONSTRUCTED");
    status = await this.transition(caseId, status, "INVESTIGATING", "INVESTIGATION_STARTED");

    const now = new Date().toISOString();
    const { data: refund } = await this.supabase.from("rs_synthetic_refunds").select("*").eq("refund_id", "REF-9003").single();
    const evPayment = `EV-${crypto.randomUUID().slice(0, 8)}`;
    const evSupport = `EV-${crypto.randomUUID().slice(0, 8)}`;
    await this.insertEvidence({ evidence_id: evPayment, case_id: caseId, source_system: "Synthetic_Payment_DB", source_record_id: refund.refund_id, source_type: "TRANSACTIONAL", field_name: "refund_status", value: JSON.stringify(refund.status), authority_level: "AUTHORITATIVE", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_refund", relevance: "payment system refund status", status: "CONTRADICTED" });
    await this.insertEvidence({ evidence_id: evSupport, case_id: caseId, source_system: "Synthetic_Support_DB", source_record_id: refund.refund_id, source_type: "SUPPORT", field_name: "refund_status", value: JSON.stringify(refund.support_status), authority_level: "SECONDARY", observed_at: now, retrieved_at: now, freshness_status: "FRESH", retrieval_method: "get_ticket", relevance: "support system refund status", status: "CONTRADICTED" });

    status = await this.transition(caseId, status, "CONTRADICTION", "CONTRADICTION_DETECTED", { source_a: { system: "Synthetic_Payment_DB", value: refund.status }, source_b: { system: "Synthetic_Support_DB", value: refund.support_status } });

    const gaps = ["CONTRADICTION_DETECTED"];
    const { score, level } = riskOf(Number(refund.amount), gaps, "HIGH", 0);
    const authState = authorize("POL-004", score, "BLOCKED");
    const decisionId = `DEC-${crypto.randomUUID().slice(0, 8)}`;
    await this.supabase.from("rs_decisions").insert({ decision_id: decisionId, case_id: caseId, contract_hash: "n/a", contract_version: "1.0", evidence_ids: [evPayment, evSupport], policy_id: "POL-004", policy_version: "1.0", risk_score: score, risk_factors: { gaps, level }, auth_state: authState, decision: authState, reason_codes: gaps });
    status = await this.transition(caseId, status, "ESCALATED", "ESCALATED_TO_HUMAN", { decision_id: decisionId, reason: "MATERIAL_CONTRADICTION" });
    await this.supabase.from("rs_cases").update({ escalation_reason: "MATERIAL_CONTRADICTION", risk_level: level }).eq("case_id", caseId);
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
    for (const table of ["rs_resolution_passports", "rs_verifications", "rs_approvals", "rs_actions", "rs_idempotency_ledger", "rs_decisions", "rs_evidence_ledger", "rs_case_events", "rs_case_twins"]) {
      await this.supabase.from(table).delete().in("case_id", caseIds);
    }
    await this.supabase.from("rs_synthetic_refunds").delete().like("refund_id", "REF-CASE-%");
    await this.supabase.from("rs_cases").update({ status: "NEW", reopened_count: 0, escalation_reason: null, risk_level: null, authorization_state: null, action_status: null, verification_status: null, final_state: null }).in("case_id", caseIds);
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
    const { action, case_id } = await req.json();

    if (action === "list_events") {
      const { data } = await engine.supabase.from("rs_case_events").select("*").order("created_at", { ascending: false }).limit(50);
      return new Response(JSON.stringify({ ok: true, events: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_approvals") {
      const { data } = await engine.supabase.from("rs_approvals").select("*").order("requested_at", { ascending: false });
      return new Response(JSON.stringify({ ok: true, approvals: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "list_cases") {
      const { data } = await engine.supabase.from("rs_cases").select("case_id, status, urgency, sentiment, raw_complaint, updated_at, escalation_reason, risk_level").order("created_at", { ascending: true });
      return new Response(JSON.stringify({ ok: true, cases: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ ok: true, case: c.data, events: events.data, evidence: evidence.data, decisions: decisions.data, actions: actions.data, verifications: verifications.data, approvals: approvals.data, passport: passport.data, twin: twin.data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    return new Response(JSON.stringify({ ok: false, error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
