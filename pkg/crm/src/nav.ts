/**
 * The CRM's pages, in the order an app's navigation lists them: People is the
 * index (`/crm`), then each object, and Sequences, the cloud's drip, before
 * Candidates; Sales, the org's orders, carts and plans, follows them. Each is named as
 * its own screen names it (`deals` is the Pipeline). A host draws these with its
 * own icons, at `/crm` and `/crm/<slug>`; Beta is the SuperAdmin's alone.
 */
import { OBJECTS } from './crm/objects'

export interface CrmPage {
  /** The address segment under /crm: '' for People, the index. */
  slug: string
  label: string
  /** Only a SuperAdmin's: a host lists it for one alone. */
  superAdmin?: boolean
}

export const CRM_PAGES: readonly CrmPage[] = [
  { slug: '', label: OBJECTS.people.plural },
  { slug: 'companies', label: OBJECTS.companies.plural },
  { slug: 'deals', label: OBJECTS.deals.plural },
  { slug: 'fundraising', label: OBJECTS.fundraising.plural },
  { slug: 'tasks', label: OBJECTS.tasks.plural },
  { slug: 'notes', label: OBJECTS.notes.plural },
  { slug: 'lists', label: OBJECTS.lists.plural },
  { slug: 'sequences', label: 'Sequences' },
  { slug: 'candidates', label: OBJECTS.candidates.plural },
  { slug: 'sales', label: 'Sales' },
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'model', label: 'Data Model' },
  { slug: 'beta', label: 'Beta', superAdmin: true },
]
