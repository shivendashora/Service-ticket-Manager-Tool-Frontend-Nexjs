import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import Providers from './providers';
import './globals.css';

// Font Awesome's CSS is imported above, so stop it injecting the same CSS at runtime
// (otherwise icons flash at full size before the styles arrive)
config.autoAddCss = false;

// Self-hosted by Next; globals.css reads these through --font and --mono
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'SupportDesk',
  description: 'SupportDesk — customer support ticket management',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
