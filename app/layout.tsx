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
            __html: `(function(){try{var t=localStorage.getItem('noosphere-theme');var a=null;try{var r=localStorage.getItem('noosphere-accent');if(r)a=JSON.parse(r);}catch(e){}var o=localStorage.getItem('noosphere-bg-opacity');var op=o?parseFloat(o):0.35;op=op>=0.1&&op<=1?op:0.35;var b=localStorage.getItem('noosphere-bg-blur');var blur=b?parseInt(b,10):48;blur=(blur===0||blur===12||blur===24||blur===32||blur===36||blur===48)?blur:48;document.documentElement.style.setProperty('--app-blur',blur===0?'0':blur+'px');document.documentElement.setAttribute('data-bg-blur',blur===0?'none':'blur');var ih=localStorage.getItem('noosphere-interface-tint');var hue=ih?parseInt(ih,10):0;hue=hue>=0&&hue<=360?hue:0;var m=t==='light'?'light':'dark';var ls=localStorage.getItem('noosphere-light-style');var lightStyle=ls==='bright'||ls==='muted'?ls:'soft';document.documentElement.setAttribute('data-theme',m);document.documentElement.setAttribute('data-light-style',lightStyle);document.documentElement.style.setProperty('--app-bg-opacity',String(op));document.documentElement.style.setProperty('--interface-hue',String(hue));document.documentElement.setAttribute('data-interface-tint',hue>0?'true':'false');if(a&&a.value&&a.hover){document.documentElement.style.setProperty('--accent-primary',a.value);document.documentElement.style.setProperty('--accent-primary-hover',a.hover);document.documentElement.style.setProperty('--accent-primary-muted',a.value+'99');if(a.secondary){document.documentElement.style.setProperty('--accent-secondary',a.secondary);}}}catch(e){}}());`,
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
          {/* Глобальное свечение (Blobs) для единообразия всего фона */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
             <div className="bg-blob blob-1"></div>
             <div className="bg-blob blob-2"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
          </div>
          <div
            className="app-container-glass studio-card"
            style={{
              maxWidth: '1440px',
              width: '100%',
              margin: '0 auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100dvh',
              maxHeight: '100dvh',
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
