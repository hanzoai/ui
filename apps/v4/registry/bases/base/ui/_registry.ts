import { type Registry } from "shadcn/schema"

export const ui: Registry["items"] = [
  {
    name: "accordion",
    type: "registry:ui",
    files: [
      {
        path: "ui/accordion.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/accordion",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/accordion-example.tsx",
        api: "https://base-ui.com/react/components/accordion.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "alert",
    type: "registry:ui",
    files: [
      {
        path: "ui/alert.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/alert",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/alert-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "alert-dialog",
    type: "registry:ui",
    registryDependencies: ["button"],
    files: [
      {
        path: "ui/alert-dialog.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/alert-dialog",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/alert-dialog-example.tsx",
        api: "https://base-ui.com/react/components/alert-dialog.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "aspect-ratio",
    type: "registry:ui",
    files: [
      {
        path: "ui/aspect-ratio.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/aspect-ratio",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/aspect-ratio-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "avatar",
    type: "registry:ui",
    files: [
      {
        path: "ui/avatar.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/avatar",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/avatar-example.tsx",
        api: "https://base-ui.com/react/components/avatar.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "badge",
    type: "registry:ui",
    files: [
      {
        path: "ui/badge.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/badge",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/badge-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "breadcrumb",
    type: "registry:ui",
    files: [
      {
        path: "ui/breadcrumb.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/breadcrumb",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/breadcrumb-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "button",
    type: "registry:ui",
    files: [
      {
        path: "ui/button.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/button",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/button-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "button-group",
    type: "registry:ui",
    registryDependencies: ["separator"],
    files: [
      {
        path: "ui/button-group.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/button-group",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/button-group-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "calendar",
    type: "registry:ui",
    dependencies: ["react-day-picker@latest", "date-fns"],
    registryDependencies: ["button"],
    files: [
      {
        path: "ui/calendar.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/calendar",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/calendar-example.tsx",
        api: "https://react-day-picker.js.org",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "card",
    type: "registry:ui",
    files: [
      {
        path: "ui/card.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/card",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/card-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "carousel",
    type: "registry:ui",
    files: [
      {
        path: "ui/carousel.tsx",
        type: "registry:ui",
      },
    ],
    registryDependencies: ["button"],
    dependencies: ["embla-carousel-react"],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/carousel",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/carousel-example.tsx",
        api: "https://www.embla-carousel.com/get-started/react",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "chart",
    type: "registry:ui",
    files: [
      {
        path: "ui/chart.tsx",
        type: "registry:ui",
      },
    ],
    registryDependencies: ["card"],
<<<<<<< HEAD
    dependencies: ["recharts@2.15.4"],
=======
    dependencies: ["recharts@3.8.0"],
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/chart",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/chart-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "checkbox",
    type: "registry:ui",
    files: [
      {
        path: "ui/checkbox.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/checkbox",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/checkbox-example.tsx",
        api: "https://base-ui.com/react/components/checkbox.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "collapsible",
    type: "registry:ui",
    files: [
      {
        path: "ui/collapsible.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/collapsible",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/collapsible-example.tsx",
        api: "https://base-ui.com/react/components/collapsible.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "combobox",
    type: "registry:ui",
    registryDependencies: ["button", "input-group"],
    dependencies: ["@base-ui/react"],
    files: [
      {
        path: "ui/combobox.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/combobox",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/combobox-example.tsx",
        api: "https://base-ui.com/react/components/combobox.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "command",
    type: "registry:ui",
    dependencies: ["cmdk"],
    registryDependencies: ["dialog", "input-group"],
    files: [
      {
        path: "ui/command.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/command",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/command-example.tsx",
        api: "https://github.com/dip/cmdk",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "context-menu",
    type: "registry:ui",
    files: [
      {
        path: "ui/context-menu.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/context-menu",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/context-menu-example.tsx",
        api: "https://base-ui.com/react/components/context-menu.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "dialog",
    type: "registry:ui",
    registryDependencies: ["button"],
    files: [
      {
        path: "ui/dialog.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/dialog",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/dialog-example.tsx",
        api: "https://base-ui.com/react/components/dialog.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "drawer",
    type: "registry:ui",
    dependencies: ["vaul"],
    files: [
      {
        path: "ui/drawer.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/drawer",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/drawer-example.tsx",
        api: "https://vaul.emilkowal.ski/getting-started",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "dropdown-menu",
    type: "registry:ui",
    files: [
      {
        path: "ui/dropdown-menu.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/dropdown-menu",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/dropdown-menu-example.tsx",
        api: "https://base-ui.com/react/components/menu.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "empty",
    type: "registry:ui",
    files: [
      {
        path: "ui/empty.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/empty",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/empty-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "field",
    type: "registry:ui",
    registryDependencies: ["label", "separator"],
    files: [
      {
        path: "ui/field.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/field",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/field-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "form",
    type: "registry:ui",
  },
  {
    name: "hover-card",
    type: "registry:ui",
    files: [
      {
        path: "ui/hover-card.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/hover-card",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/hover-card-example.tsx",
        api: "https://base-ui.com/react/components/hover-card.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "input",
    type: "registry:ui",
    files: [
      {
        path: "ui/input.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/input",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/input-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "input-group",
    type: "registry:ui",
    registryDependencies: ["button", "input", "textarea"],
    files: [
      {
        path: "ui/input-group.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/input-group",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/input-group-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "input-otp",
    type: "registry:ui",
    dependencies: ["input-otp"],
    files: [
      {
        path: "ui/input-otp.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/input-otp",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/input-otp-example.tsx",
        api: "https://input-otp.rodz.dev",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "item",
    type: "registry:ui",
    registryDependencies: ["separator"],
    files: [
      {
        path: "ui/item.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/item",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/item-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "label",
    type: "registry:ui",
    files: [
      {
        path: "ui/label.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/label",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/label-example.tsx",
        api: "https://base-ui.com/react/components/label.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "menubar",
    type: "registry:ui",
    registryDependencies: ["dropdown-menu"],
    files: [
      {
        path: "ui/menubar.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/menubar",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/menubar-example.tsx",
        api: "https://base-ui.com/react/components/menubar.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "navigation-menu",
    type: "registry:ui",
    files: [
      {
        path: "ui/navigation-menu.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/navigation-menu",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/navigation-menu-example.tsx",
        api: "https://base-ui.com/react/components/navigation-menu.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "pagination",
    type: "registry:ui",
    registryDependencies: ["button"],
    files: [
      {
        path: "ui/pagination.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/pagination",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/pagination-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "popover",
    type: "registry:ui",
    files: [
      {
        path: "ui/popover.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/popover",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/popover-example.tsx",
        api: "https://base-ui.com/react/components/popover.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "progress",
    type: "registry:ui",
    files: [
      {
        path: "ui/progress.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/progress",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/progress-example.tsx",
        api: "https://base-ui.com/react/components/progress.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "radio-group",
    type: "registry:ui",
    files: [
      {
        path: "ui/radio-group.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/radio-group",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/radio-group-example.tsx",
        api: "https://base-ui.com/react/components/radio-group.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "resizable",
    type: "registry:ui",
    dependencies: ["react-resizable-panels"],
    files: [
      {
        path: "ui/resizable.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/resizable",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/resizable-example.tsx",
        api: "https://github.com/bvaughn/react-resizable-panels",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "scroll-area",
    type: "registry:ui",
    files: [
      {
        path: "ui/scroll-area.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/scroll-area",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/scroll-area-example.tsx",
        api: "https://base-ui.com/react/components/scroll-area.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "select",
    type: "registry:ui",
    files: [
      {
        path: "ui/select.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/select",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/select-example.tsx",
        api: "https://base-ui.com/react/components/select.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "separator",
    type: "registry:ui",
    files: [
      {
        path: "ui/separator.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/separator",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/separator-example.tsx",
        api: "https://base-ui.com/react/components/separator.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "sheet",
    type: "registry:ui",
    registryDependencies: ["button"],
    files: [
      {
        path: "ui/sheet.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/sheet",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/sheet-example.tsx",
        api: "https://base-ui.com/react/components/dialog.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "sidebar",
    type: "registry:ui",
    registryDependencies: [
      "button",
      "input",
      "separator",
      "sheet",
      "skeleton",
      "tooltip",
      "use-mobile",
    ],
    files: [
      {
        path: "ui/sidebar.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/sidebar",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/sidebar-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "skeleton",
    type: "registry:ui",
    files: [
      {
        path: "ui/skeleton.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/skeleton",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/skeleton-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "slider",
    type: "registry:ui",
    files: [
      {
        path: "ui/slider.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/slider",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/slider-example.tsx",
        api: "https://base-ui.com/react/components/slider.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "sonner",
    type: "registry:ui",
    dependencies: ["sonner", "next-themes"],
    files: [
      {
        path: "ui/sonner.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/sonner",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/sonner-example.tsx",
        api: "https://sonner.emilkowal.ski",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "spinner",
    type: "registry:ui",
    files: [
      {
        path: "ui/spinner.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/spinner",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/spinner-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "switch",
    type: "registry:ui",
    files: [
      {
        path: "ui/switch.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/switch",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/switch-example.tsx",
        api: "https://base-ui.com/react/components/switch.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "table",
    type: "registry:ui",
    files: [
      {
        path: "ui/table.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/table",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/table-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "tabs",
    type: "registry:ui",
    files: [
      {
        path: "ui/tabs.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/tabs",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/tabs-example.tsx",
        api: "https://base-ui.com/react/components/tabs.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "textarea",
    type: "registry:ui",
    files: [
      {
        path: "ui/textarea.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/textarea",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/textarea-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "toggle",
    type: "registry:ui",
    files: [
      {
        path: "ui/toggle.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/toggle",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/toggle-example.tsx",
        api: "https://base-ui.com/react/components/toggle.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "toggle-group",
    type: "registry:ui",
    registryDependencies: ["toggle"],
    files: [
      {
        path: "ui/toggle-group.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/toggle-group",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/toggle-group-example.tsx",
        api: "https://base-ui.com/react/components/toggle-group.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "tooltip",
    type: "registry:ui",
    docs: `The \`tooltip\` component has been added. Remember to wrap your app with the \`TooltipProvider\` component.

\`\`\`tsx title="app/layout.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
\`\`\`
`,
    files: [
      {
        path: "ui/tooltip.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/tooltip",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/tooltip-example.tsx",
        api: "https://base-ui.com/react/components/tooltip.md",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "kbd",
    type: "registry:ui",
    files: [
      {
        path: "ui/kbd.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/kbd",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/kbd-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "native-select",
    type: "registry:ui",
    files: [
      {
        path: "ui/native-select.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/native-select",
        examples:
          "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/native-select-example.tsx",
      },
    },
>>>>>>> shadcn/main
  },
  {
    name: "direction",
    type: "registry:ui",
    dependencies: ["@base-ui/react"],
    files: [
      {
        path: "ui/direction.tsx",
        type: "registry:ui",
      },
    ],
<<<<<<< HEAD
=======
    meta: {
      links: {
        docs: "https://ui.shadcn.com/docs/components/base/direction",
        api: "https://base-ui.com/react/utils/direction-provider.md",
      },
    },
>>>>>>> shadcn/main
  },
]
