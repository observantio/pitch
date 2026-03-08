export type Path = "understand" | "use" | "docs" | null;

export type SlideType =
  | "bullets"
  | "services"
  | "metrics"
  | "arch"
  | "code"
  | "license"
  | "comparison"
  | "workflow"
  | "savings"
  | "table"
  | "image"
  | "gallery";

export type IconKey =
  | "database"
  | "cpu"
  | "fileText"
  | "shield"
  | "lock"
  | "command";

export interface SlideData {
  section?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  type: SlideType;
  links?: { label: string; href: string; description?: string }[];

  bullets?: string[];

  metrics?: { value: string; label: string; sub?: string }[];

  services?: {
    iconKey: IconKey;
    name: string;
    tagline: string;
    bullets: string[];
    tags: string[];
    image?: { src: string; alt?: string };
  }[];

  comparison?: { feature: string; us: string | boolean; datadog: string | boolean; grafana: string | boolean }[];

  code?: string;
  codeLabel?: string;

  workflowSteps?: { label: string; detail: string }[];

  archLayers?: { label: string; nodes: string[] }[];

  savings?: { metric: string; before: string; after: string; unit: string }[];

  licenseText?: string;

  table?: {
    columns: string[];
    rows: (string | boolean)[][];
  };

  image?: { src: string; alt?: string };

  gallery?: { src: string; alt?: string }[];
}

export interface SlidesJson {
  understand: SlideData[];
  use: SlideData[];
  docs: SlideData[];
}
