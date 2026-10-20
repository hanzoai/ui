/**
 * Icons are stored BY NAME — an object's, a view's, a navigation item's, a
 * select option's — and the name Hanzo stores is a Lucide name. This module turns
 * a stored name into one, whatever wrote it, and names the icon each record
 * concept and field type is drawn with.
 *
 * Lucide is the one icon set (@hanzogui/lucide-icons-2); there is no second
 * family beside it. A record imported from a product that stored Tabler names
 * ("IconBuildingSkyscraper") keeps its icon through `TABLER`, then the same-name
 * rule, then a per-kind fallback — the order reuse decided:
 *
 *   1. a Lucide name stands as it is;
 *   2. a mapped Tabler name takes its pair (`TABLER`, by meaning, not spelling);
 *   3. else "Icon" is stripped and the rest tried as a Lucide name, then with a
 *      trailing 2 or 3, then with a leading or trailing Circle/Square moved to
 *      the other end (Tabler's "CircleCheck" is Lucide's "CheckCircle");
 *   4. else the kind's fallback: an object is a Box, a view a Table, an option
 *      nothing.
 *
 * Names and pairs only: the concept dictionary is twenty-ui's (MIT, NOTICE) and
 * the pairs map its names onto Lucide's; no glyph of either set is copied. This
 * module imports nothing, so naming a concept costs a string, and the icons are
 * loaded only where one is drawn (`loadIcons` in icon-picker.tsx, one async
 * chunk).
 */

