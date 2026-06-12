"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EndOfDayReport } from "@/components/simulator/EndOfDayReport";
import { OutcomeBadge } from "@/components/simulator/OutcomeBadge";
import { ReplayView } from "@/components/simulator/ReplayView";
import {
  encodeRun,
  generateReport,
  reconstructRun,
  reportFilename,
  reportToMarkdown,
} from "@/lib/simulator";
import { extractRunCode, loadRunFromCode } from "@/lib/runLink";

function CodeForm({ label }: { label: string }) {
  const router = useRouter();
  const [text, setText] = useState("");

  function handleOpen() {
    const code = extractRunCode(text);
    if (code.length === 0) {
      return;
    }
    router.push(`/run?code=${encodeURIComponent(code)}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleOpen();
      }}
      className="mt-6 flex flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="run-code" className="sr-only">
        {label}
      </label>
      <input
        id="run-code"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a run link or code"
        spellCheck={false}
        className="flex-1 rounded-lg border border-surface-line bg-surface-raised px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint"
      />
      <button
        type="submit"
        disabled={text.trim().length === 0}
        className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface transition-colors enabled:hover:bg-accent/90 disabled:opacity-40"
      >
        Open run
      </button>
    </form>
  );
}

export function RunClient() {
  const params = useSearchParams();
  const code = params.get("code");
  const [view, setView] = useState<"report" | "replay">("report");

  const result = useMemo(
    () => (code ? loadRunFromCode(code) : null),
    [code]
  );

  if (!code || !result) {
    return (
      <AppShell footer>
        <div className="mx-auto max-w-2xl py-16">
          <h1 className="text-3xl font-bold tracking-tight">Shared run</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            This page shows a completed workday from a shared link. The link
            carries the scenario and every decision; the run is rebuilt here,
            so nothing is uploaded or stored.
          </p>
          <CodeForm label="Run link or code" />
        </div>
      </AppShell>
    );
  }

  if (!result.ok) {
    return (
      <AppShell footer>
        <div className="mx-auto max-w-2xl py-16">
          <h1 className="text-3xl font-bold tracking-tight">Shared run</h1>
          <div className="mt-6 rounded-lg border border-bad/40 bg-bad/5 p-5">
            <h2 className="text-sm font-semibold text-bad">
              This run link does not work
            </h2>
            <p className="mt-2 font-mono text-xs leading-relaxed text-ink-muted">
              {result.error}
            </p>
          </div>
          <CodeForm label="Try another run link or code" />
        </div>
      </AppShell>
    );
  }

  const { scenario, state, outcome } = result.run;
  const report = generateReport(scenario, state);
  const frames = reconstructRun(scenario, state.decisions).frames;
  const shareCode = encodeRun(
    scenario.id,
    state.decisions.map((d) => d.optionId)
  );

  function downloadReport() {
    const runDate = new Date();
    const markdown = reportToMarkdown(scenario, report, runDate);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = reportFilename(scenario, runDate);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell footer>
      <div className="mx-auto max-w-2xl py-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Shared run
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {scenario.name}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {scenario.tagline}{" "}
          <Link
            href={`/simulator/${scenario.id}`}
            className="text-accent hover:underline"
          >
            Play this workday yourself
          </Link>
          .
        </p>

        <div className="mt-6 flex flex-col gap-5">
          {view === "report" && (
            <>
              <OutcomeBadge outcome={outcome} />
              <EndOfDayReport
                report={report}
                onReplay={() => setView("replay")}
                onDownload={downloadReport}
                shareCode={shareCode}
              />
            </>
          )}
          {view === "replay" && (
            <ReplayView frames={frames} onBack={() => setView("report")} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
