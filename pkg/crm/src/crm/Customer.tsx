'use client'

/**
 * What a customer bought, left in a cart and pays for, on their record, read live from
 * commerce by their address: their orders and carts (GET /v1/commerce/order, /cart) and,
 * by the commerce user the cloud linked to them when a payment settled (apps/crm
 * customer.go), their plans from billing (GET /v1/billing/subscriptions). A person with
 * none of the three has no section; any of them a role cannot read is left out.
 */
import { useEffect, useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'

import { CrmApi, money, time, type Cart, type Order, type Plan } from '../lib/crm'
import { useChanges } from '../lib/live'

const day = (s: string): string => (time(s) ? new Date(time(s) * 1000).toLocaleDateString() : '')
const lines = (items: { name: string; quantity: number }[]): string => items.map((i) => (i.quantity > 1 ? `${i.quantity} × ${i.name}` : i.name)).join(', ')

type Held = { orders: Order[]; carts: Cart[]; plans: Plan[] }

/** What was paid in orders, less refunds, by currency. */
const spent = (orders: Order[]): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const o of orders) out[o.currency] = (out[o.currency] ?? 0) + o.paid - o.refunded
  return out
}

export function Customer({ person, email }: { person: string; email: string }) {
  const [held, setHeld] = useState<Held | null>(null)
  const [round, setRound] = useState(0)
  useChanges(['activities'], () => setRound((r) => r + 1))

  useEffect(() => {
    let live = true
    // A read this role cannot make is a section it does not have, not a failed page.
    const or = <T,>(read: Promise<T>, none: T): Promise<T> => read.catch(() => none)
    Promise.all([
      email ? or(CrmApi.orders(email).then((r) => r.orders), []) : [],
      email ? or(CrmApi.carts(email).then((r) => r.carts.filter((c) => c.status !== 'ordered')), []) : [],
      or(CrmApi.customerOf(person).then((user) => (user ? CrmApi.plans(user) : [])), []),
    ]).then(([orders, carts, plans]) => live && setHeld({ orders, carts, plans }))
    return () => {
      live = false
    }
  }, [person, email, round])

  if (!held || (held.orders.length === 0 && held.carts.length === 0 && held.plans.length === 0)) return null
  const paid = Object.entries(spent(held.orders))
  return (
    <Card p="$3" borderWidth={1} borderColor="$borderColor" gap="$3" data-slot="crm-customer">
      {held.plans.length > 0 ? (
        <Block title="Plan">
          {held.plans.map((p) => (
            <Row
              key={p.id}
              slot="customer-plan"
              title={`${p.plan}${p.test ? ' (sandbox)' : ''}`}
              detail={[p.status, p.seats > 1 ? `${p.seats} seats` : '', p.renews ? `${p.ends ? 'ends' : 'renews'} ${day(p.renews)}` : ''].filter(Boolean).join(' · ')}
              amount={`${money(p.monthly, p.currency)} a month`}
              note={`${money(p.paid, p.currency)} paid this period`}
            />
          ))}
        </Block>
      ) : null}
      {held.orders.length > 0 ? (
        <Block title="Orders" note={paid.length ? `${paid.map(([currency, cents]) => money(cents, currency)).join(' · ')} spent` : undefined}>
          {held.orders.map((o) => (
            <Row
              key={o.id}
              slot="customer-order"
              title={o.number ? `Order ${o.number}` : 'Order'}
              detail={[lines(o.items), day(o.placed), o.paymentStatus].filter(Boolean).join(' · ')}
              amount={money(o.total, o.currency)}
              note={o.refunded ? `${money(o.refunded, o.currency)} refunded` : undefined}
            />
          ))}
        </Block>
      ) : null}
      {held.carts.length > 0 ? (
        <Block title="Left in a cart">
          {held.carts.map((c) => (
            <Row key={c.id} slot="customer-cart" title={c.status === 'discarded' ? 'Discarded cart' : 'Open cart'} detail={[lines(c.items), day(c.updated)].filter(Boolean).join(' · ')} amount={money(c.total, c.currency)} />
          ))}
        </Block>
      ) : null}
    </Card>
  )
}

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <YStack gap="$2">
      <XStack justify="space-between" items="baseline" flexWrap="wrap" gap="$2">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          {title}
        </Text>
        {note ? (
          <Text fontSize="$2" color="$color10">
            {note}
          </Text>
        ) : null}
      </XStack>
      {children}
    </YStack>
  )
}

function Row({ slot, title, detail, amount, note }: { slot: string; title: string; detail: string; amount: string; note?: string }) {
  return (
    <XStack gap="$3" justify="space-between" flexWrap="wrap" data-slot={slot}>
      <YStack flex={1} minW={200}>
        <Text fontSize="$3" fontWeight="600" color="$color12">
          {title}
        </Text>
        {detail ? (
          <Text fontSize="$2" color="$color10">
            {detail}
          </Text>
        ) : null}
      </YStack>
      <YStack items="flex-end">
        <Text fontSize="$3" color="$color12">
          {amount}
        </Text>
        {note ? (
          <Text fontSize="$2" color="$color10">
            {note}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  )
}
