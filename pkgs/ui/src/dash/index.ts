/**
 * @hanzo/ui/dash
 *
 * Shared dash UI foundation. Dark-themed layout, navigation,
 * data table, form builder, and CRUD components.
 *
 * Design tokens in tokens.css work in both React and Svelte.
 */

// Layout
export { Layout } from './layout'
export type { LayoutProps } from './layout'

// Sidebar
export { Sidebar } from './sidebar'
export type { SidebarProps, NavItem, NavGroup } from './sidebar'

// Header
export { Header } from './header'
export type { HeaderProps, BreadcrumbItem } from './header'

// Data Table
export { Table } from './table'
export type { TableProps, Column } from './table'

// Form
export { Form } from './form'
export type { FormProps, FieldDef, FieldType, FieldOption } from './form'

// CRUD
export { Crud } from './crud'
export type { CrudProps } from './crud'
