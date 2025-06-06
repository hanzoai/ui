'use client'
import React, { useEffect, useState } from 'react'

// @ts-ignore
import { ApplePay, GooglePay, CreditCard, PaymentForm } from 'react-square-web-payments-sdk'

import { observer } from 'mobx-react-lite'

import {
  ApplyTypography,
  Button,
  Separator,
  Skeleton,
} from '@hanzo/ui/primitives'

import { cn } from '@hanzo/ui/util'

import { useCommerce } from '../../../../service/context'
import { processSquareCardPayment } from '../../../../util'
import type { PaymentMethodComponentProps } from '../../../../types'
import { sendFBEvent, sendGAEvent } from '../../../../util/analytics'

import ContactInfo from '../contact-form'
import PaymentMethods from '../card-icon-row'

const PayWithCard: React.FC<PaymentMethodComponentProps> = observer(({
  onDone,
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
      const res = await processSquareCardPayment(token.token, cmmc.promoAppliedCartTotal, verifiedBuyer.token)
      if (res) {
        await storePaymentInfo({paymentMethod: token.details.method ?? null, processed: res})
        setTransactionStatus('confirmed')
        sendGAEvent('purchase', {
          transaction_id: res.payment?.id,
          value: res.payment?.amountMoney?.amount,
          currency: res.payment?.amountMoney?.currency,
          items: cmmc.cartItems.map((item) => ({
            item_id: item.sku,
            item_name: item.title,
            item_category: item.familyId,
            price: item.price,
            quantity: item.quantity
          })),
        })
        sendFBEvent('Purchase', {
          content_ids: cmmc.cartItems.map((item) => item.sku),
          contents: cmmc.cartItems.map(item => ({
            id: item.sku,
            quantity: item.quantity
          })),
          num_items: cmmc.cartItems.length,
          value: cmmc.promoAppliedCartTotal,
          currency: 'USD',
        })
      } else {
        setTransactionStatus('error')
      }
    })()
  }

  const createVerificationDetails = (): { amount: string; billingContact: { givenName: string; email: string }; currencyCode: string; intent: 'CHARGE' | 'CHARGE_AND_STORE' } => {
    const {name, email} = contactForm.getValues()
    return {
      amount: cmmc.promoAppliedCartTotal.toFixed(2),
      billingContact: {
        givenName: name,
        email,
      },
      currencyCode: 'USD',
      intent: 'CHARGE' as 'CHARGE',
    }
  }

  const createPaymentRequest = () => ({
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
      amount: cmmc.promoAppliedCartTotal.toFixed(2),
      label: "Total",
    },
  })

  /**
   * Reload payment form after checkout value changes (promo code applied, etc.)
   * Reloading is required so that Apple Pay and Google Pay buttons are updated for new cart total.
   */
  const [loadingPaymentForm, setLoadingPaymentForm] = useState<boolean>(false)
  useEffect(() => {
    setLoadingPaymentForm(true)
    const timeout = setTimeout(() => setLoadingPaymentForm(false), 1000)
    return () => clearTimeout(timeout)
  }, [cmmc.promoAppliedCartTotal])

  if (loadingPaymentForm) {
    return (
      <div className='flex flex-col gap-2'>
        <Skeleton className='w-full h-10' />
        <Skeleton className='w-full h-10' />
      </div>
    )
  }

  return (
    <PaymentForm
      /**
       * Identifies the calling form with a verified application ID generated from
       * the Square Application Dashboard.
       */
      applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? ''}
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
      locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? ''}
    >
      <ApplyTypography className='flex flex-col mt-6 gap-1'>
        {transactionStatus === 'paid' ? (
          <h6 className='mx-auto'>Processing your payment...</h6>
        ) : transactionStatus === 'confirmed' ? (
          <div className='flex flex-col gap-4'>
            <h5 className='mx-auto'>Payment confirmed!</h5>
            <p className='mx-auto'>Thank you for your purchase.</p>
            <Button onClick={onDone}>Continue</Button>
          </div>
        ) : (
          <div className='flex flex-col gap-1'>
            <GooglePay/>
            <ApplePay/>

            <div className='flex gap-2 whitespace-nowrap items-center my-1 sm:my-3 text-xs text-muted'>
              <Separator className='grow w-auto'/><div className='shrink-0 mx-1'>or</div><Separator className='grow w-auto'/>
            </div>

            <PaymentMethods />

            <ContactInfo form={contactForm}/>
            {/* Imitates hanzo/ui Button and Input styles, I was unable to render the
              hanzo/ui button outright and keeping the submit form functionality*/}
            <CreditCard
              style={{
                '.input-container': {
                  borderColor: '#666666',
                  borderRadius: '8px',
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
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontFamily: 'helvetica neue, sans-serif',
                },
                'input::placeholder': {
                  color: '#999999',
                },
                'input.is-error': {
                  color: '#ff1600',
                },
              }}
              render={(Button: any) => (
                <Button className={cn(
                  'items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
                  '!bg-primary !text-primary-fg hover:!bg-primary-hover font-nav whitespace-nowrap not-typography h-10 py-2 px-4',
                  '!text-sm rounded-md lg:min-w-[220px] sm:min-w-[220px] flex'
                )}>
                  Pay
                </Button>
              )}
            />
            {transactionStatus === 'error' && (
              <p className='mx-auto text-destructive'>There was an error processing your payment.</p>
            )}
          </div>
        )}
      </ApplyTypography>
    </PaymentForm>
  )
})

export default PayWithCard
