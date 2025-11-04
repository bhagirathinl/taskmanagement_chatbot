# ⚡ UNIT 2: TTS - Quick Reference

## 📦 Files to Copy:

```
chatbot/
├── services/
│   └── ttsService.js          ← NEW
├── routes/
│   └── bulletin.js            ← REPLACE
├── index.js                   ← REPLACE
└── public/
    └── audio/                 ← CREATE (empty dir)
```

---

## 🚀 Installation (3 Minutes):

```bash
cd chatbot

# 1. Copy files
cp ttsService.js services/
cp bulletin-with-tts.js routes/bulletin.js
cp index-with-tts.js index.js

# 2. Create audio directory
mkdir -p public/audio

# 3. Restart
docker-compose up -d --build chatbot
```

---

## ⚙️ docker-compose.yml Changes:

```yaml
chatbot:
  environment:
    ENABLE_TTS: true      # NEW
    TTS_VOICE: nova       # NEW (female)
  volumes:
    - ./chatbot/public:/app/public  # NEW
```

---

## 🧪 Testing Commands:

```bash
# Text only (no audio)
curl http://localhost:4000/bulletin/user/1

# With audio
curl http://localhost:4000/bulletin/user/1?voice=true

# Play audio in browser
open http://localhost:4000/audio/bulletin_user1_*.mp3

# TTS stats
curl http://localhost:4000/bulletin/tts/stats
```

---

## ✅ Success Check:

**Logs should show:**
```
🎤 TTS Service: ENABLED (Voice: nova)
🔊 Serving audio files from: /app/public/audio
```

**API response includes:**
```json
{
  "bulletin": {
    "audio": {
      "url": "/audio/bulletin_user1_1699.mp3",
      "duration": 12.5,
      "voice": "nova"
    }
  }
}
```

---

## 🎤 Voices Available:

- **nova** ✅ - Female (recommended)
- **shimmer** - Female (soft)
- **alloy** - Neutral
- **echo** - Male
- **fable** - Male (British)
- **onyx** - Male (deep)

Change: `TTS_VOICE: shimmer`

---

## 💰 Cost:

- ~$0.003 per bulletin (0.3 cents)
- 100/day = $9/month
- Model: tts-1 (standard quality)

---

## 🐛 Quick Fixes:

**"TTS Service: DISABLED"**
→ Check OPENAI_API_KEY is set

**No audio files created**
→ Check public/audio/ directory exists

**404 on audio URL**
→ Check volume mount in docker-compose.yml

**Audio plays but silent**
→ Check file size (should be > 10KB)

---

## 📋 Endpoints:

| Endpoint | Purpose |
|----------|---------|
| GET /bulletin/user/:id | Text only |
| GET /bulletin/user/:id?voice=true | With audio |
| GET /audio/:filename | Serve audio |
| GET /bulletin/tts/stats | TTS stats |

---

## ⏭️ Next: Unit 3

**Avatar UI Component**
- React component
- Audio player
- Lip-sync animation

---

**That's it! 3 minutes to speaking bulletins!** 🎤
