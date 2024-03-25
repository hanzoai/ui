'use client'
import React from 'react'

import type { UseFormReturn } from 'react-hook-form'
// @ts-ignore
import { ApplePay, GooglePay, CreditCard, PaymentForm } from 'react-square-web-payments-sdk'

import { ChevronRight } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ApplyTypography, 
  Button, 
  buttonVariants
} from '@hanzo/ui/primitives'

import { cn } from '@hanzo/ui/util'

import { processSquareCardPayment } from '../../../../util'
import { useCommerce } from '../../../../service/context'
import type { TransactionStatus } from '../../../../types'

import ContactInfo from './contact-info'
import { sendFBEvent, sendGAEvent } from '../../../../util/analytics'
import PaymentMethods from './cards'

const PayWithCard: React.FC<{
  onDone: () => void
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
      const res = await processSquareCardPayment(token.token, cmmc.cartTotal, verifiedBuyer.token)
      if (res) {
        console.log(token)
        await storePaymentInfo({paymentMethod: token.details.method ?? null, processed: res})
        setTransactionStatus('confirmed')
        sendGAEvent('purchase', {
          transaction_id: res.payment?.id,
          value: res.payment?.amountMoney?.amount,
          currency: res.payment?.amountMoney?.currency,
          items: cmmc.cartItems.map((item) => ({
            item_id: item.sku,
            item_name: item.title,
            item_category: item.categoryId,
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
          value: cmmc.cartTotal,
          currency: 'USD',
        })
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
      <ApplyTypography className='flex flex-col mt-6 gap-1'>
        {transactionStatus === 'paid' ? (
          <h6 className='mx-auto font-nav'>Processing your payment...</h6>
        ) : transactionStatus === 'confirmed' ? (
          <div className='flex flex-col gap-4'>
            <h5 className='mx-auto font-nav'>Payment confirmed!</h5>
            <p className='mx-auto'>Thank you for your purchase.</p>
            <Button onClick={onDone}>Continue</Button>
          </div>
        ) : (
          <>
            <GooglePay/>
            <ApplePay/>
            
            <div className='flex gap-2 whitespace-nowrap items-center my-0.5 sm:my-1 text-xs text-muted'>
              <hr className='grow border'/><div className='shrink-0 mx-1'>or</div><hr className='grow border'/>
            </div>

            <Accordion type="single" collapsible className={''}>
              <AccordionItem value="cart" className='w-full border-b-0 data-[state=open]:border data-[state=open]:px-3 rounded '>
                <AccordionTrigger className={cn(
                  buttonVariants({variant: 'outline', size: 'lg'}),
                  '!no-underline group flex justify-between ',
                  'bg-transparent hover:bg-transparent border-muted-2 hover:border-muted-2',
                  'data-[state=open]:border-none data-[state=open]:py-0 px-4 data-[state=open]:px-1'
                )}>
                  <div className='font-sans text-base mr-2 text-muted'>CC</div>
                  <PaymentMethods />
                  <div>
                    <ChevronRight className="h-5 w-5 -mr-2 text-muted shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90 hidden group-data-[state=open]:block" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className='data-[state=open]:mb-4 data-[state=open]:mt-1'>
                  <ContactInfo form={contactForm}/>
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </>
        )}
      </ApplyTypography>
    </PaymentForm>
  )
}

export default PayWithCard