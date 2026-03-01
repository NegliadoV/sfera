import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#1a1b1d" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

/* Тема через data-theme на html (выставляется из AppThemeContext) */
const responsiveBackground = `
/* Тёмная тема (по умолчанию до загрузки) */
html, body, #root {
  background: #1a1b1d;
  background-image: linear-gradient(160deg, #1a1b1d 0%, #25262a 50%, #1a1b1d 100%);
  color: #e4e6e9;
}
html[data-theme="dark"],
html[data-theme="dark"] body,
html[data-theme="dark"] #root {
  background: #1a1b1d !important;
  background-image: linear-gradient(160deg, #1a1b1d 0%, #25262a 50%, #1a1b1d 100%) !important;
  color: #e4e6e9;
}
html[data-theme="dark"] * {
  scrollbar-width: thin;
  scrollbar-color: #2a2c30 #1a1b1d;
}
html[data-theme="dark"] *::-webkit-scrollbar { width: 8px; height: 8px; }
html[data-theme="dark"] *::-webkit-scrollbar-track { background: #1a1b1d; }
html[data-theme="dark"] *::-webkit-scrollbar-thumb { background: #2a2c30; border-radius: 4px; }
html[data-theme="dark"] *::-webkit-scrollbar-thumb:hover { background: #3a3c42; }

/* Светлая тема */
html[data-theme="light"],
html[data-theme="light"] body,
html[data-theme="light"] #root {
  background: #f2f3f5 !important;
  background-image: none !important;
  color: #1c1e21;
}
html[data-theme="light"] * {
  scrollbar-width: thin;
  scrollbar-color: #bcc0c4 #e4e6eb;
}
html[data-theme="light"] *::-webkit-scrollbar { width: 8px; height: 8px; }
html[data-theme="light"] *::-webkit-scrollbar-track { background: #e4e6eb; }
html[data-theme="light"] *::-webkit-scrollbar-thumb { background: #bcc0c4; border-radius: 4px; }
html[data-theme="light"] *::-webkit-scrollbar-thumb:hover { background: #8a8d91; }
`;
