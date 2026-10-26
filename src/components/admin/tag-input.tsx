"use client";

import { useState } from "react";
import { SuggestInput } from "@/components/select";
import { BW, COLOUR, STYLE_TAGS, canonicalTag, cleanTags, withColourTag } from "@/lib/categories";

// The categories of one photo, shown as small labels. Type a name and press Enter to add it
// (any name works), tap a suggestion, or press × to take one off.
export function TagInput({
  value,
  onChange,
  known = [],
  onSuggest,
  suggesting,
  note,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  known?: readonly string[];
  onSuggest?: () => void;
  suggesting?: boolean;
  note?: string;
}) {
  const [text, setText] = useState("");

  const add = (raw: string) => {
    const tag = canonicalTag(raw);
    setText("");
    if (!tag) return;
    onChange(tag === BW || tag === COLOUR ? withColourTag([...value, tag].filter((t) => t !== (tag === BW ? COLOUR : BW)), tag) : cleanTags([...value, tag]));
  };
  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const options = [...new Set([BW, COLOUR, ...known, ...STYLE_TAGS])].filter((t) => !value.includes(t));
  const quick = options.slice(0, 8);

  return (
    <div className="grid gap-1.5">
      <span className="label">Categories</span>
      <div className="tag-box">
        {value.map((t) => (
          <span key={t} className="tag-chip">
            {t}
            <button type="button" onClick={() => remove(t)} aria-label={`Take off ${t}`}>
              ×
            </button>
          </span>
        ))}
        <SuggestInput
          className="tag-field"
          value={text}
          onChange={setText}
          onPick={add}
          suggestions={options}
          maxLength={30}
          placeholder={value.length ? "Add another…" : "Add a category, then press Enter"}
          aria-label="Add a category"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && value.length) {
              remove(value[value.length - 1]);
            }
          }}
        />
      </div>
      {(quick.length > 0 || onSuggest) && (
        <div className="tag-quick">
          {quick.map((t) => (
            <button key={t} type="button" onClick={() => add(t)}>
              + {t}
            </button>
          ))}
          {onSuggest && (
            <button type="button" className="tag-ai" onClick={onSuggest} disabled={suggesting}>
              {suggesting ? "Looking at the photo…" : "✦ Suggest with AI"}
            </button>
          )}
        </div>
      )}
      {note && <p className="text-[13px] text-[var(--muted)]">{note}</p>}
    </div>
  );
}
