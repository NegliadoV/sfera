# Mobile App Development TODO List

**Project:** Horizon Mobile App
**Last Updated:** 2026-09-30

This TODO list is organized by priority and feature area based on the compatibility analysis between the mobile app and backend API.

---

## 🔴 High Priority (Critical for User Experience)

### Authentication & Security
- [ ] **Implement Password Reset Flow**
  - [ ] Add "Forgot Password" link on login screen
  - [ ] Create password reset request screen (email input)
  - [ ] Create password reset confirmation screen (code + new password)
  - [ ] Integrate with `POST /auth/forgot-password` and `POST /auth/reset-password`
  - [ ] Add success/error handling with proper user feedback

- [ ] **Add Session Management**
  - [ ] Create "Active Sessions" settings screen
  - [ ] Display list of active sessions with device info and last active time
  - [ ] Implement session revocation with `POST /auth/revoke-sessions`
  - [ ] Add "Log out all other devices" button

### Content & Engagement
- [ ] **Implement Content Reactions (Resonances)**
  - [ ] Add reaction buttons to feed cards (like, love, insightful, etc.)
  - [ ] Display reaction counts on content items
  - [ ] Show user's own reaction state
  - [ ] Integrate with `GET /content/:contentId/resonances`
  - [ ] Add reaction picker modal with emoji options
  - [ ] Show list of users who reacted (on tap)

- [ ] **Add Content View Tracking**
  - [ ] Track content views when user opens full content
  - [ ] Call `POST /content/:contentId/view` endpoint
  - [ ] Implement debouncing to avoid duplicate view tracking
  - [ ] Track view duration for analytics

- [ ] **Implement Save Content Feature**
  - [ ] Add "Save for Later" bookmark icon to content cards
  - [ ] Create "Saved Content" screen accessible from profile/menu
  - [ ] Integrate with `POST /content/:contentId/save`
  - [ ] Add unsave functionality
  - [ ] Show saved indicator on already-saved content

### Messaging
- [ ] **Add Message Editing**
  - [ ] Add long-press menu on sent messages
  - [ ] Show "Edit" option for own messages
  - [ ] Create inline edit UI with text input
  - [ ] Integrate with `PATCH /me/conversations/:userId/messages/:messageId`
  - [ ] Integrate with `PATCH /me/group-chats/:groupId/messages/:messageId`
  - [ ] Show "edited" indicator on edited messages

- [ ] **Add Message Deletion/Hiding**
  - [ ] Add "Delete" option in long-press menu
  - [ ] Show confirmation dialog before deletion
  - [ ] Integrate with `DELETE /me/conversations/:userId/messages/:messageId/hide`
  - [ ] Integrate with `DELETE /me/group-chats/:groupId/messages/:messageId/hide`
  - [ ] Show "Message deleted" placeholder for hidden messages

### Social Features
- [ ] **Add Block User Functionality**
  - [ ] Add "Block User" option in user profile menu
  - [ ] Show confirmation dialog with explanation
  - [ ] Integrate with backend block endpoint (verify POST `/me/blocks/:userId`)
  - [ ] Update UI to reflect blocked status
  - [ ] Hide blocked user's content from feed

---

## 🟡 Medium Priority (Enhanced Features)

### Content Management
- [ ] **Show Related Content/Links**
  - [ ] Integrate `GET /content/:contentId/links` endpoint
  - [ ] Display related articles/content at bottom of content detail
  - [ ] Add "Related" section with horizontal scroll
  - [ ] Allow navigation to related content

- [ ] **Add Content Sharing Between Universes**
  - [ ] Add "Share to Universe" button in content options menu
  - [ ] Create universe picker modal
  - [ ] Integrate with `POST /me/content/share`
  - [ ] Show success toast after sharing

### Universe Features
- [ ] **Add Universe Mind Maps**
  - [ ] Create mind map listing screen for universe
  - [ ] Integrate with `GET /universes/:slug/mind-maps`
  - [ ] Open mind maps in webview or native viewer
  - [ ] Allow creating mind maps in universe context

- [ ] **Show Universe Content Sources**
  - [ ] Create "Sources" tab in universe detail screen
  - [ ] Integrate with `GET /universes/:slug/sources`
  - [ ] Display source list (RSS feeds, etc.)
  - [ ] Show content attribution by source

- [ ] **Add Universe Themes**
  - [ ] Integrate with `GET /universes/:slug/themes`
  - [ ] Apply custom colors/styling per universe
  - [ ] Allow universe admins to customize themes from mobile

- [ ] **Universe-Specific Rooms**
  - [ ] Show universe rooms in universe detail screen
  - [ ] Integrate with `GET /universes/:slug/rooms`
  - [ ] Allow creating rooms within universe context
  - [ ] Filter global rooms list by universe

### Personal Mind Maps
- [ ] **Add Mind Map Management**
  - [ ] Create "My Mind Maps" screen
  - [ ] Integrate with `GET /me/mind-maps`
  - [ ] Show list of personal mind maps with previews
  - [ ] Add delete functionality with `DELETE /me/mind-maps/:id`
  - [ ] Implement mind map sharing options

