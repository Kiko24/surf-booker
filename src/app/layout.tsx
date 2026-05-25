import type { Metadata, Viewport } from 'next';
import { Oswald, Lato } from 'next/font/google';
import { headers } from 'next/headers';
import './global.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Alaia',
  description: 'Marca sessões facilmente.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1E1E1E',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("next-url") ?? "";
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <html lang="pt-PT" className={`${oswald.variable} ${lato.variable}${isDashboard ? " dashboard-scale" : ""}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}