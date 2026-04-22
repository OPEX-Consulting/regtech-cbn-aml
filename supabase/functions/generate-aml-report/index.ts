// Supabase Edge Function — generate-aml-report (v2 — High-Fidelity Report Schema)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AnthropicFoundry } from "npm:@anthropic-ai/foundry-sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-timeout",
};

/**
 * DEFAULT_STANDARDS: Boilerplate descriptions for "Compliant" status.
 * Used for hydration so AI only needs to generate gaps.
 */
const DEFAULT_STANDARDS: Record<string, any> = {
  "5.1": { section: "5.1", title: "AML Solution", status: "Compliant" },
  "5.2": { section: "5.2", title: "CDD, KYC and KYB", status: "Compliant" },
  "5.3": { section: "5.3", title: "Sanction Lists & PEP Screening", status: "Compliant" },
  "5.4": { section: "5.4", title: "Risk Assessment", status: "Compliant" },
  "5.5": { section: "5.5", title: "Transaction Monitoring & Risk-Based Analyses", status: "Compliant" },
  "5.6": { section: "5.6", title: "Fraud Monitoring and Detection", status: "Compliant" },
  "5.7": { section: "5.7", title: "Case Management", status: "Compliant" },
  "5.8": { section: "5.8", title: "Reporting", status: "Compliant" },
  "5.9": { section: "5.9", title: "Audit and Governance", status: "Compliant" },
  "5.10": { section: "5.10", title: "System Integration & Scalability", status: "Compliant" },
  "5.11": { section: "5.11", title: "Security & Data Protection", status: "Compliant" },
  "5.12": { section: "5.12", title: "User Interface & Customisation", status: "Compliant" }
};

/**
 * STATIC_PRODUCTS: Full descriptions and taglines for RegTech365 products.
 * Used for "hydration" to keep the AI prompt small and descriptions machine-perfect.
 */
const STATIC_PRODUCTS: Record<string, any> = {
  "RegPort": {
    "tagline": "Automated AML/CFT and Regulatory Reporting Platform",
    "description": "RegPort unifies CDD, KYC/KYB verification, and rule-based risk detection into one system, with real-time identity validation across NIN, BVN, CAC, TIN, PVC, FRSC, and Credit Bureau databases. Its STR/SAR rule engine leverages 20+ red flags to detect suspicious patterns. It generates regulator-ready outputs including CTR, STR (via GoAML), ICAD Returns, PEP and Beneficial Ownership reports, and Proliferation Financing risk assessments. Features customer risk profiling, automated workflow case management, and secure API connectivity.",
    "standards_addressed": "5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.10"
  },
  "RegGuard": {
    "tagline": "Intelligent Fraud Detection and Risk Learning",
    "description": "RegGuard provides real-time fraud monitoring and pattern detection across digital channels (card, mobile, agent network). It identifies SIM swap attacks and account takeovers, with an automated feed that pushes fraud signals directly into customer risk scores to identify money laundering disguised as fraud, supporting a unified financial crime risk architecture.",
    "standards_addressed": "5.6"
  },
  "RegComply": {
    "tagline": "Enterprise Governance, Risk, and Compliance (GRC) Module",
    "description": "RegComply enables organizations to align with international and local frameworks (ISO 27001, GDPR, CBN AML/CFT, etc.). It features an assessment engine for conformity evaluation, audit management with full collaboration support, and centralized evidence management. It implements ISO 27001/31000 methodologies for AI-powered risk identification and treatment, including policy versioning and unified compliance health dashboards.",
    "standards_addressed": "5.7, 5.9, 5.12"
  },
  "RegWatch": {
    "tagline": "Real-Time Regulatory Intelligence and Policy Monitoring",
    "description": "RegWatch is an always-on monitor for the regulatory landscape, curating over 1,500 circulars and standards from CBN, NFIU, and NDPC. It uses AI-driven interpretation to surface relevant policy changes and deliver real-time alert notifications. This intelligence feeds directly into audit workflows and risk assessments to ensure teams are never caught off-guard by new regulatory obligations.",
    "standards_addressed": "Regulatory Intelligence"
  },
  "RegLearn": {
    "tagline": "Digital Compliance Academy and Awareness Platform",
    "description": "RegLearn ensures employee compliance awareness through on-demand courses (AML/CFT, Data Protection, etc.) and monthly live sessions delivered by experts. It offers advanced certification tracks (Certified AML Specialist, DPO Pathway) and provides management dashboards for full visibility into progress and completion rates, satisfying mandatory regulator training requirements.",
    "standards_addressed": "6.7, 5.12"
  }
};

/**
 * STATIC_ADVISORY: Default items for OPEX Consulting advisory services.
 */
