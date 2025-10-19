import { MainNavItem, SidebarNavItem } from "types/nav"

interface DocsConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "Components",
      href: "/docs/components",
    },
    {
      title: "AI",
      href: "/docs/ai",
    },
    {
      title: "Blocks",
      href: "/blocks",
    },
    {
      title: "Charts",
      href: "/charts",
    },
    {
      title: "Themes",
      href: "/themes",
    },
    {
      title: "Colors",
      href: "/colors",
    },
    {
      title: "Builder",
      href: "/builder",
    },
    {
      title: "Theme Gen",
      href: "/theme-generator",
    },
    {
      title: "Compose",
      href: "/compose",
    },
  ],
  sidebarNav: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Introduction",
          href: "/docs",
          items: [],
        },
        {
          title: "Installation",
          href: "/docs/installation",
          items: [],
        },
        {
          title: "components.json",
          href: "/docs/components-json",
          items: [],
        },
        {
          title: "Theming",
          href: "/docs/theming",
          items: [],
        },
        {
          title: "Dark mode",
          href: "/docs/dark-mode",
          items: [],
        },
        {
          title: "CLI",
          href: "/docs/cli",
          items: [],
        },
        {
          title: "Typography",
          href: "/docs/components/typography",
          items: [],
        },
        {
          title: "Figma",
          href: "/docs/figma",
          items: [],
        },
        {
          title: "Changelog",
          href: "/docs/changelog",
          items: [],
        },
        {
          title: "hanzo Compatibility",
          href: "/docs/hanzo-compatibility",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Components",
      items: [
        {
          title: "Accordion",
          href: "/docs/components/accordion",
          items: [],
        },
        {
          title: "Alert",
          href: "/docs/components/alert",
          items: [],
        },
        {
          title: "Alert Dialog",
          href: "/docs/components/alert-dialog",
          items: [],
        },
        {
          title: "Aspect Ratio",
          href: "/docs/components/aspect-ratio",
          items: [],
        },
        {
          title: "Avatar",
          href: "/docs/components/avatar",
          items: [],
        },
        {
          title: "Badge",
          href: "/docs/components/badge",
          items: [],
        },
        {
          title: "Breadcrumb",
          href: "/docs/components/breadcrumb",
          items: [],
          label: "New",
        },
        {
          title: "Button",
          href: "/docs/components/button",
          items: [],
        },
        {
          title: "Calendar",
          href: "/docs/components/calendar",
          items: [],
        },
        {
          title: "Card",
          href: "/docs/components/card",
          items: [],
        },
        {
          title: "Carousel",
          href: "/docs/components/carousel",
          items: [],
        },
        {
          title: "Checkbox",
          href: "/docs/components/checkbox",
          items: [],
        },
        {
          title: "Collapsible",
          href: "/docs/components/collapsible",
          items: [],
        },
        {
          title: "Combobox",
          href: "/docs/components/combobox",
          items: [],
        },
        {
          title: "Command",
          href: "/docs/components/command",
          items: [],
        },
        {
          title: "Context Menu",
          href: "/docs/components/context-menu",
          items: [],
        },
        {
          title: "Data Table",
          href: "/docs/components/data-table",
          items: [],
        },
        {
          title: "Date Picker",
          href: "/docs/components/date-picker",
          items: [],
        },
        {
          title: "Dialog",
          href: "/docs/components/dialog",
          items: [],
        },
        {
          title: "Drawer",
          href: "/docs/components/drawer",
          items: [],
        },
        {
          title: "Dropdown Menu",
          href: "/docs/components/dropdown-menu",
          items: [],
        },
        {
          title: "Form",
          href: "/docs/components/form",
          items: [],
        },
        {
          title: "Hover Card",
          href: "/docs/components/hover-card",
          items: [],
        },
        {
          title: "Input",
          href: "/docs/components/input",
          items: [],
        },
        {
          title: "Input OTP",
          href: "/docs/components/input-otp",
          items: [],
          label: "New",
        },
        {
          title: "Label",
          href: "/docs/components/label",
          items: [],
        },
        {
          title: "Menubar",
          href: "/docs/components/menubar",
          items: [],
        },
        {
          title: "Navigation Menu",
          href: "/docs/components/navigation-menu",
          items: [],
        },
        {
          title: "Pagination",
          href: "/docs/components/pagination",
          items: [],
        },
        {
          title: "Popover",
          href: "/docs/components/popover",
          items: [],
        },
        {
          title: "Progress",
          href: "/docs/components/progress",
          items: [],
        },
        {
          title: "Radio Group",
          href: "/docs/components/radio-group",
          items: [],
        },
        {
          title: "Resizable",
          href: "/docs/components/resizable",
          items: [],
        },
        {
          title: "Scroll Area",
          href: "/docs/components/scroll-area",
          items: [],
        },
        {
          title: "Select",
          href: "/docs/components/select",
          items: [],
        },
        {
          title: "Separator",
          href: "/docs/components/separator",
          items: [],
        },
        {
          title: "Sheet",
          href: "/docs/components/sheet",
          items: [],
        },
        {
          title: "Skeleton",
          href: "/docs/components/skeleton",
          items: [],
        },
        {
          title: "Slider",
          href: "/docs/components/slider",
          items: [],
        },
        {
          title: "Sonner",
          href: "/docs/components/sonner",
          items: [],
        },
        {
          title: "Switch",
          href: "/docs/components/switch",
          items: [],
        },
        {
          title: "Table",
          href: "/docs/components/table",
          items: [],
        },
        {
          title: "Tabs",
          href: "/docs/components/tabs",
          items: [],
        },
        {
          title: "Textarea",
          href: "/docs/components/textarea",
          items: [],
        },
        {
          title: "Toast",
          href: "/docs/components/toast",
          items: [],
        },
        {
          title: "Toggle",
          href: "/docs/components/toggle",
          items: [],
        },
        {
          title: "Toggle Group",
          href: "/docs/components/toggle-group",
          items: [],
        },
        {
          title: "Tooltip",
          href: "/docs/components/tooltip",
          items: [],
        },
      ],
    },
    {
      title: "Code Components",
      items: [
        {
          title: "Code Block",
          href: "/docs/components/code-block",
          items: [],
          label: "New",
        },
        {
          title: "Code Editor",
          href: "/docs/components/code-editor",
          items: [],
          label: "New",
        },
        {
          title: "Code Tabs",
          href: "/docs/components/code-tabs",
          items: [],
          label: "New",
        },
        {
          title: "Sandbox",
          href: "/docs/components/sandbox",
          items: [],
          label: "New",
        },
        {
          title: "Snippet",
          href: "/docs/components/snippet",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Project Management",
      items: [
        {
          title: "Gantt Chart",
          href: "/docs/components/gantt",
          items: [],
          label: "New",
        },
        {
          title: "Kanban Board",
          href: "/docs/components/kanban",
          items: [],
          label: "New",
        },
        {
          title: "List",
          href: "/docs/components/list",
          items: [],
          label: "New",
        },
        {
          title: "Table",
          href: "/docs/components/table",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Device Mockups",
      items: [
        {
          title: "Android",
          href: "/docs/components/android",
          items: [],
          label: "New",
        },
        {
          title: "iPhone 15 Pro",
          href: "/docs/components/iphone-15-pro",
          items: [],
          label: "New",
        },
        {
          title: "Safari",
          href: "/docs/components/safari",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Dock Components",
      items: [
        {
          title: "Dock",
          href: "/docs/components/dock",
          items: [],
          label: "New",
        },
        {
          title: "Limelight Nav",
          href: "/docs/components/limelight-nav",
          items: [],
          label: "New",
        },
        {
          title: "macOS Dock",
          href: "/docs/components/macos-dock",
          items: [],
          label: "New",
        },
        {
          title: "Menu Dock",
          href: "/docs/components/menu-dock",
          items: [],
          label: "New",
        },
        {
          title: "Message Dock",
          href: "/docs/components/message-dock",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Form Components",
      items: [
        {
          title: "Choicebox",
          href: "/docs/components/choicebox",
          items: [],
          label: "New",
        },
        {
          title: "Color Picker",
          href: "/docs/components/color-picker",
          items: [],
          label: "New",
        },
        {
          title: "Combobox",
          href: "/docs/components/combobox",
          items: [],
          label: "New",
        },
        {
          title: "Dropzone",
          href: "/docs/components/dropzone",
          items: [],
          label: "New",
        },
        {
          title: "Editor",
          href: "/docs/components/editor",
          items: [],
          label: "New",
        },
        {
          title: "Minimal Tiptap",
          href: "/docs/components/minimal-tiptap",
          items: [],
          label: "New",
        },
        {
          title: "Image Crop",
          href: "/docs/components/image-crop",
          items: [],
          label: "New",
        },
        {
          title: "Image Zoom",
          href: "/docs/components/image-zoom",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "3D Components",
      items: [
        {
          title: "3D Card",
          href: "/docs/components/3d-card",
          items: [],
          label: "New",
        },
        {
          title: "3D Marquee",
          href: "/docs/components/3d-marquee",
          items: [],
          label: "New",
        },
        {
          title: "3D Pin",
          href: "/docs/components/3d-pin",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Animation Components",
      items: [
        {
          title: "Animated Beam",
          href: "/docs/components/animated-beam",
          items: [],
          label: "New",
        },
        {
          title: "Animated Cursor",
          href: "/docs/components/animated-cursor",
          items: [],
          label: "New",
        },
        {
          title: "Animated Testimonials",
          href: "/docs/components/animated-testimonials",
          items: [],
          label: "New",
        },
        {
          title: "Animated Tooltip",
          href: "/docs/components/animated-tooltip",
          items: [],
          label: "New",
        },
        {
          title: "Apple Cards Carousel",
          href: "/docs/components/apple-cards-carousel",
          items: [],
          label: "New",
        },
        {
          title: "Apple Hello Effect",
          href: "/docs/components/apple-hello-effect",
          items: [],
          label: "New",
        },
        {
          title: "Glimpse",
          href: "/docs/components/glimpse",
          items: [],
          label: "New",
        },
        {
          title: "Interactive Grid Pattern",
          href: "/docs/components/interactive-grid-pattern",
          items: [],
          label: "New",
        },
        {
          title: "Magnetic",
          href: "/docs/components/magnetic",
          items: [],
          label: "New",
        },
        {
          title: "Motion Highlight",
          href: "/docs/components/motion-highlight",
          items: [],
          label: "New",
        },
        {
          title: "Particles",
          href: "/docs/components/particles",
          items: [],
          label: "New",
        },
        {
          title: "Pin List",
          href: "/docs/components/pin-list",
          items: [],
          label: "New",
        },
        {
          title: "Pixel Image",
          href: "/docs/components/pixel-image",
          items: [],
          label: "New",
        },
        {
          title: "Spinner",
          href: "/docs/components/spinner",
          items: [],
          label: "New",
        },
        {
          title: "Stars Scrolling Wheel",
          href: "/docs/components/stars-scrolling-wheel",
          items: [],
          label: "New",
        },
        {
          title: "Tabs",
          href: "/docs/components/tabs",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "UI Elements",
      items: [
        {
          title: "Announcement",
          href: "/docs/components/announcement",
          items: [],
          label: "New",
        },
        {
          title: "Avatar Group",
          href: "/docs/components/avatar-group",
          items: [],
          label: "New",
        },
        {
          title: "Banner",
          href: "/docs/components/banner",
          items: [],
          label: "New",
        },
        {
          title: "Credit Card",
          href: "/docs/components/credit-card",
          items: [],
          label: "New",
        },
        {
          title: "Cursor",
          href: "/docs/components/cursor",
          items: [],
          label: "New",
        },
        {
          title: "Dialog Stack",
          href: "/docs/components/dialog-stack",
          items: [],
          label: "New",
        },
        {
          title: "Marquee",
          href: "/docs/components/marquee",
          items: [],
          label: "New",
        },
        {
          title: "Pill",
          href: "/docs/components/pill",
          items: [],
          label: "New",
        },
        {
          title: "Tags",
          href: "/docs/components/tags",
          items: [],
          label: "New",
        },
        {
          title: "Ticker",
          href: "/docs/components/ticker",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Navigation Bars",
      items: [
        {
          title: "Simple Navigation",
          href: "/docs/components/simple-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Advanced Navigation",
          href: "/docs/components/advanced-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Underline Navigation",
          href: "/docs/components/underline-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "E-commerce Navigation",
          href: "/docs/components/e-commerce-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Dashboard Navigation",
          href: "/docs/components/dashboard-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Icon Navigation",
          href: "/docs/components/icon-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Breadcrumb Navigation",
          href: "/docs/components/breadcrumb-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Two-Tier Navigation",
          href: "/docs/components/two-tier-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Communication Navigation",
          href: "/docs/components/communication-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Centered Logo Navigation",
          href: "/docs/components/centered-logo-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Context Switcher Navigation",
          href: "/docs/components/context-switcher-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Team Switcher Navigation",
          href: "/docs/components/team-switcher-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "AI Model Selector Navigation",
          href: "/docs/components/ai-model-selector-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Search and Toggle Navigation",
          href: "/docs/components/search-and-toggle-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Breadcrumb and Filters Navigation",
          href: "/docs/components/breadcrumb-and-filters-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "App Switcher Navigation",
          href: "/docs/components/app-switcher-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Collaboration Navigation",
          href: "/docs/components/collaboration-navigation-bar",
          items: [],
          label: "New",
        },
        {
          title: "Status Dashboard Navigation",
          href: "/docs/components/status-dashboard-navigation-bar",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Utility Components",
      items: [
        {
          title: "Calendar",
          href: "/docs/components/calendar",
          items: [],
          label: "New",
        },
        {
          title: "Mini Calendar",
          href: "/docs/components/mini-calendar",
          items: [],
          label: "New",
        },
        {
          title: "Comparison",
          href: "/docs/components/comparison",
          items: [],
          label: "New",
        },
        {
          title: "kbd",
          href: "/docs/components/kbd",
          items: [],
          label: "New",
        },
        {
          title: "QR Code",
          href: "/docs/components/qr-code",
          items: [],
          label: "New",
        },
        {
          title: "Relative Time",
          href: "/docs/components/relative-time",
          items: [],
          label: "New",
        },
        {
          title: "Status",
          href: "/docs/components/status",
          items: [],
          label: "New",
        },
        {
          title: "Terminal",
          href: "/docs/components/terminal",
          items: [],
          label: "New",
        },
        {
          title: "Video Player",
          href: "/docs/components/video-player",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "AI Components",
      items: [
        {
          title: "AI Playground",
          href: "/docs/ai/playground",
          items: [],
          label: "New",
        },
        {
          title: "AI Actions",
          href: "/docs/ai/actions",
          items: [],
          label: "New",
        },
        {
          title: "AI Models",
          href: "/docs/ai/models",
          items: [],
          label: "New",
        },
        {
          title: "AI Chat",
          href: "/docs/ai/chat",
          items: [],
          label: "New",
        },
        {
          title: "AI Assistant",
          href: "/docs/ai/assistant",
          items: [],
          label: "New",
        },
        {
          title: "AI Vision",
          href: "/docs/ai/vision",
          items: [],
          label: "New",
        },
        {
          title: "AI Agents",
          href: "/docs/ai/agents",
          items: [],
          label: "New",
        },
        {
          title: "AI Tools",
          href: "/docs/ai/tools",
          items: [],
          label: "New",
        },
      ],
    },
    {
      title: "Blocks",
      items: [
        {
          title: "Hero Sections",
          href: "/docs/blocks/heroes",
          items: [],
        },
        {
          title: "Feature Sections",
          href: "/docs/blocks/features",
          items: [],
        },
        {
          title: "CTA Sections",
          href: "/docs/blocks/cta",
          items: [],
        },
        {
          title: "Pricing Tables",
          href: "/docs/blocks/pricing",
          items: [],
        },
        {
          title: "Billing & Payments",
          href: "/docs/blocks/billing",
          items: [],
          label: "New",
        },
        {
          title: "Compose Spec",
          href: "/docs/blocks/compose-spec",
          items: [],
          label: "New",
        },
        {
          title: "Contact Forms",
          href: "/docs/blocks/contact",
          items: [],
        },
        {
          title: "Testimonials",
          href: "/docs/blocks/testimonials",
          items: [],
        },
        {
          title: "Team Sections",
          href: "/docs/blocks/team",
          items: [],
        },
        {
          title: "Stats Sections",
          href: "/docs/blocks/stats",
          items: [],
        },
        {
          title: "FAQ Sections",
          href: "/docs/blocks/faq",
          items: [],
        },
        {
          title: "Newsletter Forms",
          href: "/docs/blocks/newsletter",
          items: [],
        },
      ],
    },
    {
      title: "Charts",
      items: [
        {
          title: "Getting started",
          href: "/docs/charts",
          items: [],
        },
        {
          title: "Area Chart",
          href: "/docs/charts/area",
          items: [],
        },
        {
          title: "Bar Chart",
          href: "/docs/charts/bar",
          items: [],
        },
        {
          title: "Line Chart",
          href: "/docs/charts/line",
          items: [],
        },
        {
          title: "Pie Chart",
          href: "/docs/charts/pie",
          items: [],
        },
        {
          title: "Radar Chart",
          href: "/docs/charts/radar",
          items: [],
        },
        {
          title: "Radial Chart",
          href: "/docs/charts/radial",
          items: [],
        },
        {
          title: "Tooltip",
          href: "/docs/charts/tooltip",
          items: [],
        },
      ],
    },
    {
      title: "Frameworks",
      items: [
        {
          title: "Overview",
          href: "/docs/frameworks",
          items: [],
        },
        {
          title: "React",
          href: "/docs/frameworks/react",
          items: [],
        },
        {
          title: "Vue",
          href: "/docs/frameworks/vue",
          items: [],
        },
        {
          title: "Svelte",
          href: "/docs/frameworks/svelte",
          items: [],
          label: "Beta",
        },
        {
          title: "React Native",
          href: "/docs/frameworks/react-native",
          items: [],
          label: "Beta",
        },
      ],
    },
    {
      title: "Packages",
      items: [
        {
          title: "Overview",
          href: "/docs/packages",
          items: [],
        },
      ],
    },
    {
      title: "Testing",
      items: [
        {
          title: "Testing Guide",
          href: "/docs/testing",
          items: [],
        },
      ],
    },
    {
      title: "White-Label",
      items: [
        {
          title: "White-Label Guide",
          href: "/docs/white-label",
          items: [],
        },
      ],
    },
  ],
}
