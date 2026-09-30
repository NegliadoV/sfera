import { NextResponse } from 'next/server';

/**
 * Mobile app configuration endpoint
 * Returns feature flags, API limits, and app-specific settings
 */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    minAppVersion: {
      ios: '1.0.0',
      android: '1.0.0',
    },
    api: {
      maxUploadSize: 10 * 1024 * 1024, // 10MB
      rateLimits: {
        content: { perMinute: 10, perDay: 100 },
        comments: { perMinute: 20, perDay: 500 },
        messages: { perMinute: 30, perDay: 1000 },
      },
      pagination: {
        defaultLimit: 20,
        maxLimit: 50,
      },
    },
    features: {
      push: {
        enabled: true,
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      },
      shorts: {
        enabled: true,
        maxDuration: 60, // seconds
        maxFileSize: 50 * 1024 * 1024, // 50MB
      },
      voiceRooms: {
        enabled: true,
        provider: 'livekit',
        maxParticipants: 50,
      },
      mindMaps: {
        enabled: true,
        maxNodes: 500,
      },
      digest: {
        enabled: true,
        deliveryOptions: ['none', 'in_app', 'email'],
      },
    },
    locales: {
      supported: ['en', 'ru', 'es', 'de', 'fr', 'pt', 'zh', 'ar', 'hi'],
      default: 'en',
    },
    theme: {
      colors: {
        primary: '#2563eb',
        accent: '#a855f7',
        background: '#090a0f',
        surface: '#0f1320',
      },
    },
  });
}
