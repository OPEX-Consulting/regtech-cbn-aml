/**
 * reportGenerator.ts
 *
 * Injects the Gemini report JSON into the CBN AML HTML report template
 * and triggers a silent PDF download via html2canvas + jsPDF.
 *
 * The HTML template lives in /temp/cbn_aml_report_template.html inside
 * the project, but at runtime it is served from the public/ directory.
 * Copy or symlink it there — or fetch it from a known URL.
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** ---------------------------------------------------------------
 * Type definitions mirroring the AI output JSON schema
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
  cbn_risk?: string;
  tx_vol?: string;
  geo?: string;
}

export interface AmlReportJson {
  meta: ReportMeta;
  overall_rating: {
    rating: string;
    rating_label: string;
    summary_paragraph: string;
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
  gap_analysis_intro: string;
  standards: Array<{
    section: string;
    title: string;
    status: string;
    finding: string;
    required_action: string;
  }>;
  governance_assessment: {
    intro: string;
    items: Array<{ control: string; status: string }>;
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
    phases: Array<{
      phase_number: number;
      title: string;
      timeline: string;
      objectives: string;
      key_deliverables: string;
      standards_addressed: string;
    }>;
  };
  support_section: {
    intro_paragraph: string;
    advisory_intro: string;
    products: Array<{
      name: string;
      function: string;
      standards_addressed: string;
      relevance_to_client: string;
    }>;
    advisory_services: string[];
    next_steps_box: string;
  };
  disclaimer: string;
  // Passthrough block for optional meta fields the AI may not echo
  _input?: {
    cbn_risk?: string;
    tx_vol?: string;
    geo?: string;
  };
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

/** ---------------------------------------------------------------
 * Section builders (mirrors the template JS exactly, but in TS)
 * --------------------------------------------------------------- */
function buildCover(r: AmlReportJson): string {
  const rc = ratingClass(r.overall_rating.rating);
  return `
  <div class="report-cover">
    <div class="cover-brand">
      <div class="cover-brand-dot"></div>
      <span class="cover-brand-name">OPEX Consulting &nbsp;|&nbsp; RegTech365</span>
    </div>
    <div class="cover-eyebrow">CBN AML Baseline Standards</div>
    <div class="cover-title">Gap Assessment<br>Report</div>
    <div class="cover-subtitle">Baseline Standards for Automated AML Solutions</div>
    <div class="cover-prepared">Prepared for:</div>
    <div class="cover-institution">${esc(r.meta.inst_name)}</div>
    <div class="cover-inst-type">${esc(r.meta.inst_type_full)}</div>
    <div class="cover-meta-grid">
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Circular Reference</div>
        <div class="cover-meta-value">${esc(r.meta.circular_ref)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Report Date</div>
        <div class="cover-meta-value">${esc(r.meta.report_date)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Roadmap Deadline</div>
        <div class="cover-meta-value">${esc(r.meta.roadmap_deadline)}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Full Compliance Deadline</div>
        <div class="cover-meta-value">${esc(r.meta.compliance_deadline)}</div>
      </div>
    </div>
  </div>
  <div class="rating-banner ${rc}">
    <div class="rating-banner-left">
      <div class="rating-banner-eyebrow">Overall Compliance Risk Rating</div>
      <div class="rating-banner-value">${esc(r.overall_rating.rating)}</div>
      <div class="rating-banner-note">${esc(r.overall_rating.rating_label)}</div>
    </div>
  </div>`;
}

