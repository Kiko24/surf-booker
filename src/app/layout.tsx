import './global.css'

export const metadata = {
  title: 'Surf Booker',
  description: 'Plataforma de marcações para escolas de surf',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
}