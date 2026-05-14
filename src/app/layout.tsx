import type { Metadata } from 'next';
import { Oswald, Lato } from 'next/font/google';
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
  title: 'SurfBooker',
  description: 'Marca sessões facilmente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`${oswald.variable} ${lato.variable}`}>
      <body>{children}</body>
    </html>
  );
}