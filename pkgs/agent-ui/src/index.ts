// Hanzo Agent Cloud — Main Entry
// @hanzo/agent-ui
//
// This barrel re-exports everything for consumers who import from '@hanzo/agent-ui'.
// For tree-shaking, prefer subpath imports:
//   import { useSSE } from '@hanzo/agent-ui/hooks'
//   import { configure } from '@hanzo/agent-ui/services'
//   import type { AgentNode } from '@hanzo/agent-ui/types'

// Types — re-export all type definitions
export type {
  // Status
  CanonicalStatus,
  StatusTone,
  TimeRangeValue,

  // Agent Nodes
  HealthStatus,
  LifecycleStatus,
  AgentState,
  AgentNode,
  AgentNodeSummary,
  AgentNodeDetails,
  AgentNodeDetailsWithPackage,
  AgentStatus,
  AgentStatusUpdate,

  // MCP
  MCPServerStatus,
  MCPServerAction,
  AppMode,
  MCPServerHealth,
  MCPSummary,
  MCPTool,
  MCPHealthResponse,
  MCPServerActionResponse,
  MCPToolsResponse,
  MCPToolTestResponse,
  MCPServerMetrics,
  MCPNodeMetrics,
  MCPHealthEvent,

  // Reasoners & Skills
  ReasonerDefinition,
  SkillDefinition,

  // Configuration
  ConfigFieldType,
  ConfigFieldOption,
  ConfigField,
  ConfigurationSchema,
  AgentConfigurationStatus,
  AgentPackage,

  // Workflows
  WorkflowSummary,
  EnhancedExecution,
  ViewModeId,
  ViewMode,
  ExecutionViewFilters,
  WorkflowsResponse,
  EnhancedExecutionsResponse,
  ExecutionViewState,
  WorkflowTimelineNode,
  WorkflowDAGLightweightNode,
  WorkflowDAGLightweightResponse,
  WorkflowRunDetailResponse,
  WorkflowCleanupResult,

  // Executions
  ExecutionSummary,
  GroupedExecutionSummary,
  ExecutionFilters,
  ExecutionGrouping,
  PaginatedExecutions,
  GroupedExecutions,
  ExecutionStats,
  ExecutionEvent,
  WorkflowExecution,
  ExecutionNote,
  ExecutionWebhookEvent,
  ExecutionRequest,
  ExecutionResponse,
  ExecutionStatusResponse,
  PerformanceMetrics,
  TimelineDataPoint,
  TimelineSummary,
  ExecutionTimelineResponse,

  // DID / Verifiable Credentials
  AgentDIDStatus,
  AgentDIDInfo,
  ReasonerDIDInfo,
  SkillDIDInfo,
  ExecutionVC,
  WorkflowVC,
  VCDocument,
  VCCredentialSubject,
  VCCaller,
  VCTarget,
  VCExecution,
  VCAudit,
  VCProof,
  VerificationIssue,
  IntegrityCheckResults,
  SecurityAnalysis,
  ComplianceChecks,
  ComprehensiveVCVerificationResult,
  WorkflowVCChainResponse,
  DIDResolutionBundle,
  DIDResolutionEntry,
  DIDFilters,
  VCFilters,
  VCExportResponse,
  ExecutionVCInfo,
  DIDStatusSummary,
  VCStatusSummary,
  AuditTrailEntry,
  DIDSearchResult,
  DIDStats,
  AgentDIDResponse,
  ComponentDIDInfo,
  VCSearchResult,

  // Compute (Casvisor VMs)
  VMStatus,
  VirtualMachine,

  // SSE Events
  SSEEvent,
  SSEState,

  // Dashboard
  DashboardStats,
  ActivityEvent,
  DashboardSummary,
  TimeRangePreset,
  TimeRangeInfo,
  ComparisonData,
  EnhancedOverviewDelta,
  HotspotSummary,
  HotspotItem,
  ErrorCount,
  ActivityPatterns,
  HeatmapCell,
  EnhancedDashboardResponse,
  EnhancedDashboardOverview,
  ExecutionTrendSummary,
  ExecutionWindowMetrics,
  ExecutionTrendPoint,
  AgentHealthSummary,
  AgentHealthItem,
  EnhancedWorkflowInsights,
  WorkflowStat,
  ActiveWorkflowRun,
  CompletedExecutionStat,
  IncidentItem,
} from './types'

// Services
export {
  // Config
  configure,
  getConfig,
  setApiKey,
  getApiKey,

  // Node APIs
  getNodesSummary,
  getNodeDetails,
  getNodeDetailsWithMCP,
  getNodeDetailsWithPackageInfo,
  streamNodeEvents,

  // MCP APIs
  getMCPHealth,
  getMCPHealthEvents,
  subscribeMCPHealthEvents,
  startMCPServer,
  stopMCPServer,
  restartMCPServer,
  bulkMCPServerAction,
  getMCPTools,
  testMCPTool,
  getMCPServerMetrics,
  getMCPServerConfig,
  updateMCPServerConfig,

  // Agent Config & Env
  getAgentEnvironmentVariables,
  updateAgentEnvironmentVariables,
  getAgentConfigurationSchema,

  // Unified Status
  getNodeStatus,
  refreshNodeStatus,
  bulkNodeStatus,
  updateNodeStatus,

  // Agent Lifecycle
  startAgent,
  stopAgent,
  registerServerlessAgent,
  subscribeToStatusEvents,

  // Dashboard
  getDashboardSummary,
  getEnhancedDashboardSummary,

  // Workflow APIs
  getWorkflowsSummary,
  getWorkflowDetails,
  getWorkflowDAG,
  getWorkflowDAGLightweight,
  getWorkflowRunDetail,
  deleteWorkflow,
  deleteWorkflows,
  getFilterOptions,

  // Execution APIs
  getExecutionsSummary,
  getExecutionDetails,
  getExecutionStats,
  streamExecutionEvents,
  searchExecutions,
  getRecentExecutions,
  getExecutionNotes,
  addExecutionNote,
  retryExecutionWebhook,
  getExecutionTimeline,

  // Identity / DID APIs
  getDIDStats,
  searchDIDs,
  listIdentityAgents,
  getIdentityAgentDetails,
  searchCredentials,
  getAgentDIDs,
  getAgentDIDInfo,
  getDIDStatusSummary,
  getDIDDocument,
  resolveDID,
  getDIDSystemStatus,

  // VC APIs
  verifyVC,
  getWorkflowVCChain,
  verifyExecutionVCComprehensive,
  verifyWorkflowVCComprehensive,
  getWorkflowVCStatuses,
  getWorkflowAuditTrail,
  exportVCs,

  // DID Utilities
  formatDIDForDisplay,
  isValidDID,
  getDIDMethod,
} from './services'
export type { MCPError, EnhancedDashboardParams } from './services'

// Hooks
export {
  useSSE,
  useMCPHealthSSE,
  useNodeEventsSSE,
  useUnifiedStatusSSE,
  useNodeUnifiedStatusSSE,
  useDashboard,
  useEnhancedDashboard,
  useDashboardTimeRange,
} from './hooks'
export type { SSEOptions, TimeRangeState } from './hooks'

// Lib utilities
export {
  getStatusTone,
  getStatusBadgeClasses,
  STATUS_TONES,
  getNextTimeRange,
  TIME_RANGE_OPTIONS,
} from './lib'
