'use client'

/**
 * Twenty-style CRM Analytics Dashboard.
 *
 * - Pipeline funnel by stage for Sales & Fundraising
 * - Total & weighted pipeline value + win/conversion rate
 * - Outreach funnel: Sent → Opened → Clicked → Replied → Bounced
 * - Overdue tasks + recent activity feed
 * - Calls `CrmApi.analytics()` (`/v1/crm/analytics`) with automatic live Base fallback.
 */
import { useCallback, useEffect, useState } from 'react'
import { Button, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { Card } from '@hanzo/ui'
import { BackendStateCard, classifyBackend } from '@hanzo/ui/product'
import { Activity, AlertCircle, BarChart3, Clock, Mail, RefreshCw, TrendingUp } from '@hanzogui/lucide-icons-2'

import { CrmApi, type CrmAnalytics, type PipelineSummary } from '../lib/crm'
import { useRouter } from '../lib/host'
import { useViewport } from './responsive'

const usd = (n: number): string =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const pct = (r: number): string => `${(r * 100).toFixed(1)}%`

export function Dashboard() {
  const router = useRouter()
  const { mobile, tablet } = useViewport()
  const [data, setData] = useState<CrmAnalytics | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    CrmApi.analytics()
      .then((res) => setData(res))
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <YStack minH={240} items="center" justify="center">
        <Spinner size="large" color="$color11" />
      </YStack>
    )
  }

  if (error && !data) {
    return <BackendStateCard state={classifyBackend(error)} onRetry={load} hint="endpoint · GET /v1/crm/analytics" />
  }

  if (!data) return null

  const totalPipeline = data.sales.totalValue + data.fundraising.totalValue
  const weightedPipeline = data.sales.weightedValue + data.fundraising.weightedValue
  const kpiCols = mobile ? '1fr' : tablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))'
  const twoCols = mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))'

  const funnelSteps = [
    { label: 'Sent', count: data.outreach.sent, rate: 1 },
    { label: 'Opened', count: data.outreach.opened, rate: data.outreach.openRate },
    { label: 'Clicked', count: data.outreach.clicked, rate: data.outreach.clickRate },
    { label: 'Replied', count: data.outreach.replied, rate: data.outreach.replyRate },
    { label: 'Bounced', count: data.outreach.bounced, rate: data.outreach.bounceRate },
  ]

  return (
    <YStack gap="$4" width="100%" maxW="100%" data-slot="crm-dashboard">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <YStack gap="$0.5">
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Dashboard
          </Text>
          <Text fontSize="$2" color="$color10">
            Pipeline health, outreach conversion, overdue follow-ups, and live activity.
          </Text>
        </YStack>
        <Button size="$2" bg="$color2" borderWidth={1} borderColor="$borderColor" onPress={load} disabled={loading}>
          <XStack items="center" gap="$1.5">
            <RefreshCw size={13} color="$color11" />
            <Text fontSize="$2" color="$color12">
              {loading ? 'Refreshing…' : 'Refresh'}
            </Text>
          </XStack>
        </Button>
      </XStack>

      <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: 12 }}>
        <KpiCard
          label="Open Pipeline"
          value={usd(totalPipeline)}
          detail={`${data.sales.openDeals + data.fundraising.openDeals} open deals`}
          icon={<BarChart3 size={15} color="$blue10" />}
        />
        <KpiCard
          label="Weighted Pipeline"
          value={usd(weightedPipeline)}
          detail={`Sales ${usd(data.sales.weightedValue)} · Round ${usd(data.fundraising.weightedValue)}`}
          icon={<TrendingUp size={15} color="$green10" />}
        />
        <KpiCard
          label="Sales Win Rate"
          value={pct(data.sales.conversionRate)}
          detail={`${data.sales.wonDeals} won · ${data.sales.lostDeals} lost`}
          icon={<TrendingUp size={15} color="$color11" />}
        />
        <KpiCard
          label="Overdue Tasks"
          value={String(data.overdueTasks.length)}
          detail={data.outreach.sent > 0 ? `Reply rate ${pct(data.outreach.replyRate)}` : 'No outreach sent yet'}
          icon={<AlertCircle size={15} color={data.overdueTasks.length > 0 ? '$red10' : '$color10'} />}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 12 }}>
        <PipelineCard title="Sales Pipeline" summary={data.sales} onOpen={() => router.push('/crm/deals')} />
        <PipelineCard title="Fundraising Round" summary={data.fundraising} onOpen={() => router.push('/crm/fundraising')} />
      </div>

      <Card p="$3.5" borderWidth={1} borderColor="$borderColor" gap="$3" data-slot="crm-outreach-funnel">
        <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
          <XStack items="center" gap="$2">
            <Mail size={15} color="$blue10" />
            <Text fontSize="$4" fontWeight="700" color="$color12">
              Outreach Funnel
            </Text>
          </XStack>
          <Text fontSize="$2" color="$color10">
            {`${data.outreach.sent.toLocaleString()} sent · ${pct(data.outreach.replyRate)} replied`}
          </Text>
        </XStack>
        <YStack gap="$2">
          {funnelSteps.map((step) => {
            const widthPct = data.outreach.sent > 0 ? Math.min(100, Math.round((step.count / data.outreach.sent) * 100)) : 0
            return (
              <YStack key={step.label} gap="$1">
                <XStack items="center" justify="space-between" gap="$2">
                  <Text fontSize="$2" fontWeight="600" color="$color12">
                    {step.label}
                  </Text>
                  <Text fontSize="$2" color="$color10" fontFamily="$mono">
                    {`${step.count.toLocaleString()} (${pct(step.rate)})`}
                  </Text>
                </XStack>
                <YStack height={8} bg="$color3" rounded="$4" overflow="hidden">
                  <YStack
                    height={8}
                    width={`${widthPct}%`}
                    bg={step.label === 'Bounced' ? '$red10' : step.label === 'Replied' ? '$green10' : '$blue10'}
                    rounded="$4"
                  />
                </YStack>
              </YStack>
            )
          })}
        </YStack>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 12 }}>
        <Card p="$3.5" borderWidth={1} borderColor="$borderColor" gap="$2.5" data-slot="crm-overdue-tasks">
          <XStack items="center" justify="space-between">
            <XStack items="center" gap="$2">
              <Clock size={15} color="$red10" />
              <Text fontSize="$4" fontWeight="700" color="$color12">
                Overdue Tasks
              </Text>
            </XStack>
            <Button size="$2" chromeless onPress={() => router.push('/crm/tasks')}>
              All tasks
            </Button>
          </XStack>
          {data.overdueTasks.length === 0 ? (
            <Text fontSize="$2" color="$color10">
              All tasks are on schedule.
            </Text>
          ) : (
            <YStack gap="$1.5">
              {data.overdueTasks.slice(0, 8).map((t) => (
                <XStack
                  key={t.id}
                  items="center"
                  justify="space-between"
                  gap="$2"
                  p="$2"
                  rounded="$2"
                  bg="$color2"
                  borderWidth={1}
                  borderColor="$borderColor"
                  cursor="pointer"
                  onPress={() => router.push(`/crm/tasks/${t.id}`)}
                >
                  <YStack flex={1} minW={0}>
                    <Text fontSize="$2" fontWeight="600" color="$color12" numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text fontSize="$1" color="$color10" numberOfLines={1}>
                      {[t.due, t.assignee].filter(Boolean).join(' · ')}
                    </Text>
                  </YStack>
                  <Text fontSize="$1" fontWeight="700" color="$red10" shrink={0}>
                    {`${t.daysOverdue}d late`}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
        </Card>

        <Card p="$3.5" borderWidth={1} borderColor="$borderColor" gap="$2.5" data-slot="crm-recent-activity">
          <XStack items="center" gap="$2">
            <Activity size={15} color="$blue10" />
            <Text fontSize="$4" fontWeight="700" color="$color12">
              Recent Activity
            </Text>
          </XStack>
          {data.recentActivities.length === 0 ? (
            <Text fontSize="$2" color="$color10">
              No recent activity recorded yet.
            </Text>
          ) : (
            <YStack gap="$1.5">
              {data.recentActivities.slice(0, 8).map((item) => (
                <XStack
                  key={item.id}
                  items="center"
                  justify="space-between"
                  gap="$2"
                  p="$2"
                  rounded="$2"
                  bg="$color2"
                  borderWidth={1}
                  borderColor="$borderColor"
                  cursor={item.href ? 'pointer' : undefined}
                  onPress={() => item.href && router.push(item.href)}
                >
                  <YStack flex={1} minW={0}>
                    <Text fontSize="$2" fontWeight="600" color="$color12" numberOfLines={1}>
                      {item.subject}
                    </Text>
                    {item.detail ? (
                      <Text fontSize="$1" color="$color10" numberOfLines={1}>
                        {item.detail}
                      </Text>
                    ) : null}
                  </YStack>
                  <Text fontSize="$1" color="$color9" shrink={0}>
                    {item.at ? new Date(item.at * 1000).toLocaleDateString() : ''}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
        </Card>
      </div>
    </YStack>
  )
}

function KpiCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <Card p="$3.5" borderWidth={1} borderColor="$borderColor" gap="$1.5" data-slot="crm-kpi-card">
      <XStack items="center" justify="space-between">
        <Text fontSize="$2" color="$color10">
          {label}
        </Text>
        {icon}
      </XStack>
      <Text fontSize="$7" fontWeight="700" color="$color12" fontFamily="$mono">
        {value}
      </Text>
      <Text fontSize="$1" color="$color10" numberOfLines={1}>
        {detail}
      </Text>
    </Card>
  )
}

function PipelineCard({ title, summary, onOpen }: { title: string; summary: PipelineSummary; onOpen: () => void }) {
  const maxVal = Math.max(1, ...summary.stages.map((s) => Math.max(s.value, s.count)))
  const useValue = summary.stages.some((s) => s.value > 0)
  return (
    <Card p="$3.5" borderWidth={1} borderColor="$borderColor" gap="$3" data-slot="crm-pipeline-card">
      <XStack items="center" justify="space-between" gap="$2">
        <YStack>
          <Text fontSize="$4" fontWeight="700" color="$color12">
            {title}
          </Text>
          <Text fontSize="$2" color="$color10">
            {`${usd(summary.totalValue)} open · ${usd(summary.weightedValue)} weighted`}
          </Text>
        </YStack>
        <Button size="$2" chromeless onPress={onOpen}>
          Open board
        </Button>
      </XStack>
      <YStack gap="$2">
        {summary.stages.map((st) => {
          const metric = useValue ? st.value : st.count
          const widthPct = Math.round((metric / maxVal) * 100)
          return (
            <YStack key={st.stage} gap="$1">
              <XStack items="center" justify="space-between" gap="$2">
                <Text fontSize="$2" fontWeight="500" color="$color12">
                  {st.label}
                </Text>
                <Text fontSize="$2" color="$color10" fontFamily="$mono">
                  {`${st.count} · ${usd(st.value)}`}
                </Text>
              </XStack>
              <YStack height={7} bg="$color3" rounded="$4" overflow="hidden">
                <YStack
                  height={7}
                  width={`${widthPct}%`}
                  bg={st.stage === 'lost' ? '$red10' : st.stage === 'customer' || st.stage === 'closed' ? '$green10' : '$blue10'}
                  rounded="$4"
                />
              </YStack>
            </YStack>
          )
        })}
      </YStack>
    </Card>
  )
}