/** Twenty/Tabler names → the Lucide icon that means the same thing (153 pairs). */
export const TABLER: Readonly<Record<string, string>> = {
  Icon123: 'Hash',
  IconAddressBook: 'BookUser',
  IconAlertTriangle: 'AlertTriangle',
  IconApi: 'Webhook',
  IconAppWindow: 'AppWindow',
  IconApps: 'LayoutGrid',
  IconArchiveOff: 'ArchiveX',
  IconArrowLeft: 'ArrowLeft',
  IconArrowMerge: 'Merge',
  IconArrowRight: 'ArrowRight',
  IconArrowUpRight: 'ArrowUpRight',
  IconArrowsSort: 'ArrowUpDown',
  IconAt: 'AtSign',
  IconAxisX: 'MoveHorizontal',
  IconAxisY: 'MoveVertical',
  IconBaselineDensitySmall: 'Rows3',
  IconBell: 'Bell',
  IconBlockquote: 'Quote',
  IconBook: 'Book',
  IconBox: 'Box',
  IconBrandLinkedin: 'Linkedin',
  IconBrandTypescript: 'FileCode',
  IconBrandX: 'Twitter',
  IconBuilding: 'Building',
  IconBuildingSkyscraper: 'Building2',
  IconCalendar: 'Calendar',
  IconCalendarDue: 'CalendarClock',
  IconCalendarEvent: 'CalendarDays',
  IconCalendarMonth: 'Calendar',
  IconCalendarRepeat: 'CalendarSync',
  IconCalendarTime: 'CalendarClock',
  IconCalendarWeek: 'CalendarRange',
  IconCheck: 'Check',
  IconCheckbox: 'CheckSquare',
  IconChevronDown: 'ChevronDown',
  IconChevronLeft: 'ChevronLeft',
  IconChevronRight: 'ChevronRight',
  IconChevronUp: 'ChevronUp',
  IconClick: 'MousePointerClick',
  IconClockPlay: 'Timer',
  IconCode: 'Code',
  IconCoins: 'Coins',
  IconColorSwatch: 'Palette',
  IconCommand: 'Command',
  IconCompass: 'Compass',
  IconCopy: 'Copy',
  IconCpu: 'Cpu',
  IconCreditCard: 'CreditCard',
  IconCurrencyDollar: 'DollarSign',
  IconDeviceFloppy: 'Save',
  IconDots: 'MoreHorizontal',
  IconDotsVertical: 'MoreVertical',
  IconDownload: 'Download',
  IconExternalLink: 'ExternalLink',
  IconEye: 'Eye',
  IconEyeOff: 'EyeOff',
  IconFavorite: 'Heart',
  IconFileExport: 'FileOutput',
  IconFileImport: 'FileInput',
  IconFiles: 'Files',
  IconFilter: 'Filter',
  IconFilterOff: 'FilterX',
  IconForbid: 'Ban',
  IconFrame: 'Frame',
  IconGripVertical: 'GripVertical',
  IconH1: 'Heading1',
  IconH2: 'Heading2',
  IconH3: 'Heading3',
  IconHandMove: 'Hand',
  IconHeart: 'Heart',
  IconHeartOff: 'HeartOff',
  IconHierarchy: 'Network',
  IconHistory: 'History',
  IconId: 'IdCard',
  IconInfoCircle: 'Info',
  IconJson: 'Braces',
  IconKey: 'Key',
  IconLayoutDashboard: 'LayoutDashboard',
  IconLayoutGridAdd: 'LayoutGrid',
  IconLayoutKanban: 'Kanban',
  IconLayoutList: 'LayoutList',
  IconLayoutSidebar: 'PanelLeft',
  IconLayoutSidebarLeftCollapse: 'PanelLeftClose',
  IconLayoutSidebarLeftExpand: 'PanelLeft',
  IconLayoutSidebarRight: 'PanelRight',
  IconLego: 'Bot',
  IconLifebuoy: 'LifeBuoy',
  IconLink: 'Link',
  IconListDetails: 'ListChecks',
  IconListNumbers: 'ListOrdered',
  IconListSearch: 'ListFilter',
  IconLock: 'Lock',
  IconLogout: 'LogOut',
  IconMail: 'Mail',
  IconMailCog: 'MailCheck',
  IconMap: 'Map',
  IconMaximize: 'Maximize',
  IconMessage: 'MessageSquare',
  IconMicrophone: 'Mic',
  IconMoodSmile: 'Smile',
  IconNotes: 'StickyNote',
  IconNumber: 'Hash',
  IconPaperclip: 'Paperclip',
  IconPencil: 'Pencil',
  IconPerspective: 'PanelsTopLeft',
  IconPhone: 'Phone',
  IconPhoto: 'Image',
  IconPinned: 'Pin',
  IconPinnedOff: 'PinOff',
  IconPlayerPause: 'Pause',
  IconPlayerPlay: 'Play',
  IconPlug: 'Plug',
  IconPlus: 'Plus',
  IconProgressCheck: 'CircleCheck',
  IconPrompt: 'SquareTerminal',
  IconRefresh: 'RefreshCw',
  IconRefreshDot: 'RefreshCcwDot',
  IconRelationOneToMany: 'Network',
  IconReload: 'RotateCw',
  IconRestore: 'RotateCcw',
  IconRobot: 'Bot',
  IconSearch: 'Search',
  IconServer: 'Server',
  IconSettings: 'Settings',
  IconSettingsAutomation: 'Workflow',
  IconShoppingBag: 'ShoppingBag',
  IconSortAscending: 'ArrowUpNarrowWide',
  IconSortDescending: 'ArrowDownWideNarrow',
  IconSparkles: 'Sparkles',
  IconSpy: 'VenetianMask',
  IconStar: 'Star',
  IconStatusChange: 'ArrowRightLeft',
  IconSum: 'Sigma',
  IconTable: 'Table',
  IconTag: 'Tag',
  IconTags: 'Tags',
  IconTargetArrow: 'Target',
  IconTerminal: 'Terminal',
  IconTextSize: 'Type',
  IconTimelineEvent: 'GitCommit',
  IconToggleLeft: 'ToggleLeft',
  IconTool: 'Wrench',
  IconTransform: 'Shuffle',
  IconTrash: 'Trash',
  IconUpload: 'Upload',
  IconUser: 'User',
  IconUserCircle: 'CircleUser',
  IconUsers: 'Users',
  IconVersions: 'Layers',
  IconWebhook: 'Webhook',
  IconWorld: 'Globe',
  IconX: 'X',
  IconZzz: 'BellOff',
}

/** What a record concept is drawn with: the group it belongs to, the concept, its Lucide name. */
export type Concept = { group: string; concept: string; icon: string }

