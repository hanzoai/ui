'use client'

/**
 * The org's sales, from the cloud, never counted from what the browser happens to have
 * loaded: its customers (the people whose Type is Customer), the orders its store made
 * and what they came to, the carts left behind (GET /v1/commerce/order, /cart), and the
 * plans its customers hold (GET /v1/billing/subscriptions). Each answers the whole org
 * to an org admin or a SuperAdmin and refuses a member, so the page is an admin's. A
 * read that fails leaves its tiles out; the page does not fail with it.
 */
import { useEffect, useState } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'

import { CrmApi, confers, money, monthly, type Plan, type Sum } from '../lib/crm'
import { useRouter } from '../lib/host'
import { useAdmin } from './schema'

type Read = { customers?: number; orders?: { count: number; revenue: Sum[] }; left?: number; plans?: Plan[] }

export function Sales() {
  const admin = useAdmin()
  const router = useRouter()
  const [read, setRead] = useState<Read | null>(null)

  useEffect(() => {
    if (!admin) return
    let live = true
    const or = <T,>(r: Promise<T>): Promise<T | undefined> => r.catch(() => undefined)
    Promise.all([
      or(CrmApi.list('people', { filter: 'type = "customer"', perPage: 1 }).then((r) => r.totalItems)),
      or(CrmApi.orders()),
      or(CrmApi.carts()),
      or(CrmApi.plans()),
    ]).then(([customers, orders, carts, plans]) => live && setRead({ customers, orders, left: carts?.left, plans: plans?.filter((p) => !p.test) }))
    return () => {
      live = false
    }
  }, [admin])

  if (!admin) {
    return (
      <Text fontSize="$3" color="$color10">
        The org's sales are an admin's to read.
      </Text>
    )
  }
  if (!read) {
    return (
      <Text fontSize="$2" color="$color10">
        Reading the org's sales…
      </Text>
    )
  }
  const held = (read.plans ?? []).filter(confers)
  const tiles: { label: string; value: string }[] = [
    ...(read.customers === undefined ? [] : [{ label: 'Customers', value: String(read.customers) }]),
    ...(read.orders
      ? [
          { label: 'Orders', value: String(read.orders.count) },
          ...read.orders.revenue.map((r) => ({ label: `Revenue (${r.currency.toUpperCase()})`, value: money(r.cents, r.currency) })),
        ]
      : []),
    ...(read.left === undefined ? [] : [{ label: 'Carts left', value: String(read.left) }]),
    ...(read.plans
      ? [
          { label: 'Plans held', value: String(held.length) },
          ...Object.entries(monthly(read.plans)).map(([currency, cents]) => ({ label: `Plans per month (${currency.toUpperCase()})`, value: money(cents, currency) })),
          { label: 'Plans past due', value: String(read.plans.filter((p) => p.status === 'past_due').length) },
        ]
      : []),
  ]
  return (
    <YStack gap="$3" data-slot="crm-sales">
      <XStack gap="$3" flexWrap="wrap">
        {tiles.map((t) => (
          <Card key={t.label} p="$3" borderWidth={1} borderColor="$borderColor" minW={180} data-slot="sales-tile">
            <Text fontSize="$2" color="$color10">
              {t.label}
            </Text>
            <Text fontSize="$7" fontWeight="700" color="$color12">
              {t.value}
            </Text>
          </Card>
        ))}
      </XStack>
      <XStack>
        <Button size="$2" chromeless px={0} onPress={() => router.push('/crm?view=customers')}>
          See the customers
        </Button>
      </XStack>
    </YStack>
  )
}
