import React, { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TextField,
  RadioGroupField,
  CheckboxGroupField,
  CheckboxField,
  SelectField,
  TextAreaField,
  CoverageRow,
  InfoBox,
} from "@/components/FormFields";
import { RiskFlagItem, GovItem } from "@/components/GovAndRiskFields";
import { ReportLoadingScreen } from "@/components/ReportLoadingScreen";
import { generatePdf, type AmlReportJson } from "@/lib/reportGenerator";

/* ═══════════════════════════════════════════════════════════════════════
   FORM DATA
   ═══════════════════════════════════════════════════════════════════════ */

interface FormData {
  // S1: Institution
  instName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  instType: string;
  // S2: Scale & Risk
  txVol: string;
  custBase: string;
  cbnRisk: string;
  geo: string;
  group: string;
  products: string[];
  channels: string[];
  // S3: Risk Factors
  riskFactors: string[];
  // S4: AML System Status + Coverage
  amlStatus: string;
  covCdd: string;
  covSanctions: string;
  covTxmon: string;
  covFraud: string;
  covCase: string;
  covReporting: string;
  covRisk: string;
  covAudit: string;
  covSecurity: string;
  aiml: string;
  autoClose: string;
  // S5: Governance
  governance: Record<string, string>;
  audit: string;
  roadmapStatus: string;
  // S6: KYC/CDD
  bvnStatus: string;
  kycReview: string;
  uboMap: string;
  // S7: Sanctions & Fraud
  sanctionsCapab: string;
  sanctionLists: string[];
  fraudCapab: string;
  fraudFeed: string;
  // S8: Reporting & Security
  reportingMethod: string;
  reportApproval: string;
  encryption: string;
  mfa: string;
  dataSov: string;
  biaStatus: string;
  // S9: Vendor, Context
  implApproach: string;
  vendorStatus: string;
  biggestConcern: string;
  regulatoryContext: string;
  supportNeeds: string[];
  extraContext: string;
  marketingConsent: boolean;
}

const initialData: FormData = {
  instName: "", contactName: "", contactEmail: "", contactPhone: "", contactRole: "", instType: "",
  txVol: "", custBase: "", cbnRisk: "", geo: "", group: "", products: [], channels: [],
  riskFactors: [],
  amlStatus: "", covCdd: "", covSanctions: "", covTxmon: "", covFraud: "", covCase: "",
  covReporting: "", covRisk: "", covAudit: "", covSecurity: "", aiml: "", autoClose: "",
  governance: {}, audit: "", roadmapStatus: "",
  bvnStatus: "", kycReview: "", uboMap: "",
  sanctionsCapab: "", sanctionLists: [], fraudCapab: "", fraudFeed: "",
  reportingMethod: "", reportApproval: "", encryption: "", mfa: "", dataSov: "", biaStatus: "",
  implApproach: "", vendorStatus: "", biggestConcern: "", regulatoryContext: "", supportNeeds: [], extraContext: "",
  marketingConsent: false,
};

const TOTAL_STEPS = 10; // 9 data sections + 1 review

/* ═══════════════════════════════════════════════════════════════════════
   OPTIONS
   ═══════════════════════════════════════════════════════════════════════ */

const institutionTypes = [
  { id: "it-dmb", value: "DMB", label: "Deposit Money Bank (DMB)" },
  { id: "it-mfb", value: "MFB", label: "Microfinance Bank (MFB)" },
  { id: "it-imto", value: "IMTO", label: "International Money Transfer Operator (IMTO)" },
  { id: "it-psp", value: "PSP", label: "Payment Service Provider (PSP)" },
  { id: "it-mmo", value: "MMO", label: "Mobile Money Operator (MMO)" },
  { id: "it-fc", value: "Fintech", label: "Fintech / Other CBN-Licenced Entity" },
];

const txVolOptions = [
  { id: "tv1", value: "<1K", label: "Under 1,000/day" },
  { id: "tv2", value: "1K-50K", label: "1,000 – 50,000/day" },
  { id: "tv3", value: "50K-500K", label: "50,000 – 500,000/day" },
  { id: "tv4", value: ">500K", label: "Over 500,000/day" },
];

const custBaseOptions = [
  { id: "cb1", value: "<10K", label: "Under 10,000" },
  { id: "cb2", value: "10K-100K", label: "10,000 – 100,000" },
  { id: "cb3", value: "100K-500K", label: "100,000 – 500,000" },
  { id: "cb4", value: ">500K", label: "Over 500,000" },
];

const cbnRiskOptions = [
  { id: "cr-low", value: "Low", label: "Low risk" },
  { id: "cr-med", value: "Medium", label: "Medium risk" },
  { id: "cr-high", value: "High", label: "High risk" },
  { id: "cr-na", value: "Not assessed", label: "Not yet assessed" },
];

const productOptions = [
  { id: "p1", value: "Retail deposits", label: "Retail deposits" },
  { id: "p2", value: "Trade finance", label: "Trade finance" },
  { id: "p3", value: "Virtual assets / crypto", label: "Virtual assets / crypto" },
  { id: "p4", value: "Agent banking", label: "Agent banking" },
  { id: "p5", value: "FX / remittance", label: "FX / remittance" },
  { id: "p6", value: "Credit / loans", label: "Credit / loans" },
  { id: "p7", value: "Card issuance", label: "Card issuance" },
  { id: "p8", value: "Mobile money", label: "Mobile money" },
  { id: "p9", value: "Insurance / bancassurance", label: "Insurance / bancassurance" },
  { id: "p10", value: "Payment processing", label: "Payment processing" },
  { id: "p11", value: "Corporate banking", label: "Corporate banking" },
];

