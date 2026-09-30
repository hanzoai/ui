'use client'

import { useState } from 'react'
import { Checkbox } from '../backends/gui/checkbox'
import { FieldError } from '../backends/gui/field'
import { Button } from '../backends/gui/button'
import { Anchor, Paragraph, SizableText, XStack } from '../backends/gui/layout'
import { Page, Panel } from './frame'
import { Primary } from './screens'

/**
 * "Let's create your account": the one page a new account sees between proving
 * its address and having an account. One unticked box, one button that stays
 * disabled until the box is ticked, and the address it was proven for with a way
 * to use another. Nothing is created before `onCreate` runs; the host records the
 * acceptance (policy versions, time, method) on the IAM user.
 */
export interface CreateAccountProps {
  site?: string
  /** The address that was verified. */
  email: string
  busy?: boolean
  wrong?: string | null
  termsPath?: string
  aupPath?: string
  onCreate: () => void
  /** Go back and start over with another address. */
  onOther: () => void
}

export function CreateAccount({ site = 'Hanzo', email, busy, wrong, termsPath = '/terms', aupPath = '/aup', onCreate, onOther }: CreateAccountProps) {
  const [agree, setAgree] = useState(false)
  return (
    <Page
      site={site}
      title="Let’s create your account"
      lede="A few things for you to review"
      center
      width={360}
      foot={
        <>
          <SizableText size="$1" color="$quiet" text="center">
            {`Email verified as ${email}`}
          </SizableText>
          <Button type="button" variant="link" size="sm" px={0} minH={0} disabled={busy} onClick={onOther}>
            Use a different email
          </Button>
        </>
      }
    >
      <Panel label="Terms">
        <XStack gap="$3" items="flex-start">
          <Checkbox id="hanzo-terms" checked={agree} onCheckedChange={(v: boolean | 'indeterminate') => setAgree(v === true)} mt="$1" aria-label="I agree to the Terms of Service and Acceptable Use Policy and confirm that I am at least 18 years of age" />
          <Paragraph render="label" htmlFor="hanzo-terms" size="$2" color="$ink" flex={1} m={0}>
            {`I agree to ${site}’s `}
            <Anchor href={termsPath} color="$ink" textDecorationLine="underline">
              Terms of Service
            </Anchor>
            {' and '}
            <Anchor href={aupPath} color="$ink" textDecorationLine="underline">
              Acceptable Use Policy
            </Anchor>
            {' and confirm that I am at least 18 years of age.'}
          </Paragraph>
        </XStack>
        {wrong ? <FieldError>{wrong}</FieldError> : null}
        <Primary disabled={!agree || busy} onClick={onCreate}>
          {busy ? 'One moment…' : 'Create account'}
        </Primary>
      </Panel>
    </Page>
  )
}
