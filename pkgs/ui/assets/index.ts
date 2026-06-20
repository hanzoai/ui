// Export all asset components and icons
// Note: Some files have overlapping exports, so we export them selectively

// File-related icons
export * from './file';

// File type icons (specific exports from file-type-icon to avoid conflicts with general)
export {
  FileTypeIcon,
  DirectoryTypeIcon,
  type FileTypeIconProps
} from './file-type-icon';

// General icons (excluding duplicates: DirectoryTypeIcon, FileTypeIcon, HanzoIcon)
export {
  HanzoLogoIcon,
  HanzoLogoSoloIcon,
  HanzoCombinationMarkIcon,
  SendIcon,
  ExportIcon,
  QrIcon,
  JobBubbleIcon,
  ChatBubbleIcon,
  AttachmentIcon,
  DisconnectIcon,
  AgentIcon,
  AddAgentIcon,
  InboxIcon,
  ArchiveIcon,
  ArchivedIcon,
  ActiveIcon,
  FilesIcon,
  SharedFolderIcon,
  AddNewFolderIcon,
  UploadVectorResourceIcon,
  GenerateDocIcon,
  GenerateFromWebIcon,
  CreateAIIcon,
  FileEmptyStateIcon,
  AiTasksIcon,
  AISearchContentIcon,
  BrowseSubscriptionIcon,
  MySubscriptionsIcon,
  PromptLibraryIcon,
  NotificationIcon,
  SheetFileIcon,
  FormulaIcon,
  SheetIcon,
  ShortcutsIcon,
  NetworkAgentIcon,
  MCPIcon,
  ToolsIcon,
  ToolsDisabledIcon,
  StoreIcon,
  ScheduledTasksIcon,
  AddCryptoWalletIcon,
  CryptoWalletIcon,
  ReactJsIcon,
  AIAgentIcon,
  AisIcon,
  ToolAssetsIcon,
  ScheduledTasksComingSoonIcon,
  EmbeddingsGeneratedIcon,
  UnknownLanguageIcon,
  PythonIcon,
  TypeScriptIcon,
  MetadataIcon,
  SaveIcon,
  CloudModelIcon,
  LocalModelIcon,
  ArrowRightIcon,
  ImportIcon,
  WebSearchIcon,
  WebSearchDisabledIcon,
  ChatSettingsIcon,
  PlusIcon,
  ReasoningIcon,
  HomeIcon,
  TracingIcon,
  DownloadIcon,
  CategoryIcon,
  PartyIcon,
  // Exclude DirectoryTypeIcon and FileTypeIcon as they're exported above
  // Exclude HanzoIcon as it's exported below from hanzo-logo
} from './general';

// Crypto icons
export * from './crypto';

// AI-related icons are already exported from general above
// Removed duplicate exports to avoid conflicts

// LLM provider icons (specific exports to avoid HanzoIcon conflict)
export {
  MistralIcon,
  GoogleIcon,
  MetaIcon,
  MicrosoftIcon,
  OpenBMBIcon,
  AnthropicIcon,
  AzureIcon,
  DeepSeekIcon,
  GroqIcon,
  LmStudioIcon,
  OllamaIcon,
  OpenAIIcon,
  OpenRouterIcon,
  PerplexityIcon,
  QwenIcon,
  ExoIcon,
  GeminiIcon,
  GrokIcon,
  AyaCohereIcon,
  // Exclude HanzoIcon as it's exported below from hanzo-logo
} from './llm-provider';

// Hanzo logo (primary export for HanzoIcon)
export {
  HanzoLogo,
  HanzoIcon,  // Use this as the canonical HanzoIcon export
  // HanzoLogoProps type not exported from hanzo-logo
} from './hanzo-logo';