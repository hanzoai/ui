# @hanzo/checkout

Embeddable checkout widget for Hanzo Commerce - a Stripe-like checkout experience.

## Installation

```bash
npm install @hanzo/checkout
# or
pnpm add @hanzo/checkout
# or
yarn add @hanzo/checkout
```

## Quick Start

### React Integration

```tsx
import { CheckoutProvider, CheckoutForm } from '@hanzo/checkout'

function CheckoutPage() {
  return (
    <CheckoutProvider
      options={{
        apiKey: 'pk_live_xxx',
        onSuccess: (result) => {
          console.log('Payment successful!', result.orderId)
        },
        onError: (error) => {
          console.error('Payment failed:', error.message)
        }
      }}
      sessionId="cs_xxx" // Optional: load existing session
    >
      <CheckoutForm
        showSummary={true}
        expressCheckout={true}
        submitText="Complete Purchase"
      />
    </CheckoutProvider>
  )
}
```

### Using the Hook

```tsx
import { CheckoutProvider, useCheckout } from '@hanzo/checkout'

function CustomCheckout() {
  const {
    session,
    step,
    isLoading,
    isProcessing,
    createSession,
    confirmPayment,
    nextStep,
    prevStep
  } = useCheckout()

  const handleCreateSession = async () => {
    await createSession({
      lineItems: [
        {
          name: 'Premium Plan',
          description: 'Monthly subscription',
          unitPrice: 2999, // $29.99 in cents
          quantity: 1
        }
      ],
      customer: {
        email: 'customer@example.com'
      }
    })
  }

  // Build your custom UI...
}
```

### Vanilla JavaScript

```typescript
import { createCheckout } from '@hanzo/checkout'

const checkout = createCheckout({
  apiKey: 'pk_live_xxx',
  mode: 'production' // or 'sandbox'
})

// Create a session
const session = await checkout.createSession({
  lineItems: [
    {
      name: 'Product Name',
      unitPrice: 1999,
      quantity: 1
    }
  ],
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel'
})

// Redirect to hosted checkout
checkout.redirectToCheckout(session.id)

// Or open in a popup
checkout.openPopup(session.id)
```

### Embed Script (No Build Step)

```html
<!-- Add the script -->
<script src="https://js.hanzo.ai/checkout.js"></script>

<!-- Add checkout buttons -->
<button
  data-hanzo-checkout
  data-hanzo-key="pk_live_xxx"
  data-hanzo-amount="1999"
  data-hanzo-currency="usd"
  data-hanzo-name="Product Name"
  data-hanzo-description="Product description"
  data-hanzo-success-url="https://example.com/success"
>
  Pay $19.99
</button>

<!-- Initialize (optional, for global config) -->
<script>
  HanzoCheckout.init('pk_live_xxx', {
    mode: 'production'
  })
</script>
```

## API Reference

### CheckoutOptions

| Option | Type | Description |
|--------|------|-------------|
| `apiKey` | `string` | Your Hanzo publishable API key (required) |
| `mode` | `'production' \| 'sandbox'` | Environment mode |
| `apiEndpoint` | `string` | Custom API endpoint |
| `locale` | `string` | Locale for i18n |
| `appearance` | `CheckoutAppearance` | Theme customization |
| `onSuccess` | `(result) => void` | Success callback |
| `onError` | `(error) => void` | Error callback |
| `onCancel` | `() => void` | Cancel callback |

### CheckoutAppearance

```typescript
{
  theme: 'light' | 'dark' | 'auto',
  primaryColor: '#0066FF',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  fontFamily: 'Inter, sans-serif',
  variables: {
    '--hanzo-spacing': '16px'
  }
}
```

### CreateSessionParams

| Param | Type | Description |
|-------|------|-------------|
| `lineItems` | `LineItem[]` | Products to purchase (required) |
| `customer` | `Customer` | Customer information |
| `successUrl` | `string` | Redirect URL on success |
| `cancelUrl` | `string` | Redirect URL on cancel |
| `currency` | `string` | Currency code (default: 'usd') |
| `shipping` | `boolean` | Enable shipping collection |
| `paymentMethods` | `string[]` | Allowed payment methods |
| `promoCode` | `string` | Pre-applied promo code |

## Styling

The checkout widget uses CSS custom properties for easy theming:

```css
.hanzo-checkout-form {
  --hanzo-primary: #0066FF;
  --hanzo-primary-hover: #0052CC;
  --hanzo-bg: #FFFFFF;
  --hanzo-bg-secondary: #F5F5F5;
  --hanzo-text: #1A1A1A;
  --hanzo-text-secondary: #666666;
  --hanzo-border: #E5E5E5;
  --hanzo-radius: 8px;
  --hanzo-font: 'Inter', -apple-system, sans-serif;
}
```

## Payment Methods

- Credit/Debit Cards (Visa, Mastercard, Amex, etc.)
- Apple Pay
- Google Pay
- Cryptocurrency (ETH, USDC, etc.)
- Bank Transfers

## License

BSD-3-Clause
