import type { Metadata, Viewport } from 'next';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" suppressHydrationWarning className={`${oswald.variable} ${lato.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var html = document.documentElement;
  var path = window.location.pathname;
  if (path.indexOf("/dashboard") === 0) {
    html.classList.add("dashboard-scale");
    var t = localStorage.getItem("theme");
    if (t === "light") html.classList.add("light");
  } else {
    html.classList.add("light");
  }
})();
            `.trim()
          }}
        />
        {children}
      </body>
    </html>
  );
}