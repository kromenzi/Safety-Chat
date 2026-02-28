# SafeGuard AI

## Overview

SafeGuard AI is a mobile-first workplace safety inspection application built with Expo (React Native) and an Express backend. Users can upload workplace photos and receive AI-powered PPE (Personal Protective Equipment) compliance analysis, hazard identification, and safety reports. The app supports real-time streaming chat with an OpenAI-powered safety expert, image analysis, file/document analysis (PDF, Word, Excel, CSV, text), bilingual support (English/Arabic), text copying from AI responses, and conversation history persistence.

## Recent Changes (Feb 2026)
- Enhanced AI system prompt with comprehensive HSE expertise (OSHA, NFPA, ISO, ANSI standards)
- Added 5x5 risk assessment matrix with severity/likelihood scoring
- Added text copy button on all AI response messages (with clipboard + haptic feedback)
- Added file/document attachment support (PDF, Word, Excel, CSV, text, JSON)
- Switched to o4-mini (thinking model) for text queries and o3 (thinking model) for image analysis — deeper reasoning and more accurate safety assessments
- Improved markdown rendering (headings, bullets, sub-bullets, bold, code, dividers)
- All message text is selectable for copying

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: File-based routing via `expo-router`. Two main screens: home (`app/index.tsx`) for conversation list, and chat (`app/chat/[id].tsx`) for individual conversations
- **State Management**: React Context for chat state (`ChatContext`) and language settings (`LanguageContext`). React Query (`@tanstack/react-query`) for server data fetching
- **Local Persistence**: Conversations are stored client-side using `@react-native-async-storage/async-storage`. The app manages chat state locally rather than relying on server-side storage for the primary mobile experience
- **Styling**: Dark theme defined in `constants/colors.ts` with a dark navy/teal color scheme. No CSS-in-JS library — uses React Native `StyleSheet`
- **Fonts**: Inter font family (400, 500, 600, 700 weights) via `@expo-google-fonts/inter`
- **Animations**: `react-native-reanimated` for message animations, typing indicators, and transitions
- **Image Handling**: `expo-image-picker` for camera/gallery image selection, sent as base64 to the server for AI analysis
- **Internationalization**: Custom i18n via `LanguageContext` supporting English and Arabic with RTL layout support

### Backend (Express)

- **Framework**: Express 5 running on Node.js, defined in `server/index.ts`
- **API Pattern**: RESTful endpoints registered in `server/routes.ts`. The server handles AI chat completions with streaming responses
- **AI Integration**: OpenAI SDK configured with Replit AI Integrations environment variables (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`). The main chat endpoint streams responses using SSE
- **System Prompt**: A detailed safety inspection prompt instructs the AI to analyze workplace images for PPE compliance, identify hazards, and generate structured safety reports with severity levels
- **CORS**: Dynamic CORS configuration supporting Replit dev domains and localhost for Expo web development
- **Static Serving**: In production, serves a pre-built Expo web bundle. In development, proxies to Expo's Metro bundler via `http-proxy-middleware`

### Replit Integration Modules (`server/replit_integrations/`)

Pre-built integration modules that extend functionality:
- **Chat** (`chat/`): Server-side conversation/message CRUD using database storage via Drizzle ORM
- **Audio** (`audio/`): Voice chat with speech-to-text, text-to-speech, and audio format conversion (ffmpeg)
- **Image** (`image/`): Image generation via `gpt-image-1` model
- **Batch** (`batch/`): Generic batch processing with rate limiting (`p-limit`) and retries (`p-retry`)

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` defines a `users` table. `shared/models/chat.ts` defines `conversations` and `messages` tables with a foreign key relationship (cascade delete)
- **Migration**: Uses `drizzle-kit push` for schema synchronization (no migration files approach)
- **Connection**: Requires `DATABASE_URL` environment variable for PostgreSQL connection
- **Storage Layer**: `server/storage.ts` has an in-memory `MemStorage` implementation for users. `server/replit_integrations/chat/storage.ts` uses the actual database via Drizzle for conversations/messages

### Build & Deploy

- **Development**: Two parallel processes — `expo:dev` for the Expo Metro bundler and `server:dev` for the Express backend (via `tsx`)
- **Production Build**: `expo:static:build` creates a static web bundle, `server:build` bundles the server with esbuild, `server:prod` runs the production server
- **Build Script**: `scripts/build.js` handles Expo static export with Replit domain configuration

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (provisioned by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key via Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL via Replit AI Integrations
- `REPLIT_DEV_DOMAIN` — Auto-set by Replit for development
- `EXPO_PUBLIC_DOMAIN` — Set during dev to point the mobile client to the Express server

### Key NPM Packages
- `expo` ~54.0.27 — Core mobile framework
- `expo-router` ~6.0.17 — File-based routing
- `express` ^5.0.1 — Backend HTTP server
- `openai` ^6.22.0 — OpenAI API client
- `drizzle-orm` ^0.39.3 + `pg` ^8.16.3 — Database ORM and PostgreSQL driver
- `@tanstack/react-query` ^5.83.0 — Server state management
- `react-native-reanimated` ~4.1.1 — Animations
- `expo-image-picker` ~17.0.9 — Camera/gallery access
- `patch-package` — Applied via postinstall for dependency patches