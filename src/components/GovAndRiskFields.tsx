import React from "react";

interface RiskFlagItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const RiskFlagItem: React.FC<RiskFlagItemProps> = ({
  label,
  checked,
  onChange,
}) => (
  <label
    className={`flex items-start gap-2.5 px-3 py-2.5 border rounded-md cursor-pointer text-[13px] transition-all ${
      checked
        ? "border-warning bg-warning-light text-warning-foreground"
        : "border-border bg-background text-foreground hover:border-warning"
    }`}
  >
    <span
      className={`w-4 h-4 rounded border-[1.5px] flex-shrink-0 mt-0.5 flex items-center justify-center ${
        checked ? "bg-warning border-warning" : "bg-background border-border"
      }`}
    >
      {checked && (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          className="text-primary-foreground"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <span>{label}</span>
  </label>
);

interface GovItemProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const GovItem: React.FC<GovItemProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-border-light gap-3 last:border-b-0">
    <span className="text-[13px] text-foreground leading-snug flex-1">
      {label}
    </span>
    <div className="flex gap-1.5 flex-shrink-0">
      <button
        type="button"
        onClick={() => onChange("Yes")}
        className={`px-3 py-1 text-xs font-medium border rounded-full transition-all ${
          value === "Yes"
            ? "bg-secondary border-primary text-primary-dark"
            : "bg-background border-border text-muted-foreground hover:border-primary"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange("No")}
        className={`px-3 py-1 text-xs font-medium border rounded-full transition-all ${
          value === "No"
            ? "bg-destructive-light border-destructive text-destructive"
            : "bg-background border-border text-muted-foreground hover:border-destructive"
        }`}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => onChange("Not confirmed")}
        className={`px-3 py-1 text-xs font-medium border rounded-full transition-all ${
          value === "Not confirmed"
            ? "bg-muted border-muted-foreground/40 text-muted-foreground"
            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/40"
        }`}
      >
        Unsure
      </button>
    </div>
  </div>
);