- [ ] **Enhance Mind Map Creation**
  - [ ] Add manual mind map creation (not just from content)
  - [ ] Improve node/edge editing interface
  - [ ] Add collaborative mind mapping features
  - [ ] Implement offline editing with sync

### Notifications & Real-time
- [ ] **Implement Push Notifications**
  - [ ] Set up Expo Notifications properly
  - [ ] Request push permission on first launch
  - [ ] Subscribe to push with `POST /push/subscribe`
  - [ ] Handle notification taps and deep linking
  - [ ] Add notification categories (messages, comments, reactions)

- [ ] **Add Notification Preferences**
  - [ ] Create notification settings screen
  - [ ] Allow toggling notifications by type
  - [ ] Add quiet hours settings
  - [ ] Add notification sound/vibration settings

- [ ] **Implement Real-time Updates**
  - [ ] Integrate WebSocket for live messaging
  - [ ] Use `GET /me/ws-token` for authentication
  - [ ] Add typing indicators in conversations
  - [ ] Show online/offline status for contacts
  - [ ] Add live content updates in feed

### User Profile & Settings
- [ ] **Add Account Management**
  - [ ] Implement email change functionality
  - [ ] Implement password change from mobile
  - [ ] Add account deletion feature with confirmation
  - [ ] Add data export option (GDPR compliance)

- [ ] **Add Two-Factor Authentication**
  - [ ] Create 2FA setup screen
  - [ ] Integrate with backend 2FA endpoints (if available)
  - [ ] Support authenticator apps (TOTP)
  - [ ] Add backup codes generation

### Shorts Enhancements
- [ ] **Add Shorts Interactions**
  - [ ] Implement like/unlike for shorts
  - [ ] Add comments section for shorts
  - [ ] Implement share functionality (native share sheet)
  - [ ] Add view count display

- [ ] **Improve Shorts Creation**
  - [ ] Add video trimming before upload
  - [ ] Add video filters/effects
  - [ ] Add music/audio overlay
  - [ ] Implement video compression before upload

---

## 🟢 Low Priority (Nice to Have)

### Content Sources
- [ ] **Add Content Source Management**
  - [ ] Create "My Sources" screen
  - [ ] Integrate with `GET /me/sources`
  - [ ] Allow adding RSS feeds with `POST /me/sources`
  - [ ] Allow removing sources with `DELETE /me/sources/:id`
  - [ ] Show content attribution by source in feed

- [ ] **Add Manual Content Aggregation**
  - [ ] Trigger content aggregation from mobile
  - [ ] Integrate with `POST /me/sources/aggregate`
  - [ ] Show aggregation progress/status

### Search Enhancements
- [ ] **Improve Search Experience**
  - [ ] Add search result filtering (content type, date range)
  - [ ] Implement search history with local storage
  - [ ] Add search suggestions/autocomplete
  - [ ] Show recent searches
  - [ ] Add advanced search filters

### Analytics & Tracking
- [ ] **Add Onboarding Tracking**
  - [ ] Track onboarding step completion
  - [ ] Integrate with `POST /me/onboarding-track`
  - [ ] Add analytics events for user actions

- [ ] **Add Usage Analytics**
  - [ ] Track feature usage (anonymized)
  - [ ] Track app performance metrics
  - [ ] Send analytics to backend or analytics service

### Performance Optimizations
- [ ] **Implement Data Caching**
  - [ ] Integrate React Query or SWR
  - [ ] Cache frequently accessed data (profile, universes)
  - [ ] Implement cache invalidation strategies
  - [ ] Add offline mode with local data persistence

- [ ] **Optimize Image Loading**
  - [ ] Implement image lazy loading
  - [ ] Add image compression before upload
  - [ ] Use progressive image loading
  - [ ] Cache images locally with expo-file-system

- [ ] **Add Optimistic Updates**
  - [ ] Implement optimistic UI updates for likes/reactions
  - [ ] Optimistic message sending with retry
  - [ ] Rollback on failure with error indication

### UI/UX Improvements
- [ ] **Add Pull-to-Refresh Everywhere**
  - [ ] Ensure all list screens have refresh control
  - [ ] Add consistent refresh indicators
  - [ ] Show last updated timestamp

- [ ] **Improve Loading States**
  - [ ] Add skeleton screens for content loading
  - [ ] Replace spinners with skeleton loaders
  - [ ] Add shimmer effect to placeholders

- [ ] **Add Empty States**
  - [ ] Design empty state illustrations
  - [ ] Add helpful empty state messages
  - [ ] Include CTAs in empty states

- [ ] **Enhance Navigation**
  - [ ] Add bottom sheet modals for quick actions
  - [ ] Improve tab bar with better icons/labels
  - [ ] Add navigation gestures (swipe back)

