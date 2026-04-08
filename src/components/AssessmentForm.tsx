import React, { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TextField,
  RadioGroupField,
  CheckboxGroupField,
  SelectField,
  TextAreaField,
} from "@/components/FormFields";
import { RiskFlagItem, GovItem } from "@/components/GovAndRiskFields";

interface FormData {
  instName: string;
  contactName: string;
  contactEmail: string;
  contactRole: string;
  instType: string;
  txVol: string;
  custBase: string;
  cbnRisk: string;
  geo: string;
  group: string;
  products: string[];
  channels: string[];
  amlStatus: string;
  amlFunctions: string[];
  aiml: string;
  autoClose: string;
  riskFactors: string[];
  governance: Record<string, string>;
  audit: string;
  extraContext: string;
}

const initialData: FormData = {
  instName: "",
  contactName: "",
  contactEmail: "",
  contactRole: "",
  instType: "",
  txVol: "",
  custBase: "",
  cbnRisk: "",
  geo: "",
  group: "",
  products: [],
  channels: [],
  amlStatus: "",
  amlFunctions: [],
  aiml: "",
  autoClose: "",
  riskFactors: [],
  governance: {},
  audit: "",
  extraContext: "",
};

const TOTAL_STEPS = 7;

const institutionTypes = [
  { id: "it-dmb", value: "DMB", label: "Deposit Money Bank (DMB)" },
  { id: "it-mfb", value: "MFB", label: "Microfinance Bank (MFB)" },
  { id: "it-psp", value: "PSP", label: "Payment Service Provider (PSP)" },
  { id: "it-imto", value: "IMTO", label: "IMTO" },
  { id: "it-mmo", value: "MMO", label: "Mobile Money Operator (MMO)" },
  { id: "it-fc", value: "Finance Company", label: "Finance Company" },
  { id: "it-pmi", value: "PMI", label: "PMI" },
  { id: "it-other", value: "Other", label: "Other" },
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
  { id: "p10", value: "Wealth / investment", label: "Wealth / investment" },
  { id: "p11", value: "Pension / savings", label: "Pension / savings" },
  { id: "p12", value: "Payment processing", label: "Payment processing" },
  { id: "p13", value: "Mortgage / real estate finance", label: "Mortgage / real estate finance" },
  { id: "p14", value: "Corporate banking", label: "Corporate banking" },
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
  { id: "as-none", value: "None", label: "None — no AML system in place" },
  { id: "as-manual", value: "Manual", label: "Manual — spreadsheets / paper-based" },
  { id: "as-partial", value: "Partial", label: "Partial — some automated, some manual" },
  { id: "as-full", value: "Full", label: "Full — integrated automated AML platform" },
];

const amlFunctionOptions = [
  { id: "af1", value: "CDD/KYC/KYB", label: "CDD / KYC / KYB (§5.2)" },
  { id: "af2", value: "Sanctions & PEP screening", label: "Sanctions & PEP screening (§5.3)" },
  { id: "af3", value: "Customer risk assessment", label: "Customer risk assessment (§5.4)" },
  { id: "af4", value: "Transaction monitoring", label: "Transaction monitoring (§5.5)" },
  { id: "af5", value: "Fraud monitoring", label: "Fraud monitoring (§5.6)" },
  { id: "af6", value: "Case management", label: "Case management (§5.7)" },
  { id: "af7", value: "Regulatory reporting (STR/CTR)", label: "Regulatory reporting / STR (§5.8)" },
  { id: "af8", value: "Audit trail", label: "Audit trail & governance logs (§5.9)" },
];

const aimlOptions = [
  { id: "ai-yes", value: "Yes - in use", label: "Yes — currently in use" },
  { id: "ai-plan", value: "Yes - planned", label: "Yes — planned for implementation" },
  { id: "ai-no", value: "No", label: "No — rules-based only" },
  { id: "ai-unk", value: "Unknown", label: "Not sure / unknown" },
];

const autoCloseOptions = [
  { id: "ac-yes", value: "Yes", label: "Yes — alerts can be auto-closed by the system" },
  { id: "ac-no", value: "No", label: "No — all alerts require manual review" },
];

