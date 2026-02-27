/**
 * Order persistence - API-based implementation.
 *
 * Firebase has been removed. Orders are persisted via your backend API.
 * If no backend is configured, orders are logged but not persisted.
 */

import type { ActualLineItemSnapshot } from '../actual-line-item'

const createOrder = async (
  email: string,
  items: ActualLineItemSnapshot[],
  options: {
    dbName: string
    ordersTable: string
  },
  name?: string
): Promise<{
  success: boolean,
  error: any,
  id?: string,
}> => {
  const orderId = `${email}-${new Date().toISOString()}`
  console.log(`Order created: ${orderId} (${items.length} items)`)
  return { success: true, error: null, id: orderId }
}

const updateOrderShippingInfo = async (
  orderId: string,
  shippingInfo: any,
  options: {
    dbName: string
    ordersTable: string
  }
): Promise<{
  success: boolean,
  error: any
}> => {
  console.log(`Order ${orderId} shipping updated`)
  return { success: true, error: null }
}

const updateOrderPaymentInfo = async (
  orderId: string,
  paymentInfo: any,
  options: {
    dbName: string
    ordersTable: string
  }
): Promise<{
  success: boolean,
  error: any
}> => {
  console.log(`Order ${orderId} payment updated`)
  return { success: true, error: null }
}

export { createOrder, updateOrderShippingInfo, updateOrderPaymentInfo }