const channelOptions = [
  { id: "ch1", value: "Branch network", label: "Branch network" },
  { id: "ch2", value: "Mobile app", label: "Mobile app" },
  { id: "ch3", value: "USSD", label: "USSD" },
  { id: "ch4", value: "Internet banking", label: "Internet banking" },
  { id: "ch5", value: "API / open banking", label: "API / open banking" },
  { id: "ch6", value: "SWIFT", label: "SWIFT" },
  { id: "ch7", value: "ATM / POS", label: "ATM / POS" },
  { id: "ch8", value: "Agent network", label: "Agent network" },
  { id: "ch9", value: "NIP / NCS", label: "NIP / NCS" },
  { id: "ch10", value: "Third-party integrations", label: "Third-party integrations" },
];

const amlStatusOptions = [
  { id: "as-none", value: "None", label: "No AML system — compliance is manual or spreadsheet-based" },
  { id: "as-manual", value: "Manual", label: "Manual — spreadsheets / paper-based processes" },
  { id: "as-partial", value: "Partial", label: "Standalone / partial tools — not fully integrated" },
  { id: "as-full", value: "Full", label: "Integrated automated AML platform in place" },
];

const aimlOptions = [
  { id: "ai-yes", value: "Yes - in use", label: "Yes — currently in use" },
  { id: "ai-plan", value: "Yes - planned", label: "Yes — planned" },
  { id: "ai-no", value: "No", label: "No — rules-based only" },
  { id: "ai-unk", value: "Unknown", label: "Not sure" },
];

const autoCloseOptions = [
  { id: "ac-yes", value: "Yes", label: "Yes — alerts can be auto-closed" },
  { id: "ac-no", value: "No", label: "No — all alerts require manual review" },
];

const riskFactorLabels = [
  "We serve or are likely to serve Politically Exposed Persons (PEPs)",
  "We process cross-border / FX transactions",
  "We operate through third-party agents or sub-agents",
  "We issue or process card products",
  "We have experienced material fraud in the past 24 months",
  "We handle high-volume cash transactions",
  "We interact with virtual assets or crypto-adjacent products",
];
const riskFactorValues = [
  "PEP exposure", "Cross-border FX", "Agent banking network",
  "Card products", "Material fraud exposure", "High-volume cash",
  "Virtual assets",
];

const govItems = [
  { id: "mlro", label: "Formally designated MLRO or CCO" },
  { id: "board-policy", label: "Board-approved AML/CFT/CPF policy currently in effect" },
  { id: "aml-gov-framework", label: "Documented AML solution governance framework" },
  { id: "change-control", label: "Formal change control process for AML system configurations" },
  { id: "model-gov", label: "Model governance committee for AI/ML components" },
  { id: "alert-sla", label: "Documented alert review SLAs for high-risk alerts" },
  { id: "vendor-policy", label: "Vendor/Third-Party Management Policy" },
  { id: "data-retention", label: "Documented data retention and destruction policy" },
  { id: "bvn-nin", label: "BVN/NIN integration for customer identity corroboration" },
  { id: "training", label: "AML team training programme with documented records" },
];

const auditOptions = [
  { id: "aud-none", value: "Not covered", label: "Not covered" },
  { id: "aud-ann", value: "Annually", label: "Annually" },
  { id: "aud-bi", value: "Twice a year", label: "Twice a year" },
  { id: "aud-qtr", value: "Quarterly", label: "Quarterly" },
];

const roadmapOptions = [
  { id: "rm-na", value: "Not started", label: "Not started — we were not fully aware or haven't begun" },
  { id: "rm-aware", value: "Aware", label: "Aware of the deadline but preparation has not begun" },
  { id: "rm-progress", value: "In progress", label: "In progress — we have started internal drafting" },
  { id: "rm-consultant", value: "Engaging consultant", label: "Engaging a consultant to support preparation" },
  { id: "rm-done", value: "Submitted", label: "Already submitted" },
];

const bvnOptions = [
  { id: "bvn-none", value: "No integration", label: "No BVN/NIN integration" },
  { id: "bvn-manual", value: "Manual", label: "Manual verification — staff check BVN/NIN separately" },
  { id: "bvn-batch", value: "Batch", label: "Batch integration — periodic, not real-time" },
  { id: "bvn-real", value: "Real-time", label: "Real-time API integration with automated matching" },
];

const kycReviewOptions = [
  { id: "kyc-none", value: "No review", label: "No periodic KYC review process" },
  { id: "kyc-manual", value: "Manual", label: "Manual / ad-hoc review only" },
  { id: "kyc-partial", value: "Partial", label: "Partial — some automated triggers" },
  { id: "kyc-full", value: "Full", label: "Fully automated risk-based periodic review" },
];

const uboOptions = [
  { id: "ubo-none", value: "None", label: "No UBO identification process" },
  { id: "ubo-manual", value: "Manual", label: "Manual — paper-based identification" },
  { id: "ubo-partial", value: "Partial", label: "Partial — some customers mapped" },
  { id: "ubo-full", value: "Full", label: "Full — automated UBO mapping and monitoring" },
];

const sanctionsCapabOptions = [
  { id: "sc-none", value: "None", label: "None — no screening in place" },
  { id: "sc-manual", value: "Manual", label: "Manual list checks by compliance staff" },
  { id: "sc-batch", value: "Batch", label: "Batch screening — periodic, not real-time" },
  { id: "sc-rt", value: "Real-time basic", label: "Real-time screening but no AI/fuzzy matching" },
  { id: "sc-full", value: "Real-time AI", label: "Real-time with AI/fuzzy matching and auto-blocking" },
];

const sanctionListOptions = [
  { id: "sl-cbn", value: "CBN / EFCC domestic lists", label: "CBN / EFCC domestic lists" },
  { id: "sl-ofac", value: "OFAC (US Treasury)", label: "OFAC (US Treasury)" },
  { id: "sl-un", value: "UN Security Council list", label: "UN Security Council list" },
  { id: "sl-eu", value: "EU sanctions list", label: "EU sanctions list" },
  { id: "sl-uk", value: "UK HMT sanctions list", label: "UK HMT sanctions list" },
];