function buildSection1(r: AmlReportJson): string {
  const sc = r.scorecard;
  const rc = ratingClass(r.overall_rating.rating);
  return `
  <div class="report-section avoid-break">
    <div class="section-heading">Section 1: Executive Summary</div>

    <div class="subsection-heading">1.1 Institution Profile</div>
    <table class="profile-table">
      <tr><td class="field">Institution</td><td>${esc(r.meta.inst_name)}</td></tr>
      <tr><td class="field">Institution Type</td><td>${esc(r.meta.inst_type_full)}</td></tr>
      <tr><td class="field">CBN Risk Classification</td><td>${esc(r.meta.cbn_risk ?? "—")}</td></tr>
      <tr><td class="field">Transaction Volume</td><td>${esc(r.meta.tx_vol ?? "—")}</td></tr>
      <tr><td class="field">Geographic Footprint</td><td>${esc(r.meta.geo ?? "—")}</td></tr>
      <tr><td class="field">Compliance Deadline (Roadmap)</td><td class="deadline-val">${esc(r.meta.roadmap_deadline)}</td></tr>
      <tr><td class="field">Full Compliance Deadline</td><td class="deadline-val">${esc(r.meta.compliance_deadline)} (${esc(r.meta.compliance_deadline_basis)})</td></tr>
      <tr><td class="field">Circular Reference</td><td>${esc(r.meta.circular_ref)} — issued 10 March 2026</td></tr>
    </table>

    <div class="subsection-heading">1.2 Overall Compliance Risk Rating</div>
    <div class="rating-callout ${rc}">
      <div class="rating-callout-title">${esc(r.overall_rating.rating)}</div>
      <div class="rating-callout-body">${esc(r.overall_rating.summary_paragraph)}</div>
      <div class="rating-callout-note">${esc(r.overall_rating.sector_context_note)}</div>
    </div>

    <div class="subsection-heading">1.3 Assessment Scorecard</div>
    <table class="scorecard-table">
      <thead>
        <tr>
          <th>Assessment Dimension</th>
          <th>Score</th>
          <th style="text-align:right">Rating</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="sc-label">AML System Status</td>
          <td class="sc-score">${esc(sc.aml_system_status_label)}</td>
          <td class="sc-rating">${statusBadge(sc.aml_system_status_rating)}</td>
        </tr>
        <tr>
          <td class="sc-label">Standards Compliant (of 12)</td>
          <td class="sc-score">${esc(sc.standards_compliant_count)} / 12</td>
          <td class="sc-rating">${statusBadge(sc.standards_compliant_rating)}</td>
        </tr>
        <tr>
          <td class="sc-label">Standards with Critical Gap</td>
          <td class="sc-score">${esc(sc.standards_critical_gap_count)} / 12</td>
          <td class="sc-rating">${statusBadge(sc.standards_critical_gap_rating)}</td>
        </tr>
        <tr>
          <td class="sc-label">Standards with Gap Identified</td>
          <td class="sc-score">${esc(sc.standards_gap_identified_count)} / 12</td>
          <td class="sc-rating">${statusBadge("Gap Identified")}</td>
        </tr>
        <tr>
          <td class="sc-label">Governance Controls in Place</td>
          <td class="sc-score">${esc(sc.governance_score_label)}</td>
          <td class="sc-rating">${statusBadge(sc.governance_score_rating)}</td>
        </tr>
        <tr>
          <td class="sc-label">Internal Audit Coverage of AML</td>
          <td class="sc-score">${esc(sc.internal_audit_label)}</td>
          <td class="sc-rating">${statusBadge(sc.internal_audit_rating)}</td>
        </tr>
        <tr>
          <td class="sc-label">Risk Factors Identified</td>
          <td class="sc-score">${esc(sc.risk_factors_label)}</td>
          <td class="sc-rating">${statusBadge(sc.risk_factors_rating)}</td>
        </tr>
      </tbody>
    </table>
    <div class="info-box">
      <strong>Regulatory Context</strong>
      ${esc(sc.regulatory_context_box)}
    </div>
  </div>`;
}

