import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roominate — Платформа для глубоких дискуссий',
    short_name: 'Roominate',
    description: 'Создавай сферы по интересам, обсуждай идеи, смотри шортсы и участвуй в живых комнатах',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#090a0f',
    theme_color: '#000000',
    categories: ['social', 'education', 'lifestyle'],
    lang: 'ru',
    dir: 'ltr',
    icons: [
      {
        src: '/roominate-icon-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/roominate-icon-1024.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/roominate-icon-1024.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    // iOS-specific
    // @ts-ignore — Next.js types don't include all PWA fields yet
    prefer_related_applications: false,
    // @ts-ignore
    shortcuts: [
      {
        name: 'Explore',
        short_name: 'Explore',
        description: 'Исследуй новые сферы',
        url: '/explore',
        icons: [{ src: '/logo.svg', sizes: '96x96' }],
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        description: 'Личные сообщения',
        url: '/messages',
        icons: [{ src: '/logo.svg', sizes: '96x96' }],
      },
      {
        name: 'Rooms',
        short_name: 'Rooms',
        description: 'Голосовые комнаты',
        url: '/rooms',
        icons: [{ src: '/logo.svg', sizes: '96x96' }],
      },
    ],
  }
}
