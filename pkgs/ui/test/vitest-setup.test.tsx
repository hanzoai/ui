import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from './utils'

describe('Vitest Setup', () => {
  it('should render a simple component', async () => {
    const TestComponent = () => <div data-testid="greeting">Hello World</div>
    renderWithProviders(<TestComponent />)
    const element = await screen.findByTestId('greeting')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello World')
  })

  it('should pass basic assertions', () => {
    expect(true).toBe(true)
    expect(1 + 1).toBe(2)
  })
})
