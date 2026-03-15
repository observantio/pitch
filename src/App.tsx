import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  Sparkles,
  Terminal,
  Copy,
} from "lucide-react";

import { slidesJson } from "./data/slideData";
import type { Path, SlideData } from "./data/slideTypes";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const BLUE = "#3b82f6";
const RED = "#ef4444";
const DOCS = "#14b8a6";
const BLUE_GLOW = "rgba(59,130,246,0.14)";
const RED_GLOW = "rgba(239,68,68,0.14)";
const DOCS_GLOW = "rgba(20,184,166,0.18)";

const DOC_LINKS = [
  {
    label: "Full User Guide",
    href: "https://github.com/observantio/watchdog/blob/main/USER_GUIDE.md",
  },
  {
    label: "Architecture README",
    href: "https://github.com/observantio/watchdog/blob/main/README.md",
  },
];

function withBaseUrl(src: string) {
  if (!src) return src;
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  if (!src.startsWith("/")) return src;
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${src.replace(/^\//, "")}`;
}

function findHorizontalScrollContainer(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof HTMLElement)) return null;
  let current: HTMLElement | null = node;
  while (current) {
    if (current.scrollWidth > current.clientWidth) {
      const overflowX = window.getComputedStyle(current).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return current;
    }
    current = current.parentElement;
  }
  return null;
}

function pathAccent(path: Path) {
  if (path === "understand") return BLUE;
  if (path === "use") return RED;
  if (path === "docs") return DOCS;
  return "#00ffaa";
}
function pathGlow(path: Path) {
  if (path === "understand") return BLUE_GLOW;
  if (path === "use") return RED_GLOW;
  if (path === "docs") return DOCS_GLOW;
  return "rgba(0,255,170,0.18)";
}

function Tick({ accent }: { accent: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-35">
      <div className="absolute left-4 top-4 h-3 w-3 border-l border-t" style={{ borderColor: accent + "60" }} />
      <div className="absolute right-4 top-4 h-3 w-3 border-r border-t" style={{ borderColor: accent + "60" }} />
      <div className="absolute left-4 bottom-4 h-3 w-3 border-l border-b" style={{ borderColor: accent + "60" }} />
      <div className="absolute right-4 bottom-4 h-3 w-3 border-r border-b" style={{ borderColor: accent + "60" }} />
    </div>
  );
}

function Tag({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-mono"
      style={{ backgroundColor: accent + "18", border: `1px solid ${accent}40`, color: accent }}
    >
      {label}
    </span>
  );
}

function BoolCell({ val, accent }: { val: boolean | string; accent: string }) {
  if (val === true) return <span style={{ color: accent }} className="text-lg">✓</span>;
  if (val === false) return <span className="text-retro-dim text-lg">✗</span>;
  return <span className="text-xs text-zinc-400">{val}</span>;
}