/** The CRM's concepts and the one Lucide icon each is drawn with. */
export const CONCEPTS: readonly Concept[] = [
  { group: 'Object', concept: 'Person', icon: 'User' },
  { group: 'Object', concept: 'Company', icon: 'Building2' },
  { group: 'Object', concept: 'Opportunity', icon: 'Target' },
  { group: 'Object', concept: 'Task', icon: 'CheckSquare' },
  { group: 'Object', concept: 'Note', icon: 'StickyNote' },
  { group: 'Object', concept: 'Workspace member', icon: 'CircleUser' },
  { group: 'Object', concept: 'Attachment', icon: 'FileInput' },
  { group: 'Object', concept: 'Blocklist', icon: 'Ban' },
  { group: 'Object', concept: 'Calendar event', icon: 'Calendar' },
  { group: 'Object', concept: 'Call recording', icon: 'Video' },
  { group: 'Object', concept: 'Dashboard', icon: 'LayoutDashboard' },
  { group: 'Object', concept: 'Message, thread', icon: 'MessageSquare' },
  { group: 'Object', concept: 'Message folder', icon: 'Folder' },
  { group: 'Object', concept: 'Campaign, delivery', icon: 'Send' },
  { group: 'Object', concept: 'List (people list)', icon: 'UsersRound' },
  { group: 'Object', concept: 'List member', icon: 'User' },
  { group: 'Object', concept: 'Suppression', icon: 'Ban' },
  { group: 'Object', concept: 'Short link', icon: 'Link' },
  { group: 'Object', concept: 'Timeline activity', icon: 'GitCommit' },
  { group: 'Object', concept: 'Workflow, automated trigger', icon: 'Workflow' },
  { group: 'Object', concept: 'Workflow run', icon: 'History' },
  { group: 'Object', concept: 'Workflow version', icon: 'Layers' },
  { group: 'Object', concept: 'AI chat thread', icon: 'MessageSquare' },
  { group: 'Object', concept: 'Agent', icon: 'Bot' },
  { group: 'Data model', concept: 'Data model', icon: 'Network' },
  { group: 'Data model', concept: 'Object', icon: 'Box' },
  { group: 'Data model', concept: 'Field', icon: 'ListFilter' },
  { group: 'Data model', concept: 'Record, record page', icon: 'BookUser' },
  { group: 'Field type', concept: 'Text', icon: 'Type' },
  { group: 'Field type', concept: 'Number', icon: 'Hash' },
  { group: 'Field type', concept: 'True/False', icon: 'ToggleLeft' },
  { group: 'Field type', concept: 'Date and Time', icon: 'CalendarClock' },
  { group: 'Field type', concept: 'Date', icon: 'CalendarDays' },
  { group: 'Field type', concept: 'Select', icon: 'Tag' },
  { group: 'Field type', concept: 'Multi-select', icon: 'Tags' },
  { group: 'Field type', concept: 'Rating', icon: 'Star' },
  { group: 'Field type', concept: 'Currency', icon: 'DollarSign' },
  { group: 'Field type', concept: 'Emails', icon: 'Mail' },
  { group: 'Field type', concept: 'Links', icon: 'Link' },
  { group: 'Field type', concept: 'Phones', icon: 'Phone' },
  { group: 'Field type', concept: 'Full name', icon: 'User' },
  { group: 'Field type', concept: 'Address', icon: 'Map' },
  { group: 'Field type', concept: 'Relation, morph relation', icon: 'Network' },
  { group: 'Field type', concept: 'Actor', icon: 'Settings' },
  { group: 'Field type', concept: 'Rich text', icon: 'Type' },
  { group: 'Field type', concept: 'JSON', icon: 'Braces' },
  { group: 'Field type', concept: 'Array', icon: 'Brackets' },
  { group: 'Field type', concept: 'Files', icon: 'File' },
  { group: 'Field type', concept: 'UUID', icon: 'Fingerprint' },
  { group: 'View', concept: 'View, table view', icon: 'Table' },
  { group: 'View', concept: 'Kanban view', icon: 'Kanban' },
  { group: 'View', concept: 'Calendar view', icon: 'Calendar' },
  { group: 'View', concept: 'Group by', icon: 'LayoutList' },
  { group: 'View', concept: 'Filter', icon: 'Filter' },
  { group: 'View', concept: 'Filter off', icon: 'FilterX' },
  { group: 'View', concept: 'Sort', icon: 'ArrowUpDown' },
  { group: 'View', concept: 'Sort ascending / descending', icon: 'ArrowUpNarrowWide' },
  { group: 'View', concept: 'Compact density', icon: 'Rows3' },
  { group: 'View', concept: 'Aggregate (sum)', icon: 'Sigma' },
  { group: 'Layout', concept: 'Layout, app window', icon: 'AppWindow' },
  { group: 'Layout', concept: 'Layout page', icon: 'PanelsTopLeft' },
  { group: 'Layout', concept: 'Widget', icon: 'LayoutGrid' },
  { group: 'Layout', concept: 'Side panel', icon: 'PanelRight' },
  { group: 'Layout', concept: 'Navigation sidebar', icon: 'PanelLeft' },
  { group: 'Layout', concept: 'Command menu item', icon: 'Command' },
  { group: 'Layout', concept: 'Navigation item', icon: 'Compass' },
  { group: 'Settings', concept: 'Workspace', icon: 'Settings' },
  { group: 'Settings', concept: 'Members, team', icon: 'Users' },
  { group: 'Settings', concept: 'Roles, permissions', icon: 'Lock' },
  { group: 'Settings', concept: 'Billing', icon: 'CreditCard' },
  { group: 'Settings', concept: 'Security, API key', icon: 'Key' },
  { group: 'Settings', concept: 'Audit logs', icon: 'History' },
  { group: 'Settings', concept: 'Apps', icon: 'LayoutGrid' },
  { group: 'Settings', concept: 'Marketplace', icon: 'ShoppingBag' },
  { group: 'Settings', concept: 'Admin panel', icon: 'Server' },
  { group: 'Developer', concept: 'API', icon: 'Webhook' },
  { group: 'Developer', concept: 'Developers', icon: 'Code' },
  { group: 'Developer', concept: 'Webhook', icon: 'Webhook' },
  { group: 'Developer', concept: 'Integration', icon: 'Plug' },
  { group: 'Developer', concept: 'Connected account', icon: 'AtSign' },
  { group: 'Developer', concept: 'Functions', icon: 'FileCode' },
  { group: 'Developer', concept: 'Execution logs', icon: 'Terminal' },
  { group: 'AI', concept: 'Ask AI, MCP', icon: 'Sparkles' },
  { group: 'AI', concept: 'Model', icon: 'Cpu' },
  { group: 'AI', concept: 'Prompt', icon: 'SquareTerminal' },
  { group: 'AI', concept: 'Tools', icon: 'Wrench' },
  { group: 'AI', concept: 'Skill', icon: 'Book' },
  { group: 'AI', concept: 'Dictation', icon: 'Mic' },
  { group: 'Activity', concept: 'Notification', icon: 'Bell' },
  { group: 'Activity', concept: 'Files', icon: 'Files' },
  { group: 'Activity', concept: 'Attachments', icon: 'Paperclip' },
  { group: 'Activity', concept: 'Transcript', icon: 'Quote' },
  { group: 'Chrome', concept: 'Add', icon: 'Plus' },
  { group: 'Chrome', concept: 'Delete', icon: 'Trash2' },
  { group: 'Chrome', concept: 'More actions', icon: 'MoreVertical' },
  { group: 'Chrome', concept: 'Close', icon: 'X' },
  { group: 'Chrome', concept: 'Chevrons', icon: 'ChevronLeft' },
  { group: 'Chrome', concept: 'Edit', icon: 'Pencil' },
  { group: 'Chrome', concept: 'Confirm', icon: 'Check' },
  { group: 'Chrome', concept: 'Copy', icon: 'Copy' },
  { group: 'Chrome', concept: 'Refresh', icon: 'RefreshCw' },
  { group: 'Chrome', concept: 'Search', icon: 'Search' },
  { group: 'Chrome', concept: 'Show / hide', icon: 'Eye' },
  { group: 'Chrome', concept: 'Info', icon: 'Info' },
  { group: 'Chrome', concept: 'Warning', icon: 'AlertTriangle' },
  { group: 'Chrome', concept: 'Open record', icon: 'ArrowUpRight' },
  { group: 'Chrome', concept: 'Expand to full page', icon: 'Maximize2' },
  { group: 'Chrome', concept: 'External link', icon: 'ExternalLink' },
  { group: 'Chrome', concept: 'Drag handle', icon: 'GripVertical' },
  { group: 'Chrome', concept: 'Favorite / unfavorite', icon: 'Heart' },
  { group: 'Chrome', concept: 'Pin / unpin', icon: 'Pin' },
  { group: 'Chrome', concept: 'Import / export', icon: 'FileInput' },
  { group: 'Chrome', concept: 'Merge', icon: 'Merge' },
  { group: 'Chrome', concept: 'Restore', icon: 'RotateCcw' },
  { group: 'Chrome', concept: 'Archive off', icon: 'ArchiveX' },
  { group: 'Chrome', concept: 'Log out', icon: 'LogOut' },
  { group: 'Chrome', concept: 'Globe, domain', icon: 'Globe' },
  { group: 'Chrome', concept: 'Run, pause', icon: 'Play' },
  { group: 'Chrome', concept: 'Save', icon: 'Save' },
  { group: 'Chrome', concept: 'Colour', icon: 'Palette' },
  { group: 'Chrome', concept: 'Status change', icon: 'ArrowRightLeft' },
  { group: 'Chrome', concept: 'Social: LinkedIn, X', icon: 'Linkedin' },
]

