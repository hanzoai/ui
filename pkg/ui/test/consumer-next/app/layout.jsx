export const metadata = {
  title: '@hanzo/ui Next static export consumer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
