// Removed "use server" for static export compatibility
// This functionality is disabled for static export
export async function editInV0({
  name,
  description,
  style,
  code,
}: {
  name: string
  description: string
  style: string
  code: string
}) {
  // Return a stub response for static export
  // The v0 button will be disabled in the UI
  return {
    error: "Edit in v0 is not available in static export mode",
    url: null,
    hasV0Config: false,
  }
}
