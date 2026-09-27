import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'AURA Vantage — Healthcare Supply Chain Resilience Command',
  description:
    'National, state, and district decision-making command portal for health supply chain governance, ' +
    'AI-driven redistribution, early warnings, and crisis management.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