const fraudCapabOptions = [
  { id: "fc-none", value: "None", label: "No fraud monitoring system in place" },
  { id: "fc-manual", value: "Manual", label: "Manual monitoring by operations/compliance" },
  { id: "fc-partial", value: "Partial", label: "Partial — some automated rules" },
  { id: "fc-full", value: "Full", label: "Real-time automated fraud monitoring" },
];

const fraudFeedOptions = [
  { id: "ff-no", value: "No", label: "No — fraud and AML operate in separate silos" },
  { id: "ff-partial", value: "Partial", label: "Partially — some manual crossover" },
  { id: "ff-yes", value: "Yes", label: "Yes — fraud indicators auto-update ML/TF risk profiles" },
];

const reportingMethodOptions = [
  { id: "rp-none", value: "Not filing", label: "We are not currently filing reports" },
  { id: "rp-email", value: "Manual email", label: "Manual drafting and email submission" },
  { id: "rp-portal", value: "goAML portal", label: "Manual entry into goAML web portal" },
  { id: "rp-partial", value: "Partial auto", label: "Partially automated — some auto-drafted, filed manually" },
  { id: "rp-full", value: "Fully automated", label: "Fully automated — generated and submitted from AML system" },
];

const reportApprovalOptions = [
  { id: "ra-none", value: "No process", label: "No formal review process" },
  { id: "ra-informal", value: "Informal", label: "Informal review by compliance" },
  { id: "ra-documented", value: "Documented", label: "Documented approval workflow with audit trail" },
];

const encryptionOptions = [
  { id: "enc-none", value: "None", label: "No encryption in place" },
  { id: "enc-partial", value: "Partial", label: "Partial (some data encrypted)" },
  { id: "enc-rest", value: "At rest only", label: "Encrypted at rest only" },
  { id: "enc-full", value: "Full", label: "Encrypted at rest, in use, and in transit" },
];

const mfaOptions = [
  { id: "mfa-none", value: "Not enforced", label: "MFA not enforced" },
  { id: "mfa-partial", value: "Partial", label: "MFA for some users only" },
  { id: "mfa-full", value: "Full", label: "MFA enforced for all AML system users" },
];

const dataSovOptions = [
  { id: "ds-offshore", value: "Offshore", label: "Offshore / outside Nigeria" },
  { id: "ds-unsure", value: "Not confirmed", label: "Not confirmed — we are unsure" },
  { id: "ds-ng", value: "Nigeria", label: "In Nigeria — compliant with NDPA" },
];

const biaOptions = [
  { id: "bia-none", value: "No BIA", label: "No BIA in place" },
  { id: "bia-partial", value: "BIA no AML", label: "BIA exists but AML not specifically included" },
  { id: "bia-full", value: "BIA with AML", label: "BIA includes AML with defined RTO/RPO" },
];

const implApproachOptions = [
  { id: "ia-new", value: "New platform", label: "Deploy a new integrated AML platform from scratch" },
  { id: "ia-upgrade", value: "Upgrade existing", label: "Upgrade and extend our existing system" },
  { id: "ia-hybrid", value: "Hybrid", label: "Hybrid — keep some existing tools, add new modules" },
  { id: "ia-undecided", value: "Undecided", label: "Not yet decided — we need guidance" },
];

const vendorStatusOptions = [
  { id: "vs-none", value: "Not started", label: "No — haven't started vendor evaluation" },
  { id: "vs-research", value: "Researching", label: "Researching options but haven't seen demos" },
  { id: "vs-demos", value: "Demos seen", label: "Have seen demos from one or more vendors" },
  { id: "vs-selected", value: "Vendor selected", label: "Selected a vendor — in contract discussions" },
  { id: "vs-contracted", value: "Contracted", label: "Vendor contracted — implementation has begun" },
];

const supportOptions = [
  { 
    id: "su-roadmap", 
    value: "CBN Roadmap Template completion", 
    label: "Help completing the CBN Roadmap Template by June 10",
    description: "Mandatory 12-section submission required for all CBN-licenced institutions."
  },
  { 
    id: "su-policy", 
    value: "AML/CFT/CPF policy drafting", 
    label: "Drafting or reviewing our AML/CFT/CPF policy",
    description: "Tailored policies aligned with the new 2026 Baseline Standards and ISO 42001."
  },
  { id: "su-vendor", value: "Vendor evaluation support", label: "Vendor evaluation and AML platform selection" },
  {
    id: "su-demo",
    value: "RegTech365 product demo",
    label: "Demonstration of the RegTech365 Product Suite",
    description: "Including RegPort (AML), RegGuard (Fraud), RegComply (GRC), RegWatch (Intelligence), and RegLearn (Academy).",
  },
  { id: "su-e2e", value: "End-to-end implementation", label: "End-to-end implementation support through March 2028" },
  { id: "su-audit", value: "Internal audit co-sourcing", label: "Internal audit co-sourcing for AML" },
  {
    id: "su-training",
    value: "Staff AML training",
    label: "Staff AML training (RegLearn academy)",
    description: "On-demand AML/CFT, DPO, and Risk tracks with management dashboards and documented records.",
  },
  { id: "su-iso", value: "ISO alignment advisory", label: "ISO 27001 / ISO 42001 alignment advisory" },
];

/* ═══════════════════════════════════════════════════════════════════════
   COVERAGE MATRIX DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════ */

