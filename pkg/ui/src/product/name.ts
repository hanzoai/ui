/**
 * The name to show for a person.
 *
 * Pure, so `@hanzo/ui/product/pure` can export it and an app can check what its
 * account menu will render without mounting one.
 */

/** The given name, else the email's local part, else nothing fabricated —
 *  "User" is not a name and reads as a bug to the person it names. */
export function displayName(name?: string, email?: string): string {
  if (name?.trim()) return name.trim()
  const local = email?.split('@')[0]
  return local?.trim() || ''
}