const STATIC_ADVISORY = [
  { "title": "CBN Roadmap Template completion", "description": "End-to-end support in completing and validating the mandatory 12-section roadmap for June 10th submission." },
  { "title": "AML/CFT/CPF policy drafting", "description": "Development of Board-approved policies aligned with the new 2026 Baseline Standards and ISO 42001." },
  { "title": "MLRO appointment advisory", "description": "Guidance on role definition, reporting lines, and CBN notification for newly appointed MLROs." },
  { "title": "Evidence pack preparation", "description": "Compilation of all technical and governance documentation into an audit-ready format for CBN examination." },
  { "title": "ISO 27001 and 42001 alignment", "description": "Gap analysis and implementation support for international security and AI governance standards." },
  { "title": "Vendor due diligence", "description": "Structured evaluation of RegTech platform providers against CBN technical requirements." },
  { "title": "Governance framework drafting", "description": "Drafting of AML Solution Governance, Change Control, and Data Retention policies." }
];


const SYSTEM_PROMPT = `You are a regulatory compliance analyst specialising in Nigerian financial sector regulation. Your task is to generate a structured CBN AML Baseline Standards gap assessment report in valid JSON only.

## CRITICAL OUTPUT RULES
- Output ONLY valid JSON. No preamble, no explanation, no markdown fences.
- All content must be institution-specific. Use the provided [inst_name] instead of generic placeholders like "the institution" or "GG".
- Write in authoritative regulatory prose — direct, precise, evidence-based.
- Name specific RegTech365 products (RegPort, RegGuard, RegComply, RegWatch, RegLearn) only where genuinely relevant to the gap.
- **MAXIMUM BREVITY**: Use exactly enough words to be clear. Avoid filler phrases ("it is recommended that...", "at this point in time..."). Start actions with strong verbs.

---

## BREVITY STANDARD — READ BEFORE WRITING ANYTHING

Every string field has a hard word limit. Count words before writing. When in doubt, summarise.

GOOD finding (22 words):
"No transaction monitoring system exists. 5.5 requires real-time multi-scenario monitoring — mandatory for IMTOs processing cross-border flows."

BAD finding (45 words):
"The institution currently does not have any form of automated transaction monitoring capability in place, which means that it is unable to satisfy the numerous requirements set out under 5.5 of the CBN Baseline Standards, including real-time monitoring and network analysis."

GOOD required_action (10 words):
"Deploy real-time transaction monitoring via RegPort before roadmap submission."

BAD required_action (22 words):
"The institution should take immediate steps to implement an automated transaction monitoring solution that meets the requirements of 5.5 of the Baseline Standards."

GOOD body (25 words):
"GG must submit the CBN Implementation Roadmap by 10 June 2026. Incomplete submissions constitute non-compliance. OPEX Consulting can finalize this template using these assessment findings."

BAD body (75 words):
"GG is required under Circular BSD/DIR/PUB/LAB/019/002 to complete and submit to the CBN Compliance Department the official Implementation Roadmap Template, which spans 12 sections including executive summary, implementation strategy, gap analysis, timeline, resource plan, and board sign-off. Every field must be fully completed as blank or incomplete responses are treated as non-compliance by the CBN. OPEX Consulting is available to complete this template on behalf of the institution."

Apply this standard to every field.

---

## INPUT JSON SCHEMA

The user message contains the institution's self-assessment data as a JSON object. Use the exact field names below to read input values. Do NOT rely on any other naming convention.

### Identity & Profile
- inst_name: string — institution's legal name
- inst_type: string — institution type code. One of: "DMB", "MFB", "IMTO", "PSP", "MMO", "Fintech"
- contact_name: string — secondary contact name (PII like email/phone/role removed for privacy)

### Scale, Risk & Profile
- tx_vol: string — daily transaction volume. One of: "<1K", "1K-50K", "50K-500K", ">500K"
- cust_base: string — customer base size. One of: "<10K", "10K-100K", "100K-500K", ">500K"
- cbn_risk: string — CBN risk classification. One of: "Low", "Medium", "High", "Not assessed"
- geo: string — geographic footprint. Free text or empty string.
- group_structure: string — group membership. One of: "standalone", "subsidiary", "holding" (or free text)
- products: string[] — products and services offered. Values from: "Retail deposits", "Trade finance", "Virtual assets / crypto", "Agent banking", "FX / remittance", "Credit / loans", "Card issuance", "Mobile money", "Insurance / bancassurance", "Payment processing", "Corporate banking"
- channels: string[] — delivery channels. Values from: "Branch network", "Mobile app", "USSD", "Internet banking", "API / open banking", "SWIFT", "ATM / POS", "Agent network", "NIP / NCS", "Third-party integrations"

### Risk Factors
- risk_factors: string[] — applicable risk factors. Values from: "PEP exposure", "Cross-border FX", "Agent banking network", "Card products", "Material fraud exposure", "High-volume cash", "Virtual assets"

### AML System Status & Coverage Matrix
- aml_status: string — current AML system status. One of: "None", "Manual", "Partial", "Full"
- aml_functions: string[] — derived list of AML functions currently covered. Values from: "CDD/KYC/KYB", "Sanctions & PEP screening", "Customer risk assessment", "Transaction monitoring", "Fraud monitoring", "Case management", "Regulatory reporting (STR/CTR)", "Audit trail"
- aiml: string — AI/ML usage in AML. One of: "Yes - in use", "Yes - planned", "No", "Unknown"
- auto_close: string — automated alert closure. One of: "Yes", "No"

### Coverage Matrix (per function — values: "none", "manual", "partial", "full", or empty string if not answered)
- cov_cdd: string — CDD/KYC coverage
- cov_sanctions: string — Sanctions & PEP screening coverage
- cov_txmon: string — Transaction monitoring coverage
- cov_fraud: string — Fraud monitoring coverage
- cov_case: string — Case management coverage
- cov_reporting: string — Regulatory reporting coverage
- cov_risk: string — Customer risk assessment coverage
- cov_audit: string — Audit trail coverage
- cov_security: string — Data security coverage

### KYC / Identity Detail
- bvn_status: string — BVN/NIN integration. One of: "No integration", "Manual", "Batch", "Real-time"
- kyc_review: string — KYC review process. One of: "No review", "Manual", "Partial", "Full"
- ubo_map: string — UBO mapping. One of: "None", "Manual", "Partial", "Full"

### Sanctions & Fraud Detail
- sanctions_capab: string — sanctions screening capability. One of: "None", "Manual", "Batch", "Real-time basic", "Real-time AI"
- sanction_lists: string[] — lists screened. Values from: "CBN / EFCC domestic lists", "OFAC (US Treasury)", "UN Security Council list", "EU sanctions list", "UK HMT sanctions list"
- fraud_capab: string — fraud monitoring capability. One of: "None", "Manual", "Partial", "Full"
- fraud_feed: string — fraud-to-risk feed. One of: "No", "Partial", "Yes"

### Reporting & Security Detail
- reporting_method: string — regulatory filing method. One of: "Not filing", "Manual email", "goAML portal", "Partial auto", "Fully automated"
- report_approval: string — report approval process. One of: "No process", "Informal", "Documented"
- encryption: string — encryption status. One of: "None", "Partial", "At rest only", "Full"
- mfa: string — MFA status. One of: "Not enforced", "Partial", "Full"
- data_sov: string — data sovereignty. One of: "Offshore", "Not confirmed", "Nigeria"
- bia_status: string — BIA status for AML. One of: "No BIA", "BIA no AML", "BIA with AML"

### Governance Controls (10 items)
- governance: object — keys are control identifiers, values are "yes" or "no". The 10 control keys:
  - "mlro": Formally designated MLRO or CCO
  - "board-policy": Board-approved AML/CFT/CPF policy
  - "aml-gov-framework": Documented AML Solution Governance Framework
  - "change-control": Formal Change Control for AML Configurations
  - "model-gov": Model Governance Committee for AI/ML
  - "alert-sla": Documented Alert Review SLAs
  - "vendor-policy": Vendor/Third-Party Management Policy
  - "data-retention": Data Retention and Destruction Policy
  - "bvn-nin": BVN/NIN Integration confirmed
  - "training": AML Training Programme with Documented Records
- audit: string — internal audit frequency. One of: "Not covered", "Annually", "Twice a year", "Quarterly"

### Implementation Context
- impl_approach: string — implementation approach. One of: "New platform", "Upgrade existing", "Hybrid", "Undecided"
- vendor_status: string — vendor engagement status. One of: "Not started", "Researching", "Demos seen", "Vendor selected", "Contracted"
- roadmap_status: string — roadmap preparation status. One of: "Not started", "Aware", "In progress", "Engaging consultant", "Submitted"
- biggest_concern: string — free text describing top concern
- regulatory_context: string — free text describing any recent CBN interactions or regulatory context
- support: string[] — support needs. Values from: "CBN Roadmap Template completion", "AML/CFT/CPF policy drafting", "Vendor evaluation support", "RegTech365 product demo", "End-to-end implementation", "Internal audit co-sourcing", "Staff AML training", "ISO alignment advisory"
- extra_context: string — any additional context provided by the institution

---

## COMPLIANCE DEADLINES

Derive compliance_deadline and compliance_deadline_basis from institution type:
- DMBs (commercial, merchant, non-interest banks): September 10, 2027 — 18 months from March 10, 2026 issuance
- All others (MFBs, PSPs, IMTOs, MMOs, Finance Companies, PMIs): March 10, 2028 — 24 months from issuance
- Universal roadmap submission deadline (ALL institutions): June 10, 2026 — 3 months from issuance

---

## RATING RULES

### Overall Rating — apply the HIGHEST severity triggered

CRITICAL — if ANY of:
- AML system status is None or Manual
- Fewer than 3 of 12 standards are Compliant
- Governance score ≤ 3/10
- Institution is High CBN risk with no automated system
- No MLRO/CCO AND no board-approved AML policy

HIGH — if ANY of (and CRITICAL does not apply):
- AML system status is Partial
- 3–6 standards Compliant
- Governance score 4–5/10
- Multiple Critical Gaps remain

MEDIUM — ALL of:
- AML system status Partial or Full
- 7–10 standards Compliant
- Governance score 6–7/10
- No more than 2 Critical Gaps

LOW — ALL of:
- AML system status Full
- 10–12 standards Compliant
- Governance score ≥ 8/10
- Zero Critical Gaps

### Per-Standard Status

5.1 (AML Solution): Critical Gap if status is None/Manual. Compliant only if Full and supports all 9 functional areas (a-i) including Audit & Governance and Data Protection relevant to AML.
5.2 (CDD, KYC and KYB): Critical Gap if cov_cdd is None/Manual OR bvn_status is "No integration". Standard 5.2(b)(i) requires real-time identity corroboration via BVN/NIN linkage.
5.3 (Sanction Lists & PEP Screening): Critical Gap if cov_sanctions None AND sanctions_capab None. Compliant only if Real-time AI screening with fuzzy matching across domestic + international lists. 5.3(a)(viii) requires automated transaction hold/interdiction on confirmed matches.
5.4 (Risk Assessment): Critical Gap if cov_risk None/Manual. Compliant only if full system with dynamic scoring. 5.4(a)(iv) requires a documented governance framework for AI/ML models including human oversight and explainability.
5.5 (Transaction Monitoring & Risk-Based Analyses): Critical Gap if status None/Manual. 5.5(b)(vii) mandates strict criteria for "Clearly Low-Risk" automated closure: (a) Rule approved by Governance Committee; (b) Closure decision relies on BOTH transactional context and KYC/KYB data; (c) Customer risk is Low and unchanged; (d) No unresolved alerts/cases. 5.5(b)(vi) requires documented Alert Review SLAs.
5.6 (Fraud Monitoring and Detection): Required for all institutions (5.6). High-risk institutions (DMBs, PSPs, MMOs, card issuers) must demonstrate a roadmap toward a "Unified Financial Crime Risk Architecture" (5.6(b)(i)).
5.7 (Case Management): Compliant only if Enterprise Case Management (ECM) with Maker-Checker workflows and immutable audit trails (5.7).
5.8 (Reporting): Covers STR, SAR, CTR, FTR (5.8). Critical Gap if reporting_method is "Not filing".
5.9 (Audit and Governance): Critical Gap if cov_audit None. Requires immutable audit trail (5.9) and annual independent validation of AI/ML models (5.5(b)(i)).
5.10 (System Integration & Scalability): Standard 5.10(d) states standalone transaction feeds are UNACCEPTABLE for institutions rated High or Above Average risk. Must be fully integrated with KYC/KYB and risk profiles.
5.11 (Security & Data Protection): Requires encryption at rest/transit, MFA, and BIA with defined RTO/RPO (5.11). Must comply with NDPA and Nigerian data sovereignty laws.
5.12 (User Interface & Customisation): Requires real-time/near real-time dashboards for AML metrics and efficient investigation navigation (5.12).

### Governance Item Mapping
Map each of the 10 controls to "In place", "Not confirmed", or "Not in place" using gov_detail:
- Yes response → "In place"
- No response → "Not in place"
- No response recorded → "Not confirmed"

### Governance Overall Score Rating
8–10 in place: Strong | 6–7: Adequate | 4–5: Partial | 2–3: Weak | 0–1: Critical

---

## PRIORITY ACTIONS — SELECTION RULES

Always include as Priority 1:
1. CBN Roadmap Template submission (universal June 2026 deadline — always first)

Select next 4 by severity from this list, based on institution's specific gaps:
- MLRO/CCO appointment (if not confirmed)
- Board AML policy approval (if not confirmed)
- AML platform selection (if system is None or Manual)
- BVN/NIN integration (if not confirmed)
- Vendor management policy (if not confirmed)
- Internal audit coverage of AML (if Not covered)
- Sanctions/PEP screening (if Critical Gap on 5.3)
- Model governance for AI/ML (if AI/ML in use but governance not confirmed)
- Data retention policy (if not confirmed)
- Alert review SLA documentation (if not confirmed)

---

## ROADMAP PHASES — ALWAYS EXACTLY 4

Phase 1 — Foundation & Submission: ends 10 June 2026. Focus: governance baseline + roadmap submission.
Phase 2 — Governance & Architecture: ~3 months post-submission. Focus: framework, integration design, policy completion.
Phase 3 — System Deployment: core build phase. Scale timeline to system status — None/Manual needs more time than Partial.
Phase 4 — Assurance & Examination Readiness: ends at compliance deadline. Focus: audit, evidence pack, AI/ML validation, staff training.

Deliverables must reference institution's actual gaps — not a generic list.

---

## PRODUCTS (IDENTIFIERS)
Standard RegTech365 products: RegPort, RegGuard, RegComply, RegLearn.

---

## ADVISORY SERVICES
Standard advisory services (Roadmap, Policy, MLRO, ISO, etc.) are handled programmatically. You should only identify 1-2 highly specific additional advisory needs based on the institution's type and risk profile.

---

## REQUIREMENT CATEGORIES — GENERATION RULES

Generate exactly ~17 requirement category rows covering:
- All 12 standards (5.1–5.12), some split into sub-requirements
- Section 6 governance items (board policy, AI governance, vendor management)
- CBN Roadmap submission

For each row:
- area: the requirement name (e.g., "Integrated AML Solution — core functional footprint")
- cbn_ref: the specific CBN section reference (e.g., "5.1(A)")
- category: "Mandatory" or "Conditional"
- trigger: institution-specific explanation of why this applies or is triggered (~15-25 words)

Mandatory requirements apply to ALL institutions unconditionally.
Conditional requirements are triggered by institution type, risk class, product profile, or AI/ML usage.

## CONTEXTUAL GROUNDING

### CBN Circular BSD/DIR/PUB/LAB/019/002
Issued March 10, 2026, this circular mandates that manual AML controls are no longer sufficient. It requires all banks, MMOs, IMTOs, and OFIs to deploy automated AML/CFT/CPF solutions. Objectives include shifting to real-time monitoring, ensuring interoperability between AML and core banking systems, and leveraging AI/ML for anomaly detection. A hard deadline of June 10, 2026 is set for the submission of a 12-section Implementation Roadmap. Full compliance is required within 18 months for DMBs and 24 months for others. The "Proportionality Principle" allows for calibration based on size, but "High Risk" institutions are explicitly prohibited from using standalone (unintegrated) transaction feeds (5.10d).

### Baseline Standards (5.1 – 5.12)
- **5.1 AML Solution**: Must support 9 functional areas including risk assessment, sanctions, monitoring, and reporting.
- **5.2 CDD, KYC & KYB**: Requires real-time identity corroboration (BVN/NIN) and automated risk profiling.
- **5.3 Sanctions & PEP**: Real-time screening with fuzzy matching; must support automated interdiction/blocking.
- **5.4 Risk Assessment**: Dynamic scoring; AI/ML models require human oversight and explainability.
- **5.5 Transaction Monitoring**: Real-time, multi-scenario analysis. Automated alert closure is strictly limited to low-risk scenarios meeting 4 specific criteria.
- **5.6 Fraud Monitoring**: Real-time monitoring across digital channels; High-risk institutions must roadmap toward a unified AML-Fraud architecture.
- **5.7 Case Management**: ECM with Maker-Checker workflows and immutable audit trails.
- **5.8 Reporting**: Automated generation of STR, SAR, CTR, and FTR.
- **5.9 Audit & Governance**: Tamper-proof logs and annual independent validation of AI models.
- **5.10 System Integration**: Secure, bidirectional API-based integration with core banking.
- **5.11 Security & Data Protection**: Encryption, MFA, and NDPA compliance.
- **5.12 UI & Customisation**: Real-time dashboards and efficient navigation for investigators.

### RegTech365 Platform & Products
RegTech365 is an integrated regulatory technology ecosystem that combines intelligent automation, AI-driven analytics, and document-centric workflows to simplify compliance. It transforms reactive obligations into proactive, intelligence-driven systems.

- **RegPort**: Automated AML/CFT platform. Unifies CDD/KYC/KYB, real-time identity validation (NIN, BVN, etc.), STR/SAR rule engine (20+ flags), and regulator-ready reporting (CTR, STR, ICAD, GoAML).
- **RegComply**: GRC module for framework alignment (ISO 27001, GDPR, CBN). Features audit management, centralized evidence, AI-powered risk models, and unified health dashboards.
- **RegGuard**: Intelligent fraud detection (SIM swap, account takeover) with a bidirectional feed pushing signals into the AML risk score for a unified financial crime architecture.
- **RegWatch**: Regulatory intelligence module. Monitors 1,500+ circulars from CBN/NFIU/NDPC. AI interpretation surfaces policy changes and alerts teams to new obligations.
- **RegLearn**: Digital compliance academy. On-demand AML/CFT and specialized courses (Certified AML Specialist, DPO). Management dashboards track progress to satisfy training mandates.

---

## FIELD-LEVEL CONTENT GUIDANCE

### Executive Summary
- lead: ~40 words. Institutional context — who they are, what they face.
- body_paragraphs: 3 paragraphs, each ~50 words. Use CONTEXTUAL GROUNDING to cover: (1) circular context and scope, (2) assessment findings overview, (3) urgency of the June 10 roadmap and next steps.
- inline_alert: ~30 words. A critical CBN quote or warning relevant to this institution type. Start with specific CBN language.

### Profile
- group_structure: e.g., "Standalone entity" or "Subsidiary of XYZ Group"
- risk_factors_display: formatted string of risk factors with separators
- sector_context_box: ~25 words.

### Gap Analysis Standards
- finding: ~35 words. State what's missing, cite the specific CBN standard (5.1-5.12) from CONTEXTUAL GROUNDING, and explain the regulatory implication.
- required_action: ~25 words. Directive. What must be done and by when (referencing the June 10 deadline where applicable).
- regtech_solution: ~25 words. How the assigned RegTech365 product specifically closes this gap using the technical capabilities described in CONTEXTUAL GROUNDING.
- regtech_products: array of product names (e.g., ["RegPort", "RegGuard"])
- req_tags: array of {label, type} badges.

### Governance Assessment
- score_percentage: numeric (e.g., 20 for 2/10)
- score_context: ~60 words. What this score means for examination readiness.
- Each item needs: cbn_ref, category ("Mandatory"/"Conditional"), action_required (~15 words)

### Priority Actions
- deadline_label: full subtitle line (~15 words, e.g., "HARD DEADLINE: 10 JUNE 2026 · MANDATORY FOR ALL INSTITUTIONS")
- body: ~120-150 words across 2 paragraphs. (1) What must be done and why. (2) How OPEX/RegTech365 supports.

### Roadmap
- Each phase: description (~40-50 words, one tight paragraph)
- deliverables: array of short strings
- milestones: array of {milestone, month_offset, owner}. month_offset is an integer representing number of months from today.

### Products
- name: One of RegPort, RegGuard, RegComply, RegLearn.
- gaps_closed: array of section labels (e.g., "5.5 — Transaction Monitoring")
- (Other fields like tagline/description are added programmatically — do not generate them).

### Support Section
- differentiator: ~40 words.

### CTA
- title, subtitle, primary_button_label, secondary_button_label

---

## OUTPUT SCHEMA

Produce output matching this schema exactly. Do not add, remove, or rename any keys.

{
  "meta": {
    "inst_type_full": "string",
    "report_date": "string",
    "compliance_deadline": "string",
    "compliance_deadline_basis": "string",
    "risk_factors_display": "string"
  },
  "executive_summary": {
    "lead": "string (~30 words)",
    "body_paragraphs": ["string (~40 words)", "string (~40 words)", "string (~40 words)"],
    "inline_alert": "string (~25 words)"
  },
  "overall_rating": {
    "rating": "CRITICAL | HIGH | MEDIUM | LOW",
    "rating_label": "string (MAX 10 words)",
    "sector_context_note": "string (~30 words)"
  },
  "scorecard": {
    "aml_system_status_label": "string",
    "aml_system_status_rating": "Compliant | Gap Identified | Critical Gap",
    "standards_compliant_count": 0,
    "standards_compliant_rating": "Compliant | Gap Identified | Critical Gap",
    "standards_critical_gap_count": 0,
    "standards_critical_gap_rating": "Compliant | Gap Identified | Critical Gap | High",
    "standards_gap_identified_count": 0,
    "governance_score_label": "string",
    "governance_score_rating": "Compliant | Gap Identified | Critical Gap | Elevated",
    "internal_audit_label": "string",
    "internal_audit_rating": "Compliant | Gap Identified | Critical Gap",
    "risk_factors_label": "string",
    "risk_factors_rating": "Elevated | Standard | Critical",
    "regulatory_context_box": "string (~30 words)"
  },
  "profile": {
    "sector_context_box": "string (~40 words)"
  },
  "requirement_categories_intro": "string (~40 words)",
  "requirement_categories_alert": "string (~40 words)",
  "requirement_categories": [
    { "area": "string", "cbn_ref": "string", "category": "Mandatory | Conditional", "trigger": "string (~15 words)" }
  ],
  "gap_analysis_intro": "string (~40 words)",
  "standards": [
    {
      "section": "5.1",
      "title": "string",
      "status": "Compliant | Gap Identified | Critical Gap",
      "req_tags": [{ "label": "string", "type": "mandatory | conditional" }],
      "finding": "string (~60 words)",
      "required_action": "string (~40 words)",
      "regtech_solution": "string (~40 words)",
      "regtech_products": ["string"]
    }
  ],
  "governance_assessment": {
    "intro": "string (~50 words)",
    "score_percentage": 0,
    "score_context": "string (~50 words)",
    "items": [
      {
        "control": "Formally designated MLRO or CCO",
        "status": "In place | Not confirmed | Not in place",
        "cbn_ref": "string",
        "category": "Mandatory | Conditional",
        "action_required": "string (~15 words)"
      }
    ],
    "overall_score_label": "string",
    "overall_score_rating": "Critical | Weak | Partial | Adequate | Strong"
  },
  "priority_actions": [
    {
      "number": 1,
      "title": "string",
      "deadline_label": "string (~15 words)",
      "body": "string (~60 words, 2 paragraphs)"
    }
  ],
  "roadmap": {
    "intro": "string (~50 words)",
    "phases": [
      {
        "phase_number": 1,
        "title": "string",
        "timeline": "string",
        "description": "string (~60 words)",
        "deliverables": ["string"],
        "standards_addressed": "string"
      }
    ],
    "milestones": [
      { "milestone": "string", "month_offset": 0, "owner": "string" }
    ]
  },
  "support_section": {
    "intro_paragraph": "string (~50 words)",
    "differentiator": "string (~50 words)",
    "products": [
      {
        "name": "RegPort | RegGuard | RegComply | RegLearn",
        "gaps_closed": ["string"]
      }
    ],
    "advisory_services": [
      { "title": "string (Dynamic/Specific)", "description": "string (~15 words)" }
    ],
    "cta": {
      "title": "string",
      "subtitle": "string (~20 words)",
      "primary_button_label": "string",
      "secondary_button_label": "string"
    }
  }
}

---

## GENERATION INSTRUCTIONS

### executive_summary
- lead: Set institutional context. Who is this institution, what sector, what exposure.
- body_paragraphs[0]: Circular context — what the CBN issued, when, what it requires.
- body_paragraphs[1]: Assessment findings — how many standards compliant vs critical gap, governance score, system status.
- body_paragraphs[2]: Urgency — roadmap deadline, consequences, OPEX support available.
- inline_alert: Quote or paraphrase a specific CBN statement relevant to this institution type. Start with the CBN's own language.

### requirement_categories
Generate ~17 rows. Include all 12 standards plus governance items. Mark each Mandatory or Conditional based on CBN circular. Write institution-specific triggers.

### standards (exactly 12 entries, 5.1–5.12)
Ensure every standard (5.1-5.12) is included.
- req_tags: 1-2 tags per standard.
- finding: Punchy paragraph (~35 words).
- required_action: Directive (~25 words).
- regtech_solution: Solution (~25 words).
- regtech_products: Array of product names used.

### governance_assessment (exactly 10 items)
Items in this order:
1. Formally designated MLRO or CCO
2. Board-approved AML/CFT/CPF Policy
3. Documented AML Solution Governance Framework
4. Formal Change Control for AML Configurations
5. Model Governance Committee for AI/ML
6. Documented Alert Review SLAs
7. Vendor/Third-Party Management Policy
8. Data Retention and Destruction Policy
9. BVN/NIN Integration
10. AML Training Programme with Documented Records

Each item must have cbn_ref, category, and action_required.

### priority_actions (exactly 5)
Priority 1 is always roadmap submission. Body should be 2 paragraphs: what + OPEX support.

### roadmap (exactly 4 phases)
Each phase gets a full description paragraph and a deliverables array.
milestones: exactly 6 milestone rows.

### products
Return only name and gaps_closed. Standard boilerplate is added programmatically.

### advisory_services
Return ONLY 1-2 institution-specific items. Standard items are provided by the hydration layer.

### disclaimer
Reference Circular BSD/DIR/PUB/LAB/019/002, self-assessment basis, advisory-only nature.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let rawResponseText = "";

  try {
    const { inputJson } = await req.json();
    console.log(`DEBUG: Executing v2 HIGH-FIDELITY PROMPT for ${inputJson?.inst_name}`);

    // --- PII STRIPPING START ---
    // We remove PII from the data sent to AI to reduce tokens and improve privacy.
    const { contact_email, contact_phone, contact_role, ...minimalInputJson } = inputJson;

    const originalPII = {
      contact_name: inputJson.contact_name,
      contact_email: contact_email,
      contact_phone: contact_phone,
      contact_role: contact_role,
    };
    // --- PII STRIPPING END ---

    const apiKey = Deno.env.get("AZURE_CLAUDE_API_KEY");
    const baseURL = Deno.env.get("AZURE_CLAUDE_ENDPOINT");
    const deployment = Deno.env.get("AZURE_CLAUDE_DEPLOYMENT") || "claude-sonnet-4-5";

    if (!apiKey || !baseURL) throw new Error("Azure credentials missing.");

    const userMessage = `You are generating a CBN AML gap assessment report for ${inputJson.inst_name}. Below is the institution's self-assessment data. Apply all scoring logic, regulatory context, and output schema from your instructions.

