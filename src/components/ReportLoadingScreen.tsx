import React, { useEffect, useRef, useState } from "react";

interface ReportLoadingScreenProps {
  progress: number; // 0–100
  institutionName: string;
  onDownload?: () => void;
  onGetFullReport?: () => void;
  regwatchCtaStatus?: "idle" | "loading" | "sent" | "error";
}

const STAGES = [
  { at: 0,  label: "Connecting to analysis engine…",          icon: "⚡" },
  { at: 10, label: "Sending assessment data to AI…",          icon: "📤" },
  { at: 20, label: "Analysing AML system status…",             icon: "🔍" },
  { at: 35, label: "Scoring all 12 CBN Baseline Standards…",  icon: "📊" },
  { at: 50, label: "Assessing governance controls…",           icon: "🛡️" },
  { at: 62, label: "Drafting institution-specific findings…", icon: "✍️" },
  { at: 72, label: "Building implementation roadmap…",         icon: "🗺️" },
  { at: 80, label: "Rendering report layout…",                 icon: "📄" },
  { at: 88, label: "Generating PDF document…",                 icon: "📑" },
  { at: 96, label: "Preparing download…",                      icon: "⬇️" },
];

const FACTS = [
  "The CBN Circular BSD/DIR/PUB/LAB/019/002 requires all financial institutions to submit a compliant implementation roadmap by 10 June 2026.",
  "DMBs have 18 months (until September 2027) to achieve full compliance. All OFIs have 24 months (until March 2028).",
  "The CBN has explicitly stated that AML Solutions without effective CDD/KYC linkage will not be regarded as compliant.",
  "12 Baseline Standards are being assessed — §5.1 through §5.12 — covering everything from sanctions screening to data security.",
  "Standalone or batch-feed transaction monitoring is explicitly prohibited for High or Above Average risk institutions.",
  "Automated alert closure requires prior CBN notification and can only operate within a formal governance framework.",
  "IMTOs have mandatory goAML reporting obligations to the NFIU in addition to standard CBN reporting requirements.",
  "All AML configuration changes must be logged in a tamper-proof, immutable audit trail under §5.9.",
  "Enterprise Case Management (ECM) must include Maker-Checker controls, role-based workflows, and full audit trails.",
  "RegTech365's RegPort platform addresses §5.1, §5.3, §5.4, §5.5, §5.8, and §5.10 of the CBN Baseline Standards.",
];

