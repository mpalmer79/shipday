"use client";

/**
 * ProjectAssistant — a floating, recruiter-friendly project guide for ShipDay.
 *
 * This is a deterministic, browser-only guide. It answers strictly from the
 * local knowledge base (lib/project-assistant) with no model, no fetch, no API
 * route, no database, and no environment variable. There is no streaming and no
 * "thinking" indicator: matching is synchronous, so an answer appears at once.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { matchQuestion } from "@/lib/project-assistant/match";
import type { KnowledgeEntry } from "@/lib/project-assistant/knowledge";

/** The five common starter questions shown when the panel opens. */
const TEMPLATE_QUESTIONS = [
  "What is ShipDay?",
  "How does the simulator work?",
  "What can I do in the Studio?",
  "What does this project demonstrate technically?",
  "How do I get in touch with Michael Palmer?",
];

/** The launcher's full prompt. Shown in full on wider screens and always used
 * as the accessible label; a shorter form renders on the smallest screens so
 * the floating control never covers too much of the page. */
const LAUNCHER_LABEL = "Questions about how this was built? Ask me here.";
const LAUNCHER_LABEL_SHORT = "Ask about this build";

type Turn = {
  id: number;
  role: "user" | "assistant";
  text: string;
  /** Matched category, for the small label on assistant turns. */
  category?: KnowledgeEntry["category"] | null;
  /** In-app links from the matched entry. */
  links?: { label: string; href: string }[];
  /** Follow-up questions offered after an assistant answer. */
  related?: string[];
};

let turnSeq = 0;
function nextTurnId(): number {
  turnSeq += 1;
  return turnSeq;
}

export function ProjectAssistant() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const subheadingId = useId();

  // Open automatically from the URL: "?assistant=open" or "#assistant".
  // Client-only; reads the live location, no router dependency.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("assistant") === "open" || window.location.hash === "#assistant") {
      setOpen(true);
    }
  }, []);

  // Ask a question and append both the user turn and the deterministic answer.
  const ask = useCallback((question: string) => {
    const trimmed = question.trim();
    if (trimmed.length === 0) return;
    const result = matchQuestion(trimmed);
    setTurns((prev) => [
      ...prev,
      { id: nextTurnId(), role: "user", text: trimmed },
      {
        id: nextTurnId(),
        role: "assistant",
        text: result.answer,
        category: result.category,
        links: result.entry?.relatedLinks,
        related: result.relatedQuestions.slice(0, 3),
      },
    ]);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(draft);
    setDraft("");
  }

  function handleReset() {
    setTurns([]);
    setDraft("");
    inputRef.current?.focus();
  }

  // Escape closes the panel and returns focus to the launcher.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Move focus into the input when the panel opens.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Keep the latest turn in view as the conversation grows.
  useEffect(() => {
    if (open && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns, open]);

  return (
    <>
      {/* Floating launcher, bottom-right. The full prompt shows from the small
          breakpoint up; on the narrowest screens a shorter label keeps the
          control from covering too much content. The accessible name is always
          the full prompt regardless of which text is visually rendered. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={LAUNCHER_LABEL}
        className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[#c3d4ea] bg-[#eef3fb] px-4 py-2.5 text-sm font-semibold text-[#15233a] shadow-glow transition-colors hover:bg-[#e2ebf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      >
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-[#2563c9] shadow-glow-sm"
        />
        <span aria-hidden="true" className="hidden truncate sm:inline">
          {LAUNCHER_LABEL}
        </span>
        <span aria-hidden="true" className="truncate sm:hidden">
          {LAUNCHER_LABEL_SHORT}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
          aria-describedby={subheadingId}
          className="fixed bottom-20 right-4 z-50 flex max-h-[min(80vh,40rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-edge bg-void/95 shadow-panel backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-surface-line bg-surface-raised/60 px-4 py-3">
            <div>
              <h2
                id={headingId}
                className="text-sm font-semibold tracking-tight text-ink"
              >
                ShipDay Project Assistant
              </h2>
              <p id={subheadingId} className="mt-0.5 text-xs text-ink-muted">
                Ask about the simulator, scenarios, metrics, Studio, or technical
                design.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close Project Assistant"
              className="-mr-1 -mt-1 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-overlay hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span aria-hidden="true" className="block text-base leading-none">
                ×
              </span>
            </button>
          </div>

          {/* Thread */}
          <div
            ref={threadRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {turns.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-ink-faint">
                  Pick a question to get started, or type your own below.
                </p>
                <ul className="space-y-2">
                  {TEMPLATE_QUESTIONS.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => ask(q)}
                        className="w-full rounded-lg border border-surface-line bg-surface-raised px-3 py-2 text-left text-sm text-ink transition-colors hover:border-accent/50 hover:bg-surface-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              turns.map((turn) =>
                turn.role === "user" ? (
                  <div key={turn.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent-soft px-3 py-2 text-sm text-ink">
                      {turn.text}
                    </p>
                  </div>
                ) : (
                  <div key={turn.id} className="space-y-2">
                    {turn.category && (
                      <span className="inline-block rounded-full border border-surface-line bg-surface-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                        {turn.category}
                      </span>
                    )}
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-surface-line bg-surface-raised/70 px-3 py-2 text-sm leading-relaxed text-ink-muted">
                      {turn.text}
                    </div>
                    {turn.links && turn.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {turn.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => {
                              setOpen(false);
                              launcherRef.current?.focus();
                            }}
                            className="rounded-md border border-accent/40 bg-accent-soft/40 px-2 py-1 text-xs font-medium text-ink transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {link.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                    {turn.related && turn.related.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                          Related
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {turn.related.map((rq) => (
                            <button
                              key={rq}
                              type="button"
                              onClick={() => ask(rq)}
                              className="w-full rounded-lg border border-surface-line bg-surface px-3 py-1.5 text-left text-xs text-ink-muted transition-colors hover:border-accent/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              {rq}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-surface-line bg-surface-raised/60 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="project-assistant-input" className="sr-only">
                Ask the Project Assistant a question
              </label>
              <input
                id="project-assistant-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about ShipDay…"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-surface-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="submit"
                disabled={draft.trim().length === 0}
                className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-surface transition-colors enabled:hover:bg-accent/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                aria-label="Send question"
              >
                Send
              </button>
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 rounded-lg border border-surface-line px-2.5 py-2 text-xs text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Clear conversation"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-ink-faint">
              Local project guide. No model calls. No external data.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