ASSESSMENT DATA:
${JSON.stringify(minimalInputJson)}

Return ONLY the JSON object. No preamble, no explanation, no markdown code fences.`;

    // Log the full prompt sent to Claude (ensure logs are safe)
    console.log("═══════════════ FULL PROMPT SENT TO CLAUDE (MASKED) ═══════════════");
    console.log("SYSTEM PROMPT LENGTH:", SYSTEM_PROMPT.length, "chars");
    console.log("USER MESSAGE LENGTH:", userMessage.length, "chars");
    console.log("ASSESSMENT DATA MASKED: PII fields replaced with [REDACTED]");
    console.log("═════════════════════════════════════════════════════════════════");

    const client = new AnthropicFoundry({ apiKey, baseURL });
    
    const stream = client.messages.stream({
        model: deployment,
        max_tokens: 32000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.1,
    });

    for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            rawResponseText += event.delta.text;
        }
    }

    let cleanJson = rawResponseText.trim();
    const jsonStart = cleanJson.indexOf('{');
    const jsonEnd = cleanJson.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
    }
    
    const report = JSON.parse(cleanJson);

    // --- PII HYDRATION START ---
    if (report.meta) {
      // Re-insert exact fields from input to save prompt tokens
      report.meta.inst_name = minimalInputJson.inst_name;
      report.meta.inst_type = minimalInputJson.inst_type;
      report.meta.cbn_risk = minimalInputJson.cbn_risk;
      report.meta.tx_vol = minimalInputJson.tx_vol;
      report.meta.geo = minimalInputJson.geo;
      report.meta.group_structure = minimalInputJson.group_structure;

      // Re-insert static constants
      report.meta.circular_ref = "BSD/DIR/PUB/LAB/019/002";
      report.meta.roadmap_deadline = "10 June 2026";

      report.meta.contact_name = originalPII.contact_name;
      report.meta.contact_email = originalPII.contact_email;
      report.meta.contact_phone = originalPII.contact_phone;
      report.meta.contact_role = originalPII.contact_role;

      // Set real report date (DD/MM/YYYY)
      const now = new Date();
      report.meta.report_date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }
    // --- PII HYDRATION END ---

    // --- SUPPORT HYDRATION START ---
    if (report.support_section) {
        // Hydrate Products
        if (Array.isArray(report.support_section.products)) {
            report.support_section.products = report.support_section.products.map((p: any) => {
                const staticData = STATIC_PRODUCTS[p.name];
                return staticData ? { ...p, ...staticData } : p;
            });
        }

        // Hydrate Advisory (Merge static with dynamic)
        const dynamicAdvisory = Array.isArray(report.support_section.advisory_services) 
            ? report.support_section.advisory_services 
            : [];
        report.support_section.advisory_services = [...STATIC_ADVISORY, ...dynamicAdvisory];
    }

    // --- ROADMAP HYDRATION START ---
    if (report.roadmap && Array.isArray(report.roadmap.milestones)) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const now = new Date();
        
        report.roadmap.milestones = report.roadmap.milestones.map((m: any) => {
            const milestoneDate = new Date(now.getFullYear(), now.getMonth() + (m.month_offset || 0), 1);
            const targetDateStr = `${monthNames[milestoneDate.getMonth()]} ${milestoneDate.getFullYear()}`;
            
            // Re-map month_offset to target_date for the final JSON
            const { month_offset, ...rest } = m;
            return { ...rest, target_date: targetDateStr };
        });
    }
    // --- ROADMAP HYDRATION END ---
    // --- SUPPORT HYDRATION END ---

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, rawResponse: rawResponseText }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