/**
 * The icon each field type is drawn with — in a column header, a kanban card's
 * field row, the data-model editor. Keyed by @hanzo/data's FieldType; longText,
 * percent, url, email and position are not concepts of their own in the
 * dictionary, so they take the nearest Lucide meaning.
 */
export const FIELD_ICONS: Readonly<Record<string, string>> = {
  text: 'Type',
  longText: 'AlignLeft',
  richText: 'Type',
  number: 'Hash',
  percent: 'Percent',
  currency: 'DollarSign',
  boolean: 'ToggleLeft',
  select: 'Tag',
  multiSelect: 'Tags',
  date: 'CalendarDays',
  dateTime: 'CalendarClock',
  email: 'Mail',
  url: 'Link',
  links: 'Link',
  phone: 'Phone',
  rating: 'Star',
  relation: 'Network',
  json: 'Braces',
  uuid: 'Fingerprint',
  fullName: 'User',
  address: 'Map',
  files: 'File',
  position: 'ListOrdered',
  actor: 'Settings',
}

/** Where a stored icon is used, which decides what an unknown one falls back to. */
export type IconKind = 'object' | 'view' | 'option' | 'other'

const FALLBACK: Record<IconKind, string | null> = { object: 'Box', view: 'Table', option: null, other: null }

/** The same-name candidates for a Tabler name, in the order they are tried. */
const candidates = (stored: string): string[] => {
  const bare = stored.startsWith('Icon') ? stored.slice(4) : stored
  const out = [bare, `${bare}2`, `${bare}3`]
  for (const shape of ['Circle', 'Square']) {
    if (bare.startsWith(shape) && bare.length > shape.length) out.push(bare.slice(shape.length) + shape)
    if (bare.endsWith(shape) && bare.length > shape.length) out.push(shape + bare.slice(0, -shape.length))
  }
  return out
}

/**
 * The Lucide name a stored icon name resolves to, against the names that exist
 * (`names`, which `loadIcons` supplies): itself, its Tabler pair, a same-name
 * match, or the kind's fallback; `null` when there is none.
 */
export function resolveIcon(stored: string | null | undefined, names: ReadonlySet<string>, kind: IconKind = 'other'): string | null {
  if (stored) {
    if (names.has(stored)) return stored
    const pair = TABLER[stored]
    if (pair && names.has(pair)) return pair
    if (/^[A-Z]/.test(stored)) for (const c of candidates(stored)) if (names.has(c)) return c
  }
  return FALLBACK[kind]
}

/** Lowercased words a search over icons matches: the name split at its capitals, and the concepts drawn with it. */
export function iconWords(name: string): string {
  const own = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  const concepts = CONCEPTS.filter((c) => c.icon === name).map((c) => c.concept.toLowerCase())
  return [own, ...concepts].join(' ')
}

