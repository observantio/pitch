import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Container,
  FileText,
  FolderGit2,
  Github,
  Lock,
  Monitor,
  Sparkles,
  Terminal,
  Copy,
  Moon,
} from "lucide-react";

import { slidesJson } from "./data/slideData";
import type { Path, SlideData } from "./data/slideTypes";
import sunIcon from "./assets/sun.png";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const BLUE = "#3b82f6";
const RED = "#ef4444";
const DOCS = "#14b8a6";
const BLUE_GLOW = "rgba(59,130,246,0.14)";
const RED_GLOW = "rgba(239,68,68,0.14)";
const DOCS_GLOW = "rgba(20,184,166,0.18)";

const DOC_LINKS = [
  {
    label: "Full User Guide",
    href: "https://github.com/observantio/watchdog/blob/main/USER%20GUIDE.md",
  },
  {
    label: "Architecture README",
    href: "https://github.com/observantio/watchdog/blob/main/README.md",
  },
];
const WATCHDOG_DEPLOYMENT_GUIDE_URL =
  "https://github.com/observantio/watchdog/blob/main/DEPLOYMENT.md";
const OJO_DEPLOYMENT_GUIDE_URL =
  "https://github.com/observantio/ojo/blob/main/DEPLOYMENT.md";
const STACK_RELEASE_TAG = "v0.0.2";
const WATCHDOG_RELEASE_URL = `https://github.com/observantio/watchdog/releases/tag/${STACK_RELEASE_TAG}`;
const OJO_RELEASE_TAG = "v0.0.2";
const OJO_RELEASE_URL = `https://github.com/observantio/ojo/releases/tag/${OJO_RELEASE_TAG}`;
type InstallerTab = "stack" | "linux" | "windows";
const INSTALL_TABS: Array<{ key: InstallerTab; label: string }> = [
  { key: "stack", label: `Stack ${STACK_RELEASE_TAG}` },
  { key: "linux", label: `Ojo Linux ${OJO_RELEASE_TAG}` },
  { key: "windows", label: `Ojo Windows ${OJO_RELEASE_TAG}` },
];
const INSTALL_COMMANDS: Record<InstallerTab, string> = {
  stack: `curl -fsSL https://raw.githubusercontent.com/observantio/watchdog/main/download.sh -o download.sh
bash download.sh

# Optional explicit release + architecture:
bash download.sh ${STACK_RELEASE_TAG} arm64
# Supported arch values: amd64 | arm64 | multi`,
  linux: `curl -L https://github.com/observantio/ojo/releases/download/${OJO_RELEASE_TAG}/ojo-${OJO_RELEASE_TAG}-linux-x86_64 -o ojo
chmod +x ojo
sudo mv ojo /usr/local/bin/ojo
ojo --config linux.yaml`,
  windows: `Invoke-WebRequest https://github.com/observantio/ojo/releases/download/${OJO_RELEASE_TAG}/ojo-${OJO_RELEASE_TAG}-windows-x86_64.exe -OutFile .\\ojo.exe
.\\ojo.exe --config windows.yaml`,
};

function installerTabIcon(tab: InstallerTab) {
  if (tab === "windows") return <Monitor className="h-4 w-4" />;
  return <Container className="h-4 w-4" />;
}