function buildSection2(r: AmlReportJson): string {
  const standards = (r.standards || [])
    .map(
      (s) => `
    <tr class="${gapRowClass(s.status)}">
      <td><span class="gap-section-ref">${esc(s.section)}</span></td>
      <td><span class="gap-std-title">${esc(s.title)}</span></td>
      <td>${statusBadge(s.status)}</td>
      <td class="gap-finding">${esc(s.finding)}</td>
      <td class="gap-action">${esc(s.required_action)}</td>
    </tr>`
    )
    .join("");

  const ga = r.governance_assessment;
  const govRows = (ga.items || [])
    .map(
      (item) => `
    <tr>
      <td>${esc(item.control)}</td>
      <td style="text-align:right">${statusBadge(item.status)}</td>
    </tr>`
    )
    .join("");

  return `
  <div class="report-section page-break">
    <div class="section-heading">Section 2: Gap Analysis — 12 CBN Baseline Standards</div>
    <p class="section-intro">${esc(r.gap_analysis_intro)}</p>

    <table class="gap-table">
      <thead>
        <tr>
          <th style="width:6%">Std.</th>
          <th style="width:16%">Standard</th>
          <th style="width:12%">Status</th>
          <th style="width:41%">Finding</th>
          <th style="width:25%">Required Action</th>
        </tr>
      </thead>
      <tbody>${standards}</tbody>
    </table>

    <div class="subsection-heading" style="margin-top:40px">2.1 Governance Assessment</div>
    <p class="section-intro">${esc(ga.intro)}</p>
    <table class="gov-table">
      <thead>
        <tr>
          <th>Governance Control</th>
          <th style="text-align:right;width:180px">Current Status</th>
        </tr>
      </thead>
      <tbody>
        ${govRows}
        <tr class="gov-total">
          <td>Overall Governance Score</td>
          <td style="text-align:right">${esc(ga.overall_score_label)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function buildSection3(r: AmlReportJson): string {
  const actions = (r.priority_actions || [])
    .map(
      (a) => `
    <div class="priority-box avoid-break">
      <div class="priority-header">
        <div class="priority-number">${esc(a.number)}</div>
        <div class="priority-titles">
          <div class="priority-title">${esc(a.title)}</div>
          <div class="priority-deadline">${esc(a.deadline_label)}</div>
        </div>
      </div>
      <div class="priority-body">${esc(a.body)}</div>
    </div>`
    )
    .join("");

  return `
  <div class="report-section page-break">
    <div class="section-heading">Section 3: Top 5 Priority Actions Before ${esc(r.meta.roadmap_deadline)}</div>
    <p class="section-intro">The following five actions are the minimum required for ${esc(r.meta.inst_name)} to submit a credible, CBN-compliant implementation roadmap by the ${esc(r.meta.roadmap_deadline)} deadline. The roadmap submission itself is mandatory under Circular ${esc(r.meta.circular_ref)}.</p>
    ${actions}
  </div>`;
}

function buildSection4(r: AmlReportJson): string {
  const phases = (r.roadmap.phases || [])
    .map(
      (p) => `
    <tr>
      <td>
        <span class="roadmap-phase-header">${esc(p.title)}</span>
        <span class="roadmap-phase-timeline">${esc(p.timeline)}</span>
      </td>
      <td>${esc(p.objectives)}</td>
      <td>${esc(p.key_deliverables)}</td>
      <td>${esc(p.standards_addressed)}</td>
    </tr>`
    )
    .join("");

  return `
  <div class="report-section page-break">
    <div class="section-heading">Section 4: Recommended Implementation Roadmap</div>
    <p class="section-intro">${esc(r.roadmap.intro)}</p>
    <table class="roadmap-table">
      <thead>
        <tr>
          <th style="width:20%">Phase</th>
          <th style="width:22%">Objectives</th>
          <th style="width:35%">Key Deliverables</th>
          <th style="width:23%">CBN Standards Addressed</th>
        </tr>
      </thead>
      <tbody>${phases}</tbody>
    </table>
  </div>`;
}

function buildSection5(r: AmlReportJson): string {
  const ss = r.support_section;
  const products = (ss.products || [])
    .map(
      (p) => `
    <div class="product-card avoid-break">
      <div class="product-card-name">${esc(p.name)}</div>
      <div class="product-card-function">${esc(p.function)}</div>
      <div class="product-card-standards">${esc(p.standards_addressed)}</div>
      <div class="product-card-relevance">${esc(p.relevance_to_client)}</div>
    </div>`
    )
    .join("");

  const services = (ss.advisory_services || [])
    .map((s) => `<li>${esc(s)}</li>`)
    .join("");

  return `
  <div class="report-section page-break">
    <div class="section-heading">Section 5: How RegTech365 and OPEX Consulting Can Support</div>
    <p class="section-intro">${esc(ss.intro_paragraph)}</p>

    <div class="subsection-heading">5.1 Immediate Advisory Support — Roadmap Submission</div>
    <p class="section-intro">${esc(ss.advisory_intro)}</p>

    <div class="subsection-heading">5.2 RegTech365 Product Suite — Mapped to Your Gaps</div>
    <div class="product-grid">${products}</div>

    <div class="subsection-heading">5.3 OPEX Advisory Services</div>
    <ul class="advisory-list">${services}</ul>

    <div class="next-steps-box">
      <strong>Next Step</strong>
      ${esc(ss.next_steps_box)}
      <a class="next-steps-email" href="mailto:compliance@opexconsulting.ng">compliance@opexconsulting.ng</a>
    </div>
  </div>`;
}

function buildFooter(r: AmlReportJson): string {
  return `
  <div class="report-disclaimer">
    <p class="disclaimer-text"><strong>Disclaimer</strong>${esc(r.disclaimer)}</p>
  </div>
  <div class="report-footer">
    <span class="footer-brand">OPEX Consulting Limited &nbsp;|&nbsp; RegTech365</span>
    <span class="footer-ref">Circular ${esc(r.meta.circular_ref)} &nbsp;·&nbsp; ${esc(r.meta.report_date)}</span>
  </div>`;
}

/** ---------------------------------------------------------------
 * Fetches the CSS from the template so we can embed it in the
 * off-screen container used for PDF rendering.
 * --------------------------------------------------------------- */
async function fetchTemplateCSS(): Promise<string> {
  // The template HTML is served from /temp/cbn_aml_report_template.html
  // We only need the <style> block — fetch it and strip prose outside <style>
  try {
    const res = await fetch("/temp/cbn_aml_report_template.html");
    const html = await res.text();
    const match = html.match(/<style>([\s\S]*?)<\/style>/i);
    return match ? match[1] : "";
  } catch {
    return ""; // gracefully degrade
  }
}

/** ---------------------------------------------------------------
 * Core render function — returns a populated HTML string
 * --------------------------------------------------------------- */
export function buildReportHtml(reportData: AmlReportJson): string {
  const r = { ...reportData };

  // Inject passthrough meta fields from _input if AI didn't echo them
  if (r._input) {
    r.meta.cbn_risk = r.meta.cbn_risk || r._input.cbn_risk || "—";
    r.meta.tx_vol = r.meta.tx_vol || txVolLabel(r._input.tx_vol ?? "");
    r.meta.geo = r.meta.geo || r._input.geo || "—";
  }

  return `
    <div class="report-wrapper">
      ${buildCover(r)}
      <div class="report-body">
        ${buildSection1(r)}
        ${buildSection2(r)}
        ${buildSection3(r)}
        ${buildSection4(r)}
        ${buildSection5(r)}
      </div>
      ${buildFooter(r)}
    </div>`;
}

/** ---------------------------------------------------------------
 * generatePdf — renders report HTML off-screen and exports PDF
 *
 * @param reportData  Parsed AI output JSON
 * @param onProgress  Optional callback receiving progress 0–100
 * --------------------------------------------------------------- */
export async function generatePdf(
  reportData: AmlReportJson,
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(5);

  // Fetch the CSS from the template
  const css = await fetchTemplateCSS();
  onProgress?.(10);

  // Build report HTML
  const reportHtml = buildReportHtml(reportData);

  // Create an off-screen container with the full report HTML + CSS
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;top:0;left:0;width:900px;z-index:-9999;pointer-events:none;background:white;";
  container.innerHTML = `<style>${css}</style>${reportHtml}`;
  document.body.appendChild(container);

  onProgress?.(20);

  // Wait a frame for fonts/layout to settle
  await new Promise((r) => setTimeout(r, 600));
  onProgress?.(30);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 900,
      windowWidth: 900,
      onclone: (_doc, el) => {
        el.style.position = "static";
        el.style.zIndex = "auto";
      },
    });
    onProgress?.(75);

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const ratio = pdfW / canvasW;
    const totalPdfH = canvasH * ratio;

    let yOffset = 0;
    let page = 0;

    while (yOffset < totalPdfH) {
      if (page > 0) pdf.addPage();

      // Crop the segment for this page
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasW;
      pageCanvas.height = Math.min(pdfH / ratio, canvasH - yOffset / ratio);
      const ctx = pageCanvas.getContext("2d")!;
      ctx.drawImage(
        canvas,
        0,
        (yOffset / ratio),
        canvasW,
        pageCanvas.height,
        0,
        0,
        canvasW,
        pageCanvas.height
      );

      const pageImg = pageCanvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(pageImg, "JPEG", 0, 0, pdfW, pageCanvas.height * ratio);
      yOffset += pdfH;
      page++;
    }

    onProgress?.(90);

    // Build filename: CBN_AML_Gap_Assessment_InstitutionName_April2026.pdf
    const safeName = (reportData.meta.inst_name || "Institution")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    const filename = `CBN_AML_Gap_Assessment_${safeName}_April2026.pdf`;

    pdf.save(filename);
    onProgress?.(100);
  } finally {
    document.body.removeChild(container);
  }
}

/** ---------------------------------------------------------------
 * openReportInTab — alternative to PDF: opens the rendered report
 * in a new browser tab (useful for debugging)
 * --------------------------------------------------------------- */
export async function openReportInTab(reportData: AmlReportJson): Promise<void> {
  const css = await fetchTemplateCSS();
  const reportHtml = buildReportHtml(reportData);
  const fullHtml = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <title>CBN AML Report — ${reportData.meta.inst_name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>${css}</style>
  </head><body>${reportHtml}</body></html>`;
  const blob = new Blob([fullHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
