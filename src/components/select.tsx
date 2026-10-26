"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The website's own dropdowns. The browser's built-in list can't be styled, so these draw
// their own panel (dark, hairline border, copper edge) and still work with the keyboard,
// a screen reader and a phone.
// - Select: pick one from a list (replaces <select>).
// - SuggestInput: a text box that offers suggestions as you type (replaces <datalist>).

export type Option = { value: string; label: string };

const toOptions = (list: readonly (string | Option)[]): Option[] => list.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

// Where the panel goes: under the field, or above it when there is no room below.
function measure(el: HTMLElement | null): Place | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - 8;
  const above = r.top - 8;
  const up = below < 220 && above > below;
  const maxHeight = Math.max(140, Math.min(320, up ? above : below));
  return up
    ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top, maxHeight }
    : { left: r.left, width: r.width, top: r.bottom, maxHeight };
}

// Closes the panel on a click elsewhere, on resize, or when the page scrolls.
function useDismiss(open: boolean, close: () => void, anchor: React.RefObject<HTMLElement | null>, list: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      const t = e.target as Node;
      if (anchor.current?.contains(t) || list.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && list.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

// Keeps the highlighted row in view inside the panel, without moving the page.
function useKeepInView(list: React.RefObject<HTMLUListElement | null>, active: number, open: boolean) {
  useEffect(() => {
    const ul = list.current;
    const li = ul?.children[active] as HTMLElement | undefined;
    if (!open || !ul || !li) return;
    if (li.offsetTop < ul.scrollTop) ul.scrollTo(0, li.offsetTop - 6);
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTo(0, li.offsetTop + li.offsetHeight - ul.clientHeight + 6);
  }, [list, active, open]);
}

function Panel({
  id,
  place,
  options,
  active,
  selected,
  onActive,
  onChoose,
  listRef,
  label,
}: {
  id: string;
  place: Place;
  options: Option[];
  active: number;
  selected: number;
  onActive: (i: number) => void;
  onChoose: (i: number) => void;
  listRef: React.RefObject<HTMLUListElement | null>;
  label?: string;
}) {
  return createPortal(
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      aria-label={label}
      className="sel-list"
      data-up={place.bottom !== undefined ? "" : undefined}
      data-lenis-prevent
      style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }}
      onMouseDown={(e) => e.preventDefault()} // the field keeps focus
    >
      {options.map((o, i) => (
        <li
          key={o.value || `empty-${i}`}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === selected}
          data-active={i === active ? "" : undefined}
          className="sel-option"
          onMouseMove={() => i !== active && onActive(i)}
          onClick={() => onChoose(i)}
        >
          <span>{o.label}</span>
        </li>
      ))}
    </ul>,
    document.body,
  );
}

const Chevron = () => (
  <svg className="sel-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
    <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export function Select({
  options,
  value,
  onChange,
  placeholder = "Choose",
  id,
  name,
  variant = "line",
  invalid,
  disabled,
  className = "",
  ariaLabel,
}: {
  options: readonly (string | Option)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  variant?: "line" | "box";
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const uid = useId();
  const opts = useMemo(() => toOptions(options), [options]);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [active, setActive] = useState(-1);
  const typed = useRef({ text: "", at: 0 });

  const open = place !== null;
  const selected = opts.findIndex((o) => o.value === value);
  const current = selected >= 0 ? opts[selected] : undefined;
  const listId = `${uid}-list`;

  const close = () => setPlace(null);
  const show = (at?: number) => {
    if (disabled) return;
    setPlace(measure(btn.current));
    setActive(at ?? (selected >= 0 ? selected : 0));
  };
  const choose = (i: number) => {
    const o = opts[i];
    if (o) onChange(o.value);
    close();
    btn.current?.focus();
  };

  useDismiss(open, close, btn, list);
  useKeepInView(list, active, open);

  // Typing letters jumps to a matching row, like a normal dropdown.
  const jump = (char: string) => {
    const now = Date.now();
    typed.current.text = now - typed.current.at > 700 ? char : typed.current.text + char;
    typed.current.at = now;
    const text = typed.current.text.toLowerCase();
    const same = text.split("").every((c) => c === text[0]);
    const from = same ? active + 1 : active;
    for (let n = 0; n < opts.length; n++) {
      const i = (Math.max(from, 0) + n) % opts.length;
      if (opts[i].label.toLowerCase().startsWith(same ? text[0] : text)) {
        if (!open) show(i);
        else setActive(i);
        return;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      } else if (e.key.length === 1) jump(e.key);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(opts.length - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(opts.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        if (e.key.length === 1) jump(e.key);
    }
  };

  return (
    <>
      <button
        ref={btn}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`sel ${variant === "box" ? "field" : "auth-input"} ${className}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
      >
        <span className="sel-value" data-empty={current ? undefined : ""}>
          {current ? current.label : placeholder}
        </span>
        <Chevron />
      </button>
      {name && <input type="hidden" name={name} value={value} />}
      {place && <Panel id={listId} place={place} options={opts} active={active} selected={selected} onActive={setActive} onChoose={choose} listRef={list} label={ariaLabel} />}
    </>
  );
}

// A text box that suggests values as you type. Anything can still be typed.
export function SuggestInput({
  value,
  onChange,
  suggestions,
  className = "field",
  ...input
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "list">) {
  const uid = useId();
  const field = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [active, setActive] = useState(-1);

  const q = value.trim().toLowerCase();
  const opts = useMemo(
    () => toOptions(suggestions.filter((s) => s.toLowerCase() !== q && (!q || s.toLowerCase().includes(q)))),
    [suggestions, q],
  );
  const open = place !== null && opts.length > 0;
  const listId = `${uid}-list`;

  const close = () => setPlace(null);
  const show = () => setPlace(measure(field.current));
  const choose = (i: number) => {
    const o = opts[i];
    if (o) onChange(o.value);
    close();
    field.current?.focus();
  };

  useDismiss(place !== null, close, field, list);
  useKeepInView(list, active, open);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        show();
        setActive(0);
      } else setActive((a) => Math.min(opts.length - 1, a + 1));
    } else if (!open) {
      return;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <>
      <input
        {...input}
        ref={field}
        className={className}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(-1);
          show();
        }}
        onFocus={show}
        onClick={show}
        onKeyDown={onKeyDown}
      />
      {open && place && <Panel id={listId} place={place} options={opts} active={active} selected={-1} onActive={setActive} onChoose={choose} listRef={list} />}
    </>
  );
}
