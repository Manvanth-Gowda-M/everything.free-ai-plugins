export type CategoryId =
  | "developer"
  | "data"
  | "text"
  | "utility"
  | "encoding"
  | "ai"
  | "productivity"
  | "security"
  | "media"
  | "education"
  | "other";

export type PlatformId =
  "chatgpt" | "claude" | "gemini" | "cursor" | "windsurf" | "mcp-cli" | "api";

export type PricingModel = "free" | "open_source" | "freemium";

export type PluginStatus = "available" | "beta" | "coming_soon";

export type ConnectionStateType =
  | "NOT_CONNECTED"
  | "CONNECTING"
  | "AUTHORIZATION_REQUIRED"
  | "CONNECTED"
  | "UNAVAILABLE"
  | "MANUAL_SETUP_REQUIRED";

export interface CapabilityItem {
  id: string;
  name: string;
  description: string;
  pack: string;
  operations: string[];
  inputExample?: string;
  outputExample?: string;
  isOffline: boolean;
}

export interface CapabilityPack {
  id: string;
  name: string;
  description: string;
  icon?: string;
  capabilities: CapabilityItem[];
}

export interface PlatformConnection {
  platformId: PlatformId;
  platformName: string;
  icon: string;
  status: PluginStatus;
  connectionType: "streamable_http" | "stdio" | "adapter" | "manual";
  transport: "streamable_http" | "stdio" | "function_calling" | "streamable_http_or_stdio";
  requiresRemoteServer: boolean;
  requiresAuthentication: boolean;
  requiresOAuth: boolean;
  requiresManualSetup: boolean;
  endpoint?: string;
  instructions: string[];
  setupSnippet?: string;
  snippetLanguage?: string;
  officialDocumentationUrl: string;
}

export interface PrivacyAudit {
  localExecutionOnly: boolean;
  networkEgress: boolean;
  telemetryPresent: boolean;
  dataRetention: string;
  requiresAuth: boolean;
  openSourceVerified: boolean;
  license: string;
}

export type HostingStatus = "LOCAL_ONLY" | "HOSTED" | "COMING_SOON";

export interface ConnectionProfiles {
  local: {
    endpoint: string;
    command: string;
    args: string[];
    transport: "stdio" | "streamable_http";
    instructions: string[];
  };
  hosted: {
    endpoint: string;
    transport: "streamable_http";
    active: boolean;
    instructions: string[];
    privacyNotice: string;
  };
  manual: {
    stdioConfig: string;
    httpConfig: string;
    instructions: string[];
  };
}

export interface TechnicalMcpInfo {
  transport: ("streamable-http" | "stdio")[];
  httpEndpoint?: string;
  stdioCommand?: string;
  stdioArgs?: string[];
  capabilitiesCount: number;
  resourcesCount: number;
  promptsCount: number;
  protocolVersion: string;
}

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  version: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: string;
  category: CategoryId;
  tags: string[];
  author: {
    name: string;
    organization?: string;
    url?: string;
    avatar?: string;
  };
  repository: {
    url: string;
    starsCount?: number;
    openIssues?: number;
    license: string;
  };
  homepage?: string;
  documentationUrl?: string;
  pricing: PricingModel;
  isOpenSource: boolean;
  status: PluginStatus;
  hostingStatus: HostingStatus;
  isFeatured: boolean;
  platforms: PlatformConnection[];
  connectionProfiles?: ConnectionProfiles;
  packs: CapabilityPack[];
  mcpInfo: TechnicalMcpInfo;
  privacy: PrivacyAudit;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  pluginCount: number;
}

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  description: string;
  badge: string;
  icon: string;
  supported: boolean;
  connectionType: "mcp_remote" | "mcp_stdio" | "adapter" | "manual";
  transport: "streamable_http" | "stdio" | "function_calling" | "streamable_http_or_stdio";
  requiresRemoteServer: boolean;
  requiresAuthentication: boolean;
  requiresManualSetup: boolean;
  docsUrl: string;
  officialDocs: string;
}

export interface FilterState {
  searchQuery: string;
  category: CategoryId | "all";
  platform: PlatformId | "all";
  pricing: PricingModel | "all";
  status: PluginStatus | "all";
  sortBy: "featured" | "name" | "newest";
}
