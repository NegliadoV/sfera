import { NextResponse } from 'next/server';

/**
 * Health check endpoint for mobile apps
 * Used by iOS/Android to verify API availability
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    api: {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://roominate.rest',
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://roominate.rest:3002',
      livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://livekit.roominate.rest',
    },
    features: {
      auth: ['google', 'github', 'facebook', 'credentials'],
      realtime: true,
      voiceRooms: true,
      push: true,
      shorts: true,
      mindMaps: true,
      digest: true,
    },
  });
}
