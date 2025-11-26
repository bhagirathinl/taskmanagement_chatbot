# Task Management Chatbot - Tech Stack

A comprehensive AI-powered task management system with multi-modal interaction capabilities.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                       │
│                         (User's Browser)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (443)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CADDY REVERSE PROXY                                 │
│                      taskbot.duckdns.org:443                                │
│                                                                             │
│   Tech: Caddy 2.x | Auto SSL/TLS | HTTP/2                                   │
│                                                                             │
│                          
└─────────────────────────────────────────────────────────────────────────────┘
          │                         │                         │
          │ HTTP                    │ HTTP                    │ HTTP
          ▼                         ▼                         ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   CHATBOT UI      │    │   CHATBOT API     │    │  AVATAR BACKEND   │
│   Port: 8080      │    │   Port: 4000      │    │   Port: 4700      │
│                   │    │                   │    │                   │
│ ┌───────────────┐ │    │ ┌───────────────┐ │    │ ┌───────────────┐ │
│ │ React 19.2    │ │    │ │ Node.js 20    │ │    │ │ Node.js 20    │ │
│ │ TypeScript 5  │ │    │ │ Express 4.18  │ │    │ │ Express 4.18  │ │
│ │ TRTC SDK 5.9  │ │    │ │ LangChain 1.0 │ │    │ │ Akool API     │ │
│ │ serve (prod)  │ │    │ │ OpenAI 4.27   │ │    │ │               │ │
│ └───────────────┘ │    │ │ ws 8.18       │ │    │ └───────────────┘ │
│                   │    │ └───────────────┘ │    │                   │
│ Features:         │    │                   │    │ Features:         │
│ • Text Chat Tab   │    │ Features:         │    │ • Session mgmt    │
│ • Voice Chat Tab  │    │ • AI Agent        │    │ • Avatar config   │
│ • Avatar Tab      │    │ • SQL Tool        │    │ • Chat proxy      │
│ • Real-time UI    │    │ • TTS Service     │    │ • TRTC creds      │
└───────────────────┘    │ • WebSocket       │    └───────────────────┘
          │              │ • Voice Chat      │              │
          │              └───────────────────┘              │
          │                         │                       │
          │                         │ HTTP                  │ HTTPS
          │                         ▼                       ▼
          │              ┌───────────────────┐    ┌───────────────────┐
          │              │   TASKS API       │    │   AKOOL API       │
          │              │   Port: 3000      │    │   (External)      │
          │              │                   │    │                   │
          │              │ ┌───────────────┐ │    │ • Avatar Stream   │
          │              │ │ Node.js 18    │ │    │ • Voice Synth     │
          │              │ │ Express 4.18  │ │    │ • TRTC Protocol   │
          │              │ │ mysql2 3.9    │ │    │                   │
          │              │ └───────────────┘ │    └───────────────────┘
          │              │                   │
          │              │ Features:         │
          │              │ • REST CRUD       │
          │              │ • SQL Execution   │
          │              │ • Health Check    │
          │              └───────────────────┘
          │                         │
          │                         │ TCP (3306)
          │                         ▼
          │              ┌───────────────────┐
          │              │      MYSQL        │
          │              │   Port: 3306      │
          │              │                   │
          │              │ ┌───────────────┐ │
          │              │ │ MySQL 8.0     │ │
          │              │ │ InnoDB        │ │
          │              │ └───────────────┘ │
          │              │                   │
          │              │ Tables:           │
          │              │ • users           │
          │              │ • projects        │
          │              │ • tasks           │
          │              └───────────────────┘
          │
          │ WebRTC (TRTC)
          ▼
┌───────────────────┐
│   TRTC SERVERS    │
│   (Tencent Cloud) │
│                   │
│ • Video Stream    │
│ • Audio Stream    │
│ • Custom Messages │
└───────────────────┘
```

---

## Communication Flow Diagrams

### 1. Text Chat Flow
```
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌───────┐
│  User    │     │ Chatbot │     │ Chatbot │     │ OpenAI  │     │  Tasks   │     │ MySQL │
│ Browser  │     │   UI    │     │   API   │     │ GPT-4   │     │   API    │     │       │
└────┬─────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬─────┘     └───┬───┘
     │                │               │               │               │               │
     │  Type message  │               │               │               │               │
     │───────────────>│               │               │               │               │
     │                │  POST /chat   │               │               │               │
     │                │──────────────>│               │               │               │
     │                │               │               │               │               │
     │                │               │ LangChain     │               │               │
     │                │               │ Agent call    │               │               │
     │                │               │──────────────>│               │               │
     │                │               │               │               │               │
     │                │               │  Tool call:   │               │               │
     │                │               │  SQL query    │               │               │
     │                │               │<──────────────│               │               │
     │                │               │               │               │               │
     │                │               │ POST /sql     │               │               │
     │                │               │──────────────────────────────>│               │
     │                │               │               │               │  SQL Query    │
     │                │               │               │               │──────────────>│
     │                │               │               │               │               │
     │                │               │               │               │  Results      │
     │                │               │               │               │<──────────────│
     │                │               │  JSON Response│               │               │
     │                │               │<──────────────────────────────│               │
     │                │               │               │               │               │
     │                │               │ Return tool   │               │               │
     │                │               │ results       │               │               │
     │                │               │──────────────>│               │               │
     │                │               │               │               │               │
     │                │               │  Formatted    │               │               │
     │                │               │  AI Response  │               │               │
     │                │               │<──────────────│               │               │
     │                │  AI Response  │               │               │               │
     │                │<──────────────│               │               │               │
     │  Display       │               │               │               │               │
     │<───────────────│               │               │               │               │
     │                │               │               │               │               │
```

### 2. Avatar Chat Flow
```
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User    │     │ Chatbot │     │ Avatar  │     │ Chatbot │     │  Akool  │     │  AKOOL  │
│ Browser  │     │   UI    │     │ Backend │     │API+GPT-4│     │   API   │     │ Servers │
└────┬─────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │                │               │               │               │               │
     │  Click Avatar  │               │               │               │               │
     │───────────────>│               │               │               │               │
     │                │ POST /session │               │               │               │
     │                │   /create     │               │               │               │
     │                │──────────────>│               │               │               │
     │                │               │ Create Session│               │               │
     │                │               │──────────────────────────────>│               │
     │                │               │               │               │               │
     │                │               │ TRTC Creds    │               │               │
     │                │               │<──────────────────────────────│               │
     │                │  Credentials  │               │               │               │
     │                │<──────────────│               │               │               │
     │                │               │               │               │               │
     │                │ Connect TRTC  │               │               │               │
     │                │────────────────────────────────────────────────────────────────>│
     │                │               │               │               │               │
     │  Video Stream  │               │               │               │               │
     │<────────────────────────────────────────────────────────────────────────────────│
     │                │               │               │               │               │
     │  Speak (Mic)   │               │               │               │               │
     │───────────────>│               │               │               │               │
     │                │ Audio via AKOOL               │               │               │
     │                │────────────────────────────────────────────────────────────────>│
     │                │               │               │               │ Transcribe    │
     │                │               │               │               │<──────────────│
     │                │               │               │               │               │
     │                │ Custom Msg    │               │               │ User Text     │
     │                │<────────────────────────────────────────────────────────────────│
     │                │               │               │               │               │
     │                │ POST /chat    │               │               │               │
     │                │──────────────>│               │               │               │
     │                │               │ Forward to    │               │               │
     │                │               │ Chatbot API   │               │               │
     │                │               │──────────────>│               │               │
     │                │               │               │               │               │
     │                │               │               │ OpenAI GPT-4  │               │
     │                │               │               │ processes msg │               │
     │                │               │               │───┐           │               │
     │                │               │               │<──┘           │               │
     │                │               │               │               │               │
     │                │               │  AI Response  │               │               │
     │                │               │<──────────────│               │               │
     │                │  AI Response  │               │               │               │
     │                │<──────────────│               │               │               │
     │                │               │               │               │               │
     │                │ Send to Avatar│               │               │               │
     │                │ (Custom Msg)  │               │               │               │
     │                │────────────────────────────────────────────────────────────────>│
     │                │               │               │               │               │
     │  Avatar Speaks │               │               │               │               │
     │<────────────────────────────────────────────────────────────────────────────────│
     │                │               │               │               │               │
```

### 3. Realtime Voice Chat Flow
```
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│  User    │     │ Chatbot │     │ Chatbot │     │  OpenAI  │
│ Browser  │     │   UI    │     │   API   │     │ Realtime │
└────┬─────┘     └────┬────┘     └────┬────┘     └────┬─────┘
     │                │               │               │
     │ Click Voice    │               │               │
     │───────────────>│               │               │
     │                │ POST /session │               │
     │                │──────────────>│               │
     │                │               │ Create WS     │
     │                │               │──────────────>│
     │                │               │               │
     │                │                               │
     │                │.                              │
     │                │               │               │
     │                │ WebRTC Connect│               │
     │                │──────────────────────────────>│
     │                │               │               │
     │  Speak (Mic)   │               │               │
     │───────────────>│               │               │
     │                │ Audio Stream  │               │
     │                │──────────────────────────────>│
     │                │               │               │
     │                │               │  AI Response  │
     │                │               │  (Audio)      │
     │                │<──────────────────────────────│
     │  AI Voice      │               │               │
     │<───────────────│               │               │
     │                │               │               │
```

---

## Component Tech Stacks

### 1. Chatbot UI (`/chatbot-ui`)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | React | 19.2.0 | UI components |
| **Language** | TypeScript | 5.0.0+ | Type safety |
| **Build** | React Scripts | 5.0.1 | Bundling |
| **Streaming** | trtc-sdk-v5 | 5.9.3 | WebRTC avatar |
| **HTTP** | Fetch API | native | API calls |
| **Server** | serve | latest | Static file serving |
| **Container** | node:20-alpine | - | Docker base |

**Key Files:**
- `src/App.js` - Main app with tabs
- `src/components/AvatarStream.tsx` - TRTC integration
- `src/components/EmbeddedAvatar.tsx` - Avatar wrapper
- `src/components/RealtimeVoiceChat.jsx` - Voice chat
- `src/services/avatarApi.ts` - Avatar backend client

---

### 2. Chatbot API (`/chatbot`)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 20 | JavaScript engine |
| **Framework** | Express.js | 4.18.2 | HTTP server |
| **AI Agent** | LangChain | 1.0.1 | Agent framework |
| **LLM** | OpenAI API | 4.27.0 | GPT-4 integration |
| **WebSocket** | ws | 8.18.3 | Real-time chat |
| **Validation** | Zod | 3.25.76 | Schema validation |
| **TTS** | OpenAI TTS | - | Text-to-speech |
| **Container** | node:20 | - | Docker base |

**Key Files:**
- `index.js` - Express server setup
- `agent/` - LangChain AI agent
- `services/realtimeVoiceChat.js` - OpenAI Realtime
- `services/streamingVoiceChat.js` - WebSocket voice
- `routes/chat.js` - Chat endpoints

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | /chat | Send message to AI |
| POST | /chat/clear | Clear conversation |
| GET | /health | Health check |
| POST | /realtime-voice/session | Create voice session |
| WS | /ws/voice-chat | Streaming voice |

---

### 3. Avatar Backend (`/simple-avatar-ui/backend`)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 20 | JavaScript engine |
| **Framework** | Express.js | 4.18.2 | HTTP server |
| **HTTP Client** | Fetch API | native | Akool API calls |
| **Config** | dotenv | 16.x | Environment vars |
| **Container** | node:20 | - | Docker base |

**Key Files:**
- `server.js` - Express server with Akool proxy

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/config | Avatar configuration |
| POST | /api/session/create | Create TRTC session |
| POST | /api/session/close | Close session |
| POST | /api/chat | Proxy to chatbot |
| GET | /api/chat/status | Chatbot status |
| GET | /api/avatars | List available avatars |
| GET | /api/voices | List available voices |
| GET | /health | Health check |

---

### 4. Tasks API (`/app`)

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 18 | JavaScript engine |
| **Framework** | Express.js | 4.18.2 | HTTP server |
| **Database** | mysql2 | 3.9.0 | MySQL driver |
| **Middleware** | CORS | 2.8.5 | Cross-origin |
| **Container** | node:18 | - | Docker base |

**Key Files:**
- `index.js` - Express server with all routes

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /projects | List projects |
| GET | /projects/:id | Get project |
| GET | /tasks | List tasks |
| GET | /tasks/user/:id | Tasks by user |
| GET | /tasks/status/:status | Tasks by status |
| GET | /users | List users |
| POST | /sql/execute | Execute SQL |
| GET | /health | Health check |

---

### 5. MySQL Database

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Database** | MySQL | 8.0 | Data storage |
| **Engine** | InnoDB | - | Transactions |
| **Container** | mysql:8.0 | - | Docker image |

**Schema:**
```sql
users (id, name, email, role, department)
projects (id, name, description, status, start_date, end_date)
tasks (id, project_id, assigned_to, title, description, status, priority, due_date)
```

---

### 6. Caddy Reverse Proxy

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Server** | Caddy | 2.x | Reverse proxy |
| **SSL** | Let's Encrypt | auto | HTTPS certificates |
| **Protocol** | HTTP/2 | - | Modern HTTP |

**Configuration:**
```
taskbot.duckdns.org {
    handle /avatar/* { reverse_proxy localhost:4700 }
    handle /chat*    { reverse_proxy localhost:4000 }
    handle /ws/*     { reverse_proxy localhost:4000 }
    handle           { reverse_proxy localhost:8080 }
}
```

---

## External Services

| Service | Provider | Purpose | Protocol |
|---------|----------|---------|----------|
| **GPT-4** | OpenAI | Conversational AI | HTTPS REST |
| **TTS** | OpenAI | Text-to-speech | HTTPS REST |
| **Realtime** | OpenAI | Voice chat | WebSocket |
| **Avatar** | Akool | Streaming avatar | HTTPS REST |
| **TRTC** | Tencent | WebRTC streaming | WebRTC |
| **DNS** | DuckDNS | Dynamic DNS | HTTPS |
| **Hosting** | AWS EC2 | Cloud compute | - |

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTIONS                            │
└─────────────────────────────────────────────────────────────────────┘
                    │              │              │
            ┌───────┴───────┐ ┌────┴────┐ ┌──────┴──────┐
            │   Text Chat   │ │  Voice  │ │   Avatar    │
            │               │ │  Chat   │ │   Chat      │
            └───────┬───────┘ └────┬────┘ └──────┬──────┘
                    │              │              │
                    ▼              ▼              ▼
            ┌─────────────────────────────────────────────┐
            │              CHATBOT UI (React)              │
            │                                              │
            │  • Renders chat interface                    │
            │  • Manages WebRTC connections                │
            │  • Handles user input                        │
            └─────────────────────────────────────────────┘
                    │              │              │
         ┌──────────┘              │              └──────────┐
         │ REST                    │ WebRTC                  │ REST
         ▼                         ▼                         ▼
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────┐
│  CHATBOT API    │    │   TRTC SERVERS    │    │ AVATAR BACKEND  │
│                 │    │   (Tencent)       │    │                 │
│ • LangChain AI  │    │                   │    │ • Akool proxy   │
│ • SQL Tool      │    │ • Video stream    │    │ • Session mgmt  │
│ • TTS           │    │ • Audio stream    │    │                 │
└────────┬────────┘    └───────────────────┘    └────────┬────────┘
         │                                               │
         │ REST                                          │ HTTPS
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   TASKS API     │                            │   AKOOL API     │
│                 │                            │                 │
│ • CRUD ops      │                            │ • Avatar gen    │
│ • SQL execute   │                            │ • Voice synth   │
└────────┬────────┘                            └─────────────────┘
         │
         │ SQL
         ▼
┌─────────────────┐
│     MYSQL       │
│                 │
│ • users         │
│ • projects      │
│ • tasks         │
└─────────────────┘
```

---

## Technology Summary by Category

### Languages
- **JavaScript/TypeScript** - All services
- **SQL** - Database queries
- **JSON** - Data exchange

### Frontend
- React 19, TypeScript, TRTC SDK

### Backend
- Node.js 18/20, Express.js, LangChain

### AI/ML
- OpenAI GPT-4, OpenAI TTS, OpenAI Realtime, Akool Avatar

### Database
- MySQL 8.0

### Infrastructure
- Docker, Docker Compose, Caddy, AWS EC2

### Protocols
- HTTPS, WebSocket, WebRTC, REST

---

## Version History

| Date | Change |
|------|--------|
| Nov 2024 | Initial release with text chat |
| Nov 2024 | Added voice chat (OpenAI Realtime) |
| Nov 2024 | Integrated Akool streaming avatar |
| Nov 2024 | Consolidated UI (removed separate avatar frontend) |

---

## License

Private repository - All rights reserved.
