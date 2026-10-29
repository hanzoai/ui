'use client'

/**
 * The model families as chips: Auto, then each of Hanzo's families the catalog
 * lists (Enso's own tiers, Kai, Zen), one press each. Auto is the router, which
 * picks the model for every message; a family chip names its first model the plan
 * grants, and one the plan does not grant asks for the plan instead.
 *
 * Only what the catalog lists is drawn, so a person on a catalog without Kai sees
 * no Kai. This is Chat's chip row, hidden until the person turns the chips on.
 */
import { useMemo } from 'react'

import { useTranslate } from '../i18n/react'
import { ENSO, FAMILIES, grants, sortModels, type ModelFamily } from '../models/catalog'
import type { Chip, Mind } from './Tune'

/** The families a chip names, in order. Enso's router is Auto, so only a tier of Enso beside the router earns a chip. */
const NAMED: readonly ModelFamily[] = ['enso', 'kai', 'zen']

export function useFamilies(mind: Mind, onUpgrade?: (model: string) => void): Chip[] {
  const t = useTranslate()
  return useMemo(() => {
    const router = mind.models.find((m) => m.id === ENSO)
    const rows: Chip[] = router
      ? [
          {
            id: 'auto',
            label: t('Auto'),
            on: mind.model === ENSO,
            onPress: () => mind.pick(ENSO),
          },
        ]
      : []
    for (const id of NAMED) {
      const own = sortModels(mind.models.filter((m) => m.family === id && m.id !== ENSO && m.access !== 'research'))
      if (!own.length) continue
      const first = own.find((m) => grants(mind.free, m.id, mind.models)) ?? own[0]!
      const label = FAMILIES.find((f) => f.id === id)?.label ?? id
      rows.push({
        id,
        label,
        on: own.some((m) => m.id === mind.model),
        onPress: () => (grants(mind.free, first.id, mind.models) ? mind.pick(first.id) : onUpgrade?.(first.id)),
      })
    }
    return rows
  }, [mind, onUpgrade, t])
}