function withBaseUrl(src: string) {
  if (!src) return src;
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  if (!src.startsWith("/")) return src;
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${src.replace(/^\//, "")}`;
}

function findHorizontalScrollContainer(
  node: EventTarget | null,
): HTMLElement | null {
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

type ThemeMode = "dark" | "light";

function ThemeToggleButton({
  theme,
  onToggle,
}: {
  theme: ThemeMode;
  onToggle: () => void;
}) {
  const goingToLight = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${goingToLight ? "light" : "dark"} mode`}
      title={`Switch to ${goingToLight ? "light" : "dark"} mode`}
      className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono transition min-h-10"
      style={{
        borderColor: goingToLight ? BLUE + "55" : "#54657d",
        backgroundColor: goingToLight ? BLUE + "12" : "#f8fafcde",
        color: goingToLight ? "#f3f7ff" : "#0f172a",
        boxShadow: "0 10px 30px rgba(2, 8, 23, 0.2)",
      }}
    >
      {goingToLight ? (
        <img src={sunIcon} alt="" className="h-4 w-4 object-contain" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span>{goingToLight ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

function renderCommandLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return <span className="text-zinc-500"> </span>;

  if (trimmed.startsWith("#")) {
    return <span className="text-zinc-500">{line}</span>;
  }

  const assignMatch = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (assignMatch) {
    const [, key, value] = assignMatch;
    return (
      <>
        <span className="text-sky-300">{key}</span>
        <span className="text-zinc-400">=</span>
        <span className="text-amber-300">{value}</span>
      </>
    );
  }

  const commandMatch = line.match(/^(\s*)([a-zA-Z0-9_.-]+)(.*)$/);
  if (!commandMatch) return <span className="text-zinc-200">{line}</span>;

  const [, indent, cmd, rest] = commandMatch;
  return (
    <>
      <span className="text-zinc-500">{indent}</span>
      <span className="text-emerald-300">{cmd}</span>
      <span className="text-zinc-200">{rest}</span>
    </>
  );
}

function IdeCodeBlock({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <div
      className="showcase-code-shell relative w-full text-left"
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="showcase-code-header flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800 bg-black/30">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[11px] font-mono text-zinc-500">
            terminal
          </span>
        </div>
        <pre className="showcase-code px-3 sm:px-4 py-3 text-left font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700/50 hover:scrollbar-thumb-zinc-600/60">
          <code>
            {lines.map((line, idx) => (
              <div
                key={`${idx}-${line}`}
                className="grid grid-cols-[2.4rem_1fr] sm:grid-cols-[2.9rem_1fr] gap-3"
              >
                <span className="select-none pr-1 text-right tabular-nums text-zinc-600">
                  {idx + 1}
                </span>
                <span>{renderCommandLine(line)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function Tag({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-mono"
      style={{
        backgroundColor: accent + "18",
        border: `1px solid ${accent}40`,
        color: accent,
      }}
    >
      {label}
    </span>
  );
}

function BoolCell({ val, accent }: { val: boolean | string; accent: string }) {
  if (val === true)
    return (
      <span style={{ color: accent }} className="text-lg">
        ✓
      </span>
    );
  if (val === false) return <span className="text-retro-dim text-lg">✗</span>;
  return <span className="text-xs text-zinc-400">{val}</span>;
}

function GenericTable({ slide, accent }: { slide: SlideData; accent: string }) {
  const t = slide.table;
  if (!t) return null;

  return (
    <div
      className="mt-6 overflow-x-auto rounded-2xl border"
      style={{ borderColor: accent + "35" }}
    >
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr
            style={{
              backgroundColor: accent + "10",
              borderBottom: `1px solid ${accent}25`,
            }}
          >
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
            <tr
              key={ri}
              style={{
                borderBottom:
                  ri < t.rows.length - 1 ? `1px solid ${accent}15` : "none",
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-2.5 px-4 ${ci === 0 ? "text-zinc-200" : "text-zinc-300"}`}
                >
                  {typeof cell === "boolean" ? (
                    <BoolCell val={cell} accent={accent} />
                  ) : (
                    cell
                  )}
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
    <div
      className="mt-6 overflow-hidden rounded-2xl border"
      style={{ borderColor: accent + "35" }}
    >
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
        <div
          key={i}
          className="overflow-hidden rounded-2xl border bg-black/30"
          style={{ borderColor: accent + "35" }}
        >
          <img
            src={withBaseUrl(g.src)}
            alt={g.alt ?? `gallery ${i + 1}`}
            className="w-full h-[180px] sm:h-[200px] object-cover"
          />
          {g.alt && (
            <div
              className="px-3 py-2 text-xs text-zinc-400 font-mono border-t"
              style={{ borderColor: accent + "20" }}
            >
              {g.alt}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SlideLinks({ slide, accent }: { slide: SlideData; accent: string }) {
  if (!slide.links?.length) return null;
  const linkIcon = (label: string, href: string) => {
    const lowerLabel = label.toLowerCase();
    const lowerHref = href.toLowerCase();
    if (lowerLabel.includes("repository") && lowerHref.includes("github.com")) {
      return lowerLabel.includes("project") ? (
        <Github className="h-4 w-4" />
      ) : (
        <FolderGit2 className="h-4 w-4" />
      );
    }
    if (lowerLabel.includes("guide")) return <BookOpen className="h-4 w-4" />;
    if (lowerLabel.includes("readme")) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };
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
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border"
                style={{
                  color: accent,
                  borderColor: accent + "35",
                  backgroundColor: accent + "12",
                }}
              >
                {linkIcon(item.label, item.href)}
              </span>
              <div className="text-sm font-semibold" style={{ color: accent }}>
                {item.label}
              </div>
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
            <li
              key={i}
              className="showcase-body-copy flex gap-3 text-base sm:text-lg leading-relaxed"
            >
              <span
                className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 8px ${accent}`,
                }}
              />
              {b}
            </li>
          ))}
        </ul>
      ) : null;

    case "metrics":
      return (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {slide.metrics?.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-retro-bg/40 p-5"
              style={{ borderColor: accent + "35" }}
            >
              <div
                className="text-3xl sm:text-4xl font-bold font-mono"
                style={{ color: accent }}
              >
                {m.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {m.label}
              </div>
              {m.sub && (
                <div className="mt-1 text-xs text-retro-dim">{m.sub}</div>
              )}
            </div>
          ))}
        </div>
      );

    case "services":
      return (
        <div className="mt-6 space-y-5">
          {slide.services?.map((svc, i) => (
            <section
              key={i}
              className="showcase-service-block overflow-hidden py-4"
            >
              {svc.image && (
                <div className="showcase-image-frame overflow-hidden">
                  <img
                    src={withBaseUrl(svc.image.src)}
                    alt={svc.image.alt ?? svc.name}
                    className="w-full object-contain my-3 block"
                  />
                </div>
              )}
              <div className="mb-4 mt-4 flex items-center gap-3">
                <div>
                  <div className="my-3 text-xl font-semibold">{svc.name}</div>
                  <div className="text-sm text-retro-dim">{svc.tagline}</div>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {svc.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="showcase-body-copy flex gap-2.5 text-sm leading-relaxed"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {svc.tags.map((t) => (
                  <Tag key={t} label={t} accent={accent} />
                ))}
              </div>
            </section>
          ))}
        </div>
      );

    case "comparison":
      return (
        <div
          className="mt-6 overflow-x-auto rounded-2xl border"
          style={{ borderColor: accent + "35" }}
        >
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: accent + "25",
                  backgroundColor: accent + "10",
                }}
              >
                <th className="py-3 px-4 text-left font-mono text-xs uppercase tracking-wider text-retro-dim">
                  Feature
                </th>
                <th
                  className="py-3 px-4 text-center font-mono text-xs uppercase tracking-wider"
                  style={{ color: accent }}
                >
                  Watchdog
                </th>
                <th className="py-3 px-4 text-center font-mono text-xs uppercase tracking-wider text-retro-dim">
                  Datadog
                </th>
                <th className="py-3 px-4 text-center font-mono text-xs uppercase tracking-wider text-retro-dim">
                  Grafana
                </th>
              </tr>
            </thead>
            <tbody>
              {slide.comparison?.map((row, i) => (
                <tr
                  key={i}
                  className="border-b last:border-0"
                  style={{ borderColor: accent + "15" }}
                >
                  <td className="py-3 px-4 text-zinc-200 text-xs sm:text-sm">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <BoolCell val={row.us} accent={accent} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <BoolCell val={row.datadog} accent={accent} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <BoolCell val={row.grafana} accent={accent} />
                  </td>
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
                <span className="text-xs font-mono uppercase tracking-wider text-retro-dim">
                  {layer.label}
                </span>
              </div>
              <div className="flex-shrink-0 pt-3">
                <div
                  className="h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: accent,
                    backgroundColor: accent + "30",
                  }}
                />
                {li < (slide.archLayers?.length ?? 0) - 1 && (
                  <div
                    className="ml-[5px] mt-1 h-8 w-px"
                    style={{ backgroundColor: accent + "40" }}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2 pb-2">
                {layer.nodes.map((node) => (
                  <div
                    key={node}
                    className="rounded-xl border px-3 py-1.5 text-xs font-mono"
                    style={{
                      borderColor: accent + "40",
                      backgroundColor: accent + "0D",
                      color: "#d4d4d8",
                    }}
                  >
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
              <span className="text-xs font-mono text-retro-dim">
                {slide.codeLabel}
              </span>
            </div>
          )}
          <div
            className="showcase-code-panel rounded-2xl border overflow-auto"
            style={{ borderColor: accent + "35" }}
          >
            <div
              className="flex items-center gap-1.5 px-4 py-3 border-b"
              style={{ borderColor: accent + "25" }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            </div>
            <pre className="showcase-code px-5 py-4 text-xs sm:text-sm font-mono leading-relaxed text-zinc-300 max-h-[400px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700/50 hover:scrollbar-thumb-zinc-600/60">
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
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-bold"
                  style={{
                    backgroundColor: accent + "20",
                    border: `1.5px solid ${accent}`,
                    color: accent,
                  }}
                >
                  {i + 1}
                </div>
                {i < (slide.workflowSteps?.length ?? 0) - 1 && (
                  <div
                    className="mt-1 h-full w-px"
                    style={{ backgroundColor: accent + "30" }}
                  />
                )}
              </div>
              <div className="pb-4">
                <div className="font-semibold text-zinc-100 text-sm">
                  {step.label}
                </div>
                <div className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case "savings":
      return (
        <div
          className="mt-6 overflow-x-auto rounded-2xl border"
          style={{ borderColor: accent + "35" }}
        >
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: accent + "10",
                  borderBottom: `1px solid ${accent}25`,
                }}
              >
                <th className="py-2.5 px-4 text-left font-mono text-xs uppercase tracking-wider text-retro-dim">
                  Metric
                </th>
                <th className="py-2.5 px-4 text-center font-mono text-xs uppercase tracking-wider text-retro-dim">
                  Before
                </th>
                <th
                  className="py-2.5 px-4 text-center font-mono text-xs uppercase tracking-wider"
                  style={{ color: accent }}
                >
                  After / Saved
                </th>
              </tr>
            </thead>
            <tbody>
              {slide.savings?.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom:
                      i < (slide.savings?.length ?? 0) - 1
                        ? `1px solid ${accent}15`
                        : "none",
                  }}
                >
                  <td className="py-2.5 px-4 text-xs text-zinc-300">
                    {row.metric}
                  </td>
                  <td className="py-2.5 px-4 text-center text-xs text-zinc-400 font-mono">
                    {row.before}
                  </td>
                  <td
                    className="py-2.5 px-4 text-center text-xs font-mono font-semibold"
                    style={{ color: accent }}
                  >
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
        <div
          className="mt-6 rounded-2xl border p-6"
          style={{ borderColor: accent + "35", backgroundColor: accent + "08" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4" style={{ color: accent }} />
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: accent }}
            >
              License
            </span>
          </div>
          <pre className="text-xs text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
            {slide.licenseText}
          </pre>
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

function PillChoice({
  onChoose,
}: {
  onChoose: (p: Exclude<Path, null>) => void;
}) {
  const [hovered, setHovered] = useState<Path>(null);
  const [activeInstallTab, setActiveInstallTab] =
    useState<InstallerTab>("stack");
  const [copied, setCopied] = useState(false);
  const activeInstallCommand = INSTALL_COMMANDS[activeInstallTab];
  const isStackTab = activeInstallTab === "stack";
  const deploymentGuideUrl = isStackTab
    ? WATCHDOG_DEPLOYMENT_GUIDE_URL
    : OJO_DEPLOYMENT_GUIDE_URL;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeInstallCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-retro-bg text-retro-text font-sans flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 sm:px-6">
        <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
          <div className="h-full w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[length:100%_3px]" />
        </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-5xl flex-col text-left"
      >
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-retro-glow" />
          <span className="text-xs uppercase tracking-[0.22em] text-retro-dim">
            Observantio's LGTM
          </span>
        </div>

        <h1 className="mb-3 max-w-5xl text-2xl font-bold tracking-tight sm:text-4xl">
          LGTM stack management for self-hosted teams, made possible for free
        </h1>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-retro-dim sm:text-base">
          Our vision is to make the LGTM stack secure, usable, and affordable
          for self-hosted teams by putting access control, guided operations,
          and day-to-day workflows in one place.
        </p>

        <div className="order-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-retro-text">
                Quick start
              </div>
              <div className="text-xs text-retro-dim">
                Choose an install target and copy the command.
              </div>
            </div>
            <button
              onClick={() => onChoose("docs")}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs transition showcase-link-inline"
            >
              <FileText className="h-3.5 w-3.5" />
              Product docs
            </button>
          </div>

          <div className="showcase-home-tabs mb-3 grid w-full grid-cols-1 gap-2 rounded-xl p-1 sm:grid-cols-3">
            {INSTALL_TABS.map((tab) => {
              const active = activeInstallTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveInstallTab(tab.key);
                    setCopied(false);
                  }}
                  className={`showcase-home-tab-${tab.key} w-full rounded-lg px-3 py-2 text-xs transition min-h-10 ${
                    active
                      ? "showcase-home-tab showcase-home-tab-active"
                      : "showcase-home-tab"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="showcase-home-tab-icon">
                      {installerTabIcon(tab.key)}
                    </span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full">
            <IdeCodeBlock code={activeInstallCommand} />
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 rounded-md px-2 py-1 text-xs text-retro-dim transition hover:bg-retro-bg/60 hover:text-retro-text"
              title="Copy command"
            >
              {copied ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Copied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-retro-dim">
            <span>
              {isStackTab
                ? `Stack install is intended for Linux hosts, preferably Ubuntu or Amazon Linux. Recommended arch values: amd64 | arm64 | multi`
                : `Use the latest Ojo ${OJO_RELEASE_TAG} binary for your host.`}
            </span>
            <a
              href={deploymentGuideUrl}
              target="_blank"
              rel="noreferrer"
              className="showcase-link-inline inline-flex items-center gap-1.5 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              Deployment guide
            </a>
            <a
              href={isStackTab ? WATCHDOG_RELEASE_URL : OJO_RELEASE_URL}
              target="_blank"
              rel="noreferrer"
              className="showcase-link-inline inline-flex items-center gap-1.5 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              Release
            </a>
            {DOC_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="showcase-link-inline inline-flex items-center gap-1.5 transition"
              >
                <FileText className="h-3.5 w-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="order-2 mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          <motion.button
            onHoverStart={() => setHovered("understand")}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onChoose("understand")}
            className="showcase-path group relative overflow-hidden rounded-2xl border p-5 sm:p-6 text-left transition-all duration-200 min-h-[210px] flex flex-col"
            style={{ color: hovered === "understand" ? BLUE : undefined }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: `linear-gradient(180deg, ${BLUE}12, transparent 55%)` }}
            />
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border text-xl"
                style={{
                  opacity: hovered === "understand" ? 1 : 0.85,
                  borderColor: BLUE + "33",
                  backgroundColor: BLUE + "12",
                }}
              >
                🧠
              </div>
              <div>
                <div className="font-bold text-xl" style={{ color: BLUE }}>
                  Platform Understanding
                </div>
                <div className="text-xs text-retro-dim uppercase tracking-wider">
                  Architecture and concepts
                </div>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-300">
              Read the system flow, understand the services, and learn how the
              product fits around the LGTM stack.
            </p>
            <div
              className="mt-auto inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: BLUE }}
            >
              Open the guided architecture path
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </motion.button>

          <motion.button
            onHoverStart={() => setHovered("use")}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onChoose("use")}
            className="showcase-path group relative overflow-hidden rounded-2xl border p-5 sm:p-6 text-left transition-all duration-200 min-h-[210px] flex flex-col"
            style={{ color: hovered === "use" ? RED : undefined }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: `linear-gradient(180deg, ${RED}10, transparent 55%)` }}
            />
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border text-xl"
                style={{
                  opacity: hovered === "use" ? 1 : 0.85,
                  borderColor: RED + "33",
                  backgroundColor: RED + "10",
                }}
              >
                🚀
              </div>
              <div>
                <div className="font-bold text-xl" style={{ color: RED }}>
                  Deployment Fast Track
                </div>
                <div className="text-xs text-retro-dim uppercase tracking-wider">
                  Install and operate
                </div>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-300">
              Follow the shortest route to install, send telemetry, validate
              data, and start using the stack quickly.
            </p>
            <div
              className="mt-auto inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: RED }}
            >
              Open the install and usage path
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </motion.button>
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

function normalizeLegalText(docText: string) {
  const blocks: Array<{ type: "blank" | "divider" | "heading" | "paragraph"; text: string }> = [];
  let paragraph = "";

  const flushParagraph = () => {
    if (!paragraph) return;
    blocks.push({ type: "paragraph", text: paragraph });
    paragraph = "";
  };

  for (const rawLine of docText.split("\n")) {
    const trimmed = rawLine.trim();
    const isDivider = /^─{6,}$/.test(trimmed);
    const isSectionHeading =
      /^[A-Z][A-Z0-9 &(),./-]+$/.test(trimmed) &&
      trimmed.length > 4 &&
      !trimmed.startsWith("HTTP://");
    const isClauseHeading = /^\d+\.\s+[A-Z]/.test(trimmed);

    if (!trimmed) {
      flushParagraph();
      blocks.push({ type: "blank", text: "" });
      continue;
    }

    if (isDivider) {
      flushParagraph();
      blocks.push({ type: "divider", text: trimmed });
      continue;
    }

    if (isSectionHeading || isClauseHeading) {
      flushParagraph();
      blocks.push({ type: "heading", text: trimmed });
      continue;
    }

    paragraph = paragraph ? `${paragraph} ${trimmed}` : trimmed;
  }

  flushParagraph();
  return blocks;
}

function LegalGate({
  path,
  onAccept,
  onBack,
}: {
  path: Exclude<Path, null>;
  onAccept: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<LegalStep>("notice");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const accent = pathAccent(path);
  const glow = pathGlow(path);
  const isNotice = step === "notice";
  const docTitle = isNotice ? "NOTICE" : "LICENSE";
  const docText = isNotice ? NOTICE_TEXT : LICENSE_TEXT;
  const btnLabel = isNotice
    ? "Continue to License →"
    : "I Accept — Begin Journey";

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8)
      setScrolledToBottom(true);
  };

  useEffect(() => {
    setScrolledToBottom(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      const { scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight <= clientHeight + 8) setScrolledToBottom(true);
    }
  }, [step]);

  const handlePrimary = () => {
    if (isNotice) setStep("license");
    else onAccept();
  };
  const legalBlocks = isNotice
    ? docText.split("\n").map((line) => ({ type: "paragraph" as const, text: line }))
    : normalizeLegalText(docText);

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
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" style={{ color: accent }} />
            <span
              className="text-xs font-mono uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              Legal Review
            </span>
          </div>
          <div className="text-xs font-mono text-retro-dim">
            {isNotice ? "1 / 2" : "2 / 2"}
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex items-center justify-between px-0 py-2"
            style={{
              borderColor: accent + "25",
            }}
          >
            <span className="text-xs font-mono font-bold tracking-wide text-retro-dim">
              WATCHDOG / {docTitle}
            </span>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-retro-dim" />
              <span className="text-xs font-mono font-bold tracking-wide text-retro-dim">
                {docTitle}
              </span>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="legal-page px-0 py-5 font-mono text-xs leading-relaxed text-zinc-300"
          >
            <div className={`legal-doc break-words ${isNotice ? "whitespace-pre-wrap" : ""}`}>
              {legalBlocks.map((block, idx) => {
                const isDivider = block.type === "divider";
                const isHeading = block.type === "heading";
                const blockClassName =
                  block.type === "blank"
                    ? "h-3"
                    : block.type === "divider"
                      ? "my-4"
                      : block.type === "heading"
                        ? "mt-5 mb-2"
                        : isNotice
                          ? "mb-0"
                          : "mb-3 leading-7";
                return (
                  <div
                    key={`${idx}-${block.type}-${block.text}`}
                    className={`${isHeading ? "font-normal text-retro-text" : "font-normal"} ${blockClassName}`}
                    style={{ opacity: isDivider ? 0.65 : 1 }}
                  >
                    {block.type === "blank" ? " " : block.text}
                  </div>
                );
              })}
            </div>
            <div className="h-8" />
          </div>

          <div
            className="px-0 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              borderColor: accent + "25",
            }}
          >
            <button
              onClick={isNotice ? onBack : () => setStep("notice")}
              className="inline-flex items-center gap-2 text-xs font-mono text-retro-dim hover:text-zinc-300 transition border border-retro-border rounded-lg px-3 py-2 min-h-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {isNotice ? "Back to paths" : "Back to Notice"}
            </button>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
              {!scrolledToBottom && (
                <span className="text-[11px] sm:text-xs font-mono text-retro-dim animate-pulse">
                  ↓ scroll to read
                </span>
              )}
              <motion.button
                animate={{ opacity: scrolledToBottom ? 1 : 0.35 }}
                onClick={scrolledToBottom ? handlePrimary : undefined}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-mono font-semibold transition min-h-10"
                style={{
                  borderColor: scrolledToBottom ? accent + "70" : accent + "30",
                  backgroundColor: scrolledToBottom
                    ? accent + "20"
                    : accent + "08",
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
          {isNotice
            ? "By continuing you acknowledge the attributions above."
            : "By clicking accept you agree to the license terms."}
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("showcase-theme");
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  });
  const [path, setPath] = useState<Path>(null);
  const [legalDone, setLegalDone] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem("showcase-theme", theme);
  }, [theme]);

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

    return Array.from(starts.entries()).map(([label, index]) => ({
      label,
      index,
    }));
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

  const go = useCallback(
    (n: number) => {
      if (total <= 0) return;
      setSlideIndex(clamp(n, 0, total - 1));
    },
    [total],
  );

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
    swipeLockedToScroll.current =
      findHorizontalScrollContainer(e.target) !== null;
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
    if (
      typeof endX !== "number" ||
      typeof endY !== "number" ||
      touchStartY.current === null
    )
      return;
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

  if (!path)
    return (
      <>
        <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        <PillChoice onChoose={choosePath} />
      </>
    );
  if (!legalDone)
    return (
      <>
        <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        <LegalGate
          path={path}
          onAccept={() => setLegalDone(true)}
          onBack={() => setPath(null)}
        />
      </>
    );

  const progressPct = total ? Math.round(((slideIndex + 1) / total) * 100) : 0;
  const pathLabel =
    path === "understand"
      ? "Platform Understanding — The Why"
      : path === "use"
        ? "Deployment Fast Track — Install & Use"
        : "Documentation — Product Guide";

  return (
    <div className="min-h-screen bg-retro-bg text-retro-text font-sans selection:bg-retro-glow/20">
      <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
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
            <div
              className="h-11 w-11 rounded-2xl border flex items-center justify-center"
              style={{
                backgroundColor: accent + "15",
                borderColor: accent + "40",
                boxShadow: `0 6px 18px ${glow}`,
              }}
            >
              <Sparkles className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-retro-dim">
                Watchdog
              </div>
              <div className="text-sm font-semibold" style={{ color: accent }}>
                {pathLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4">
            <button
              onClick={() => {
                setPath(null);
                setLegalDone(false);
              }}
              className="text-xs font-mono text-retro-dim hover:text-zinc-300 transition border border-retro-border rounded-lg px-3 py-2 min-h-10"
            >
              ⇄ switch path
            </button>
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-retro-dim">
                {slideIndex + 1} / {total}
              </div>
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
                  className={
                    isActive
                      ? "showcase-section-tab showcase-section-tab-active inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono transition"
                      : "showcase-section-tab inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono transition"
                  }
                  style={{
                    borderColor: isActive ? accent + "55" : undefined,
                    color: isActive ? accent : undefined,
                    boxShadow: isActive ? `0 12px 28px ${accent}20` : undefined,
                  }}
                >
                  <span className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {entry.label}
                </button>
              );
            })}
          </div>
        )}

        <main className="mt-8">
          <div className="overflow-hidden">
            <div
              ref={slideFrameRef}
              className="px-0 py-3 sm:py-5 relative min-h-[440px] sm:min-h-[520px]"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${path}-${slideIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-retro-dim">
                    <span>
                      Section {currentSectionIndex + 1} /{" "}
                      {sectionEntries.length || 1}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span style={{ color: accent }}>{currentSection}</span>
                  </div>

                  {s?.kicker && (
                    <div
                      className="text-sm font-mono font-bold uppercase tracking-[0.18em]"
                      style={{ color: accent }}
                    >
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

            <div
              className="px-0 py-4 flex items-center justify-between gap-2 sm:gap-3"
              style={{
                borderColor: accent + "25",
              }}
            >
              <button
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-mono transition disabled:opacity-30 min-h-10"
                style={{
                  borderColor: canPrev ? accent + "50" : "transparent",
                  color: canPrev ? accent : undefined,
                }}
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
                      backgroundColor:
                        i === slideIndex ? accent : "transparent",
                      borderColor: i === slideIndex ? accent : accent + "40",
                      width: i === slideIndex ? "24px" : "8px",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-mono transition disabled:opacity-30 min-h-10"
                style={{
                  borderColor: canNext ? accent + "50" : "transparent",
                  color: canNext ? accent : undefined,
                }}
                onClick={() => canNext && go(slideIndex + 1)}
                disabled={!canNext}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="text-xs font-mono text-retro-dim">
              ← → keys · swipe to navigate
            </div>
            <div
              className="text-xs font-mono text-retro-dim"
              style={{ color: theme === "light" ? "#0f172a" : accent }}
            >
              {slideIndex + 1} of {total} · {progressPct}% complete
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
