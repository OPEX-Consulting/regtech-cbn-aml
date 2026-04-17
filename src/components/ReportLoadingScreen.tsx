import React, { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  BarChart3,
  Circle,
  Clock3,
  CheckCircle2,
  FileText,
  Link2,
  LoaderCircle,
  Radar,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

interface ReportLoadingScreenProps {
  progress: number; // 0–100
  institutionName: string;
  onDownload?: () => void;
  onGetFullReport?: () => void;
  onStartNewAssessment?: () => void;
  regwatchCtaStatus?: "idle" | "loading" | "sent" | "error";
}

const STAGES = [
  { at: 0,  label: "Connecting to analysis engine…",          Icon: Sparkles, iconClassName: "text-amber-300" },
  { at: 10, label: "Sending assessment data to AI…",          Icon: Send, iconClassName: "text-blue-300" },
  { at: 20, label: "Analysing AML system status…",            Icon: Search, iconClassName: "text-cyan-300" },
  { at: 35, label: "Scoring all 12 CBN Baseline Standards…",  Icon: BarChart3, iconClassName: "text-violet-300" },
  { at: 50, label: "Assessing governance controls…",          Icon: ShieldCheck, iconClassName: "text-emerald-300" },
  { at: 62, label: "Drafting institution-specific findings…", Icon: WandSparkles, iconClassName: "text-fuchsia-300" },
  { at: 72, label: "Building implementation roadmap…",        Icon: Radar, iconClassName: "text-sky-300" },
  { at: 80, label: "Rendering report layout…",                Icon: FileText, iconClassName: "text-indigo-300" },
  { at: 88, label: "Generating PDF document…",                Icon: FileText, iconClassName: "text-orange-300" },
  { at: 96, label: "Preparing download…",                     Icon: ArrowDownToLine, iconClassName: "text-teal-300" },
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
  onStartNewAssessment,
  regwatchCtaStatus = "idle",
}) => {
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);

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

  useEffect(() => {
    if (progress >= 100) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [progress]);

  const currentStage = [...STAGES]
    .reverse()
    .find((s) => progress >= s.at) ?? STAGES[0];
  const CurrentStageIcon = currentStage.Icon;

  const circumference = 2 * Math.PI * 44;
  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const secs = String(elapsedSec % 60).padStart(2, "0");
  const isSlow = elapsedSec >= 60 && progress < 100;
  const isVerySlow = elapsedSec >= 75 && progress < 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
         style={{ background: "linear-gradient(135deg, hsl(var(--loading-bg-start)) 0%, hsl(var(--loading-bg-mid)) 60%, hsl(var(--loading-bg-end)) 100%)" }}>
      <div className="bg-card/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-2xl py-5 sm:py-7 px-4 sm:px-7 max-w-[520px] w-full max-h-[92vh] overflow-y-auto text-center text-primary-foreground shadow-[0_32px_80px_rgba(0,0,0,0.5)] animate-card-in">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
          <div className="w-[7px] h-[7px] rounded-full bg-primary" />
          <span className="text-[10px] font-semibold text-primary-foreground/40 tracking-[0.14em] uppercase font-sans">
            RegTech365 · OPEX Consulting
          </span>
        </div>

        {/* Spinner ring */}
        <div className="relative w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] mx-auto mb-4 sm:mb-5">
          <svg className="w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
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
          <div className="absolute inset-0 flex items-center justify-center text-[17px] sm:text-[20px] font-bold text-primary-foreground font-sans">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-base sm:text-lg font-semibold text-primary-foreground mb-1 font-sans leading-snug">
          {progress < 100 ? "Generating your gap assessment report" : "Your gap assessment is ready!"}
        </h2>
        <p className="text-[12.5px] sm:text-[13px] text-primary-foreground/55 mb-3 sm:mb-4 font-sans">
          for <strong className="text-primary-foreground/90 font-semibold">{institutionName || "your institution"}</strong>
        </p>
        {progress < 100 && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-primary-foreground/55 mb-3 font-sans">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
              Elapsed {mins}:{secs}
            </span>
            <span className="text-primary-foreground/30">•</span>
            <span>Usually takes 30-90 seconds</span>
          </div>
        )}

        {/* Current stage or Download */}
        {progress < 100 ? (
          <div className="flex items-center justify-center gap-2 bg-primary-foreground/[0.06] border border-primary-foreground/10 rounded-lg px-4 py-2.5 mb-3 text-[12.5px] text-primary-foreground/80 font-sans min-h-[42px]">
            <CurrentStageIcon className={`h-4 w-4 flex-shrink-0 ${currentStage.iconClassName}`} />
            <span className="leading-snug">{currentStage.label}</span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
              <button
                onClick={onDownload}
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold border border-primary/40 bg-primary/20 text-primary-foreground transition-all duration-200 hover:bg-primary hover:border-primary"
              >
                <ArrowDownToLine className="h-4 w-4 text-cyan-300" />
                Download PDF
              </button>
              {onStartNewAssessment && (
                <button
                  onClick={onStartNewAssessment}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold border border-primary-foreground/25 bg-primary-foreground/[0.04] text-primary-foreground/90 transition-all duration-200 hover:border-primary-foreground/50 hover:bg-primary-foreground/[0.08]"
                >
                  <RotateCcw className="h-4 w-4 text-violet-300" />
                  New Assessment
                </button>
              )}
              {onGetFullReport && (
                <>
                  {regwatchCtaStatus !== "sent" ? (
                    <button
                      onClick={onGetFullReport}
                      disabled={regwatchCtaStatus === "loading"}
                      className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold border border-primary-foreground/25 bg-primary-foreground/[0.04] text-primary-foreground/90 transition-all duration-200 hover:border-primary-foreground/50 hover:bg-primary-foreground/[0.08] disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      {regwatchCtaStatus === "loading" ? (
                        <>
                          <LoaderCircle className="h-4 w-4 text-cyan-300 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 text-cyan-300" />
                          RegWatch Full Report
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold border border-emerald-300/40 bg-emerald-300/15 text-primary-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      Link sent to your email
                    </span>
                  )}
                </>
              )}
            </div>
            {onGetFullReport && (
              <div className="mb-3">
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
        {progress < 100 && (
          <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.04] p-2.5 mb-3 text-left">
            <p className="text-[10px] uppercase tracking-[0.08em] text-primary-foreground/40 mb-2 font-semibold">Milestones</p>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {STAGES.map((stage) => {
                const done = progress >= stage.at;
                const active = currentStage.at === stage.at;
                const StageIcon = stage.Icon;
                return (
                  <div
                    key={stage.at}
                    className={`flex items-center gap-1.5 text-[11px] leading-snug ${done ? "text-primary-foreground/85" : "text-primary-foreground/40"}`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0" />
                    ) : active ? (
                      <LoaderCircle className="h-3.5 w-3.5 text-cyan-300 animate-spin flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-primary-foreground/30 flex-shrink-0" />
                    )}
                    <StageIcon className={`h-3.5 w-3.5 flex-shrink-0 ${stage.iconClassName}`} />
                    <span>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {isSlow && (
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-2.5 mb-3 text-left text-[11px] text-amber-100/90">
            <p className="font-semibold mb-1">Taking longer than usual</p>
            <p>This can happen for detailed reports. Your request is still being processed.</p>
          </div>
        )}
        {isVerySlow && (
          <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/[0.05] p-2.5 mb-3 text-left text-[11px] text-primary-foreground/75">
            <p>Your submitted data is safe. Please keep this tab open while generation completes.</p>
          </div>
        )}

        {/* Progress bar */}
        <div className="bg-primary-foreground/10 rounded-full h-1 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-600"
            style={{ width: `${progress}%`, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </div>

        {/* Did you know */}
        <div
          className={`bg-primary-foreground/5 border-l-[3px] border-l-primary rounded text-left px-3 py-2.5 text-[11px] sm:text-[11.5px] text-primary-foreground/60 leading-relaxed mb-3 font-sans transition-all duration-400 ${
            factVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <span className="block text-[9px] font-bold tracking-[0.1em] uppercase text-primary mb-1">
            Did you know?
          </span>
          {FACTS[factIndex]}
        </div>

        <p className="text-[10.5px] text-primary-foreground/30 font-sans">
          {progress < 100
            ? "This typically takes 30–90 seconds. Please don't close this tab."
            : "Your report is ready for review."}
        </p>
      </div>
    </div>
  );
};