const coverageItems: { key: keyof FormData; name: string; desc: string }[] = [
  { key: "covCdd", name: "CDD, KYC and KYB", desc: "Automated with BVN/NIN linkage — 5.2" },
  { key: "covSanctions", name: "Sanction Lists & PEP Screening", desc: "Real-time with fuzzy matching — 5.3" },
  { key: "covTxmon", name: "Transaction Monitoring & Risk-Based Analyses", desc: "Rules-based and/or AI/ML with alert generation — 5.5" },
  { key: "covFraud", name: "Fraud Monitoring and Detection", desc: "Real-time across cards, e-channels, digital — 5.6" },
  { key: "covCase", name: "Case Management", desc: "Enterprise ECM with maker-checker and audit trail — 5.7" },
  { key: "covReporting", name: "Reporting", desc: "Automated generation (STR/CTR/SAR/FTR) — 5.8" },
  { key: "covRisk", name: "Risk Assessment", desc: "Dynamic profiling tied to documented risk appetite — 5.4" },
  { key: "covAudit", name: "Audit and Governance", desc: "Tamper-proof logs and configuration trails — 5.9" },
  { key: "covSecurity", name: "Security & Data Protection", desc: "Encryption, MFA, data sovereignty, BIA — 5.11" },
];

/* ═══════════════════════════════════════════════════════════════════════
   PERSISTENCE
   ═══════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "aml_assessment_draft";
const REPORT_API_URL = "http://localhost:8000/api/v1/generate-aml-report";
// const REPORT_API_URL = "https://regtech365-ai.gentlemeadow-8588bc06.eastus.azurecontainerapps.io/api/v1/generate-aml-report";

const loadDraft = (): { step: number; data: FormData } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { step: parsed.step || 1, data: { ...initialData, ...parsed.data } };
    }
  } catch { /* ignore */ }
  return { step: 1, data: initialData };
};

/* ═══════════════════════════════════════════════════════════════════════
   DATA MAPPING — form state → DB + AI prompt
   ═══════════════════════════════════════════════════════════════════════ */

function deriveAmlFunctions(d: FormData): string[] {
  const map: [keyof FormData, string][] = [
    ["covCdd", "CDD/KYC/KYB"],
    ["covSanctions", "Sanctions & PEP screening"],
    ["covRisk", "Customer risk assessment"],
    ["covTxmon", "Transaction monitoring"],
    ["covFraud", "Fraud monitoring"],
    ["covCase", "Case management"],
    ["covReporting", "Regulatory reporting (STR/CTR)"],
    ["covAudit", "Audit trail"],
  ];
  return map
    .filter(([key]) => d[key] && d[key] !== "none")
    .map(([, label]) => label);
}

