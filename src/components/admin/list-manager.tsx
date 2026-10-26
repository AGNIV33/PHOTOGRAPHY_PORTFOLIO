"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SuggestInput } from "@/components/select";

// One editor for short lists (achievements, gear): add, edit, move up/down, delete.

export type ListField = {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  // Offers these as suggestions while still allowing any text.
  suggestions?: string[];
  width?: "short" | "full";
};

type Values = Record<string, string>;
export type ListItem = Values & { id: string };

type Props = {
  noun: string;
  fields: ListField[];
  items: ListItem[];
  // Used as the item's name in the delete question.
  titleField: string;
  save: (id: string | null, values: never) => Promise<void>;
  remove: (id: string) => Promise<void>;
  move: (id: string, direction: -1 | 1) => Promise<void>;
};

function useRun() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>, done = "") =>
    new Promise<boolean>((resolve) =>
      start(async () => {
        try {
          await fn();
          setError("");
          setMsg(done);
          router.refresh();
          resolve(true);
        } catch (e) {
          setMsg("");
          setError(e instanceof Error ? e.message : "Something went wrong");
          resolve(false);
        }
      }),
    );
  return { run, msg, error, pending };
}

function Fields({ fields, values, onChange }: { fields: ListField[]; values: Values; onChange: (v: Values) => void }) {
  return (
    <div className="list-fields">
      {fields.map((f) => (
        <label key={f.name} className={`grid gap-1.5 ${f.width === "short" ? "" : "list-fields-full"}`}>
          <span className="label">{f.label}</span>
          {f.multiline ? (
            <textarea className="field" rows={2} value={values[f.name] ?? ""} placeholder={f.placeholder} onChange={(e) => onChange({ ...values, [f.name]: e.target.value })} />
          ) : (
            f.suggestions ? (
              <SuggestInput
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                suggestions={f.suggestions}
                onChange={(v) => onChange({ ...values, [f.name]: v })}
              />
            ) : (
              <input
                className="field"
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
              />
            )
          )}
        </label>
      ))}
    </div>
  );
}

function Row({ item, index, total, props }: { item: ListItem; index: number; total: number; props: Props }) {
  const [values, setValues] = useState<Values>(item);
  const { run, msg, error, pending } = useRun();
  const save = props.save as (id: string | null, v: Values) => Promise<void>;

  return (
    <li className="admin-panel grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="frame-no">{String(index + 1).padStart(2, "0")}</span>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === 0} onClick={() => run(() => props.move(item.id, -1))}>
            ↑ Up
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === total - 1} onClick={() => run(() => props.move(item.id, 1))}>
            ↓ Down
          </button>
        </div>
      </div>
      <Fields fields={props.fields} values={values} onChange={setValues} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px]" role="status">
          {error ? <span className="text-[var(--safelight)]">{error}</span> : <span className="text-[var(--ink-2)]">{msg}</span>}
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => {
              const name = item[props.titleField] || `this ${props.noun}`;
              if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
              run(() => props.remove(item.id));
            }}
          >
            Delete
          </button>
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => run(() => save(item.id, values), "Saved.")}>
            Save
          </button>
        </div>
      </div>
    </li>
  );
}

export function ListManager(props: Props) {
  const empty = Object.fromEntries(props.fields.map((f) => [f.name, ""]));
  const [values, setValues] = useState<Values>(empty);
  const { run, msg, error, pending } = useRun();
  const save = props.save as (id: string | null, v: Values) => Promise<void>;

  return (
    <div className="grid gap-10 max-w-3xl">
      <form
        className="admin-panel grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => save(null, values), "Added.")) setValues(empty);
        }}
      >
        <span className="kicker">Add {props.noun}</span>
        <Fields fields={props.fields} values={values} onChange={setValues} />
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : `Add ${props.noun}`}
          </button>
          <span className="text-[14px]" role="status">
            {error ? <span className="text-[var(--safelight)]">{error}</span> : <span className="text-[var(--ink-2)]">{msg}</span>}
          </span>
        </div>
      </form>

      {props.items.length === 0 ? (
        <p className="text-[var(--ink-2)]">Nothing added yet.</p>
      ) : (
        <ol className="grid gap-6">
          {props.items.map((it, i) => (
            <Row key={it.id} item={it} index={i} total={props.items.length} props={props} />
          ))}
        </ol>
      )}
    </div>
  );
}
