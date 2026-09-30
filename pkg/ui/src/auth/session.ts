/**
 * Where the IAM session is kept, named once. The `@hanzo/iam` SDK owns these
 * keys (`hanzo_iam_`-prefixed) and publishes no plain-module reader, so this is
 * the one derivation every surface reads the bearer through.
 */

const PREFIX = 'hanzo_iam_'
const ACCESS = `${PREFIX}access_token`
const REFRESH = `${PREFIX}refresh_token`
const EXPIRES = `${PREFIX}expires_at`
const ID = `${PREFIX}id_token`

const read = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** The access token, or null. Storage that throws answers null. */
export const bearer = (): string | null => read(ACCESS)

/** The refresh token, or null. */
export const refresher = (): string | null => read(REFRESH)

/** The ID token, or null: the hint IAM's end-session route names the session by. */
export const identity = (): string | null => read(ID)

/** Whether the stored access token is present and not past the expiry the SDK wrote beside it. */
export function live(): boolean {
  const expires = read(EXPIRES)
  return Boolean(bearer()) && (!expires || Date.now() < Number(expires))
}
