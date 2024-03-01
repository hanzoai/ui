import type { LineItem } from "../types"  
import firebase_app from "./firebase-config"  
import { getFirestore, collection, addDoc, setDoc, doc } from "firebase/firestore"  
  
const db = getFirestore(firebase_app, 'lux-commerce')  
  
export default async function persistCart(cart: LineItem[], userEmail: string) {  
    let result = null  
    let error = null
    const ordersRef = collection(db, "orders");

    const cartAsObject = cart.reduce((acc, item) => {
        acc[item.sku] = {
            sku: item.sku,
            title: item.title,
            quantity: item.quantity,
            description: item.desc,
            img: item.img,
            price: item.price,
        }
        return acc
    }, {} as Record<string, {}>)
  
    try {  
        try {
            result = await setDoc(doc(ordersRef, `${userEmail}-${Date.now()}`), { order: cartAsObject })
        } catch (e) {  
            console.error('Error writing item document: ', e)
            error = e  
        }  
    } catch (e) {  
        console.error('Error writing order document: ', e)
        error = e  
    }  
  
    return { result, error }  
}