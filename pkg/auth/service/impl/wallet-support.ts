/**
 * @deprecated Firebase-based wallet support has been removed.
 * Use @hanzo/auth-firebase for Firebase wallet integration, or
 * implement wallet association via your IAM provider.
 */

export async function associateWalletAddressWithAccount(
  _userEmail: string,
  _siteName?: string
): Promise<{ result: string | null, error: Error | null }> {
  console.warn('@hanzo/auth: Firebase wallet support removed. Use @hanzo/auth-firebase or Hanzo IAM.')
  return { result: null, error: new Error('Wallet association not configured') }
}

export async function getAssociatedWalletAddress(
  _userEmail: string
): Promise<{ error: Error | null, result?: string }> {
  return { error: new Error('Wallet association not configured'), result: undefined }
}
