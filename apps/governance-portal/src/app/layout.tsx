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
    <html lang="en" translate="no" suppressHydrationWarning>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
                try {
                  var langStored = localStorage.getItem('governance-language');
                  if (langStored) {
                    var langParsed = JSON.parse(langStored);
                    var lang = langParsed && langParsed.state && langParsed.state.language;
                    if (lang) {
                      document.documentElement.setAttribute('lang', lang);
                      document.documentElement.setAttribute('data-lang', lang);
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
