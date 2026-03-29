import { ImageResponse } from 'next/og';

export const contentType = 'image/png';
export const size = { width: 180, height: 180 };

export default function Icon() {
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
          width={120}
          height={120}
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
      width: 180,
      height: 180,
    }
  );
}
