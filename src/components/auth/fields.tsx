"use client";

import { useId, useState } from "react";
import { passwordScore } from "@/lib/password";
import { Select } from "../select";

type Common = {
  label: string;
  error?: string | null;
  hint?: string;
  className?: string;
};

export function Field({
  label,
  error,
  hint,
  className,
  ...input
}: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={`auth-field ${className ?? ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="auth-input" aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} {...input} />
      {(error || hint) && (
        <p id={`${id}-note`} className="auth-note" role={error ? "alert" : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...area
}: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={`auth-field ${className ?? ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id} className="label">{label}</label>
      <textarea id={id} className="auth-input auth-textarea" aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} {...area} />
      {(error || hint) && (
        <p id={`${id}-note`} className="auth-note" role={error ? "alert" : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  error,
  options,
  placeholder,
  className,
  value,
  onChange,
}: Common & { options: readonly string[]; placeholder: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className={`auth-field ${className ?? ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id} className="label">{label}</label>
      <Select id={id} options={options} placeholder={placeholder} value={value} onChange={onChange} invalid={!!error} />
      {error && <p className="auth-note" role="alert">{error}</p>}
    </div>
  );
}

export function PasswordField({
  label,
  error,
  hint,
  showStrength,
  className,
  ...input
}: Common & { showStrength?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const value = String(input.value ?? "");
  const score = passwordScore(value);
  return (
    <div className={`auth-field ${className ?? ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id} className="label">{label}</label>
      <div className="auth-password">
        <input
          id={id}
          className="auth-input"
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-note`}
          {...input}
        />
        <button type="button" className="auth-reveal" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-controls={id}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && (
        <div className="auth-strength" data-score={value ? score : 0} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
      <p id={`${id}-note`} className="auth-note" role={error ? "alert" : undefined}>
        {error || hint}
      </p>
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  return (
    <div className="auth-message" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
