'use client'
import React from 'react'

import type { UseFormReturn } from 'react-hook-form'
// @ts-ignore
import { ApplePay, GooglePay, CreditCard, PaymentForm } from 'react-square-web-payments-sdk'

import { ApplyTypography, Button } from '@hanzo/ui/primitives'

import { processSquareCardPayment } from '../../../util'
import { useCommerce } from '../../../service/context'
import type { TransactionStatus } from '../../../types'

import PaymentMethods from './payment-methods'
import ContactInfo from './contact-info'

const PayWithCard: React.FC<{
  setStep: (currentStep: number) => void
  transactionStatus: TransactionStatus
  setTransactionStatus: (status: TransactionStatus) => void
  storePaymentInfo: (paymentInfo: any) => Promise<void>
  contactForm: UseFormReturn<{
    name: string
    email: string
  }, any, {
    name: string
    email: string
  }>
}> = ({
  setStep,
  transactionStatus,
  setTransactionStatus,
  storePaymentInfo,
  contactForm,
}) => {
  const cmmc = useCommerce()

  const cardTokenizeResponseReceived = async (
    token: any,
    verifiedBuyer: any
  ) => {
    contactForm.handleSubmit(async () => {
      setTransactionStatus('paid')
      const res = await processSquareCardPayment(token.token, cmmc.cartTotal, verifiedBuyer.token)
      if (res) {
        console.log(token)
        await storePaymentInfo({paymentMethod: token.details.method ?? null, processed: res})
        setTransactionStatus('confirmed')
      } else {
        setTransactionStatus('error')
      }  
    })() 
  }

  const createVerificationDetails = () => {
    const {name, email} = contactForm.getValues()
    return {
      amount: cmmc.cartTotal.toFixed(2),
      billingContact: {
        givenName: name,
        email,
      },
      currencyCode: 'USD',
      intent: 'CHARGE',
    }
  }

  const createPaymentRequest= () => ({
    countryCode: "US",
    currencyCode: "USD",
    lineItems: cmmc.cartItems.map(item => ({
      amount: item.price.toFixed(2),
      label: item.title,
      id: item.sku,
    })),
    requestBillingContact: false,
    requestShippingContact: false,
    total: {
      amount: cmmc.cartTotal.toFixed(2),
      label: "Total",
    },
  })

  return (
    <PaymentForm
      /**
       * Identifies the calling form with a verified application ID generated from
       * the Square Application Dashboard.
       */
      applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID}
      /**
       * Invoked when payment form receives the result of a tokenize generation
       * request. The result will be a valid credit card or wallet token, or an error.
       */
      cardTokenizeResponseReceived={cardTokenizeResponseReceived}
      /**
        * This function enable the Strong Customer Authentication (SCA) flow
        *
        * We strongly recommend use this function to verify the buyer and reduce
        * the chance of fraudulent transactions.
        */
      createVerificationDetails={createVerificationDetails}
      /**
        * This function is required for digital wallets (Apple Pay, Google Pay)
        */
      createPaymentRequest={createPaymentRequest}
      /**
       * Identifies the location of the merchant that is taking the payment.
       * Obtained from the Square Application Dashboard - Locations tab.
       */
      locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID}
    >
      <ApplyTypography className='flex flex-col gap-2 mt-6'>
        {transactionStatus === 'paid' ? (
          <h6 className='mx-auto font-nav'>Processing your payment...</h6>
        ) : transactionStatus === 'confirmed' ? (
          <div className='flex flex-col gap-4'>
            <h5 className='mx-auto font-nav'>Payment confirmed!</h5>
            <p className='mx-auto'>Thank you for your purchase.</p>
            <Button onClick={() => setStep(2)}>Continue</Button>
          </div>
        ) : (
          <>
            <GooglePay/>
            <ApplePay/>
            
            <div className='flex gap-2 whitespace-nowrap items-center my-6 sm:my-10 text-sm text-foreground/60'>
              <hr className='bg-foreground/60 w-full border'/> or pay with card <hr className='bg-foreground/60 w-full border'/>
            </div>

            <ContactInfo form={contactForm}/>
            
            <PaymentMethods/>

            {/* Imitates hanzo/ui Button and Input styles, I was unable to render the
              hanzo/ui button outright and keeping the submit form functionality*/}
            <CreditCard
              style={{
                '.input-container': {
                  borderColor: '#404040',
                  borderRadius: '6px',
                },
                '.input-container.is-focus': {
                  borderColor: '#ffffff',
                },
                '.input-container.is-error': {
                  borderColor: '#ff1600',
                },
                '.message-text': {
                  color: '#999999',
                },
                '.message-icon': {
                  color: '#999999',
                },
                '.message-text.is-error': {
                  color: '#ff1600',
                },
                '.message-icon.is-error': {
                  color: '#ff1600',
                },
                input: {
                  backgroundColor: '#1f1f1f',
                  color: '#FFFFFF',
                },
                'input::placeholder': {
                  color: '#999999',
                },
                'input.is-error': {
                  color: '#ff1600',
                },
              }}
              buttonProps={{
                className: 'font-nav h-10',
                css: {
                  backgroundColor: '#fff',
                  color: '#000',
                  padding: 0,
                  '&:hover': {
                    backgroundColor: '#ffffffd9',
                  },
                },
              }}
            />
            {transactionStatus === 'error' && (
              <p className='mx-auto text-destructive'>There was an error processing your payment.</p>
            )}
          </>
        )}
      </ApplyTypography>
    </PaymentForm>
  )
}

export default PayWithCard