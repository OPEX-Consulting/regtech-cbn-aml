/** ---------------------------------------------------------------
 * reportGenerator.ts — v2 High-Fidelity Report (matches sample)
 * --------------------------------------------------------------- */

/** ---------------------------------------------------------------
 * Type definitions mirroring the v2 AI output JSON schema
 * --------------------------------------------------------------- */
export interface ReportMeta {
  inst_name: string;
  inst_type: string;
  inst_type_full: string;
  contact_name: string;
  contact_email: string;
  contact_role: string;
  report_date: string;
  circular_ref: string;
  roadmap_deadline: string;
  compliance_deadline: string;
  compliance_deadline_basis: string;
  cbn_risk: string;
  tx_vol: string;
  geo: string;
  group_structure: string;
  risk_factors_display: string;
}

export interface ReqTag {
  label: string;
  type: string; // "mandatory" | "conditional"
}

export interface RequirementCategory {
  area: string;
  cbn_ref: string;
  category: string;
  trigger: string;
}

export interface GovernanceItem {
  control: string;
  status: string;
  cbn_ref: string;
  category: string;
  action_required: string;
}

export interface RoadmapPhase {
  phase_number: number;
  title: string;
  timeline: string;
  description?: string;
  objectives?: string;
  deliverables?: string[];
  key_deliverables?: string;
  standards_addressed: string;
}

export interface Milestone {
  milestone: string;
  target_date: string;
  owner: string;
}

export interface Product {
  name: string;
  tagline: string;
  gaps_closed: string[];
  description: string;
  standards_addressed: string;
}

export interface AdvisoryService {
  title: string;
  description: string;
}

export interface CTA {
  title: string;
  subtitle: string;
  primary_button_label: string;
  secondary_button_label: string;
}

export interface AmlReportJson {
  meta: ReportMeta;
  executive_summary: {
    lead: string;
    body_paragraphs: string[];
    inline_alert: string;
  };
  overall_rating: {
    rating: string;
    rating_label: string;
    summary_paragraph?: string;
    sector_context_note: string;
  };
  scorecard: {
    aml_system_status_label: string;
    aml_system_status_rating: string;
    standards_compliant_count: number;
    standards_compliant_rating: string;
    standards_critical_gap_count: number;
    standards_critical_gap_rating: string;
    standards_gap_identified_count: number;
    governance_score_label: string;
    governance_score_rating: string;
    internal_audit_label: string;
    internal_audit_rating: string;
    risk_factors_label: string;
    risk_factors_rating: string;
    regulatory_context_box: string;
  };
  profile?: {
    sector_context_box?: string;
  };
  requirement_categories_intro?: string;
  requirement_categories_alert?: string;
  requirement_categories?: RequirementCategory[];
  gap_analysis_intro: string;
  standards: Array<{
    section: string;
    title: string;
    status: string;
    req_tags?: ReqTag[];
    finding: string;
    required_action: string;
    regtech_solution?: string;
    regtech_products?: string[];
    detail_factors?: Array<{ factor: string; value: string; impact: string }>;
  }>;
  governance_assessment: {
    intro: string;
    score_percentage?: number;
    score_context?: string;
    items: GovernanceItem[];
    overall_score_label: string;
    overall_score_rating: string;
  };
  priority_actions: Array<{
    number: number;
    title: string;
    deadline_label: string;
    body: string;
  }>;
  roadmap: {
    intro: string;
    phases: RoadmapPhase[];
    milestones: Milestone[];
  };
  support_section: {
    intro_paragraph: string;
    differentiator: string;
    products: Product[];
    advisory_services: AdvisoryService[];
    cta: CTA;
    next_steps_box?: string;
  };
  disclaimer: string;
  // Legacy fields (backward compat)
  capability_snapshot?: Array<{ function: string; level: string }>;
  security_posture?: { encryption: string; mfa: string; data_sovereignty: string; bia_status: string; overall_label: string };
  implementation_readiness?: { approach: string; vendor_status: string; budget_status: string; tech_capacity: string; overall_label: string };
  _input?: { cbn_risk?: string; tx_vol?: string; geo?: string };
}

/** ---------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------- */
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function txVolLabel(v: string): string {
  const map: Record<string, string> = {
    "<1K": "Under 1,000 transactions per day",
    "1K-50K": "1,000 – 50,000 transactions per day",
    "50K-500K": "50,000 – 500,000 transactions per day",
    ">500K": "Over 500,000 transactions per day",
  };
  return map[v] || v || "—";
}

function statusBadge(status: string): string {
  const s = String(status).toLowerCase();
  if (s === "critical gap" || s === "critical")
    return `<span class="badge badge-critical">Critical Gap</span>`;
  if (s === "gap identified")
    return `<span class="badge badge-gap">Gap Identified</span>`;
  if (s === "compliant")
    return `<span class="badge badge-compliant">Compliant</span>`;
  if (s === "high") return `<span class="badge badge-high">High</span>`;
  if (s === "elevated")
    return `<span class="badge badge-elevated">Elevated</span>`;
  if (s === "standard")
    return `<span class="badge badge-compliant">Standard</span>`;
  if (s === "in place")
    return `<span class="badge badge-inplace">In Place</span>`;
  if (s === "not confirmed")
    return `<span class="badge badge-notconf">Not Confirmed</span>`;
  if (s === "not in place")
    return `<span class="badge badge-notinplace">Not In Place</span>`;
  if (s === "not applicable yet")
    return `<span class="badge badge-notconf">Not Applicable Yet</span>`;
  if (s === "weak" || s === "partial")
    return `<span class="badge badge-gap">${esc(status)}</span>`;
  if (s === "adequate" || s === "strong")
    return `<span class="badge badge-compliant">${esc(status)}</span>`;
  return `<span class="badge badge-notconf">${esc(status)}</span>`;
}

function ratingClass(rating: string): string {
  const r = String(rating).toLowerCase();
  if (r === "critical") return "critical";
  if (r === "high") return "high";
  if (r === "medium") return "medium";
  if (r === "low") return "low";
  return "critical";
}

function gapRowClass(status: string): string {
  const s = String(status).toLowerCase();
  if (s === "critical gap") return "row-critical";
  if (s === "gap identified") return "row-gap";
  if (s === "compliant") return "row-compliant";
  return "";
}

function reqTagBadge(tag: ReqTag): string {
  const cls = tag.type === "mandatory" ? "req-tag-mandatory" : "req-tag-conditional";
  return `<span class="req-tag ${cls}">${esc(tag.label)}</span>`;
}