const riskFactorLabels = [
  "We serve politically exposed persons (PEPs) or their associates",
  "We process cross-border or foreign currency transactions",
  "We have exposure to virtual assets or crypto products",
  "We operate an agent banking network",
  "We issue or process card products",
  "We have experienced material fraud losses or operate in a high-fraud-risk subsector",
];
const riskFactorValues = [
  "PEP exposure",
  "Cross-border FX",
  "Virtual assets",
  "Agent banking network",
  "Card products",
  "Material fraud exposure",
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

const AssessmentForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const validateStep = useCallback((s: number, d: FormData): string[] => {
    const errs: string[] = [];
    switch (s) {
      case 1:
        if (!d.instName.trim()) errs.push("Institution name is required");
        if (!d.contactName.trim()) errs.push("Your full name is required");
        if (!d.contactEmail.trim()) errs.push("Work email is required");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contactEmail)) errs.push("Please enter a valid email address");
        if (!d.contactRole.trim()) errs.push("Your role is required");
        if (!d.instType) errs.push("Please select an institution type");
        break;
      case 2:
        if (!d.txVol) errs.push("Please select daily transaction volume");
        if (!d.custBase) errs.push("Please select active customer base");
        if (!d.cbnRisk) errs.push("Please select CBN risk classification");
        if (!d.geo) errs.push("Please select geographic footprint");
        if (!d.group) errs.push("Please select group structure");
        break;
      case 3:
        if (d.products.length === 0) errs.push("Please select at least one product or service");
        if (d.channels.length === 0) errs.push("Please select at least one delivery channel");
        break;
      case 4:
        if (!d.amlStatus) errs.push("Please select AML system status");
        if (!d.aiml) errs.push("Please select AI/ML usage status");
        if (!d.autoClose) errs.push("Please select automated alert closure status");
        break;
      case 6:
        if (Object.keys(d.governance).length < 10) errs.push("Please answer all governance questions");
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

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const setGov = (id: string, val: string) => {
    setData((prev) => ({
      ...prev,
      governance: { ...prev.governance, [id]: val },
    }));
  };

  const toggleRisk = (val: string, checked: boolean) => {
    setData((prev) => ({
      ...prev,
      riskFactors: checked
        ? [...prev.riskFactors, val]
        : prev.riskFactors.filter((v) => v !== val),
    }));
  };

  const pct = Math.round((step / TOTAL_STEPS) * 100);

  const govYes = Object.values(data.governance).filter((v) => v === "Yes").length;
  const govTotal = Math.max(Object.keys(data.governance).length, 10);

  const [submitting, setSubmitting] = useState(false);

  const generateReport = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("assessments").insert({
        inst_name: data.instName,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_role: data.contactRole,
        inst_type: data.instType,
        tx_vol: data.txVol,
        cust_base: data.custBase,
        cbn_risk: data.cbnRisk,
        geo: data.geo,
        group_structure: data.group,
        products: data.products,
        channels: data.channels,
        aml_status: data.amlStatus,
        aml_functions: data.amlFunctions,
        aiml: data.aiml,
        auto_close: data.autoClose,
        risk_factors: data.riskFactors,
        governance: data.governance,
        audit: data.audit,
        extra_context: data.extraContext,
      });

      if (error) throw error;
      toast.success("Assessment submitted successfully!");
    } catch (err: any) {
      console.error("Failed to save assessment:", err);
      toast.error("Failed to save assessment. Please try again.");
      setSubmitting(false);
      return;
    }

    // Generate report prompt
    const allFuncs = [
      "CDD/KYC/KYB",
      "Sanctions & PEP screening",
      "Customer risk assessment",
      "Transaction monitoring",
      "Fraud monitoring",
      "Case management",
      "Regulatory reporting (STR/CTR)",
      "Audit trail",
    ];
    const missing = allFuncs.filter(
      (f) =>
        !data.amlFunctions.includes(f) &&
        !data.amlFunctions.some((x) => x.includes(f.split("/")[0]))
    );
    const govPct = Math.round((govYes / govTotal) * 100);

    const prompt = `Based on the CBN AML Baseline Standards gap assessment I just completed, please generate a detailed, branded gap assessment report for ${data.instName || "Your Institution"} (${data.instType}).

Here is my assessment data:
- Institution type: ${data.instType}
- AML system status: ${data.amlStatus}
- AML functions currently covered: ${data.amlFunctions.length ? data.amlFunctions.join(", ") : "None"}
- Missing functions: ${missing.join(", ") || "None"}
- AI/ML usage: ${data.aiml}
- CBN risk classification: ${data.cbnRisk}
- Risk factors: ${data.riskFactors.length ? data.riskFactors.join(", ") : "None selected"}
- Governance controls in place: ${govYes} of ${govTotal} (${govPct}%)
- Internal audit frequency: ${data.audit}
- Transaction volume: ${data.txVol}
- Geographic footprint: ${data.geo}`;

    console.log("Generated report prompt:", prompt);
    setSubmitting(false);
    alert("Report generation prompt has been logged to the console. In production, this would be sent to an AI service.");
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6 pb-12">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-2 h-2 rounded-full bg-primary-dark" />
        <span className="text-[13px] font-medium text-muted-foreground tracking-wider uppercase">
          RegTech365 · OPEX Consulting
        </span>
      </div>

      {/* Progress */}
      <div className="bg-muted rounded-full h-1 mb-2">
        <div
          className="bg-primary rounded-full h-1 transition-all duration-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mb-8">
        Step {step} of {TOTAL_STEPS}
      </div>

      {/* Validation errors */}
      {showErrors && errors.length > 0 && (
        <div className="bg-destructive-light border border-destructive/30 rounded-md px-4 py-3 mb-6">
          <p className="text-sm font-medium text-destructive mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside text-[13px] text-destructive space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <StepHeader
            tag="Step 1 — Institution"
            title="Tell us about your institution"
            desc="This assessment is confidential and used solely to generate your personalised gap report."
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Institution name" value={data.instName} onChange={(v) => update("instName", v)} placeholder="e.g. Sunrise MFB Ltd" />
            <TextField label="Your full name" value={data.contactName} onChange={(v) => update("contactName", v)} placeholder="e.g. Amara Okonkwo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Work email" value={data.contactEmail} onChange={(v) => update("contactEmail", v)} placeholder="amara@sunrisemfb.com" type="email" />
            <TextField label="Your role" value={data.contactRole} onChange={(v) => update("contactRole", v)} placeholder="e.g. Chief Compliance Officer" />
          </div>
          <RadioGroupField label="Institution type" name="inst-type" options={institutionTypes} value={data.instType} onChange={(v) => update("instType", v)} />
          <NavButtons onNext={() => tryNext(2)} />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <StepHeader
            tag="Step 2 — Scale & Complexity"
            title="What is your institution's scale?"
            desc="Proportionality applies — but all institutions must comply. Larger and higher-risk institutions face heightened requirements."
          />
          <RadioGroupField label="Daily transaction volume" name="tx-vol" options={txVolOptions} value={data.txVol} onChange={(v) => update("txVol", v)} />
          <RadioGroupField label="Active customer base" name="cust-base" options={custBaseOptions} value={data.custBase} onChange={(v) => update("custBase", v)} />
          <RadioGroupField label="CBN risk classification" name="cbn-risk" options={cbnRiskOptions} value={data.cbnRisk} onChange={(v) => update("cbnRisk", v)} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Geographic footprint" value={data.geo} onChange={(v) => update("geo", v)} options={["Single state", "Multiple states", "Cross-border"]} />
            <SelectField label="Group structure" value={data.group} onChange={(v) => update("group", v)} options={["Standalone", "Subsidiary", "Group holding", "Shared services arrangement"]} />
          </div>
          <NavButtons onBack={() => goTo(1)} onNext={() => tryNext(3)} />
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <StepHeader
            tag="Step 3 — Products & Channels"
            title="What products and channels do you operate?"
            desc="Select all that apply. This determines which monitoring requirements and risk factors are relevant to your assessment."
          />
          <CheckboxGroupField label="Products & services offered" options={productOptions} values={data.products} onChange={(v) => update("products", v)} />
          <CheckboxGroupField label="Delivery channels" options={channelOptions} values={data.channels} onChange={(v) => update("channels", v)} />
          <NavButtons onBack={() => goTo(2)} onNext={() => tryNext(4)} />
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div>
          <StepHeader
            tag="Step 4 — AML System Status"
            title="What AML capabilities do you currently have?"
            desc="Be as accurate as possible — honest responses generate more useful gap findings."
          />
          <RadioGroupField label="Overall AML system status" name="aml-status" options={amlStatusOptions} value={data.amlStatus} onChange={(v) => update("amlStatus", v)} />
          <CheckboxGroupField label="Which AML functions are currently covered? (select all that apply)" options={amlFunctionOptions} values={data.amlFunctions} onChange={(v) => update("amlFunctions", v)} />
          <RadioGroupField label="AI/ML usage in your AML system" name="aiml" options={aimlOptions} value={data.aiml} onChange={(v) => update("aiml", v)} />
          <RadioGroupField label="Automated alert closure" name="auto-close" options={autoCloseOptions} value={data.autoClose} onChange={(v) => update("autoClose", v)} />
          <p className="text-xs text-muted-foreground -mt-3 mb-5">
            Note: Automated alert closure requires CBN notification and strict governance controls under §5.5.
          </p>
          <NavButtons onBack={() => goTo(3)} onNext={() => tryNext(5)} />
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div>
          <StepHeader
            tag="Step 5 — Risk Factors"
            title="Which risk factors apply to your institution?"
            desc="These factors trigger enhanced monitoring obligations under the Baseline Standards. Select all that apply."
          />
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
          <NavButtons onBack={() => goTo(4)} onNext={() => tryNext(6)} />
        </div>
      )}

      {/* Step 6 */}
      {step === 6 && (
        <div>
          <StepHeader
            tag="Step 6 — Governance"
            title="Governance and compliance infrastructure"
            desc="These governance controls are required under the Baseline Standards Section 6 cross-cutting obligations."
          />
          <div className="mb-5">
            {govItems.map((item) => (
              <GovItem
                key={item.id}
                label={item.label}
                value={data.governance[item.id] || ""}
                onChange={(val) => setGov(item.id, val)}
              />
            ))}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 pb-1.5 border-b border-border-light">
            Internal audit coverage of AML
          </div>
          <RadioGroupField label="" name="audit" options={auditOptions} value={data.audit} onChange={(v) => update("audit", v)} columns={4} />
          <div className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase mb-3 pb-1.5 border-b border-border-light">
            Additional context (optional)
          </div>
          <TextAreaField
            value={data.extraContext}
            onChange={(v) => update("extraContext", v)}
            placeholder="Any additional context about your current AML programme, system limitations, or compliance concerns…"
          />
          <NavButtons onBack={() => goTo(5)} onNext={() => tryNext(7)} nextLabel="Review & Generate →" />
        </div>
      )}

      {/* Step 7 */}
      {step === 7 && (
        <div>
          <StepHeader
            tag="Step 7 — Review & Generate"
            title="Review your responses"
            desc="Please confirm all details below are accurate before generating your gap assessment report."
          />
          <ReviewSection title="Institution">
            <ReviewRow label="Institution" value={data.instName || "—"} />
            <ReviewRow label="Contact" value={data.contactName || "—"} />
            <ReviewRow label="Email" value={data.contactEmail || "—"} />
            <ReviewRow label="Role" value={data.contactRole || "—"} />
            <ReviewRow label="Type" value={data.instType || "—"} />
          </ReviewSection>
          <ReviewSection title="Scale & complexity">
            <ReviewRow label="Transaction volume" value={data.txVol || "—"} />
            <ReviewRow label="Customer base" value={data.custBase || "—"} />
            <ReviewRow label="CBN risk classification" value={data.cbnRisk || "—"} />
            <ReviewRow label="Geography" value={data.geo || "—"} />
            <ReviewRow label="Group structure" value={data.group || "—"} />
          </ReviewSection>
          <ReviewSection title="AML system">
            <ReviewRow label="System status" value={data.amlStatus || "—"} />
            <ReviewRow label="Functions covered" value={data.amlFunctions.length ? data.amlFunctions.join(", ") : "None selected"} />
            <ReviewRow label="AI/ML usage" value={data.aiml || "—"} />
          </ReviewSection>
          <ReviewSection title="Governance score">
            <ReviewRow label="Controls in place" value={Object.keys(data.governance).length ? `${govYes} of ${govTotal} controls confirmed` : "Not yet completed"} />
            <ReviewRow label="Internal audit frequency" value={data.audit || "—"} />
          </ReviewSection>
          <NavButtons onBack={() => goTo(6)} onNext={generateReport} nextLabel={submitting ? "Submitting…" : "Generate Gap Report ↗"} />
        </div>
      )}
    </div>
  );
};

const StepHeader: React.FC<{ tag: string; title: string; desc: string }> = ({
  tag,
  title,
  desc,
}) => (
  <div className="mb-6">
    <div className="text-[11px] font-medium text-primary-dark tracking-wider uppercase mb-1">
      {tag}
    </div>
    <h2 className="text-xl font-medium text-foreground mb-1">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
    ) : (
      <span />
    )}
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

const ReviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-muted rounded-md p-4 mb-4">
    <h4 className="text-[13px] font-medium text-muted-foreground mb-3">
      {title}
    </h4>
    {children}
  </div>
);

const ReviewRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between text-[13px] py-1 gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right">{value}</span>
  </div>
);

export default AssessmentForm;