### Accessibility
- [ ] **Improve Accessibility**
  - [ ] Add proper accessibility labels to all interactive elements
  - [ ] Test with VoiceOver (iOS) and TalkBack (Android)
  - [ ] Ensure proper contrast ratios
  - [ ] Add dynamic type support (font scaling)
  - [ ] Test keyboard navigation

### Localization
- [ ] **Add Multi-language Support**
  - [ ] Set up i18n (react-i18next)
  - [ ] Extract all hardcoded strings
  - [ ] Add language switcher in settings
  - [ ] Support RTL layouts for RTL languages

### Testing
- [ ] **Add Comprehensive Testing**
  - [ ] Write unit tests for utility functions
  - [ ] Add component tests with React Native Testing Library
  - [ ] Write integration tests for API calls
  - [ ] Add E2E tests with Detox or Maestro
  - [ ] Set up CI/CD pipeline with automated tests

---

## 🛠️ Technical Debt & Refactoring

### Code Quality
- [ ] **Create Shared Type Definitions**
  - [ ] Extract common types into separate files
  - [ ] Create `@horizon/types` package for shared types
  - [ ] Generate types from OpenAPI spec (if available)
  - [ ] Use consistent naming conventions

- [ ] **Refactor API Client**
  - [ ] Create typed API client wrapper
  - [ ] Add request/response interceptors
  - [ ] Implement retry logic for failed requests
  - [ ] Add request queuing for offline mode

- [ ] **Improve Error Handling**
  - [ ] Create centralized error handling utility
  - [ ] Add consistent error messages across app
  - [ ] Implement error boundary components
  - [ ] Add error reporting service (Sentry, etc.)

### Configuration
- [ ] **Environment Configuration**
  - [ ] Use environment variables for API URLs
  - [ ] Separate dev, staging, and production configs
  - [ ] Add build variants for different environments
  - [ ] Secure API keys and sensitive config

### File Organization
- [ ] **Restructure Project**
  - [ ] Move components to feature-based folders
  - [ ] Create shared components library
  - [ ] Organize hooks into separate directory
  - [ ] Create utilities directory for helper functions

---

## 📱 Platform-Specific Features

### iOS
- [ ] **iOS-Specific Features**
  - [ ] Add 3D Touch / Haptic Touch previews
  - [ ] Implement home screen widgets
  - [ ] Add Siri shortcuts for common actions
  - [ ] Support dark mode appearance properly
  - [ ] Add iOS share extension

### Android
- [ ] **Android-Specific Features**
  - [ ] Add home screen widgets
  - [ ] Implement Android share sheet integration
  - [ ] Add quick settings tiles
  - [ ] Support split-screen multitasking
  - [ ] Add notification channels

---

## 🚀 Future Enhancements

### Advanced Features
- [ ] **Add AI Features**
  - [ ] Content recommendations based on user behavior
  - [ ] Smart content summarization
  - [ ] Automatic content categorization

- [ ] **Add Collaboration Features**
  - [ ] Co-editing documents in real-time
  - [ ] Shared mind maps with live collaboration
  - [ ] Video call integration in universes

- [ ] **Add Gamification**
  - [ ] User levels and badges
  - [ ] Daily streaks for engagement
  - [ ] Leaderboards for contributions
  - [ ] Achievement system

---

## 📋 Notes

### Development Workflow
1. Pick items from high priority first
2. Create feature branches for each major feature
3. Write tests before implementation (TDD when possible)
4. Update documentation as features are completed
5. Mark items as complete with `[x]` checkbox

### Testing Strategy
- Test each new feature on both iOS and Android
- Test on real devices, not just simulators
- Test various screen sizes (phone, tablet)
- Test different network conditions (slow 3G, offline)
- Test with different user roles/permissions

### Deployment
- Use Expo EAS Build for production builds
- Set up OTA updates for minor fixes
- Maintain changelog for each release
- Follow semantic versioning (semver)

---

## 🎯 Sprint Planning Suggestions

### Sprint 1 (2 weeks): Authentication & Core Fixes
- Password reset flow
- Content reactions
- Message editing/deletion
- Block user functionality

### Sprint 2 (2 weeks): Content Enhancements
- Save content feature
- Content view tracking
- Related content/links
- Shorts interactions

### Sprint 3 (2 weeks): Universe Features
- Universe mind maps
- Universe sources
- Universe themes
- Universe rooms

### Sprint 4 (2 weeks): Notifications & Real-time
- Push notifications setup
- Notification preferences
- WebSocket integration
- Typing indicators

### Sprint 5 (2 weeks): Profile & Settings
- Account management
- Session management
- 2FA setup
- Mind map management

---

## ✅ Completion Tracking

**High Priority:** 0/15 completed (0%)
**Medium Priority:** 0/35 completed (0%)
**Low Priority:** 0/30 completed (0%)
**Technical Debt:** 0/10 completed (0%)

**Overall Progress:** 0/90 tasks completed (0%)

---

*Last reviewed: 2026-09-30*