function catBadge(cat: string): string {
  const c = String(cat).toLowerCase();
  if (c === "mandatory") return `<span class="badge badge-cat-mandatory">MANDATORY</span>`;
  return `<span class="badge badge-cat-conditional">CONDITIONAL</span>`;
}

function govStatusDisplay(status: string): string {
  const s = String(status).toLowerCase();
  if (s === "in place") return `<span class="gov-status gov-in-place">✓ In Place</span>`;
  if (s === "not in place") return `<span class="gov-status gov-not-in-place">✗ Not In Place</span>`;
  if (s === "not confirmed") return `<span class="gov-status gov-not-confirmed">✗ Not Confirmed</span>`;
  if (s.includes("not applicable")) return `<span class="gov-status gov-not-confirmed">— Not Applicable Yet</span>`;
  return `<span class="gov-status gov-not-confirmed">${esc(status)}</span>`;
}

/** ---------------------------------------------------------------
 * Section builders
 * --------------------------------------------------------------- */

function buildCover(r: AmlReportJson): string {
  const rc = ratingClass(r.overall_rating.rating);
  const ratingText = `${r.scorecard.standards_critical_gap_count} of 12 standards carry a Critical Gap. ${r.scorecard.standards_compliant_count === 0 ? 'No standard is currently assessed as Compliant.' : `${r.scorecard.standards_compliant_count} standard(s) assessed as Compliant.`} Immediate action required before ${r.meta.roadmap_deadline}.`;

  return `
  <div class="report-cover">
    <div class="cover-brand">
      <div class="cover-brand-dot"></div>
      <span class="cover-brand-name">OPEX Consulting &nbsp;·&nbsp; RegTech365</span>
    </div>
    <div class="cover-sub-brand">Compliance Advisory & Regulatory Technology · Lagos, Nigeria</div>
    <div class="cover-eyebrow">CBN AML Baseline Standards</div>
    <div class="cover-title">Gap Assessment<br>Report</div>
    <div class="cover-subtitle">Circular ${esc(r.meta.circular_ref)} — ${esc(r.meta.report_date)}</div>
    <div class="cover-meta-grid">
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Institution</div>
        <div class="cover-meta-value">${esc(r.meta.inst_name)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Institution Type</div>
        <div class="cover-meta-value">${esc(r.meta.inst_type_full)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">CBN Risk Classification</div>
        <div class="cover-meta-value">${esc(r.meta.cbn_risk)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Report Date</div>
        <div class="cover-meta-value">${esc(r.meta.report_date)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Roadmap Submission Deadline</div>
        <div class="cover-meta-value">${esc(r.meta.roadmap_deadline)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Full Compliance Deadline</div>
        <div class="cover-meta-value">${esc(r.meta.compliance_deadline)}</div>
      </div>
    </div>
    <div class="cover-rating-strip ${rc}">
      <span class="cover-rating-icon">⚠</span>
      <div class="cover-rating-text">
        <strong>${esc(r.overall_rating.rating)} RISK RATING</strong>
        <span>${esc(ratingText)}</span>
      </div>
    </div>
    <div class="cover-footer">
      <div>Prepared by OPEX Consulting / RegTech365</div>
      <div>business@regtech365.com</div>
      <div class="cover-footer-note">Confidential — for internal compliance planning only<br>Not legal advice</div>
    </div>
  </div>`;
}

function buildTOC(r: AmlReportJson): string {
  return `
  <div class="toc-page page-break">
    <div class="toc-title">Contents</div>
    <div class="toc-list">
      <a href="#section-1" class="toc-item"><span class="toc-num">01</span><span class="toc-label">Executive Summary</span></a>
      <a href="#section-2" class="toc-item"><span class="toc-num">02</span><span class="toc-label">Institution Profile & Assessment Scorecard</span></a>
      <a href="#section-3" class="toc-item"><span class="toc-num">03</span><span class="toc-label">CBN Requirement Categories — Mandatory vs Conditional</span></a>
      <a href="#section-4" class="toc-item"><span class="toc-num">04</span><span class="toc-label">Gap Analysis — 12 CBN Baseline Standards</span></a>
      <a href="#section-5" class="toc-item"><span class="toc-num">05</span><span class="toc-label">Governance Assessment — Section 6 Controls</span></a>
      <a href="#section-6" class="toc-item"><span class="toc-num">06</span><span class="toc-label">Top 5 Priority Actions Before ${esc(r.meta.roadmap_deadline)}</span></a>
      <a href="#section-7" class="toc-item"><span class="toc-num">07</span><span class="toc-label">Recommended Implementation Roadmap</span></a>
      <a href="#section-8" class="toc-item"><span class="toc-num">08</span><span class="toc-label">How RegTech365 & OPEX Consulting Can Help</span></a>
      <a href="#section-disclaimer" class="toc-item toc-item-last"><span class="toc-num">—</span><span class="toc-label">Disclaimer</span></a>
    </div>
  </div>`;
}

function buildSection1(r: AmlReportJson): string {
  const es = r.executive_summary;
  const bodyParas = es.body_paragraphs;
  const lead = es.lead;
  const inlineAlert = es.inline_alert;

  const scoreRing = `
    <div class="score-ring-block">
      <div class="score-ring">
        <div class="score-ring-value">${esc(r.scorecard.standards_compliant_count)}<span class="score-ring-denom">/₁₂</span></div>
      </div>
      <div class="score-ring-labels">
        <div class="score-ring-item"><span class="sr-dot sr-dot-green"></span>Standards Compliant</div>
        <div class="score-ring-item"><span class="sr-dot sr-dot-red"></span>Critical Gap Ratings</div>
        <div class="score-ring-item"><span class="sr-dot sr-dot-amber"></span>Gap Identified Ratings</div>
      </div>
    </div>`;

  return `
  <div class="report-section page-break" id="section-1">
    <div class="section-eyebrow">SECTION ONE</div>
    <div class="section-heading">01 Executive Summary</div>
    <p class="section-prose">${esc(lead)}</p>
    ${bodyParas.map(p => `<p class="section-prose">${esc(p)}</p>`).join("")}
    ${inlineAlert ? `<div class="inline-alert avoid-break"><span class="inline-alert-icon">⚠</span><div>${esc(inlineAlert)}</div></div>` : ""}
    ${scoreRing}
  </div>`;
}

