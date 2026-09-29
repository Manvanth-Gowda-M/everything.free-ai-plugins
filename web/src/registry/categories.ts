import { CategoryId, CategoryInfo } from "../types/plugin.js";

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "developer",
    name: "Developer",
    description: "Regex testing, JWT token inspection, URL decomposition, and MIME type analysis.",
    icon: "code",
    pluginCount: 2,
  },
  {
    id: "data",
    name: "Data",
    description:
      "High-throughput JSON formatting, CSV query/transform, SQL processing, and XML validation.",
    icon: "database",
    pluginCount: 2,
  },
  {
    id: "text",
    name: "Text & Docs",
    description:
      "Unified text diffing, Markdown structural parsing, and safe offline HTML extraction.",
    icon: "file-text",
    pluginCount: 1,
  },
  {
    id: "utility",
    name: "Utilities",
    description:
      "Physical unit conversions, timezone/date parsing, color space conversions, and cron scheduling.",
    icon: "sliders",
    pluginCount: 1,
  },
  {
    id: "encoding",
    name: "Encoding & Crypto",
    description:
      "Cryptographic hashing (SHA-256, SHA-512), Base64/Hex/URL encodings, and UUID generation.",
    icon: "lock",
    pluginCount: 1,
  },
  {
    id: "productivity",
    name: "Productivity",
    description: "Workflow optimization, workspace shortcuts, and task management helpers.",
    icon: "zap",
    pluginCount: 1,
  },
  {
    id: "media",
    name: "Media & Assets",
    description: "Offline image compression, SVG optimization, and multimedia document inspection.",
    icon: "image",
    pluginCount: 1,
  },
  {
    id: "security",
    name: "Security & Auditing",
    description: "Local vulnerability scanners, dependency checkers, and permission inspectors.",
    icon: "shield",
    pluginCount: 1,
  },
];

export function getCategoryById(id: CategoryId): CategoryInfo | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}