function GenericTable({ slide, accent }: { slide: SlideData; accent: string }) {
  const t = slide.table;
  if (!t) return null;

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border" style={{ borderColor: accent + "35" }}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr style={{ backgroundColor: accent + "10", borderBottom: `1px solid ${accent}25` }}>
            {t.columns.map((c, i) => (
              <th
                key={i}
                className="py-2.5 px-4 text-left font-mono text-xs uppercase tracking-wider"
                style={{ color: i === 0 ? "#a1a1aa" : accent }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < t.rows.length - 1 ? `1px solid ${accent}15` : "none" }}>
              {row.map((cell, ci) => (
                <td key={ci} className={`py-2.5 px-4 ${ci === 0 ? "text-zinc-200" : "text-zinc-300"}`}>
                  {typeof cell === "boolean" ? <BoolCell val={cell} accent={accent} /> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlideImage({ slide, accent }: { slide: SlideData; accent: string }) {
  if (!slide.image) return null;
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border" style={{ borderColor: accent + "35" }}>
      <div className="bg-black/40">
        <img
          src={withBaseUrl(slide.image.src)}
          alt={slide.image.alt ?? "slide image"}
          className="w-full max-h-[420px] object-contain"
        />
      </div>
    </div>
  );
}

function SlideGallery({ slide, accent }: { slide: SlideData; accent: string }) {
  if (!slide.gallery?.length) return null;
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {slide.gallery.map((g, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-black/30" style={{ borderColor: accent + "35" }}>
          <img
            src={withBaseUrl(g.src)}
            alt={g.alt ?? `gallery ${i + 1}`}
            className="w-full h-[180px] sm:h-[200px] object-cover"
          />
          {g.alt && <div className="px-3 py-2 text-xs text-zinc-400 font-mono border-t" style={{ borderColor: accent + "20" }}>{g.alt}</div>}
        </div>
      ))}
    </div>
  );
}

function SlideLinks({ slide, accent }: { slide: SlideData; accent: string }) {
  if (!slide.links?.length) return null;
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {slide.links.map((item) => (
        <a
          key={`${item.label}-${item.href}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-4 bg-retro-bg/40 hover:bg-retro-bg/70 transition-colors"
          style={{ borderColor: accent + "35" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: accent }}>
              {item.label}
            </div>
            <ArrowRight className="h-4 w-4 text-retro-dim" />
          </div>
          {item.description && (
            <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {item.description}
            </div>
          )}
          <div className="mt-2 text-[11px] font-mono text-retro-dim break-all">
            {item.href}
          </div>
        </a>
      ))}
    </div>
  );
}

function renderContent(slide: SlideData, accent: string) {
  switch (slide.type) {
    case "bullets":
      return slide.bullets ? (
        <ul className="mt-6 space-y-3">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-base sm:text-lg leading-relaxed text-zinc-100/90">
              <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
              {b}
            </li>
          ))}
        </ul>
      ) : null;

    case "metrics":
      return (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {slide.metrics?.map((m, i) => (
            <div key={i} className="rounded-2xl border bg-retro-bg/40 p-5" style={{ borderColor: accent + "35" }}>
              <div className="text-3xl sm:text-4xl font-bold font-mono" style={{ color: accent }}>{m.value}</div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">{m.label}</div>
              {m.sub && <div className="mt-1 text-xs text-retro-dim">{m.sub}</div>}
            </div>
          ))}
        </div>
      );

    case "services":
      return (
        <div className="mt-6 space-y-5">
          {slide.services?.map((svc, i) => (
            <div key={i} className="rounded-2xl bg-retro-bg/40 overflow-hidden">
              {svc.image && (
                <div className="rounded-t-2xl overflow-hidden">
                  <img
                    src={withBaseUrl(svc.image.src)}
                    alt={svc.image.alt ?? svc.name}
                    className="w-full object-contain my-3 block"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <div className="font-semibold text-xl my-3">{svc.name}</div>
                  <div className="text-sm text-retro-dim">{svc.tagline}</div>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {svc.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2.5 text-sm text-zinc-200/90">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {svc.tags.map((t) => <Tag key={t} label={t} accent={accent} />)}
              </div>
            </div>
          ))}
        </div>
      );

    case "comparison":
      return (
        <div className="mt-6 overflow-x-auto rounded-2xl border" style={{ borderColor: accent + "35" }}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: accent + "25", backgroundColor: accent + "10" }}>
                <th className="py-3 px-4 text-left font-mono text-xs uppercase tracking-wider text-retro-dim">Feature</th>
                <th className="py-3 px-4 text-center font-mono text-xs uppercase tracking-wider" style={{ color: accent }}>Watchdog</th>
                <th className="py-3 px-4 text-center font-mono text-xs uppercase tracking-wider text-retro-dim">Datadog</th>
                <th className="py-3 px-4 text-center font-mono text-xs uppercase tracking-wider text-retro-dim">Grafana</th>
              </tr>
            </thead>
            <tbody>
              {slide.comparison?.map((row, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: accent + "15" }}>
                  <td className="py-3 px-4 text-zinc-200 text-xs sm:text-sm">{row.feature}</td>
                  <td className="py-3 px-4 text-center"><BoolCell val={row.us} accent={accent} /></td>
                  <td className="py-3 px-4 text-center"><BoolCell val={row.datadog} accent={accent} /></td>
                  <td className="py-3 px-4 text-center"><BoolCell val={row.grafana} accent={accent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "arch":
      return (
        <div className="mt-8 space-y-3">
          {slide.archLayers?.map((layer, li) => (
            <div key={li} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 pt-2.5 text-right">
                <span className="text-xs font-mono uppercase tracking-wider text-retro-dim">{layer.label}</span>
              </div>
              <div className="flex-shrink-0 pt-3">
                <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: accent, backgroundColor: accent + "30" }} />
                {li < (slide.archLayers?.length ?? 0) - 1 && (
                  <div className="ml-[5px] mt-1 h-8 w-px" style={{ backgroundColor: accent + "40" }} />
                )}
              </div>
              <div className="flex flex-wrap gap-2 pb-2">
                {layer.nodes.map((node) => (
                  <div key={node} className="rounded-xl border px-3 py-1.5 text-xs font-mono" style={{ borderColor: accent + "40", backgroundColor: accent + "0D", color: "#d4d4d8" }}>
                    {node}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case "code":
      return (
        <div className="mt-6">
          {slide.codeLabel && (
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-retro-dim" />
              <span className="text-xs font-mono text-retro-dim">{slide.codeLabel}</span>
            </div>
          )}
          <div className="rounded-2xl border overflow-auto" style={{ borderColor: accent + "35", backgroundColor: "#0a0a0a" }}>
            <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: accent + "25" }}>
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            </div>
            <pre className="px-5 py-4 text-xs sm:text-sm font-mono leading-relaxed text-zinc-300 max-h-[400px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700/50 hover:scrollbar-thumb-zinc-600/60">
              <code className="whitespace-pre">{slide.code}</code>
            </pre>
          </div>
        </div>
      );

    case "workflow":
      return (
        <div className="mt-6 space-y-3">
          {slide.workflowSteps?.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-bold" style={{ backgroundColor: accent + "20", border: `1.5px solid ${accent}`, color: accent }}>
                  {i + 1}
                </div>
                {i < (slide.workflowSteps?.length ?? 0) - 1 && (
                  <div className="mt-1 h-full w-px" style={{ backgroundColor: accent + "30" }} />
                )}
              </div>
              <div className="pb-4">
                <div className="font-semibold text-zinc-100 text-sm">{step.label}</div>
                <div className="mt-1 text-sm text-zinc-400 leading-relaxed">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      );

    case "savings":
      return (
        <div className="mt-6 overflow-x-auto rounded-2xl border" style={{ borderColor: accent + "35" }}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr style={{ backgroundColor: accent + "10", borderBottom: `1px solid ${accent}25` }}>
                <th className="py-2.5 px-4 text-left font-mono text-xs uppercase tracking-wider text-retro-dim">Metric</th>
                <th className="py-2.5 px-4 text-center font-mono text-xs uppercase tracking-wider text-retro-dim">Before</th>
                <th className="py-2.5 px-4 text-center font-mono text-xs uppercase tracking-wider" style={{ color: accent }}>After / Saved</th>
              </tr>
            </thead>
            <tbody>
              {slide.savings?.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < (slide.savings?.length ?? 0) - 1 ? `1px solid ${accent}15` : "none" }}>
                  <td className="py-2.5 px-4 text-xs text-zinc-300">{row.metric}</td>
                  <td className="py-2.5 px-4 text-center text-xs text-zinc-400 font-mono">{row.before}</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono font-semibold" style={{ color: accent }}>
                    {row.unit ? row.unit : row.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "license":
      return (
        <div className="mt-6 rounded-2xl border p-6" style={{ borderColor: accent + "35", backgroundColor: accent + "08" }}>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: accent }}>License</span>
          </div>
          <pre className="text-xs text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">{slide.licenseText}</pre>
        </div>
      );

    case "table":
      return <GenericTable slide={slide} accent={accent} />;

    case "image":
      return <SlideImage slide={slide} accent={accent} />;

    case "gallery":
      return <SlideGallery slide={slide} accent={accent} />;

    default:
      return null;
  }
}

function PillChoice({ onChoose }: { onChoose: (p: Exclude<Path, null>) => void }) {
  const [hovered, setHovered] = useState<Path>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      "curl -fsSL https://raw.githubusercontent.com/observantio/watchdog/main/install.py -o /tmp/install.py && python3 /tmp/install.py"
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-retro-bg text-retro-text font-sans flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]">
        <div className="h-full w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[length:100%_3px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl text-center px-4 py-6 sm:px-6 sm:py-7 rounded-3xl border bg-zinc-950/90 backdrop-blur-sm"
        style={{ borderColor: "#ffffff1f", boxShadow: "0 14px 48px rgba(0,0,0,0.45)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-retro-glow" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-retro-dim">Watchdog</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-bold tracking-tight mb-4">Choose your path</h1>
        <p className="text-retro-dim text-sm sm:text-lg mb-8 sm:mb-12 max-w-md mx-auto">
          Two pills. One decision. Your journey is tailored to what you actually need.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHovered("understand")}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onChoose("understand")}
            className="group relative rounded-3xl border p-5 sm:p-7 text-left transition-all duration-300"
            style={{
              borderColor: BLUE + "50",
              backgroundColor: hovered === "understand" ? BLUE + "18" : BLUE + "08",
              boxShadow: hovered === "understand" ? `0 10px 30px ${BLUE_GLOW}` : "none",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: BLUE + "25", boxShadow: `0 0 20px ${BLUE}40` }}>
                💊
              </div>
              <div>
                <div className="font-bold text-xl" style={{ color: BLUE }}>Blue Pill</div>
                <div className="text-xs font-mono text-retro-dim uppercase tracking-wider">Understand</div>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              What is the purpose of Watchdog? How does it work? Why is it different? For thinkers.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Architecture", "Core Services"].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: BLUE + "20", color: BLUE }}>
                  {t}
                </span>
              ))}
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHovered("use")}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onChoose("use")}
            className="group relative rounded-3xl border p-5 sm:p-7 text-left transition-all duration-300"
            style={{
              borderColor: RED + "50",
              backgroundColor: hovered === "use" ? RED + "18" : RED + "08",
              boxShadow: hovered === "use" ? `0 10px 30px ${RED_GLOW}` : "none",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: RED + "25", boxShadow: `0 0 20px ${RED}40` }}>
                💊
              </div>
              <div>
                <div className="font-bold text-xl" style={{ color: RED }}>Red Pill</div>
                <div className="text-xs font-mono text-retro-dim uppercase tracking-wider">Deploy & Use</div>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              Fast path to deploying a dev version locally, exploring the UI, and getting value immediately. For doers.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Quick Start", "Development"].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: RED + "20", color: RED }}>
                  {t}
                </span>
              ))}
            </div>
          </motion.button>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <div className="relative w-full">
            <pre className="rounded-2xl bg-zinc-950 px-4 sm:px-5 py-3 font-mono text-[11px] sm:text-xs text-zinc-200 border border-zinc-800 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700/50 hover:scrollbar-thumb-zinc-600/60">
              <code>curl -fsSL https://raw.githubusercontent.com/observantio/watchdog/main/install.py -o /tmp/install.py && python3 /tmp/install.py</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-1 right-1 p-1 rounded bg-retro-bg/60 hover:bg-retro-bg/80 text-retro-dim"
              title="Copy command"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            {copied && (
              <span className="absolute top-2 right-8 text-xs text-green-400">Copied!</span>
            )}
          </div>
          <p className="mt-2 text-xs text-retro-dim">
            Run the command above to spin up Watchdog and the full LGTM stack locally. Great for exploring the UI and features without any commitment.
          </p>
          <div className="mt-4 flex w-full flex-col items-center gap-3">
            <button
              onClick={() => onChoose("docs")}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-mono font-semibold transition"
              style={{ borderColor: DOCS + "55", backgroundColor: DOCS + "12", color: DOCS, boxShadow: `0 0 22px ${DOCS_GLOW}` }}
            >
              <FileText className="h-4 w-4" />
              Open Full Product Documentation
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {DOC_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs font-mono text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const NOTICE_TEXT = `Copyright (c) 2026 Stefan Kumarasinghe

This product includes software developed by Stefan Kumarasinghe and contributors.

────────────────────────────────────────
LICENSING
────────────────────────────────────────

This project is licensed under the Apache License, Version 2.0 (the "License").
You may obtain a copy of the License at:
http://www.apache.org/licenses/LICENSE-2.0

────────────────────────────────────────
THIRD-PARTY COMPONENTS & NON-ENDORSEMENT
────────────────────────────────────────

This project utilizes several third-party components to provide observability
and infrastructure capabilities.

Stefan Kumarasinghe and this project are not affiliated with, endorsed by,
or sponsored by the owners of these projects.

Relevant third-party software includes (but is not limited to):

Observability & Tracing  —  OpenTelemetry (OTel), Grafana, Loki, Tempo, Mimir, Alertmanager

Infrastructure & Data    —  Envoy, PostgreSQL, Redis and Nginx

Application Frameworks   —  FastAPI and the Python ecosystem, React and the JavaScript ecosystem

────────────────────────────────────────
ATTRIBUTION
────────────────────────────────────────

Each dependency remains subject to its own license terms. Refer to individual
dependency manifests (requirements.txt, package.json) and upstream project
repositories for full attribution and license text.`;

const LICENSE_TEXT = `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work.

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship.

   "Contribution" shall mean any work of authorship, including the
   original version of the Work and any modifications or additions to
   that Work or Derivative Works thereof, that is intentionally submitted
   to the Licensor for inclusion in the Work.

2. Grant of Copyright License.

   Subject to the terms and conditions of this License, each Contributor
   hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
   royalty-free, irrevocable copyright license to reproduce, prepare
   Derivative Works of, publicly display, publicly perform, sublicense,
   and distribute the Work and such Derivative Works in Source or Object
   form.

3. Grant of Patent License.

   Subject to the terms and conditions of this License, each Contributor
   hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
   royalty-free, irrevocable patent license to make, have made, use,
   offer to sell, sell, import, and otherwise transfer the Work.

4. Redistribution.

   You may reproduce and distribute copies of the Work or Derivative Works
   thereof in any medium, with or without modifications, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or Derivative Works
       a copy of this License; and

   (b) You must cause any modified files to carry prominent notices stating
       that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works, all
       copyright, patent, trademark, and attribution notices from the Source
       form of the Work.

5. Submission of Contributions.

   Unless You explicitly state otherwise, any Contribution intentionally
   submitted for inclusion in the Work shall be under the terms of this
   License.

6. Trademarks.

   This License does not grant permission to use the trade names, trademarks,
   service marks, or product names of the Licensor.

7. Disclaimer of Warranty.

   Unless required by applicable law or agreed to in writing, Licensor
   provides the Work "AS IS", WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
   either express or implied.

8. Limitation of Liability.

   In no event and under no legal theory shall any Contributor be liable for
   any damages arising as a result of this License or the use of the Work.

9. Accepting Warranty or Additional Liability.

   While redistributing the Work, You may choose to offer support or warranty
   obligations, but only on Your own behalf.

END OF TERMS AND CONDITIONS`;

type LegalStep = "notice" | "license";

function LegalGate({ path, onAccept, onBack }: { path: Exclude<Path, null>; onAccept: () => void; onBack: () => void }) {
  const [step, setStep] = useState<LegalStep>("notice");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const accent = pathAccent(path);
  const glow = pathGlow(path);
  const isNotice = step === "notice";
  const docTitle = isNotice ? "NOTICE" : "LICENSE";
  const docText = isNotice ? NOTICE_TEXT : LICENSE_TEXT;
  const btnLabel = isNotice ? "Continue to License →" : "I Accept — Begin Journey";

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolledToBottom(true);
  };

  useEffect(() => {
    setScrolledToBottom(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [step]);

  const handlePrimary = () => {
    if (isNotice) setStep("license");
    else onAccept();
  };

  return (
    <div className="min-h-screen bg-retro-bg text-retro-text font-sans flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 sm:px-5 sm:py-10">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]">
        <div className="h-full w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[length:100%_3px]" />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: accent }}>Legal Review</span>
          </div>
          <div className="text-xs font-mono text-retro-dim">{isNotice ? "1 / 2" : "2 / 2"}</div>
        </div>

        <div className="rounded-3xl border overflow-hidden bg-zinc-950/95 backdrop-blur-sm" style={{ borderColor: accent + "40", boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px ${accent}20` }}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ borderColor: accent + "25", backgroundColor: accent + "08" }}>
            <span className="text-xs font-mono text-retro-dim">WATCHDOG / {docTitle}</span>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-retro-dim" />
              <span className="text-xs font-mono text-retro-dim">{docTitle}</span>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="px-4 sm:px-6 py-5 overflow-y-auto font-mono text-xs scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600 leading-relaxed text-zinc-300 bg-retro-bg"
            style={{ maxHeight: "420px" }}
          >
            <pre className="whitespace-pre-wrap break-words">{docText}</pre>
            <div className="h-8" />
          </div>

          <div className="border-t px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: accent + "25", backgroundColor: accent + "05" }}>
            <button
              onClick={isNotice ? onBack : () => setStep("notice")}
              className="inline-flex items-center gap-2 text-xs font-mono text-retro-dim hover:text-zinc-300 transition border border-retro-border rounded-lg px-3 py-2 min-h-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {isNotice ? "Back to paths" : "Back to Notice"}
            </button>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
              {!scrolledToBottom && <span className="text-[11px] sm:text-xs font-mono text-retro-dim animate-pulse">↓ scroll to read</span>}
              <motion.button
                animate={{ opacity: scrolledToBottom ? 1 : 0.35 }}
                onClick={scrolledToBottom ? handlePrimary : undefined}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-mono font-semibold transition min-h-10"
                style={{
                  borderColor: scrolledToBottom ? accent + "70" : accent + "30",
                  backgroundColor: scrolledToBottom ? accent + "20" : accent + "08",
                  color: scrolledToBottom ? accent : accent + "60",
                  cursor: scrolledToBottom ? "pointer" : "not-allowed",
                  boxShadow: scrolledToBottom ? `0 0 20px ${glow}` : "none",
                }}
              >
                {btnLabel}
                {!isNotice && <CheckCircle2 className="h-4 w-4" />}
              </motion.button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-mono text-retro-dim">
          {isNotice ? "By continuing you acknowledge the attributions above." : "By clicking accept you agree to the license terms."}
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState<Path>(null);
  const [legalDone, setLegalDone] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => {
    if (path === "understand") return slidesJson.understand;
    if (path === "use") return slidesJson.use;
    if (path === "docs") return slidesJson.docs;
    return [];
  }, [path]);

  const sectionEntries = useMemo(() => {
    const starts = new Map<string, number>();

    slides.forEach((slide, index) => {
      const section = slide.section ?? "Pitch";
      if (!starts.has(section)) starts.set(section, index);
    });

    return Array.from(starts.entries()).map(([label, index]) => ({ label, index }));
  }, [slides]);

  const total = slides.length;
  const s = slides[slideIndex];
  const currentSection = s?.section ?? "Pitch";
  const currentSectionIndex = Math.max(
    0,
    sectionEntries.findIndex((entry) => entry.label === currentSection),
  );

  const accent = pathAccent(path);
  const glow = pathGlow(path);

  const canPrev = slideIndex > 0;
  const canNext = slideIndex < total - 1;
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const swipeLockedToScroll = React.useRef(false);
  const slideFrameRef = React.useRef<HTMLDivElement>(null);

  const go = useCallback((n: number) => {
    if (total <= 0) return;
    setSlideIndex(clamp(n, 0, total - 1));
  }, [total]);

  const choosePath = (p: Exclude<Path, null>) => {
    setPath(p);
    setLegalDone(false);
    setSlideIndex(0);
  };

  useEffect(() => {
    slideFrameRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [path, legalDone, slideIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canPrev) go(slideIndex - 1);
      if (e.key === "ArrowRight" && canNext) go(slideIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canPrev, canNext, go, slideIndex]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    swipeLockedToScroll.current = findHorizontalScrollContainer(e.target) !== null;
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
    touchStartY.current = e.changedTouches[0]?.clientY ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    if (swipeLockedToScroll.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      swipeLockedToScroll.current = false;
      return;
    }
    const endX = e.changedTouches[0]?.clientX;
    const endY = e.changedTouches[0]?.clientY;
    if (typeof endX !== "number" || typeof endY !== "number" || touchStartY.current === null) return;
    const delta = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;
    if (Math.abs(delta) > Math.abs(deltaY)) {
      if (delta <= -60 && canNext) go(slideIndex + 1);
      if (delta >= 60 && canPrev) go(slideIndex - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    swipeLockedToScroll.current = false;
  };

  if (!path) return <PillChoice onChoose={choosePath} />;
  if (!legalDone) return (
    <LegalGate
      path={path}
      onAccept={() => setLegalDone(true)}
      onBack={() => setPath(null)}
    />
  );

  const progressPct = total ? Math.round(((slideIndex + 1) / total) * 100) : 0;
  const pathLabel = path === "understand"
    ? "Blue Pill — The Why"
    : path === "use"
      ? "Red Pill — Deploy & Use"
      : "Documentation — Product Guide";

  return (
    <div className="min-h-screen bg-retro-bg text-retro-text font-sans selection:bg-retro-glow/20">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]">
        <div className="h-full w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[length:100%_3px]" />
      </div>

      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-[0.03] blur-3xl"
          style={{ backgroundColor: accent }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-5 py-6 sm:py-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl border flex items-center justify-center" style={{ backgroundColor: accent + "15", borderColor: accent + "40", boxShadow: `0 6px 18px ${glow}` }}>
              <Sparkles className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-retro-dim">Watchdog</div>
              <div className="text-sm font-semibold" style={{ color: accent }}>{pathLabel}</div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4">
            <button
              onClick={() => { setPath(null); setLegalDone(false); }}
              className="text-xs font-mono text-retro-dim hover:text-zinc-300 transition border border-retro-border rounded-lg px-3 py-2 min-h-10"
            >
              ⇄ switch path
            </button>
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-retro-dim">{slideIndex + 1} / {total}</div>
              <div className="w-24 sm:w-36 h-1.5 rounded-full bg-retro-panel border border-retro-border overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: accent }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </header>

        {sectionEntries.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sectionEntries.map((entry, index) => {
              const isActive = entry.label === currentSection;

              return (
                <button
                  key={entry.label}
                  onClick={() => go(entry.index)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono transition"
                  style={{
                    borderColor: isActive ? accent + "60" : accent + "25",
                    backgroundColor: isActive ? accent + "16" : "rgba(10, 10, 10, 0.45)",
                    color: isActive ? accent : "#a1a1aa",
                    boxShadow: isActive ? `0 0 18px ${glow}` : "none",
                  }}
                >
                  <span className="text-[10px] uppercase tracking-[0.16em] opacity-70">{String(index + 1).padStart(2, "0")}</span>
                  {entry.label}
                </button>
              );
            })}
          </div>
        )}

        <main className="mt-8">
          <div className="rounded-3xl border bg-zinc-950/90 overflow-hidden backdrop-blur-sm" style={{ borderColor: accent + "35", boxShadow: `0 16px 44px rgba(0,0,0,0.48), 0 0 0 1px ${accent}16` }}>
            <div
              ref={slideFrameRef}
              className="px-4 py-6 sm:px-10 sm:py-10 relative min-h-[440px] sm:min-h-[520px]"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <Tick accent={accent} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${path}-${slideIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-retro-dim">
                    <span>Section {currentSectionIndex + 1} / {sectionEntries.length || 1}</span>
                    <span className="text-zinc-600">|</span>
                    <span style={{ color: accent }}>{currentSection}</span>
                  </div>

                  {s?.kicker && (
                    <div className="text-sm font-mono font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
                      <span style={{ color: accent }}>{">"}</span> {s.kicker}
                    </div>
                  )}

                  <h1 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight max-w-3xl">
                    {s?.title}
                  </h1>

                  {s?.subtitle && (
                    <p className="mt-4 text-sm sm:text-lg text-zinc-300/90 max-w-3xl leading-relaxed">
                      {s.subtitle}
                    </p>
                  )}

                  {s ? (
                    <>
                      {renderContent(s, accent)}
                      <SlideLinks slide={s} accent={accent} />
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-4 py-4 sm:px-10 flex items-center justify-between gap-2 sm:gap-3" style={{ borderColor: accent + "25", backgroundColor: accent + "05" }}>
              <button
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-mono transition disabled:opacity-30 min-h-10"
                style={{ borderColor: canPrev ? accent + "50" : "transparent", color: canPrev ? accent : undefined }}
                onClick={() => canPrev && go(slideIndex - 1)}
                disabled={!canPrev}
              >
                <ArrowLeft className="h-4 w-4" />
                Prev
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto px-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className="h-2 w-2 rounded-full transition-all border"
                    style={{
                      backgroundColor: i === slideIndex ? accent : "transparent",
                      borderColor: i === slideIndex ? accent : accent + "40",
                      boxShadow: i === slideIndex ? `0 0 10px ${glow}` : "none",
                      width: i === slideIndex ? "24px" : "8px",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-mono transition disabled:opacity-30 min-h-10"
                style={{ borderColor: canNext ? accent + "50" : "transparent", color: canNext ? accent : undefined }}
                onClick={() => canNext && go(slideIndex + 1)}
                disabled={!canNext}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="text-xs font-mono text-retro-dim">← → keys · swipe to navigate</div>
            <div className="text-xs font-mono text-retro-dim" style={{ color: accent + "80" }}>
              {slideIndex + 1} of {total} · {progressPct}% complete
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
