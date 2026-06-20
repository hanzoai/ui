// Payment processing - requires API endpoint
// For static builds, this will call an external payment API

// https://developer.squareup.com/blog/online-payments-with-square-and-react/
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function() { return this.toString(); }

const processPayment = async (sourceId: string, amount: number, verificationToken: string) => {
  // For static builds, payments should be processed via an API endpoint
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side: call the payment API
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId,
          amount,
          verificationToken
        })
      })

      if (!response.ok) {
        console.error('Payment API error:', response.statusText)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error processing payment:', error)
      return null
    }
  }

  // Server-side (for SSR builds only, not static export)
  console.warn('Server-side payment processing not available in static export')
  return null
}

export {
  processPayment as default
}
