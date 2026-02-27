import type { Metadata, Viewport } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import { auth } from '@/auth';
import { AppLayout } from '@/components/AppLayout';
import { HygieneProvider } from '@/components/HygieneProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

const sora = Sora({ subsets: ['latin', 'latin-ext'], variable: '--font-brand' });

export const metadata: Metadata = {
  title: 'SFERA | Платформа для глубокого познания',
  description:
    'Инструмент для мышления и осмысленного диалога. Тематические вселенные, структурированные дискуссии, совместное познание.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
}>) {
  if (params) await params;
  let session = null;
  try {
    session = await auth();
  } catch {
    // invalid/old JWT cookie
  }

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('noosphere-theme');var a=null;try{var r=localStorage.getItem('noosphere-accent');if(r)a=JSON.parse(r);}catch(e){}var o=localStorage.getItem('noosphere-bg-opacity');var op=o?parseFloat(o):0.95;op=op>=0.5&&op<=1?op:0.95;var b=localStorage.getItem('noosphere-bg-blur');var blur=b?parseInt(b,10):24;blur=(blur===0||blur===12||blur===24||blur===36)?blur:24;document.documentElement.style.setProperty('--app-blur',blur===0?'0':blur+'px');document.documentElement.setAttribute('data-bg-blur',blur===0?'none':'blur');var ih=localStorage.getItem('noosphere-interface-tint');var hue=ih?parseInt(ih,10):0;hue=hue>=0&&hue<=360?hue:0;var m=t==='light'?'light':'dark';var ls=localStorage.getItem('noosphere-light-style');var lightStyle=ls==='bright'||ls==='muted'?ls:'soft';document.documentElement.setAttribute('data-theme',m);document.documentElement.setAttribute('data-light-style',lightStyle);document.documentElement.style.setProperty('--app-bg-opacity',String(op));document.documentElement.style.setProperty('--interface-hue',String(hue));document.documentElement.setAttribute('data-interface-tint',hue>0?'true':'false');if(a&&a.value&&a.hover){document.documentElement.style.setProperty('--accent-primary',a.value);document.documentElement.style.setProperty('--accent-primary-hover',a.hover);document.documentElement.style.setProperty('--accent-primary-muted',a.value+'99');}}catch(e){}}());`,
          }}
        />
      </head>
      <body
        className={`${sora.variable} antialiased min-h-screen`}
        style={{ fontFamily: 'var(--font-inter)' }}
        suppressHydrationWarning
      >
        <HygieneProvider session={session}>
          <SessionProvider>
          <ThemeProvider>
          <div
            className="app-container-glass studio-card"
            style={{
              maxWidth: '1440px',
              width: '100%',
              margin: '0 auto',
              marginTop: '12px',
              marginBottom: '24px',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 'calc(100dvh - 48px)',
            }}
          >
            <AppLayout session={session}>{children}</AppLayout>
          </div>
          </ThemeProvider>
          </SessionProvider>
        </HygieneProvider>
      </body>
    </html>
  );
}
