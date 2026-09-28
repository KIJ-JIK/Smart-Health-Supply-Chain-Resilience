import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'AURA Vantage — Healthcare Supply Chain Resilience Command',
  description:
    'National, state, and district decision-making command portal for health supply chain governance, ' +
    'AI-driven redistribution, early warnings, and crisis management.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Priority hints for backend API and tile services */}
        <link
          rel="preconnect"
          href="https://smart-health-supply-chain-resilience-production.up.railway.app"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://smart-health-supply-chain-resilience-production.up.railway.app"
        />
        <link
          rel="preconnect"
          href="https://tile.openstreetmap.org"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://tile.openstreetmap.org"
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('governance-theme');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed && parsed.state && parsed.state.isDark) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
