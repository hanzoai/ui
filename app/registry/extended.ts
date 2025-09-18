import { Registry } from "@/registry/schema"

export const extended: Registry = [
  // Code Components
  {
    name: "code-block",
    type: "components:ui",
    dependencies: ["shiki", "react-copy-to-clipboard"],
    files: ["ui/code-block.tsx"],
    description: "Syntax highlighted code block with copy functionality"
  },
  {
    name: "code-editor",
    type: "components:ui",
    dependencies: ["@monaco-editor/react"],
    files: ["ui/code-editor.tsx"],
    description: "Full-featured code editor with syntax highlighting"
  },
  {
    name: "code-tabs",
    type: "components:ui",
    dependencies: ["@radix-ui/react-tabs"],
    files: ["ui/code-tabs.tsx"],
    description: "Tabbed code blocks for multiple examples"
  },
  {
    name: "sandbox",
    type: "components:ui",
    dependencies: ["@codesandbox/sandpack-react"],
    files: ["ui/sandbox.tsx"],
    description: "Interactive code sandbox"
  },
  {
    name: "snippet",
    type: "components:ui",
    files: ["ui/snippet.tsx"],
    description: "Inline code snippet with copy"
  },

  // Project Management Components
  {
    name: "gantt",
    type: "components:ui",
    dependencies: ["@frappe/gantt"],
    files: ["ui/gantt.tsx"],
    description: "Interactive Gantt chart component"
  },
  {
    name: "kanban",
    type: "components:ui",
    dependencies: ["@dnd-kit/sortable", "@dnd-kit/core"],
    files: ["ui/kanban.tsx"],
    description: "Drag and drop Kanban board"
  },
  {
    name: "list",
    type: "components:ui",
    files: ["ui/list.tsx"],
    description: "Enhanced list component with sorting and filtering"
  },
  {
    name: "table",
    type: "components:ui",
    dependencies: ["@tanstack/react-table"],
    registryDependencies: ["checkbox"],
    files: ["ui/table.tsx"],
    description: "Advanced data table with sorting, filtering, and pagination"
  },

  // Device Mockups
  {
    name: "android",
    type: "components:ui",
    files: ["ui/android.tsx"],
    description: "Android device mockup frame"
  },
  {
    name: "iphone-15-pro",
    type: "components:ui",
    files: ["ui/iphone-15-pro.tsx"],
    description: "iPhone 15 Pro device mockup"
  },
  {
    name: "safari",
    type: "components:ui",
    files: ["ui/safari.tsx"],
    description: "Safari browser window mockup"
  },

  // Dock Components
  {
    name: "dock",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/dock.tsx"],
    description: "macOS-style dock with animations"
  },
  {
    name: "limelight-nav",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/limelight-nav.tsx"],
    description: "Animated navigation with limelight effect"
  },
  {
    name: "macos-dock",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/macos-dock.tsx"],
    description: "macOS dock with hover magnification"
  },
  {
    name: "menu-dock",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/menu-dock.tsx"],
    description: "Dock-style menu with icons"
  },
  {
    name: "message-dock",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/message-dock.tsx"],
    description: "Message app dock interface"
  },

  // Financial Components
  {
    name: "credit-card",
    type: "components:ui",
    dependencies: ["react-credit-cards-2"],
    files: ["ui/credit-card.tsx"],
    description: "Interactive credit card component"
  },
  {
    name: "ticker",
    type: "components:ui",
    dependencies: ["react-ticker"],
    files: ["ui/ticker.tsx"],
    description: "Stock ticker or news ticker component"
  },

  // Form Components
  {
    name: "choicebox",
    type: "components:ui",
    files: ["ui/choicebox.tsx"],
    description: "Enhanced choice selector"
  },
  {
    name: "color-picker",
    type: "components:ui",
    dependencies: ["react-color"],
    files: ["ui/color-picker.tsx"],
    description: "Advanced color picker with presets"
  },
  {
    name: "combobox",
    type: "components:ui",
    dependencies: ["@radix-ui/react-popover"],
    registryDependencies: ["command"],
    files: ["ui/combobox.tsx"],
    description: "Autocomplete combobox with search"
  },
  {
    name: "dropzone",
    type: "components:ui",
    dependencies: ["react-dropzone"],
    files: ["ui/dropzone.tsx"],
    description: "File upload dropzone"
  },
  {
    name: "editor",
    type: "components:ui",
    dependencies: ["@tiptap/react", "@tiptap/starter-kit"],
    files: ["ui/editor.tsx"],
    description: "Rich text editor"
  },
  {
    name: "minimal-tiptap",
    type: "components:ui",
    dependencies: ["@tiptap/react", "@tiptap/starter-kit"],
    files: ["ui/minimal-tiptap.tsx"],
    description: "Minimal rich text editor"
  },
  {
    name: "image-crop",
    type: "components:ui",
    dependencies: ["react-image-crop"],
    files: ["ui/image-crop.tsx"],
    description: "Image cropping component"
  },
  {
    name: "image-zoom",
    type: "components:ui",
    dependencies: ["react-medium-image-zoom"],
    files: ["ui/image-zoom.tsx"],
    description: "Image zoom on click/hover"
  },

  // 3D Components
  {
    name: "3d-card",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/3d-card.tsx"],
    description: "Card with 3D tilt effect"
  },
  {
    name: "3d-marquee",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/3d-marquee.tsx"],
    description: "3D rotating marquee"
  },
  {
    name: "3d-pin",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/3d-pin.tsx"],
    description: "3D pin perspective effect"
  },

  // Animation Components
  {
    name: "animated-cursor",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/animated-cursor.tsx"],
    description: "Custom animated cursor"
  },
  {
    name: "animated-testimonials",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/animated-testimonials.tsx"],
    description: "Animated testimonial carousel"
  },
  {
    name: "animated-tooltip",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/animated-tooltip.tsx"],
    description: "Tooltip with animation effects"
  },
  {
    name: "apple-cards-carousel",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/apple-cards-carousel.tsx"],
    description: "Apple-style cards carousel"
  },
  {
    name: "apple-hello-effect",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/apple-hello-effect.tsx"],
    description: "Apple's animated hello text effect"
  },
  {
    name: "glimpse",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/glimpse.tsx"],
    description: "Glimpse animation effect"
  },
  {
    name: "interactive-grid-pattern",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/interactive-grid-pattern.tsx"],
    description: "Interactive grid background pattern"
  },
  {
    name: "particles",
    type: "components:ui",
    dependencies: ["tsparticles", "@tsparticles/react"],
    files: ["ui/particles.tsx"],
    description: "Particle effects background"
  },
  {
    name: "pin-list",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/pin-list.tsx"],
    description: "Pinned list with animations"
  },
  {
    name: "spinner",
    type: "components:ui",
    files: ["ui/spinner.tsx"],
    description: "Loading spinner variations"
  },
  {
    name: "stars-scrolling-wheel",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/stars-scrolling-wheel.tsx"],
    description: "Scrolling star rating wheel"
  },
  {
    name: "tabs",
    type: "components:ui",
    dependencies: ["@radix-ui/react-tabs"],
    files: ["ui/tabs.tsx"],
    description: "Enhanced tabs component"
  },

  // UI Elements
  {
    name: "announcement",
    type: "components:ui",
    files: ["ui/announcement.tsx"],
    description: "Announcement banner component"
  },
  {
    name: "banner",
    type: "components:ui",
    files: ["ui/banner.tsx"],
    description: "Banner notification component"
  },
  {
    name: "cursor",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/cursor.tsx"],
    description: "Custom cursor component"
  },
  {
    name: "dialog-stack",
    type: "components:ui",
    dependencies: ["@radix-ui/react-dialog"],
    files: ["ui/dialog-stack.tsx"],
    description: "Stacked dialog windows"
  },
  {
    name: "marquee",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/marquee.tsx"],
    description: "Scrolling marquee text"
  },
  {
    name: "avatar-group",
    type: "components:ui",
    registryDependencies: ["avatar"],
    files: ["ui/avatar-group.tsx"],
    description: "Grouped avatar display"
  },
  {
    name: "pill",
    type: "components:ui",
    files: ["ui/pill.tsx"],
    description: "Pill-shaped badge component"
  },
  {
    name: "tags",
    type: "components:ui",
    files: ["ui/tags.tsx"],
    description: "Tag input and display component"
  },

  // Navigation Components
  {
    name: "simple-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/simple-navigation-bar.tsx"],
    description: "Simple navigation bar"
  },
  {
    name: "advanced-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/advanced-navigation-bar.tsx"],
    description: "Advanced navigation with dropdowns"
  },
  {
    name: "underline-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/underline-navigation-bar.tsx"],
    description: "Navigation with underline animation"
  },
  {
    name: "e-commerce-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/e-commerce-navigation-bar.tsx"],
    description: "E-commerce site navigation"
  },
  {
    name: "dashboard-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/dashboard-navigation-bar.tsx"],
    description: "Dashboard navigation layout"
  },
  {
    name: "icon-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/icon-navigation-bar.tsx"],
    description: "Icon-based navigation"
  },
  {
    name: "breadcrumb-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/breadcrumb-navigation-bar.tsx"],
    description: "Breadcrumb navigation"
  },
  {
    name: "two-tier-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/two-tier-navigation-bar.tsx"],
    description: "Two-level navigation"
  },
  {
    name: "communication-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/communication-navigation-bar.tsx"],
    description: "Communication app navigation"
  },
  {
    name: "centered-logo-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/centered-logo-navigation-bar.tsx"],
    description: "Navigation with centered logo"
  },
  {
    name: "context-switcher-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/context-switcher-navigation-bar.tsx"],
    description: "Navigation with context switcher"
  },
  {
    name: "team-switcher-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/team-switcher-navigation-bar.tsx"],
    description: "Navigation with team switcher"
  },
  {
    name: "ai-model-selector-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/ai-model-selector-navigation-bar.tsx"],
    description: "Navigation with AI model selector"
  },
  {
    name: "search-and-toggle-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/search-and-toggle-navigation-bar.tsx"],
    description: "Navigation with search and toggle"
  },
  {
    name: "breadcrumb-and-filters-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/breadcrumb-and-filters-navigation-bar.tsx"],
    description: "Navigation with breadcrumbs and filters"
  },
  {
    name: "app-switcher-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/app-switcher-navigation-bar.tsx"],
    description: "Navigation with app switcher"
  },
  {
    name: "collaboration-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/collaboration-navigation-bar.tsx"],
    description: "Collaboration tools navigation"
  },
  {
    name: "status-dashboard-navigation-bar",
    type: "components:ui",
    files: ["ui/navigation/status-dashboard-navigation-bar.tsx"],
    description: "Status dashboard navigation"
  },

  // Effect Components
  {
    name: "animated-beam",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/animated-beam.tsx"],
    description: "Animated beam connection effect"
  },
  {
    name: "magnetic",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/magnetic.tsx"],
    description: "Magnetic hover effect"
  },
  {
    name: "motion-highlight",
    type: "components:ui",
    dependencies: ["framer-motion"],
    files: ["ui/motion-highlight.tsx"],
    description: "Motion-based text highlighting"
  },
  {
    name: "pixel-image",
    type: "components:ui",
    files: ["ui/pixel-image.tsx"],
    description: "Pixelated image effect"
  },

  // Utility Components
  {
    name: "calendar",
    type: "components:ui",
    dependencies: ["react-day-picker", "date-fns"],
    files: ["ui/calendar.tsx"],
    description: "Full calendar component"
  },
  {
    name: "mini-calendar",
    type: "components:ui",
    dependencies: ["react-day-picker", "date-fns"],
    files: ["ui/mini-calendar.tsx"],
    description: "Compact calendar widget"
  },
  {
    name: "relative-time",
    type: "components:ui",
    dependencies: ["date-fns"],
    files: ["ui/relative-time.tsx"],
    description: "Relative time display (e.g., '2 hours ago')"
  },
  {
    name: "comparison",
    type: "components:ui",
    dependencies: ["react-compare-slider"],
    files: ["ui/comparison.tsx"],
    description: "Before/after comparison slider"
  },
  {
    name: "kbd",
    type: "components:ui",
    files: ["ui/kbd.tsx"],
    description: "Keyboard key component"
  },
  {
    name: "qr-code",
    type: "components:ui",
    dependencies: ["qrcode.react"],
    files: ["ui/qr-code.tsx"],
    description: "QR code generator"
  },
  {
    name: "status",
    type: "components:ui",
    files: ["ui/status.tsx"],
    description: "Status indicator component"
  },
  {
    name: "terminal",
    type: "components:ui",
    dependencies: ["xterm", "xterm-addon-fit"],
    files: ["ui/terminal.tsx"],
    description: "Terminal emulator component"
  },
  {
    name: "video-player",
    type: "components:ui",
    dependencies: ["video.js", "videojs-react-enhanced"],
    files: ["ui/video-player.tsx"],
    description: "Advanced video player component"
  },
]