import React, { useEffect, useState } from "react";

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

  // Cycle through did-you-know facts every 5s
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

  // Determine current stage label
  const currentStage = [...STAGES]
    .reverse()
    .find((s) => progress >= s.at) ?? STAGES[0];

  const dots = Math.floor((Date.now() / 500) % 4);

  return (
    <div className="report-loading-overlay">
      <div className="report-loading-card">
        {/* Brand */}
        <div className="rl-brand">
          <div className="rl-brand-dot" />
          <span className="rl-brand-name">RegTech365 · OPEX Consulting</span>
        </div>

        {/* Animated spinner ring */}
        <div className="rl-spinner-wrap">
          <svg className="rl-spinner-ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" className="rl-ring-track" />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="rl-ring-fill"
              style={{
                strokeDasharray: `${2 * Math.PI * 44}`,
                strokeDashoffset: `${2 * Math.PI * 44 * (1 - progress / 100)}`,
              }}
            />
          </svg>
          <div className="rl-spinner-pct">{Math.round(progress)}%</div>
        </div>

        {/* Headline */}
        <h2 className="rl-title">
          {progress < 100 ? "Generating your gap assessment report" : "Your gap assessment is ready!"}
        </h2>
        <p className="rl-subtitle">
          for <strong>{institutionName || "your institution"}</strong>
        </p>

        {/* Current stage or Download Button */}
        {progress < 100 ? (
          <div className="rl-stage">
            <span className="rl-stage-icon">{currentStage.icon}</span>
            <span className="rl-stage-label">
              {currentStage.label}
              {"...".slice(0, dots)}
            </span>
          </div>
        ) : (
          <>
            <button
              onClick={onDownload}
              className="rl-download-btn"
            >
              <span>📥</span> Download PDF Report
            </button>
            {onGetFullReport && (
              <div className="rl-cta-section">
                {regwatchCtaStatus !== "sent" ? (
                  <button
                    onClick={onGetFullReport}
                    disabled={regwatchCtaStatus === "loading"}
                    className="rl-regwatch-btn"
                  >
                    {regwatchCtaStatus === "loading"
                      ? "Sending…"
                      : "🔗 Get Your Full Compliance Report on RegWatch"}
                  </button>
                ) : (
                  <div className="rl-email-sent">
                    ✅ Check your email for your personalised compliance assessment link.
                  </div>
                )}
                {regwatchCtaStatus === "error" && (
                  <p className="rl-cta-error">Something went wrong. Please try again.</p>
                )}
                <p className="rl-cta-subtext">
                  Free · No account needed · Full CBN AML assessment on RegWatch
                </p>
              </div>
            )}
          </>
        )}

        {/* Progress bar */}
        <div className="rl-progress-track">
          <div
            className="rl-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Did you know */}
        <div className={`rl-fact ${factVisible ? "rl-fact-in" : "rl-fact-out"}`}>
          <span className="rl-fact-label">Did you know?</span>
          {FACTS[factIndex]}
        </div>

        <p className="rl-footer-note">
          {progress < 100 
            ? "This typically takes 30–60 seconds. Please don't close this tab." 
            : "Your report is ready for review."}
        </p>
      </div>

      <style>{`
        .report-loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: linear-gradient(135deg, #0D1F3C 0%, #1A3560 60%, #0F6E56 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .report-loading-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 48px 44px;
          max-width: 520px;
          width: 100%;
          text-align: center;
          color: #fff;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          animation: cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .rl-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
        }
        .rl-brand-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #1D9E75;
        }
        .rl-brand-name {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* Spinner ring */
        .rl-spinner-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
        }
        .rl-spinner-ring {
          width: 120px;
          height: 120px;
          transform: rotate(-90deg);
        }
        .rl-ring-track {
          fill: none;
          stroke: rgba(255,255,255,0.08);
          stroke-width: 8;
        }
        .rl-ring-fill {
          fill: none;
          stroke: #1D9E75;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rl-spinner-pct {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .rl-title {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 6px;
          font-family: 'DM Sans', system-ui, sans-serif;
          line-height: 1.3;
        }
        .rl-subtitle {
          font-size: 13.5px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 28px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rl-subtitle strong {
          color: rgba(255,255,255,0.9);
          font-weight: 600;
        }

        /* Current stage */
        .rl-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 20px;
          margin-bottom: 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          font-family: 'DM Sans', system-ui, sans-serif;
          min-height: 46px;
        }
        .rl-stage-icon { font-size: 16px; flex-shrink: 0; }
        .rl-stage-label { line-height: 1.4; }

        .rl-download-btn {
          width: 100%;
          background: #1D9E75;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 16px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          transition: transform 0.2s ease, background 0.2s ease;
          box-shadow: 0 4px 20px rgba(29, 158, 117, 0.4);
        }
        .rl-download-btn:hover {
          background: #158562;
          transform: translateY(-2px);
        }
        .rl-download-btn span {
          font-size: 18px;
        }

        /* RegWatch CTA section */
        .rl-cta-section {
          margin-bottom: 20px;
        }
        .rl-regwatch-btn {
          width: 100%;
          background: transparent;
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
          transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rl-regwatch-btn:hover:not(:disabled) {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.06);
          color: #fff;
        }
        .rl-regwatch-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .rl-email-sent {
          background: rgba(29, 158, 117, 0.15);
          border: 1px solid rgba(29, 158, 117, 0.4);
          border-radius: 8px;
          padding: 14px 20px;
          font-size: 13.5px;
          color: rgba(255,255,255,0.9);
          text-align: center;
          margin-bottom: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rl-cta-error {
          font-size: 12px;
          color: #ff8080;
          margin: 0 0 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rl-cta-subtext {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin: 0;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* Progress bar */
        .rl-progress-track {
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
          height: 5px;
          overflow: hidden;
          margin-bottom: 28px;
        }
        .rl-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1D9E75, #0F6E56);
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Did you know */
        .rl-fact {
          background: rgba(255,255,255,0.05);
          border-left: 3px solid #1D9E75;
          border-radius: 4px;
          padding: 14px 16px;
          font-size: 12.5px;
          color: rgba(255,255,255,0.6);
          text-align: left;
          line-height: 1.6;
          margin-bottom: 24px;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .rl-fact-in  { opacity: 1; transform: translateY(0); }
        .rl-fact-out { opacity: 0; transform: translateY(4px); }
        .rl-fact-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1D9E75;
          margin-bottom: 5px;
        }

        .rl-footer-note {
          font-size: 11.5px;
          color: rgba(255,255,255,0.3);
          font-family: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>
    </div>
  );
};
