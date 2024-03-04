import firebaseApp from './firebase-app' 

import { 
  getFirestore, 
  collection, 
  setDoc, 
  doc, 
  serverTimestamp,
  type Firestore,
  type FieldValue, 
} from 'firebase/firestore'  

import type { ActualLineItemSnapshot } from '../actual-line-item'

let dbInstance: Firestore | undefined = undefined

const getDBInstance = (name: string): Firestore => {
  if (!dbInstance) {
    dbInstance = getFirestore(firebaseApp, name) 
  }
  return dbInstance  
} 
 
interface SavedOrder {
  email: string
  paymentMethod: string
  status: string
  timestamp: FieldValue
  items: ActualLineItemSnapshot[]
}

const createOrder = async (
  email: string,
  paymentMethod: string,
  items: ActualLineItemSnapshot[],
  options: {
    dbName: string
    ordersTable: string
  }
): Promise<{
  success: boolean,
  error: any,
  id?: string
}> => {  

  let error: any | null = null
  const ordersRef = collection(getDBInstance(options.dbName), options.ordersTable)
  const orderId = `${email}-${new Date().toISOString()}`

  try {
    await setDoc(doc(ordersRef, orderId), {
      email,
      paymentMethod,
      status: 'open',
      timestamp: serverTimestamp(),
      items,
    } satisfies SavedOrder)
    return { success: !error, error, id: orderId }
  }
  catch (e) {  
    console.error('Error writing item document: ', e)
    error = e  
  }  
  
  return { success: !error, error }  
}

const updateOrder = async (
  orderId: string,
  email: string,
  paymentMethod: string,
  items: ActualLineItemSnapshot[],
  options: {
    dbName: string
    ordersTable: string
  }
): Promise<{
  success: boolean,
  error: any
}> => {  

  let error: any | null = null
  const ordersRef = collection(getDBInstance(options.dbName), options.ordersTable)

  try {
    await setDoc(doc(ordersRef, orderId), {
      email,
      paymentMethod,
      status: 'open',
      timestamp: serverTimestamp(),
      items,
    } satisfies SavedOrder)
  } 
  catch (e) {  
      console.error('Error writing item document: ', e)
      error = e  
  }  
  
  return { success: !error, error }  
}

export { createOrder, updateOrder }