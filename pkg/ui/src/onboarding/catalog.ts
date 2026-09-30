import { useEffect, useState } from 'react'
import { call } from './api'
import { adopt, type Row } from './plans'

const loads = new Map<string, Promise<void>>()

/** Read the live catalog once per origin; a failed read is tried again next time. */
export function loadCatalog(api: string): Promise<void> {
  let p = loads.get(api)
  if (!p) {
    p = call<Row[] | { plans: Row[] }>(api, '/v1/billing/plans').then((r) => adopt(Array.isArray(r) ? r : r.plans))
    p.catch(() => loads.delete(api))
    loads.set(api, p)
  }
  return p
}

/** Whether the catalog has loaded (`null` while it is being read), so no screen prices from nothing. */
export function useCatalog(api: string): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    loadCatalog(api).then(
      () => live && setOk(true),
      () => live && setOk(false),
    )
    return () => {
      live = false
    }
  }, [api])
  return ok
}
