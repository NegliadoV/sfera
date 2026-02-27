# SFERA iOS App

Native iOS app for SFERA platform. Uses the same backend API as the web app.

## Requirements

- Xcode 15+
- iOS 17+
- Mac (Xcode runs only on macOS)

## Setup

1. **Create a new iOS App project in Xcode**
   - File → New → Project → iOS App
   - Product Name: SFERA
   - Interface: SwiftUI
   - Language: Swift
   - Minimum Deployments: iOS 17

2. **Add source files**
   - Delete the default ContentView and SFERAApp files
   - Add the entire `SFERA/SFERA` folder to the project (drag into Xcode, ensure "Copy items if needed" is unchecked if files are in place)

3. **Configure API URL**
   - Edit `Config/Config.swift` — Debug uses localhost; for device testing, set `apiBaseURL` to your machine IP
   - Add `API_BASE_URL` and `WS_URL` to Info.plist for production builds

4. **Run backend**
   - From the Horizon_project root: `npm run dev`
   - For device testing, use your machine's IP instead of localhost in Config.swift

## Backend

The backend exposes:

- `POST /api/auth/mobile/login` — returns `{ token, user }` for JWT auth
- `POST /api/auth/register` — registration
- `GET /api/universes` — list universes
- `GET /api/content?universeId=...` — list content
- `GET /api/me/*` — requires `Authorization: Bearer <token>`

## Project structure

```
SFERA/
├── SFERA/
│   ├── App/           — SFERAApp, ContentView
│   ├── Core/          — Design, Network, Auth
│   ├── Config/        — API URLs
│   ├── Models/        — Data models
│   ├── Features/      — Auth, Universes, Content, Messages, Rooms, MindMaps, etc.
│   └── Shared/        — Shared components
└── README.md
```
