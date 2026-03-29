import { ImageResponse } from 'next/og';

// We implement generateImageMetadata to serve both 192x192 and 512x512 from this single endpoint
export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: '192' },
    { contentType: 'image/png', size: { width: 512, height: 512 }, id: '512' },
  ];
}

export default function Icon({ id }: { id: string }) {
  const size = id === '192' ? 192 : 512;
  const padding = size * 0.15;
  const logoSize = size - (padding * 2);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0c',
        }}
      >
        <svg
          width={logoSize}
          height={logoSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="40" stroke="#0ea5e9" strokeWidth="8" />
          <path d="M50 20 L50 80" stroke="#a855f7" strokeWidth="6" strokeLinecap="round" />
          <path d="M20 50 L80 50" stroke="#a855f7" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="50" r="6" fill="#f43f5e" />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