function buildSection2(r: AmlReportJson): string {
  const sc = r.scorecard;
  const sectorBox = r.profile?.sector_context_box || r.overall_rating.sector_context_note || "";

  return `
  <div class="report-section page-break" id="section-2">
    <div class="section-eyebrow">SECTION TWO</div>
    <div class="section-heading">02 Institution Profile & Assessment Scorecard</div>
    <div class="table-wrap">
      <table class="data-table">
        <tbody>
          <tr><td class="field-label">Institution</td><td>${esc(r.meta.inst_name)}</td></tr>
          <tr><td class="field-label">Institution Type</td><td>${esc(r.meta.inst_type_full)}</td></tr>
          <tr><td class="field-label">CBN Risk Classification</td><td>${esc(r.meta.cbn_risk)}</td></tr>
          <tr><td class="field-label">Daily Transaction Volume</td><td>${esc(r.meta.tx_vol)}</td></tr>
          <tr><td class="field-label">Geographic Footprint</td><td>${esc(r.meta.geo)}</td></tr>
          <tr><td class="field-label">Group / Holding Structure</td><td>${esc(r.meta.group_structure)}</td></tr>
          <tr><td class="field-label">Elevated Risk Indicators</td><td>${esc(r.meta.risk_factors_display)}</td></tr>
          <tr><td class="field-label">Circular Reference</td><td>${esc(r.meta.circular_ref)} — issued 10 March 2026</td></tr>
          <tr><td class="field-label">Roadmap Submission Deadline</td><td class="bold">${esc(r.meta.roadmap_deadline)}</td></tr>
          <tr><td class="field-label">Full Compliance Deadline</td><td>${esc(r.meta.compliance_deadline)} (${esc(r.meta.compliance_deadline_basis)})</td></tr>
          <tr><td class="field-label">Report Prepared By</td><td>OPEX Consulting / RegTech365</td></tr>
          <tr><td class="field-label">Report Date</td><td>${esc(r.meta.report_date)}</td></tr>
        </tbody>
      </table>
    </div>
    ${sectorBox ? `<div class="info-box avoid-break"><strong>ℹ Why ${esc(r.meta.inst_name)}'s ${esc(r.meta.inst_type)} status matters.</strong> ${esc(sectorBox)}</div>` : ""}

    <div class="scorecard-stats avoid-break">
      <div class="stat-card">
        <div class="stat-value">${esc(sc.governance_score_label)}</div>
        <div class="stat-label">Governance Controls Confirmed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${esc(sc.aml_system_status_label)}</div>
        <div class="stat-label">AML System Status</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${esc(sc.risk_factors_label)}</div>
        <div class="stat-label">Fraud Exposure Risk Level</div>
      </div>
    </div>
  </div>`;
}

function buildSection3(r: AmlReportJson): string {
  const cats = r.requirement_categories || [];
  if (cats.length === 0) return "";

  const intro = r.requirement_categories_intro || "";
  const alert = r.requirement_categories_alert || "";

  const rows = cats.map(c => `
    <tr>
      <td class="bold">${esc(c.area)}</td>
      <td><span class="cbn-ref-pill">${esc(c.cbn_ref)}</span></td>
      <td>${catBadge(c.category)}</td>
      <td>${esc(c.trigger)}</td>
    </tr>`).join("");

  return `
  <div class="report-section page-break" id="section-3">
    <div class="section-eyebrow">SECTION THREE</div>
    <div class="section-heading">03 CBN Requirement Categories — Mandatory vs Conditional</div>
    <p class="section-prose">${esc(intro)}</p>
    <div class="cat-legend avoid-break">
      <div class="cat-legend-item"><span class="badge badge-cat-mandatory">MANDATORY</span> Applies to all covered institutions without exception</div>
      <div class="cat-legend-item"><span class="badge badge-cat-conditional">CONDITIONAL</span> Activated by institution type, risk class, or product profile &nbsp; <span class="cbn-ref-pill">5.X</span> CBN circular section reference</div>
    </div>
    <div class="table-wrap">
      <table class="data-table avoid-break">
        <thead>
          <tr>
            <th>Requirement Area</th>
            <th>CBN Ref</th>
            <th>Category</th>
            <th>Trigger for ${esc(r.meta.inst_name)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${alert ? `<div class="inline-alert avoid-break"><span class="inline-alert-icon">⚡</span><div><strong>${esc(r.meta.inst_name)}'s position on conditional requirements.</strong> ${esc(alert)}</div></div>` : ""}
  </div>`;
}

function buildSection4(r: AmlReportJson): string {
  const standards = (r.standards || []).map(s => {
    const tags = (s.req_tags || []).map(t => reqTagBadge(t)).join(" ");
    const products = (s.regtech_products || []).map(p => `<span class="product-pill">→ ${esc(p)}</span>`).join(" ");

    return `
    <div class="std-card avoid-break ${gapRowClass(s.status)}">
      <div class="std-card-header">
        <div class="std-card-title-row">
          <span class="std-card-title">${esc(s.title)}</span>
        </div>
        <div class="std-card-meta">
          <span class="gap-ref-pill">${esc(s.section)}</span>
          ${tags}
          ${statusBadge(s.status)}
        </div>
      </div>
      <div class="std-card-body">
        <p class="std-finding">${esc(s.finding)}</p>
        <div class="std-action-block">
          <div class="std-action-label">REQUIRED ACTION</div>
          <p class="std-action-text">${esc(s.required_action)}</p>
        </div>
        ${s.regtech_solution ? `
        <div class="std-regtech-block">
          <div class="std-regtech-label">REGTECH365 SOLUTION</div>
          <p class="std-regtech-text">${esc(s.regtech_solution)}</p>
          ${products ? `<div class="std-product-pills">${products}</div>` : ""}
        </div>` : ""}
      </div>
    </div>`;
  }).join("");

  return `
  <div class="report-section page-break" id="section-4">
    <div class="section-eyebrow">SECTION FOUR</div>
    <div class="section-heading">04 Gap Analysis — 12 CBN Baseline Standards</div>
    <p class="section-prose">${esc(r.gap_analysis_intro)}</p>
    <div class="std-list">${standards}</div>
  </div>`;
}

function buildSection5(r: AmlReportJson): string {
  const ga = r.governance_assessment;
  const scorePct = ga.score_percentage ?? 0;
  const scoreCtx = ga.score_context || "";
  const inPlaceCount = (ga.items || []).filter(i => String(i.status).toLowerCase() === "in place").length;

  const govRows = ga.items.map(item => `
    <tr>
      <td class="bold">${esc(item.control)}</td>
      <td>${esc(item.cbn_ref)}</td>
      <td>${catBadge(item.category)}</td>
      <td>${govStatusDisplay(item.status)}</td>
      <td>${esc(item.action_required)}</td>
    </tr>`).join("");

  return `
  <div class="report-section page-break" id="section-5">
    <div class="section-eyebrow">SECTION FIVE</div>
    <div class="section-heading">05 Governance Assessment — Section 6 Controls</div>
    <p class="section-prose">${esc(ga.intro)}</p>

    <div class="gov-score-block avoid-break">
      <div class="gov-score-title">Governance Score — ${esc(ga.overall_score_rating)}</div>
      <div class="gov-score-ring">
        <div class="gov-ring-visual">
          <svg viewBox="0 0 120 120" class="gov-ring-svg">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#EDF0F5" stroke-width="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="${scorePct <= 30 ? '#A32D2D' : scorePct <= 60 ? '#B06200' : '#0F6E56'}" stroke-width="10" stroke-dasharray="${(scorePct / 100) * 314} 314" stroke-linecap="round" transform="rotate(-90 60 60)"/>
            <text x="60" y="55" text-anchor="middle" font-size="24" font-weight="700" fill="#0D1F3C">${scorePct}%</text>
            <text x="60" y="72" text-anchor="middle" font-size="11" fill="#6B7A94">${inPlaceCount} of 10</text>
          </svg>
        </div>
        <p class="gov-score-context">${esc(scoreCtx)}</p>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table gov-table avoid-break">
        <thead>
          <tr>
            <th>Governance Control</th>
            <th>CBN Ref</th>
            <th>Category</th>
            <th>${esc(r.meta.inst_name)} Status</th>
            <th>Action Required</th>
          </tr>
        </thead>
        <tbody>${govRows}</tbody>
      </table>
    </div>
  </div>`;
}

function buildSection6(r: AmlReportJson): string {
  const actions = (r.priority_actions || []).map(a => `
    <div class="priority-box avoid-break">
      <div class="priority-header">
        <div class="priority-number">${esc(a.number)}</div>
        <div class="priority-titles">
          <div class="priority-title">${esc(a.title)}</div>
          <div class="priority-deadline">${esc(a.deadline_label)}</div>
        </div>
      </div>
      <div class="priority-body">${esc(a.body)}</div>
    </div>`).join("");

  return `
  <div class="report-section page-break" id="section-6">
    <div class="section-eyebrow">SECTION SIX</div>
    <div class="section-heading">06 Top 5 Priority Actions Before ${esc(r.meta.roadmap_deadline)}</div>
    ${actions}
  </div>`;
}

function buildSection7(r: AmlReportJson): string {
  const phases = (r.roadmap.phases || []).map(p => {
    const desc = p.description || p.objectives || "";
    const deliverables = p.deliverables || (p.key_deliverables ? p.key_deliverables.split(",").map(d => d.trim()) : []);
    const delivTags = deliverables.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("");

    return `
    <div class="phase-card avoid-break">
      <div class="phase-header">
        <div class="phase-dot"></div>
        <div class="phase-title-block">
          <div class="phase-timeline">${esc(p.timeline)}</div>
          <div class="phase-title">${esc(p.title)}</div>
        </div>
      </div>
      <p class="phase-desc">${esc(desc)}</p>
      ${delivTags ? `<div class="phase-deliverables">${delivTags}</div>` : ""}
    </div>`;
  }).join("");

  const milestones = r.roadmap.milestones;
  const milestoneRows = milestones.map(m => `
    <tr>
      <td>${esc(m.milestone)}</td>
      <td class="bold">${esc(m.target_date)}</td>
      <td>${esc(m.owner)}</td>
    </tr>`).join("");

  const milestoneTable = `
    <div class="table-wrap" style="margin-top:32px">
      <table class="data-table avoid-break">
        <thead>
          <tr><th>Milestone</th><th>Target Date</th><th>Owner</th></tr>
        </thead>
        <tbody>${milestoneRows}</tbody>
      </table>
    </div>`;

  return `
  <div class="report-section page-break" id="section-7">
    <div class="section-eyebrow">SECTION SEVEN</div>
    <div class="section-heading">07 Recommended Implementation Roadmap</div>
    <p class="section-prose">${esc(r.roadmap.intro)}</p>
    <div class="phase-timeline-list">${phases}</div>
    ${milestoneTable}
  </div>`;
}

function buildSection8(r: AmlReportJson): string {
  const ss = r.support_section;
  const diffText = ss.differentiator || "";

  const products = ss.products.map(p => {
    const gapsClosed = p.gaps_closed.map(g => `<span class="gap-closed-tag">${esc(g)}</span>`).join("");

    return `
    <div class="product-card-v2 avoid-break">
      <div class="product-card-header-v2">
        <span class="product-icon">${esc(p.name.substring(0, 2).toUpperCase())}</span>
        <div>
          <div class="product-name-v2">${esc(p.name)}</div>
          <div class="product-tagline">${esc(p.tagline)}</div>
        </div>
      </div>
      ${gapsClosed ? `<div class="product-gaps-closed">${gapsClosed}</div>` : ""}
      <p class="product-desc-v2">${esc(p.description)}</p>
    </div>`;
  }).join("");

  const services = ss.advisory_services.map(s => {
    return `<div class="advisory-item-v2"><strong>${esc(s.title)}</strong> — ${esc(s.description)}</div>`;
  }).join("");

  const cta = ss.cta;
  const ctaHtml = cta ? `
    <div class="cta-box avoid-break">
      <div class="cta-title">${esc(cta.title)}</div>
      <p class="cta-subtitle">${esc(cta.subtitle)}</p>
      <div class="cta-buttons">
        <a class="cta-btn cta-btn-primary" href="mailto:business@regtech365.com?subject=CBN%20Roadmap%20Support%20-%20${encodeURIComponent(r.meta.inst_name)}">${esc(cta.primary_button_label)} →</a>
        <a class="cta-btn cta-btn-secondary" href="mailto:business@regtech365.com?subject=RegPort%20Demo%20Request%20-%20${encodeURIComponent(r.meta.inst_name)}">${esc(cta.secondary_button_label)}</a>
      </div>
    </div>` : `
    <div class="cta-box avoid-break">
      <div class="cta-title">Finalize Your Mandatory CBN Roadmap</div>
      <p class="cta-subtitle">The CBN Circular mandates that all institutions submit a detailed 12-section Implementation Roadmap by <strong>June 10, 2026</strong>. OPEX Consulting can finalize your roadmap template based on this assessment.</p>
      <div class="cta-buttons">
        <a class="cta-btn cta-btn-primary" href="mailto:business@regtech365.com?subject=CBN%20Roadmap%20Support%20-%20${encodeURIComponent(r.meta.inst_name)}">Get Roadmap Support →</a>
        <a class="cta-btn cta-btn-secondary" href="mailto:business@regtech365.com?subject=RegPort%20Demo%20Request%20-%20${encodeURIComponent(r.meta.inst_name)}">Request RegPort/RegGuard/RegComply/RegLearn Demo</a>
      </div>
    </div>`;

  return `
  <div class="report-section page-break" id="section-8">
    <div class="section-eyebrow">SECTION EIGHT</div>
    <div class="section-heading">08 How RegTech365 & OPEX Consulting Can Support ${esc(r.meta.inst_name)}</div>
    <p class="section-prose">${esc(ss.intro_paragraph)}</p>
    ${diffText ? `<div class="diff-callout avoid-break"><span class="diff-icon">💡</span><div><strong>What makes this different.</strong> ${esc(diffText)}</div></div>` : ""}

    <div class="subsection-heading">RegTech365 Product Suite — Mapped to ${esc(r.meta.inst_name)}'s Gaps</div>
    <div class="product-grid-v2">${products}</div>

    <div class="subsection-heading">OPEX Consulting Advisory Services</div>
    <div class="advisory-grid">${services}</div>

    ${ctaHtml}
  </div>`;
}

function buildFooter(r: AmlReportJson): string {
  const disclaimerText = r.disclaimer;
  return `
  <div class="report-disclaimer" id="section-disclaimer">
    <p class="disclaimer-text"><strong>Disclaimer</strong>${esc(disclaimerText)}</p>
  </div>
  <div class="report-footer">
    <span class="footer-brand">OPEX Consulting Limited &nbsp;·&nbsp; RegTech365 &nbsp;·&nbsp; business@regtech365.com</span>
  </div>`;
}

/** ---------------------------------------------------------------
 * CSS — high-fidelity matching the sample report
 * --------------------------------------------------------------- */
function getReportCSS(): string {
  return `
  /* ─── Reset & Base ─────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:       #0D1F3C;
    --navy-mid:   #1A3560;
    --navy-light: #2A4A7F;
    --teal:       #0F6E56;
    --teal-mid:   #1D9E75;
    --teal-light: #E1F5EE;
    --amber:      #B06200;
    --amber-bg:   #FDF3E3;
    --red:        #A32D2D;
    --red-bg:     #FCEBEB;
    --orange:     #C85000;
    --orange-bg:  #FEF0E6;
    --slate:      #3D4F6B;
    --muted:      #6B7A94;
    --border:     #D8DFE9;
    --border-light: #EDF0F5;
    --bg:         #F7F9FC;
    --white:      #FFFFFF;
    --text:       #0D1F3C;
    --text-sec:   #3D4F6B;

    --gap-critical-bg:   #FCEBEB;
    --gap-critical-text: #7A1F1F;
    --gap-critical-border: #E07070;
    --gap-identified-bg:   #FDF3E3;
    --gap-identified-text: #6B3A00;
    --gap-identified-border: #D4943A;
    --compliant-bg:   #E1F5EE;
    --compliant-text: #085041;
    --compliant-border: #3BAB82;

    --font-display: 'EB Garamond', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --page-max: 900px;
    --section-gap: 32px;
  }

  html { font-size: 15px; scroll-behavior: smooth; }

  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: var(--font-body);
    color: var(--text);
    background: var(--bg);
    line-height: 1.6;
  }

  /* ─── Print ─────────────────────────────────────── */
  @media print {
    @page { margin: 15mm; size: A4; }
    body { background: white; font-size: 11pt; }
    .no-print { display: none !important; }
    .page-break { break-before: page; page-break-before: always; }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    .report-cover { break-after: page; page-break-after: always; min-height: 100vh; }
    .toc-page { break-after: page; page-break-after: always; }
    .priority-box, .std-card, .product-card-v2, .phase-card, .cta-box, .info-box, .data-table, .gov-table, .inline-alert, .diff-callout, .gov-score-block {
      break-inside: avoid !important; page-break-inside: avoid !important;
    }
    a { color: inherit; text-decoration: none; }
  }

  /* ─── Layout ─────────────────────────────────────── */
  .report-wrapper { max-width: var(--page-max); margin: 0 auto; background: var(--white); box-shadow: 0 0 40px rgba(13,31,60,0.08); }

  /* ─── Cover ──────────────────────────────────────── */
  .report-cover {
    background: var(--navy);
    padding: 72px 72px 48px;
    position: relative;
    overflow: hidden;
    min-height: 500px;
    display: flex;
    flex-direction: column;
  }
  .report-cover::before { content: ''; position: absolute; top: -120px; right: -120px; width: 500px; height: 500px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
  .report-cover::after { content: ''; position: absolute; bottom: -80px; left: -80px; width: 340px; height: 340px; border-radius: 50%; border: 1px solid rgba(29,158,117,0.15); }
  .cover-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .cover-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--teal-mid); }
  .cover-brand-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.55); letter-spacing: 0.12em; text-transform: uppercase; }
  .cover-sub-brand { font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 48px; }
  .cover-eyebrow { font-size: 11px; font-weight: 600; color: var(--teal-mid); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
  .cover-title { font-family: var(--font-display); font-size: 36px; font-weight: 500; color: #FFFFFF; line-height: 1.15; margin-bottom: 6px; letter-spacing: -0.01em; }
  .cover-subtitle { font-family: var(--font-display); font-size: 18px; font-weight: 400; font-style: italic; color: rgba(255,255,255,0.45); margin-bottom: 40px; }
  .cover-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; max-width: 560px; position: relative; z-index: 1; margin-bottom: 28px; }
  .cover-meta-cell { background: rgba(255,255,255,0.04); padding: 14px 18px; }
  .cover-meta-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .cover-meta-value { font-size: 14px; font-weight: 600; color: #FFFFFF; }

  .cover-rating-strip { padding: 16px 20px; border-radius: 6px; display: flex; align-items: flex-start; gap: 12px; position: relative; z-index: 1; margin-bottom: 28px; }
  .cover-rating-strip.critical { background: rgba(163,45,45,0.2); border: 1px solid rgba(163,45,45,0.4); }
  .cover-rating-strip.high { background: rgba(200,80,0,0.2); border: 1px solid rgba(200,80,0,0.4); }
  .cover-rating-strip.medium { background: rgba(176,98,0,0.2); border: 1px solid rgba(176,98,0,0.4); }
  .cover-rating-strip.low { background: rgba(15,110,86,0.2); border: 1px solid rgba(15,110,86,0.4); }
  .cover-rating-icon { font-size: 18px; margin-top: 2px; }
  .cover-rating-text { font-size: 13px; color: rgba(255,255,255,0.85); line-height: 1.6; }
  .cover-rating-text strong { display: block; font-size: 14px; color: #FFFFFF; margin-bottom: 4px; }

  .cover-footer { margin-top: auto; position: relative; z-index: 1; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.7; }
  .cover-footer-note { margin-top: 8px; font-size: 11px; font-style: italic; color: rgba(255,255,255,0.3); }

  /* ─── TOC ────────────────────────────────────────── */
  .toc-page { padding: 72px; }
  .toc-title { font-family: var(--font-display); font-size: 28px; font-weight: 500; color: var(--navy); margin-bottom: 32px; }
  .toc-list { display: flex; flex-direction: column; gap: 0; }
  .toc-item { display: flex; align-items: baseline; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border-light); text-decoration: none; color: var(--text); transition: background 0.15s; }
  .toc-item:hover { background: var(--bg); }
  .toc-num { font-family: var(--font-display); font-size: 18px; font-weight: 500; color: var(--navy-mid); min-width: 32px; }
  .toc-label { font-size: 15px; color: var(--text); }
  .toc-item-last { border-bottom: none; }

  /* ─── Report Body ────────────────────────────────── */
  .report-body { padding: 0 72px; }
  .report-section { padding-top: var(--section-gap); padding-bottom: var(--section-gap); border-bottom: 1px solid var(--border-light); }
  .report-section:last-child { border-bottom: none; }

  .section-eyebrow { font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }
  .section-heading { font-family: var(--font-display); font-size: 22px; font-weight: 500; color: var(--navy); margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid var(--navy); letter-spacing: -0.01em; }
  .subsection-heading { font-size: 13px; font-weight: 600; color: var(--navy-mid); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; margin-top: 28px; }
  .section-prose { font-size: 13.5px; color: var(--text-sec); line-height: 1.75; margin-bottom: 18px; }

  /* ─── Tables ─────────────────────────────────────── */
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th { background: var(--navy); color: #FFFFFF; font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; padding: 11px 14px; text-align: left; }
  .data-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-light); vertical-align: top; color: var(--text); line-height: 1.55; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:nth-child(even) td { background: #FAFBFD; }
  .data-table .bold, .bold { font-weight: 600; }
  .data-table .field-label { font-weight: 600; color: var(--navy-mid); width: 35%; }

  /* ─── Badges ─────────────────────────────────────── */
  .badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 3px 9px; border-radius: 3px; white-space: nowrap; }
  .badge-critical   { background: var(--gap-critical-bg); color: var(--gap-critical-text); border: 1px solid var(--gap-critical-border); }
  .badge-gap        { background: var(--gap-identified-bg); color: var(--gap-identified-text); border: 1px solid var(--gap-identified-border); }
  .badge-compliant  { background: var(--compliant-bg); color: var(--compliant-text); border: 1px solid var(--compliant-border); }
  .badge-high       { background: var(--orange-bg); color: var(--orange); border: 1px solid #F0C8A0; }
  .badge-elevated   { background: var(--amber-bg); color: var(--amber); border: 1px solid #E8C882; }
  .badge-inplace    { background: var(--compliant-bg); color: var(--compliant-text); border: 1px solid var(--compliant-border); }
  .badge-notconf    { background: #F3F5F9; color: var(--muted); border: 1px solid var(--border); }
  .badge-notinplace { background: var(--gap-critical-bg); color: var(--gap-critical-text); border: 1px solid var(--gap-critical-border); }
  .badge-cat-mandatory { background: var(--navy); color: #FFFFFF; border: none; }
  .badge-cat-conditional { background: var(--amber-bg); color: var(--amber); border: 1px solid #E8C882; }

  .req-tag { display: inline-block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; white-space: nowrap; }
  .req-tag-mandatory { background: var(--navy); color: #FFFFFF; }
  .req-tag-conditional { background: var(--amber-bg); color: var(--amber); border: 1px solid #E8C882; }

  .cbn-ref-pill { display: inline-block; font-size: 10px; font-weight: 700; color: var(--navy-mid); background: var(--bg); border: 1px solid var(--border); border-radius: 3px; padding: 2px 7px; white-space: nowrap; }

  /* ─── Info / Alert Boxes ──────────────────────────── */
  .info-box { background: #EEF2FB; border: 1px solid #BCC8E3; border-left: 4px solid var(--navy-mid); border-radius: 5px; padding: 18px 22px; font-size: 13px; color: var(--text-sec); line-height: 1.65; margin-top: 20px; margin-bottom: 20px; }
  .info-box strong { font-weight: 700; color: var(--navy); }

  .inline-alert { background: var(--amber-bg); border: 1px solid #E8C882; border-left: 4px solid var(--amber); border-radius: 5px; padding: 18px 22px; font-size: 13px; color: var(--gap-identified-text); line-height: 1.65; margin: 20px 0; display: flex; gap: 12px; align-items: flex-start; }
  .inline-alert-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .inline-alert strong { font-weight: 700; }

  .diff-callout { background: #EEF2FB; border: 1px solid #BCC8E3; border-radius: 6px; padding: 18px 22px; font-size: 13px; color: var(--text-sec); line-height: 1.65; margin: 20px 0; display: flex; gap: 12px; align-items: flex-start; }
  .diff-icon { font-size: 16px; flex-shrink: 0; }

  /* ─── Score Ring (Section 1) ──────────────────────── */
  .score-ring-block { display: flex; align-items: center; gap: 32px; padding: 24px 0; }
  .score-ring { width: 80px; height: 80px; border-radius: 50%; border: 6px solid var(--border-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .score-ring-value { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--navy); }
  .score-ring-denom { font-size: 14px; color: var(--muted); }
  .score-ring-labels { display: flex; flex-direction: column; gap: 6px; }
  .score-ring-item { font-size: 12px; color: var(--text-sec); display: flex; align-items: center; gap: 8px; }
  .sr-dot { width: 8px; height: 8px; border-radius: 50%; }
  .sr-dot-green { background: var(--teal); }
  .sr-dot-red { background: var(--red); }
  .sr-dot-amber { background: var(--amber); }

  /* ─── Scorecard Stats (Section 2) ────────────────── */
  .scorecard-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 24px; }
  .stat-card { background: var(--bg); border: 1px solid var(--border-light); border-radius: 6px; padding: 20px; text-align: center; }
  .stat-value { font-family: var(--font-display); font-size: 20px; font-weight: 600; color: var(--navy); margin-bottom: 6px; }
  .stat-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }

  /* ─── Req Categories Legend ──────────────────────── */
  .cat-legend { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .cat-legend-item { font-size: 12px; color: var(--text-sec); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* ─── Gap Analysis Cards (Section 4) ─────────────── */
  .std-list { display: flex; flex-direction: column; gap: 20px; }
  .std-card { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--white); }
  .std-card.row-critical { border-left: 5px solid var(--red); }
  .std-card.row-gap      { border-left: 5px solid var(--amber); }
  .std-card.row-compliant { border-left: 5px solid var(--teal); }
  .std-card-header { padding: 18px 22px; border-bottom: 1px solid var(--border-light); }
  .std-card.row-critical .std-card-header { background: #FEF7F7; }
  .std-card.row-gap .std-card-header      { background: #FFFBF5; }
  .std-card.row-compliant .std-card-header { background: #F4FBF8; }
  .std-card-title-row { margin-bottom: 10px; }
  .std-card-title { font-family: var(--font-display); font-weight: 600; font-size: 17px; color: var(--navy); }
  .std-card-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .std-card-body { padding: 22px; }
  .std-finding { font-size: 13.5px; color: var(--text); line-height: 1.75; margin-bottom: 18px; }
  .std-action-block { margin-bottom: 18px; }
  .std-action-label, .std-regtech-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 8px; }
  .std-action-text { font-size: 13.5px; color: var(--text-sec); line-height: 1.7; }
  .std-regtech-block { background: var(--teal-light); border-radius: 5px; padding: 16px 18px; }
  .std-regtech-label { color: var(--teal); }
  .std-regtech-text { font-size: 13px; color: var(--text-sec); line-height: 1.7; margin-bottom: 10px; }
  .std-product-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .product-pill { font-size: 11px; font-weight: 700; color: var(--teal); background: var(--white); border: 1px solid var(--teal); border-radius: 4px; padding: 3px 10px; }

  /* ─── Governance (Section 5) ─────────────────────── */
  .gov-score-block { margin-bottom: 28px; }
  .gov-score-title { font-family: var(--font-display); font-size: 18px; font-weight: 500; color: var(--navy); margin-bottom: 16px; }
  .gov-score-ring { display: flex; align-items: center; gap: 24px; }
  .gov-ring-visual { width: 120px; height: 120px; flex-shrink: 0; }
  .gov-ring-svg { width: 100%; height: 100%; }
  .gov-score-context { font-size: 13px; color: var(--text-sec); line-height: 1.7; }

  .gov-status { font-size: 12px; font-weight: 600; }
  .gov-in-place { color: var(--teal); }
  .gov-not-in-place { color: var(--red); }
  .gov-not-confirmed { color: var(--muted); }

  .gov-table th:nth-child(4), .gov-table td:nth-child(4) { white-space: nowrap; }

  /* ─── Priority Actions (Section 6) ───────────────── */
  .priority-box { border: 1px solid var(--border); border-left: 4px solid var(--navy-mid); border-radius: 5px; padding: 22px 26px; margin-bottom: 20px; background: var(--white); }
  .priority-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
  .priority-number { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; min-width: 32px; border-radius: 50%; background: var(--navy); color: #FFFFFF; font-weight: 700; font-size: 14px; margin-top: 2px; }
  .priority-titles { flex: 1; }
  .priority-title { font-weight: 700; font-size: 15px; color: var(--navy); line-height: 1.3; margin-bottom: 4px; }
  .priority-deadline { font-size: 11px; font-weight: 700; color: var(--red); text-transform: uppercase; letter-spacing: 0.06em; }
  .priority-body { font-size: 13.5px; color: var(--text-sec); line-height: 1.75; padding-left: 48px; }

  /* ─── Roadmap (Section 7) ────────────────────────── */
  .phase-timeline-list { display: flex; flex-direction: column; gap: 0; margin: 24px 0; border-left: 3px solid var(--navy-mid); padding-left: 28px; }
  .phase-card { padding: 20px 0; border-bottom: 1px solid var(--border-light); position: relative; }
  .phase-card:last-child { border-bottom: none; }
  .phase-card::before { content: ''; position: absolute; left: -34px; top: 24px; width: 12px; height: 12px; border-radius: 50%; background: var(--navy-mid); border: 3px solid var(--white); }
  .phase-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .phase-dot { display: none; }
  .phase-timeline { font-size: 11px; font-weight: 700; color: var(--teal); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .phase-title { font-family: var(--font-display); font-size: 17px; font-weight: 500; color: var(--navy); }
  .phase-desc { font-size: 13.5px; color: var(--text-sec); line-height: 1.75; margin-bottom: 12px; }
  .phase-deliverables { display: flex; flex-wrap: wrap; gap: 6px; }
  .deliv-tag { font-size: 11px; font-weight: 600; color: var(--navy-mid); background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 4px 10px; }

  /* ─── Products (Section 8) ───────────────────────── */
  .product-grid-v2 { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 32px; }
  .product-card-v2 { border: 1px solid var(--border); border-radius: 8px; padding: 24px; background: var(--white); }
  .product-card-header-v2 { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .product-icon { width: 40px; height: 40px; border-radius: 8px; background: var(--navy); color: #FFFFFF; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .product-name-v2 { font-weight: 700; font-size: 16px; color: var(--navy); }
  .product-tagline { font-size: 12px; color: var(--muted); }
  .product-gaps-closed { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .gap-closed-tag { font-size: 10px; font-weight: 600; color: var(--teal); background: var(--teal-light); border: 1px solid #9FD4BC; border-radius: 3px; padding: 3px 8px; }
  .product-desc-v2 { font-size: 13px; color: var(--text-sec); line-height: 1.7; }

  /* ─── Advisory Services ──────────────────────────── */
  .advisory-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 28px; }
  .advisory-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text-sec); line-height: 1.5; }
  .advisory-arrow { color: var(--teal-mid); font-weight: 700; flex-shrink: 0; }
  .advisory-item-v2 { font-size: 13px; color: var(--text-sec); line-height: 1.6; padding: 8px 0; border-bottom: 1px solid var(--border-light); }
  .advisory-item-v2 strong { color: var(--navy); }
  .advisory-item-v2:last-child { border-bottom: none; }

  /* ─── CTA Box ────────────────────────────────────── */
  .cta-box { background: var(--navy); border-radius: 8px; padding: 32px; text-align: center; margin-top: 28px; }
  .cta-title { font-family: var(--font-display); font-size: 20px; font-weight: 500; color: #FFFFFF; margin-bottom: 12px; }
  .cta-subtitle { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.65; margin-bottom: 20px; }
  .cta-buttons { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
  .cta-btn { display: inline-block; padding: 10px 24px; border-radius: 5px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; }
  .cta-btn-primary { background: var(--teal-mid); color: #FFFFFF; }
  .cta-btn-secondary { background: transparent; color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.3); }

  /* ─── Footer / Disclaimer ────────────────────────── */
  .report-disclaimer { padding: 32px 72px; border-top: 1px solid var(--border-light); background: #F7F9FC; }
  .disclaimer-text { font-size: 12px; color: var(--muted); font-style: italic; line-height: 1.7; }
  .disclaimer-text strong { font-style: normal; color: var(--text-sec); display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  .report-footer { background: var(--navy); padding: 20px 72px; text-align: center; }
  .footer-brand { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.1em; text-transform: uppercase; }

  /* ─── Responsive ─────────────────────────────────── */
  @media (max-width: 720px) {
    .report-cover, .toc-page { padding: 40px 24px 36px; }
    .report-body { padding: 0 24px; }
    .report-disclaimer { padding: 24px; }
    .report-footer { padding: 16px 24px; }
    .cover-title { font-size: 28px; }
    .cover-meta-grid { grid-template-columns: 1fr; }
    .scorecard-stats { grid-template-columns: 1fr; }
    .std-card-body { padding: 16px; }
    .priority-body { padding-left: 0; }
    .phase-timeline-list { padding-left: 20px; }
  }
  `;
}

/** ---------------------------------------------------------------
 * Fetch template CSS (fallback if inline CSS fails)
 * --------------------------------------------------------------- */
async function fetchTemplateCSS(): Promise<string> {
  try {
    const res = await fetch("temp/cbn_aml_report_template.html");
    const html = await res.text();
    const match = html.match(/<style>([\s\S]*?)<\/style>/i);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

/** ---------------------------------------------------------------
 * generatePdf — Native Browser Print Engine
 * --------------------------------------------------------------- */
export async function generatePdf(
  reportData: AmlReportJson,
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(10);

  const r = { ...reportData };
  if (r._input) {
    // PII & Meta Hydration
    r.meta.inst_name = r.meta.inst_name || r._input.inst_name || "—";
    r.meta.contact_name = r.meta.contact_name || r._input.contact_name || "—";
    r.meta.contact_email = r.meta.contact_email || r._input.contact_email || "—";
    r.meta.contact_role = r.meta.contact_role || r._input.contact_role || "—";
    r.meta.cbn_risk = r.meta.cbn_risk || r._input.cbn_risk || "—";
    r.meta.tx_vol = r.meta.tx_vol || txVolLabel(r._input.tx_vol ?? "");
    r.meta.geo = r.meta.geo || r._input.geo || "—";
    r.meta.report_date = r.meta.report_date || new Date().toLocaleDateString('en-GB');
    r.meta.circular_ref = "BSD/DIR/PUB/LAB/019/002";
    r.meta.roadmap_deadline = "10 June 2026";
  }

  // Roadmap Hydration (Convert relative offsets to real dates)
  if (r.roadmap && Array.isArray(r.roadmap.milestones)) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();

    r.roadmap.milestones = r.roadmap.milestones.map((m: any) => {
      // If target_date is missing OR looks like a raw offset, calculate it
      if (!m.target_date || typeof m.month_offset === 'number') {
        const milestoneDate = new Date(now.getFullYear(), now.getMonth() + (m.month_offset || 0), 1);
        const targetDateStr = `${monthNames[milestoneDate.getMonth()]} ${milestoneDate.getFullYear()}`;
        return { ...m, target_date: targetDateStr };
      }
      return m;
    });
  }

  // Attempt to use the external premium template for consistency
  let reportHtml = "";
  try {
    const templatePath = "temp/cbn_aml_report_template.html";
    const res = await fetch(templatePath);
    if (res.ok) {
      const templateText = await res.text();
      const escapedJson = JSON.stringify(r);
      // Inject data into the template's DEMO_REPORT variable
      reportHtml = templateText.replace(/const DEMO_REPORT = \{[\s\S]*?\};/, `const DEMO_REPORT = ${escapedJson};`);
      console.log("✅ Injected AI data into external premium template.");
    }
  } catch (e) {
    console.warn("⚠️ Could not load external template, falling back to built-in generator.", e);
  }

  // Built-in generator (Legacy/Fallback)
  if (!reportHtml) {
    const css = getReportCSS();
    reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>CBN AML Gap Assessment - ${esc(r.meta.inst_name)}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>${css}</style>
        </head>
        <body>
          <div class="report-wrapper">
            ${buildCover(r)}
            <div class="report-body">
              ${buildSection1(r)}
              ${buildSection2(r)}
              ${buildSection3(r)}
              ${buildSection4(r)}
              ${buildSection5(r)}
              ${buildSection6(r)}
              ${buildSection7(r)}
              ${buildSection8(r)}
            </div>
            ${buildFooter(r)}
          </div>
        </body>
      </html>
    `;
  }

  onProgress?.(40);

  const fileName = `CBN_AML_Gap_Assessment_Report_${r.meta.inst_name.replace(/\s+/g, "_")}.pdf`;

  // const PDF_API_URL = "http://localhost:8000/api/v1/generate-pdf";
  const PDF_API_URL = "https://regtech365-ai.gentlemeadow-8588bc06.eastus.azurecontainerapps.io/api/v1/generate-pdf";

  const res = await fetch(PDF_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: reportHtml }),
  });

  if (!res.ok) {
    throw new Error(`PDF generation failed: ${res.status} ${res.statusText}`);
  }

  onProgress?.(90);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onProgress?.(100);
}
