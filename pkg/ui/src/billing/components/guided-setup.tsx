'use client'

export interface GuidedSetupProps {
  hasPaymentMethod: boolean
  hasSubscription: boolean
  hasSpendAlert: boolean
  hasCredits: boolean
  onAddPaymentMethod: () => void
  onPickPlan: () => void
  onSetSpendLimit: () => void
  onBuyCredits: () => void
  onDismiss: () => void
}

interface Step {
  label: string
  description: string
  done: boolean
  required: boolean
  action: () => void
  actionLabel: string
}

export function GuidedSetup(props: GuidedSetupProps) {
  const steps: Step[] = [
    {
      label: 'Add a payment method',
      description: 'Required to activate your account and start using Hanzo services.',
      done: props.hasPaymentMethod,
      required: true,
      action: props.onAddPaymentMethod,
      actionLabel: 'Add payment method',
    },
    {
      label: 'Pick a billing mode',
      description: 'Choose a monthly plan for predictable costs, or pay-as-you-go for flexible usage.',
      done: props.hasSubscription,
      required: true,
      action: props.onPickPlan,
      actionLabel: 'Choose plan',
    },
    {
      label: 'Set a spend limit',
      description: 'Prevent surprise bills by setting a monthly budget with automatic alerts.',
      done: props.hasSpendAlert,
      required: false,
      action: props.onSetSpendLimit,
      actionLabel: 'Set limit',
    },
    {
      label: 'Buy credits',
      description: 'Pre-pay for usage at a discount. Credits are applied before card charges.',
      done: props.hasCredits,
      required: false,
      action: props.onBuyCredits,
      actionLabel: 'Buy credits',
    },
  ]

  const completedCount = steps.filter(s => s.done).length

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="rounded-2xl border border-border bg-bg-card p-8">
        <h2 className="text-lg font-semibold text-text mb-1">Get billing ready</h2>
        <p className="text-sm text-text-muted mb-6">
          Complete these steps to activate your account. {completedCount} of {steps.length} done.
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-bg-elevated mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-start gap-4 rounded-xl border p-4 transition ${
                step.done
                  ? 'border-success/20 bg-success/5'
                  : 'border-border bg-bg'
              }`}
            >
              {/* Step indicator */}
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? 'bg-success text-white'
                  : 'bg-bg-elevated text-text-muted border border-border'
              }`}>
                {step.done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-medium ${step.done ? 'text-success' : 'text-text'}`}>
                    {step.label}
                  </p>
                  {!step.required && !step.done && (
                    <span className="text-[10px] uppercase tracking-wider text-text-dim">Optional</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{step.description}</p>
              </div>

              {/* Action */}
              {!step.done && (
                <button
                  type="button"
                  onClick={step.action}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-bg-elevated"
                >
                  {step.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={props.onDismiss}
            className="text-sm text-text-muted transition hover:text-text"
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  )
}
