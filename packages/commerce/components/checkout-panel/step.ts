interface CheckoutStep {
  label: string 
  element: JSX.Element
}

type CheckoutSteps = Record<number, CheckoutStep>

export {
  type CheckoutStep,
  type CheckoutSteps
}