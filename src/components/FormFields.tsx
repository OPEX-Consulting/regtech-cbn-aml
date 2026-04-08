import React from "react";

interface RadioGroupFieldProps {
  label: string;
  name: string;
  options: { id: string; value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4;
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  columns = 2,
}) => {
  const gridCols =
    columns === 3
      ? "grid-cols-3"
      : columns === 4
      ? "grid-cols-4"
      : "grid-cols-2";

  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label}
      </label>
      <div className={`grid ${gridCols} gap-2`}>
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-2 px-3 py-2.5 border rounded-md cursor-pointer text-[13px] leading-snug transition-all ${
              value === opt.value
                ? "border-primary bg-secondary text-primary-dark"
                : "border-border bg-background text-foreground hover:border-primary"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center ${
                value === opt.value ? "border-primary" : "border-border"
              }`}
            >
              {value === opt.value && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </span>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
};

interface CheckboxGroupFieldProps {
  label: string;
  options: { id: string; value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
}

export const CheckboxGroupField: React.FC<CheckboxGroupFieldProps> = ({
  label,
  options,
  values,
  onChange,
}) => {
  const toggle = (val: string) => {
    onChange(
      values.includes(val) ? values.filter((v) => v !== val) : [...values, val]
    );
  };

  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <label
              key={opt.id}
              className={`flex items-center gap-2 px-3 py-2.5 border rounded-md cursor-pointer text-[13px] leading-snug transition-all ${
                checked
                  ? "border-primary bg-secondary text-primary-dark"
                  : "border-border bg-background text-foreground hover:border-primary"
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-[1.5px] ${
                  checked
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
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
                onChange={() => toggle(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) => (
  <div className="mb-5">
    <label className="block text-[13px] font-medium text-foreground mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background text-foreground transition-colors focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
    />
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
}) => (
  <div className="mb-5">
    <label className="block text-[13px] font-medium text-foreground mb-1.5">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background text-foreground transition-colors focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

interface TextAreaFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => (
  <div className="mb-5">
    {label && (
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background text-foreground transition-colors focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 min-h-[80px] resize-y"
    />
  </div>
);
