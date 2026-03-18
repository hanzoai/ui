/**
 * @hanzo/ui/dash
 *
 * Shared dash UI foundation. Dark-themed layout, navigation,
 * data table, form builder, and CRUD components.
 *
 * Design tokens in tokens.css work in both React and Svelte.
 */

// Layout
export { DashLayout } from './dash-layout'
export type { DashLayoutProps } from './dash-layout'

// Sidebar
export { DashSidebar } from './dash-sidebar'
export type { DashSidebarProps, NavItem, NavGroup } from './dash-sidebar'

// Header
export { DashHeader } from './dash-header'
export type { DashHeaderProps, BreadcrumbItem } from './dash-header'

// Data Table
export { DashDataTable } from './dash-data-table'
export type { DashDataTableProps, DashColumn } from './dash-data-table'

// Form
export { DashForm } from './dash-form'
export type { DashFormProps, DashFieldDef, DashFieldType, DashFieldOption } from './dash-form'

// CRUD
export { DashCrud } from './dash-crud'
export type { DashCrudProps } from './dash-crud'
