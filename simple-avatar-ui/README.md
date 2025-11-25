# Simple Avatar UI

A simplified Akool streaming avatar application with Express.js backend and React frontend.

## Features

- **Repeat Mode**: Avatar echoes back what you say
- **TRTC Streaming**: Uses Akool's TRTC-based streaming
- **Backend Processing**: All API tokens and session management handled by backend
- **Environment Configuration**: All defaults configurable via `.env` files

## Project Structure

```
simple-avatar-ui/
├── backend/
│   ├── server.js       # Express server
│   ├── package.json
│   └── .env            # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   └── AvatarStream.tsx
│   │   └── services/
│   │       └── api.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── .env            # Frontend configuration
└── README.md
```

## Quick Start

### 1. Configure Backend

Edit `backend/.env`:

```env
# Required: Your Akool API Token
AKOOL_API_TOKEN=your_akool_api_token_here

# Optional: Customize defaults
DEFAULT_AVATAR_ID=dvp_Alinna_realisticbg_20241224
DEFAULT_VOICE_ID=Xb7hH8MSUJpSbSDYk0k2
DEFAULT_LANGUAGE=en
DEFAULT_MODE_TYPE=2  # 2 = Repeat mode
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open the App

Navigate to http://localhost:3000

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `4700` |
| `AKOOL_API_HOST` | Akool API endpoint | `https://openapi.akool.com` |
| `AKOOL_API_TOKEN` | Your Akool API token | Required |
| `DEFAULT_AVATAR_ID` | Avatar to use | `dvp_Alinna_realisticbg_20241224` |
| `DEFAULT_VOICE_ID` | Voice ID | `Xb7hH8MSUJpSbSDYk0k2` |
| `DEFAULT_LANGUAGE` | Language code | `en` |
| `DEFAULT_MODE_TYPE` | Mode: 2=Repeat, 1=AI | `2` |
| `DEFAULT_STREAM_TYPE` | Stream provider | `trtc` |
| `DEFAULT_DURATION` | Session duration (sec) | `600` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:4700` |
| `VITE_PLACEHOLDER_VIDEO` | Placeholder video URL | (Akool default) |

## Mode Types

- **Mode 1 (AI)**: Avatar responds using AI/knowledge base
- **Mode 2 (Repeat)**: Avatar repeats what the user says

## API Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/config` | GET | Get default configuration |
| `/api/session/create` | POST | Create avatar session |
| `/api/session/close` | POST | Close avatar session |
| `/api/avatars` | GET | List available avatars |
| `/api/voices` | GET | List available voices |

## How It Works

1. **Start Session**: Frontend calls backend to create an Akool session
2. **Get Credentials**: Backend returns TRTC credentials
3. **Connect**: Frontend connects to TRTC room using credentials
4. **Stream**: Avatar video/audio streams to frontend
5. **Mic Input**: User enables microphone, speech is sent to avatar
6. **Repeat**: Avatar repeats the user's speech (mode_type=2)

## Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

## Troubleshooting

### "Failed to create session"
- Check your `AKOOL_API_TOKEN` is valid
- Ensure the backend is running on the correct port

### "Connection failed"
- Check browser permissions for microphone
- Ensure you're using HTTPS in production (required for WebRTC)

### Avatar not responding
- Ensure microphone is enabled
- Check browser console for errors
- Verify TRTC credentials are being received

## License

MIT