export const ReportLoadingScreen: React.FC<ReportLoadingScreenProps> = ({
  progress,
  institutionName,
  onDownload,
  onGetFullReport,
  regwatchCtaStatus = "idle",
}) => {
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds
  const startRef = useRef<number>(Date.now());

  // Rotate Did You Know facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex((i) => (i + 1) % FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Elapsed time counter — resets if progress resets to 0
  useEffect(() => {
    if (progress === 0) {
      startRef.current = Date.now();
      setElapsed(0);
    }
    if (progress >= 100) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [progress]);

  const fmtElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const currentStage = [...STAGES]
    .reverse()
    .find((s) => progress >= s.at) ?? STAGES[0];

  const circumference = 2 * Math.PI * 44;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
         style={{ background: "linear-gradient(135deg, hsl(var(--loading-bg-start)) 0%, hsl(var(--loading-bg-mid)) 60%, hsl(var(--loading-bg-end)) 100%)" }}>
      <div className="bg-card/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-2xl py-12 px-11 max-w-[520px] w-full text-center text-primary-foreground shadow-[0_32px_80px_rgba(0,0,0,0.5)] animate-card-in">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-[7px] h-[7px] rounded-full bg-primary" />
          <span className="text-[10px] font-semibold text-primary-foreground/40 tracking-[0.14em] uppercase font-sans">
            RegTech365 · OPEX Consulting
          </span>
        </div>

        {/* Spinner ring */}
        <div className="relative w-[120px] h-[120px] mx-auto mb-6">
          <svg className="w-[120px] h-[120px] -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary-foreground) / 0.08)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              className="stroke-primary"
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                strokeDasharray: `${circumference}`,
                strokeDashoffset: `${circumference * (1 - progress / 100)}`,
                transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[22px] font-bold text-primary-foreground font-sans">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-xl font-semibold text-primary-foreground mb-1.5 font-sans leading-snug">
          {progress < 100 ? "Generating your gap assessment report" : "Your gap assessment is ready!"}
        </h2>
        <p className="text-[13.5px] text-primary-foreground/55 mb-7 font-sans">
          for <strong className="text-primary-foreground/90 font-semibold">{institutionName || "your institution"}</strong>
        </p>

        {/* Current stage or Download */}
        {progress < 100 ? (
          <>
            <div className="flex items-center justify-center gap-2 bg-primary-foreground/[0.06] border border-primary-foreground/10 rounded-lg px-5 py-3 mb-3 text-[13px] text-primary-foreground/80 font-sans min-h-[46px]">
              <span className="text-base flex-shrink-0 animate-pulse">{currentStage.icon}</span>
              <span className="leading-snug">{currentStage.label}</span>
            </div>
            {elapsed > 3 && (
              <p className="text-[11px] text-primary-foreground/35 mb-4 font-sans tabular-nums">
                ⏱ Elapsed: {fmtElapsed(elapsed)}
              </p>
            )}
          </>
        ) : (
          <>
            <button
              onClick={onDownload}
              className="w-full bg-primary text-primary-foreground border-none rounded-lg py-4 px-6 text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-3 mb-5 transition-all duration-200 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:bg-primary-dark hover:-translate-y-0.5"
            >
              <span className="text-lg">📥</span> Download PDF Report
            </button>
            {onGetFullReport && (
              <div className="mb-5">
                {regwatchCtaStatus !== "sent" ? (
                  <button
                    onClick={onGetFullReport}
                    disabled={regwatchCtaStatus === "loading"}
                    className="w-full bg-transparent text-primary-foreground/85 border border-primary-foreground/25 rounded-lg py-3.5 px-6 text-sm font-medium cursor-pointer flex items-center justify-center gap-2.5 mb-2 transition-all duration-200 font-sans hover:border-primary-foreground/50 hover:bg-primary-foreground/[0.06] hover:text-primary-foreground disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {regwatchCtaStatus === "loading"
                      ? "Sending…"
                      : "🔗 Get Your Full Compliance Report on RegWatch"}
                  </button>
                ) : (
                  <div className="bg-primary/15 border border-primary/40 rounded-lg py-3.5 px-5 text-[13.5px] text-primary-foreground/90 text-center mb-2 font-sans">
                    ✅ Check your email for your personalised compliance assessment link.
                  </div>
                )}
                {regwatchCtaStatus === "error" && (
                  <p className="text-xs text-destructive mb-2 font-sans">Something went wrong. Please try again.</p>
                )}
                <p className="text-[11px] text-primary-foreground/30 m-0 font-sans">
                  Free · No account needed · Full CBN AML assessment on RegWatch
                </p>
              </div>
            )}
          </>
        )}

        {/* Progress bar */}
        <div className="bg-primary-foreground/10 rounded-full h-[5px] overflow-hidden mb-7">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-600"
            style={{ width: `${progress}%`, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </div>

        {/* Did you know */}
        <div
          className={`bg-primary-foreground/5 border-l-[3px] border-l-primary rounded text-left px-4 py-3.5 text-[12.5px] text-primary-foreground/60 leading-relaxed mb-6 font-sans transition-all duration-400 ${
            factVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <span className="block text-[9px] font-bold tracking-[0.1em] uppercase text-primary mb-1">
            Did you know?
          </span>
          {FACTS[factIndex]}
        </div>

        <p className="text-[11.5px] text-primary-foreground/30 font-sans">
          {progress < 100
            ? "AI analysis typically takes 1–3 minutes. Please keep this tab open."
            : "Your report is ready for review."}
        </p>
      </div>
    </div>
  );
};