function buildInputJson(d: FormData) {
  return {
    inst_name: d.instName,
    contact_name: d.contactName,
    contact_email: d.contactEmail,
    contact_phone: d.contactPhone,
    contact_role: d.contactRole,
    inst_type: d.instType,
    tx_vol: d.txVol,
    cust_base: d.custBase,
    cbn_risk: d.cbnRisk,
    geo: d.geo,
    group_structure: d.group,
    products: d.products,
    channels: d.channels,
    aml_status: d.amlStatus,
    aml_functions: deriveAmlFunctions(d),
    aiml: d.aiml,
    auto_close: d.autoClose,
    risk_factors: d.riskFactors,
    governance: d.governance,
    audit: d.audit,
    extra_context: d.extraContext,
    // New granular fields
    cov_cdd: d.covCdd,
    cov_sanctions: d.covSanctions,
    cov_txmon: d.covTxmon,
    cov_fraud: d.covFraud,
    cov_case: d.covCase,
    cov_reporting: d.covReporting,
    cov_risk: d.covRisk,
    cov_audit: d.covAudit,
    cov_security: d.covSecurity,
    bvn_status: d.bvnStatus,
    kyc_review: d.kycReview,
    ubo_map: d.uboMap,
    sanctions_capab: d.sanctionsCapab,
    sanction_lists: d.sanctionLists,
    fraud_capab: d.fraudCapab,
    fraud_feed: d.fraudFeed,
    reporting_method: d.reportingMethod,
    report_approval: d.reportApproval,
    encryption: d.encryption,
    mfa: d.mfa,
    data_sov: d.dataSov,
    bia_status: d.biaStatus,
    impl_approach: d.implApproach,
    vendor_status: d.vendorStatus,
    roadmap_status: d.roadmapStatus,
    biggest_concern: d.biggestConcern,
    regulatory_context: d.regulatoryContext,
    support: d.supportNeeds,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

const AssessmentForm: React.FC = () => {
  const draft = loadDraft();
  const [step, setStep] = useState(draft.step);
  const [data, setData] = useState<FormData>(draft.data);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportProgress, setReportProgress] = useState<number | null>(null);
  const [reportData, setReportData] = useState<AmlReportJson | null>(null);
  const assessmentIdRef = React.useRef<string | null>(null);
  const [regwatchCtaStatus, setRegwatchCtaStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
  }, [step, data]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const setGov = (id: string, val: string) => {
    setData((prev) => ({ ...prev, governance: { ...prev.governance, [id]: val } }));
  };

  const toggleRisk = (val: string, checked: boolean) => {
    setData((prev) => ({
      ...prev,
      riskFactors: checked ? [...prev.riskFactors, val] : prev.riskFactors.filter((v) => v !== val),
    }));
  };

  /* ── Validation ─────────────────────────────────────────────────────── */

  const validateStep = useCallback((s: number, d: FormData): string[] => {
    const errs: string[] = [];
    switch (s) {
      case 1:
        if (!d.instName.trim()) errs.push("Institution name is required");
        if (!d.contactName.trim()) errs.push("Contact name is required");
        if (!d.contactEmail.trim()) errs.push("Work email is required");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contactEmail)) errs.push("Please enter a valid email");
        if (!d.contactRole.trim()) errs.push("Role is required");
        if (!d.instType) errs.push("Please select an institution type");
        if (!d.marketingConsent) errs.push("Please consent to receive regulatory updates to proceed");
        break;
      case 2:
        if (!d.txVol) errs.push("Please select daily transaction volume");
        if (!d.custBase) errs.push("Please select customer base size");
        if (!d.cbnRisk) errs.push("Please select CBN risk classification");
        break;
      case 4:
        if (!d.amlStatus) errs.push("Please select AML system status");
        break;
      case 5:
        if (Object.keys(d.governance).length < 10) errs.push("Please answer all 10 governance questions");
        if (!d.audit) errs.push("Please select internal audit frequency");
        break;
    }
    return errs;
  }, []);

  const goTo = useCallback((n: number) => {
    setStep(n);
    setErrors([]);
    setShowErrors(false);
    window.scrollTo(0, 0);
  }, []);

  const tryNext = useCallback((nextStep: number) => {
    const errs = validateStep(step, data);
    if (errs.length > 0) {
      setErrors(errs);
      setShowErrors(true);
      window.scrollTo(0, 0);
      return;
    }
    setErrors([]);
    setShowErrors(false);
    setStep(nextStep);
    window.scrollTo(0, 0);
  }, [step, data, validateStep]);

  /* ── Submission ─────────────────────────────────────────────────────── */

  const startDownload = async () => {
    if (!reportData) return;
    const toastId = toast.loading("Building your high-fidelity PDF... Please wait.");
    try {
      await generatePdf(reportData, (pct) => {
        if (pct === 100) setReportProgress(100);
      });
      toast.success("Report downloaded successfully.", { id: toastId });
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed. Please try again.", { id: toastId });
    }
  };

  const generateReport = async () => {
    setSubmitting(true);
    setReportProgress(0);

    const inputJson = buildInputJson(data);
    const assessmentId = crypto.randomUUID();
    assessmentIdRef.current = assessmentId;

    // Save to Supabase
    try {
      const { data: insertData, error: insertError } = await supabase
        .from("assessments")
        .insert({ ...inputJson, id: assessmentId })
        .select("id")
        .single();

      if (insertError) throw insertError;
      
      assessmentIdRef.current = insertData.id;
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      console.error("Failed to save assessment:", err);
      toast.error("Failed to save assessment. Please try again.");
      setSubmitting(false);
      setReportProgress(null);
      return;
    }

    setReportProgress(5);

    // Generate report from external AML report API
    let reportJson: AmlReportJson;
    let progressInterval: number | undefined;
    try {
      progressInterval = window.setInterval(() => {
        setReportProgress((prev) => {
          if (prev === null) return prev;
          if (prev >= 96) return prev;
          const next = prev < 60 ? prev + 6 : prev + 2;
          return Math.min(next, 96);
        });
      }, 1800);

      const response = await fetch(REPORT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(inputJson),
      });

      const fnData = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg =
          fnData?.detail?.[0]?.msg ||
          fnData?.error ||
          `Report API failed with status ${response.status}`;
        throw new Error(errMsg);
      }

      if (!fnData?.report) throw new Error("Report API returned no report data.");

      reportJson = fnData.report as AmlReportJson;
      reportJson._input = {
        inst_name: data.instName,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        contact_role: data.contactRole,
        cbn_risk: data.cbnRisk,
        tx_vol: data.txVol,
        geo: data.geo,
      };

      // Persist report JSON for audit
      const { error: updateError, data: updateData } = await supabase
        .from("assessments")
        .update({ report_json: reportJson })
        .eq("id", assessmentIdRef.current)
        .select("id");

      if (updateError) {
        console.error("Failed to save report_json:", updateError);
      } else if (!updateData || updateData.length === 0) {
        console.warn("⚠️ No rows were updated with report_json. This usually means the RLS 'update' policy is missing or targeting the wrong ID.", { id: assessmentIdRef.current });
      } else {
        console.log("✅ Successfully saved report_json for assessment:", assessmentIdRef.current);
      }

      setReportData(reportJson);
      setReportProgress(100);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Report generation failed:", err);
      toast.error(`Report generation failed: ${err.message ?? "Unknown error"}`);
      setSubmitting(false);
      setReportProgress(null);
    } finally {
      if (progressInterval) window.clearInterval(progressInterval);
    }
  };

  const handleGetFullReport = async () => {
    if (!reportData) return;
    setRegwatchCtaStatus("loading");
    try {
      const gapAreas = reportData.standards.filter((s) => s.status !== "Compliant").map((s) => s.section);
      const score = Math.round(((reportData.scorecard.standards_compliant_count ?? 0) / 12) * 100);
      const { error } = await supabase.functions.invoke("aml-lead-notify", {
        body: {
          email: data.contactEmail,
          fullName: data.contactName,
          institutionName: data.instName,
          institutionType: data.instType,
          dailyTransactionVolume: data.txVol,
          cbnRiskClassification: data.cbnRisk,
          lovableAssessmentId: assessmentIdRef.current,
          lovableScore: score,
          lovableGapAreas: gapAreas,
        },
      });
      if (error) throw error;
      setRegwatchCtaStatus("sent");
    } catch {
      setRegwatchCtaStatus("error");
    }
  };

  const handleStartNewAssessment = () => {
    assessmentIdRef.current = null;
    setSubmitting(false);
    setReportProgress(null);
    setReportData(null);
    setRegwatchCtaStatus("idle");
    setErrors([]);
    setShowErrors(false);
    setStep(1);
    setData(initialData);
    localStorage.removeItem(STORAGE_KEY);
    window.scrollTo(0, 0);
  };

  /* ── Loading screen ─────────────────────────────────────────────────── */

  if (reportProgress !== null) {
    return (
      <ReportLoadingScreen
        progress={reportProgress}
        institutionName={data.instName}
        onDownload={startDownload}
        onStartNewAssessment={handleStartNewAssessment}
        onGetFullReport={handleGetFullReport}
        regwatchCtaStatus={regwatchCtaStatus}
      />
    );
  }

  /* ── Derived ────────────────────────────────────────────────────────── */

  const pct = Math.round((Math.min(step, 9) / 9) * 100);
  const govYes = Object.values(data.governance).filter((v) => v === "Yes").length;
  const sectionLabel = step <= 9 ? `Section ${step} of 9` : "Review & Submit";

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6 pb-12">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-6">
        <img src="/reglogo.svg" alt="RegTech365" className="h-5" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground mb-1">CBN AML Baseline Standards Gap Assessment</h1>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Calibrated to CBN Circular BSD/DIR/PUB/LAB/019/002 (March 2026). Complete all sections honestly — your answers directly shape the gap report.
      </p>

      {/* Progress */}
      <div className="bg-muted rounded-full h-1.5 mb-2">
        <div className="bg-primary rounded-full h-1.5 transition-all duration-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mb-8">
        <span>{sectionLabel}</span>
        <span>{pct}%</span>
      </div>

      {/* Validation errors */}
      {showErrors && errors.length > 0 && (
        <div className="bg-destructive-light border border-destructive/30 rounded-md px-4 py-3 mb-6">
          <p className="text-sm font-medium text-destructive mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside text-[13px] text-destructive space-y-0.5">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* ── S1: Institution Profile ───────────────────────────────────── */}
      {step === 1 && (
        <div>
          <SectionHeader num="01" title="Institution Profile" sub="Tell us about your institution. This calibrates your CBN risk classification and compliance deadline." />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Institution name" value={data.instName} onChange={(v) => update("instName", v)} placeholder="e.g. Sunrise Microfinance Bank" />
            <TextField label="Contact person (compliance lead)" value={data.contactName} onChange={(v) => update("contactName", v)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Work email" value={data.contactEmail} onChange={(v) => update("contactEmail", v)} placeholder="name@institution.com" type="email" />
            <TextField label="Phone (optional)" value={data.contactPhone} onChange={(v) => update("contactPhone", v)} placeholder="+234…" type="tel" />
          </div>
          <TextField label="Your role / title" value={data.contactRole} onChange={(v) => update("contactRole", v)} placeholder="e.g. Chief Compliance Officer" />
          <RadioGroupField label="Institution type" name="inst-type" options={institutionTypes} value={data.instType} onChange={(v) => update("instType", v)} columns={2} />
          <div className="mt-8 mb-6">
            <CheckboxField 
              label="I consent to receive promotional emails, regulatory updates, and advisory insights from OPEX Consulting and RegTech365 (required)."
              checked={data.marketingConsent}
              onChange={(v) => update("marketingConsent", v)}
            />
          </div>
          <NavButtons onNext={() => tryNext(2)} />
        </div>
      )}

      {/* ── S2: Scale & Risk Profile ──────────────────────────────────── */}
      {step === 2 && (
        <div>
          <SectionHeader num="02" title="Scale & Risk Profile" sub="Proportionality applies — but all institutions must comply. Larger and higher-risk institutions face heightened requirements." />
          <RadioGroupField label="Daily transaction volume" name="tx-vol" options={txVolOptions} value={data.txVol} onChange={(v) => update("txVol", v)} />
          <RadioGroupField label="Active customer base" name="cust-base" options={custBaseOptions} value={data.custBase} onChange={(v) => update("custBase", v)} />
          <RadioGroupField label="CBN risk classification" name="cbn-risk" options={cbnRiskOptions} value={data.cbnRisk} onChange={(v) => update("cbnRisk", v)} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Geographic footprint" value={data.geo} onChange={(v) => update("geo", v)} options={["Single state", "Multiple states", "Cross-border"]} />
            <SelectField label="Group structure" value={data.group} onChange={(v) => update("group", v)} options={["Standalone", "Subsidiary", "Group holding", "Shared services"]} />
          </div>
          <CheckboxGroupField label="Products & services offered" options={productOptions} values={data.products} onChange={(v) => update("products", v)} />
          <CheckboxGroupField label="Delivery channels" options={channelOptions} values={data.channels} onChange={(v) => update("channels", v)} />
          <NavButtons onBack={() => goTo(1)} onNext={() => tryNext(3)} />
        </div>
      )}

      {/* ── S3: Risk Factors ──────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <SectionHeader num="03" title="Risk Factors" sub="These factors trigger enhanced monitoring obligations under the Baseline Standards. Select all that apply." />
          <div className="flex flex-col gap-2 mb-5">
            {riskFactorLabels.map((label, i) => (
              <RiskFlagItem
                key={riskFactorValues[i]}
                label={label}
                checked={data.riskFactors.includes(riskFactorValues[i])}
                onChange={(checked) => toggleRisk(riskFactorValues[i], checked)}
              />
            ))}
          </div>
          <NavButtons onBack={() => goTo(2)} onNext={() => tryNext(4)} />
        </div>
      )}

      {/* ── S4: AML System Status & Coverage ──────────────────────────── */}
      {step === 4 && (
        <div>
          <SectionHeader num="04" title="AML System Status" sub="The CBN requires an integrated AML solution covering 9 core functional areas. 5.1" />
          <InfoBox>
            The CBN has stated that AML solutions without effective linkage to CDD/KYC/KYB information and customer risk assessments will not be regarded as compliant. Standalone tools do not satisfy the Baseline Standards.
          </InfoBox>
          <RadioGroupField label="Overall AML system status 5.1(A)" name="aml-status" options={amlStatusOptions} value={data.amlStatus} onChange={(v) => update("amlStatus", v)} columns={1} />

          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 mt-6 pb-1.5 border-b border-border-light">
            Coverage Matrix — Current capability per function
          </div>
          <div className="mb-6">
            {coverageItems.map((item) => (
              <CoverageRow
                key={item.key}
                functionName={item.name}
                description={item.desc}
                value={data[item.key] as string}
                onChange={(v) => update(item.key, v)}
              />
            ))}
          </div>

          <RadioGroupField label="AI/ML usage in your AML system" name="aiml" options={aimlOptions} value={data.aiml} onChange={(v) => update("aiml", v)} />
          <RadioGroupField label="Automated alert closure" name="auto-close" options={autoCloseOptions} value={data.autoClose} onChange={(v) => update("autoClose", v)} />
          <p className="text-xs text-muted-foreground -mt-3 mb-5">
            Note: Automated alert closure requires CBN notification and strict governance under 5.5.
          </p>
          <NavButtons onBack={() => goTo(3)} onNext={() => tryNext(5)} />
        </div>
      )}

      {/* ── S5: Governance & Policy ───────────────────────────────────── */}
      {step === 5 && (
        <div>
          <SectionHeader num="05" title="Governance & Policy Framework" sub="Section 6 of the Baseline Standards sets cross-cutting governance obligations assessed independently from technology. 5.9, Section 6" />
          <div className="mb-5">
            {govItems.map((item) => (
              <GovItem key={item.id} label={item.label} value={data.governance[item.id] || ""} onChange={(val) => setGov(item.id, val)} />
            ))}
          </div>

          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 pb-1.5 border-b border-border-light">
            Internal audit coverage of AML
          </div>
          <RadioGroupField label="" name="audit" options={auditOptions} value={data.audit} onChange={(v) => update("audit", v)} columns={4} />

          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 pb-1.5 border-b border-border-light">
            CBN roadmap preparation status
          </div>
          <RadioGroupField label="" name="roadmap" options={roadmapOptions} value={data.roadmapStatus} onChange={(v) => update("roadmapStatus", v)} columns={1} />
          <NavButtons onBack={() => goTo(4)} onNext={() => tryNext(6)} />
        </div>
      )}

      {/* ── S6: KYC / CDD ─────────────────────────────────────────────── */}
      {step === 6 && (
        <div>
          <SectionHeader num="06" title="KYC / CDD Capability" sub="The CBN requires live linkage between KYC records, risk profiles, and transaction monitoring. Disconnected KYC is explicitly non-compliant. 5.2" />
          <RadioGroupField label="BVN / NIN integration 5.2(B)(I)" name="bvn" options={bvnOptions} value={data.bvnStatus} onChange={(v) => update("bvnStatus", v)} columns={1} />
          <RadioGroupField label="Periodic KYC review process" name="kyc-rev" options={kycReviewOptions} value={data.kycReview} onChange={(v) => update("kycReview", v)} columns={2} />
          <RadioGroupField label="UBO identification & mapping" name="ubo" options={uboOptions} value={data.uboMap} onChange={(v) => update("uboMap", v)} columns={2} />
          <NavButtons onBack={() => goTo(5)} onNext={() => tryNext(7)} />
        </div>
      )}

      {/* ── S7: Sanctions, PEP & Fraud ────────────────────────────────── */}
      {step === 7 && (
        <div>
          <SectionHeader num="07" title="Sanctions, PEP & Fraud" sub="Covers sanctions and PEP screening (5.3), customer risk scoring (5.4), and fraud monitoring (5.6)." />
          <RadioGroupField label="Sanctions & PEP screening capability 5.3" name="sanctions" options={sanctionsCapabOptions} value={data.sanctionsCapab} onChange={(v) => update("sanctionsCapab", v)} columns={1} />
          <CheckboxGroupField label="Sanction lists currently screened against" options={sanctionListOptions} values={data.sanctionLists} onChange={(v) => update("sanctionLists", v)} columns={1} />
          <RadioGroupField label="Fraud monitoring capability 5.6" name="fraud" options={fraudCapabOptions} value={data.fraudCapab} onChange={(v) => update("fraudCapab", v)} columns={1} />
          <RadioGroupField label="Do fraud indicators feed into ML/TF risk profiles?" name="fraud-feed" options={fraudFeedOptions} value={data.fraudFeed} onChange={(v) => update("fraudFeed", v)} columns={1} />
          <NavButtons onBack={() => goTo(6)} onNext={() => tryNext(8)} />
        </div>
      )}

      {/* ── S8: Reporting & Security ──────────────────────────────────── */}
      {step === 8 && (
        <div>
          <SectionHeader num="08" title="Reporting, Data Protection & Security" sub="STR/CTR/SAR/FTR submission (5.8) and AML data security / NDPA compliance (5.11)." />
          <RadioGroupField label="Regulatory filing method 5.8" name="reporting" options={reportingMethodOptions} value={data.reportingMethod} onChange={(v) => update("reportingMethod", v)} columns={1} />
          <RadioGroupField label="Internal report approval process" name="report-approval" options={reportApprovalOptions} value={data.reportApproval} onChange={(v) => update("reportApproval", v)} columns={1} />

          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 mt-6 pb-1.5 border-b border-border-light">
            Data Protection & Security — 5.11
          </div>
          <RadioGroupField label="Data encryption 5.11(A)" name="encryption" options={encryptionOptions} value={data.encryption} onChange={(v) => update("encryption", v)} columns={2} />
          <RadioGroupField label="Multi-factor authentication 5.11(A)(III)" name="mfa" options={mfaOptions} value={data.mfa} onChange={(v) => update("mfa", v)} columns={3} />
          <RadioGroupField label="Data sovereignty & NDPA 5.11(B)" name="data-sov" options={dataSovOptions} value={data.dataSov} onChange={(v) => update("dataSov", v)} columns={1} />
          <RadioGroupField label="Business impact analysis (BIA) for AML systems" name="bia" options={biaOptions} value={data.biaStatus} onChange={(v) => update("biaStatus", v)} columns={1} />
          <NavButtons onBack={() => goTo(7)} onNext={() => tryNext(9)} />
        </div>
      )}

      {/* ── S9: Vendor, Context & Priorities ──────────────────────────── */}
      {step === 9 && (
        <div>
          <SectionHeader num="09" title="Vendor Strategy & Context" sub="Understanding your vendor landscape and priorities helps calibrate a realistic roadmap to the June 2026 and March 2028 deadlines." />
          <RadioGroupField label="Implementation approach" name="impl" options={implApproachOptions} value={data.implApproach} onChange={(v) => update("implApproach", v)} columns={1} />
          <RadioGroupField label="Vendor evaluation status" name="vendor" options={vendorStatusOptions} value={data.vendorStatus} onChange={(v) => update("vendorStatus", v)} columns={1} />

          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 mt-6 pb-1.5 border-b border-border-light">
            Context & Priorities
          </div>
          <TextAreaField
            label="What is your single biggest concern about meeting the CBN AML requirements?"
            value={data.biggestConcern}
            onChange={(v) => update("biggestConcern", v)}
            placeholder="e.g. Budget not yet approved, Board doesn't fully understand the urgency…"
          />
          <TextAreaField
            label="Any recent CBN examinations, findings, or regulatory correspondence? (optional)"
            value={data.regulatoryContext}
            onChange={(v) => update("regulatoryContext", v)}
            placeholder="Optional — prior CBN letters, audit findings…"
          />
          <CheckboxGroupField label="What level of support are you looking for?" options={supportOptions} values={data.supportNeeds} onChange={(v) => update("supportNeeds", v)} columns={1} />
          <TextAreaField
            label="Anything else before we prepare your gap report? (optional)"
            value={data.extraContext}
            onChange={(v) => update("extraContext", v)}
            placeholder="Any additional context, constraints, or questions…"
          />

          <InfoBox>
            ⚡ <strong>The June 10 deadline is firm.</strong> Every CBN-licenced institution must submit a roadmap regardless of current compliance status. An incomplete or absent submission is treated as non-compliance.
          </InfoBox>
          <NavButtons onBack={() => goTo(8)} onNext={() => tryNext(10)} nextLabel="Review & Submit →" />
        </div>
      )}

      {/* ── S10: Review & Generate ────────────────────────────────────── */}
      {step === 10 && (
        <div>
          <SectionHeader num="✓" title="Review & Generate Report" sub="Please confirm all details below are accurate before generating your gap assessment report." />
          <ReviewSection title="Institution Profile">
            <ReviewRow label="Institution" value={data.instName || "—"} />
            <ReviewRow label="Contact" value={data.contactName || "—"} />
            <ReviewRow label="Email" value={data.contactEmail || "—"} />
            <ReviewRow label="Role" value={data.contactRole || "—"} />
            <ReviewRow label="Type" value={data.instType || "—"} />
            <ReviewRow label="Marketing Consent" value={data.marketingConsent ? "Yes" : "No"} />
          </ReviewSection>
          <ReviewSection title="Scale & Risk">
            <ReviewRow label="Transaction volume" value={data.txVol || "—"} />
            <ReviewRow label="Customer base" value={data.custBase || "—"} />
            <ReviewRow label="CBN risk" value={data.cbnRisk || "—"} />
            <ReviewRow label="Geography" value={data.geo || "—"} />
            <ReviewRow label="Group" value={data.group || "—"} />
            <ReviewRow label="Products" value={data.products.length ? data.products.join(", ") : "—"} />
            <ReviewRow label="Channels" value={data.channels.length ? data.channels.join(", ") : "—"} />
            <ReviewRow label="Risk factors" value={data.riskFactors.length ? data.riskFactors.join(", ") : "None selected"} />
          </ReviewSection>
          <ReviewSection title="AML System">
            <ReviewRow label="System status" value={data.amlStatus || "—"} />
            <ReviewRow label="Functions covered" value={deriveAmlFunctions(data).join(", ") || "None"} />
            <ReviewRow label="AI/ML" value={data.aiml || "—"} />
          </ReviewSection>
          <ReviewSection title="Governance">
            <ReviewRow label="Controls confirmed" value={`${govYes} of 10`} />
            <ReviewRow label="Audit frequency" value={data.audit || "—"} />
            <ReviewRow label="Roadmap status" value={data.roadmapStatus || "—"} />
          </ReviewSection>
          <ReviewSection title="KYC & Sanctions">
            <ReviewRow label="BVN/NIN integration" value={data.bvnStatus || "—"} />
            <ReviewRow label="Sanctions screening" value={data.sanctionsCapab || "—"} />
            <ReviewRow label="Fraud monitoring" value={data.fraudCapab || "—"} />
          </ReviewSection>
          <ReviewSection title="Reporting & Security">
            <ReviewRow label="Filing method" value={data.reportingMethod || "—"} />
            <ReviewRow label="Encryption" value={data.encryption || "—"} />
            <ReviewRow label="MFA" value={data.mfa || "—"} />
            <ReviewRow label="Data sovereignty" value={data.dataSov || "—"} />
          </ReviewSection>
          <ReviewSection title="Vendor & Context">
            <ReviewRow label="Approach" value={data.implApproach || "—"} />
            <ReviewRow label="Vendor status" value={data.vendorStatus || "—"} />
          </ReviewSection>
          <NavButtons onBack={() => goTo(9)} onNext={generateReport} nextLabel={submitting ? "Generating…" : "Generate Gap Report ↗"} />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

const SectionHeader: React.FC<{ num: string; title: string; sub: string }> = ({ num, title, sub }) => (
  <div className="mb-6">
    <div className="text-[11px] font-medium text-primary-dark tracking-wider uppercase mb-1">
      {num}
    </div>
    <h2 className="text-xl font-medium text-foreground mb-1">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>
  </div>
);

const NavButtons: React.FC<{
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}> = ({ onBack, onNext, nextLabel = "Continue →" }) => (
  <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-light">
    {onBack ? (
      <button
        onClick={onBack}
        className="px-5 py-2.5 text-sm border border-border rounded-md bg-background text-muted-foreground hover:bg-muted transition-colors"
      >
        ← Back
      </button>
    ) : <span />}
    {onNext && (
      <button
        onClick={onNext}
        className="px-6 py-2.5 text-sm font-medium border-none rounded-md bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        {nextLabel}
      </button>
    )}
  </div>
);

const ReviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-muted rounded-md p-4 mb-4">
    <h4 className="text-[13px] font-medium text-muted-foreground mb-3">{title}</h4>
    {children}
  </div>
);

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-[13px] py-1 gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right">{value}</span>
  </div>
);

export default AssessmentForm;
