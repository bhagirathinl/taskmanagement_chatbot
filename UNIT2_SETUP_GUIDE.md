# 🎤 UNIT 2: TEXT-TO-SPEECH - Complete Setup Guide

## 🎯 What This Adds:

Your bulletins can now SPEAK! Convert text bulletins to audio using OpenAI's TTS.

**Before Unit 2:**
```json
{
  "bulletin": {
    "fullScript": "Good morning Alice! You have 3 tasks..."
  }
}
```

**After Unit 2:**
```json
{
  "bulletin": {
    "fullScript": "Good morning Alice! You have 3 tasks...",
    "audio": {
      "url": "/audio/bulletin_user1_1699123456.mp3",
      "duration": 12.5,
      "voice": "nova"
    }
  }
}
```

---

## 📦 Files You Need:

### 1. **ttsService.js** (NEW)
Location: `chatbot/services/ttsService.js`
- Converts text to speech using OpenAI
- Manages audio file storage
- Auto-cleanup of old files

### 2. **bulletin.js** (UPDATED)
Location: `chatbot/routes/bulletin.js`
- Adds `?voice=true` parameter
- Integrates TTS service
- Returns audio URLs

### 3. **index.js** (UPDATED)
Location: `chatbot/index.js`
- Serves audio files at `/audio/`
- Adds TTS status to health check

---

## 🚀 Installation Steps:

### Step 1: Copy Files

```bash
cd /path/to/taskmanagement_chatbot/chatbot

# Create services directory if needed
mkdir -p services

# Copy TTS service (NEW FILE)
cp /path/to/ttsService.js services/

# Replace bulletin routes
cp /path/to/bulletin-with-tts.js routes/bulletin.js

# Replace main index
cp /path/to/index-with-tts.js index.js
```

### Step 2: Create Audio Directory

```bash
# Create directory for audio files
mkdir -p public/audio

# Set permissions (if needed)
chmod 755 public/audio
```

### Step 3: Configure Environment

**Option A: Enable TTS (Default)**

In `docker-compose.yml`:
```yaml
chatbot:
  environment:
    PORT: 4000
    API_BASE_URL: http://app:3000
    OPENAI_API_KEY: ${OPENAI_API_KEY}
    USE_AI_BULLETIN: true  # From Unit 1
    ENABLE_TTS: true  # NEW: Enable text-to-speech (default)
    TTS_VOICE: nova  # NEW: Female voice
  volumes:
    - ./chatbot/public:/app/public  # NEW: Mount audio directory
```

**Option B: Disable TTS**

Set `ENABLE_TTS: false` if you want bulletins without audio.

### Step 4: Update Docker Volume

Add audio directory mount to `docker-compose.yml`:

```yaml
chatbot:
  build: ./chatbot
  volumes:
    - ./chatbot/public:/app/public  # Mount public directory for audio files
```

This ensures audio files persist outside the container.

### Step 5: Rebuild and Restart

```bash
# Stop services
docker-compose down

# Rebuild chatbot
docker-compose up -d --build chatbot

# Check logs
docker-compose logs -f chatbot
```

---

## ✅ Verify Installation:

### Check Startup Logs:

You should see:
```
🔊 Serving audio files from: /app/public/audio
🎤 TTS Service: ENABLED (Voice: nova)
📁 Created audio directory: /app/public/audio
🚀 Chatbot service running on port 4000
```

### Test Health Check:

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "features": {
    "tts": "enabled"
  }
}
```

---

## 🧪 Testing:

### Test 1: Bulletin WITHOUT Audio (Text Only)

```bash
curl http://localhost:4000/bulletin/user/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "userName": "Alice",
    "bulletin": {
      "fullScript": "Good morning, Alice! ...",
      "metadata": { ... }
    }
  }
}
```

✅ **No audio field - just text**

---

### Test 2: Bulletin WITH Audio

```bash
curl http://localhost:4000/bulletin/user/1?voice=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "userName": "Alice",
    "bulletin": {
      "fullScript": "Good morning, Alice! You have 3 tasks...",
      "audio": {
        "available": true,
        "url": "/audio/bulletin_user1_1699123456.mp3",
        "filename": "bulletin_user1_1699123456.mp3",
        "duration": 12.5,
        "voice": "nova",
        "fileSize": 45678
      }
    }
  }
}
```

✅ **Has audio field with URL!**

---

### Test 3: Play the Audio

**Option A: In Browser**
```
Open: http://localhost:4000/audio/bulletin_user1_1699123456.mp3
```

**Option B: Download and Play**
```bash
# Download the file
curl http://localhost:4000/audio/bulletin_user1_1699123456.mp3 -o test.mp3

# Play it (macOS)
afplay test.mp3

# Play it (Linux)
mpg123 test.mp3

# Play it (Windows)
start test.mp3
```

✅ **You should hear the bulletin spoken in a female voice!**

---

### Test 4: TTS Statistics

```bash
curl http://localhost:4000/bulletin/tts/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "voice": "nova",
    "audioDirectory": "/app/public/audio",
    "cachedFiles": 3,
    "totalSize": 156789,
    "totalSizeMB": "0.15"
  }
}
```

---

## 🎛️ Configuration Options:

### Available Voices:

| Voice | Gender | Description |
|-------|--------|-------------|
| **nova** | Female | Clear, professional (Recommended) |
| **shimmer** | Female | Soft, warm |
| **alloy** | Neutral | Balanced |
| **echo** | Male | Clear |
| **fable** | Male | British accent |
| **onyx** | Male | Deep |

**To change voice:**
```yaml
TTS_VOICE: shimmer  # or any voice above
```

### Enable/Disable TTS:

```yaml
ENABLE_TTS: true   # TTS enabled (default)
ENABLE_TTS: false  # TTS disabled
```

### Speed Adjustment (in code):

Edit `ttsService.js` line 72:
```javascript
speed: 1.0  // Normal speed
speed: 0.9  // Slightly slower
speed: 1.1  // Slightly faster
```

---

## 📊 How It Works:

### Flow Diagram:

```
User requests: GET /bulletin/user/1?voice=true
    ↓
Generate bulletin text (Unit 1)
    ↓
Is voice=true? → YES
    ↓
Call TTS Service
    ↓
OpenAI TTS API (nova voice)
    ↓
Receive audio buffer
    ↓
Save as MP3: bulletin_user1_timestamp.mp3
    ↓
Return JSON with audio URL
    ↓
Frontend can play: /audio/bulletin_user1_timestamp.mp3
```

### File Management:

**Audio files are stored at:**
- Container: `/app/public/audio/`
- Host: `./chatbot/public/audio/`

**Automatic Cleanup:**
- Files older than 24 hours are deleted
- Runs every 6 hours
- Saves disk space

**Manual Cleanup:**
```bash
# Delete all audio files
rm chatbot/public/audio/*.mp3
```

---

## 💰 Cost Breakdown:

### OpenAI TTS Pricing:
- **$15 per 1 million characters**
- Average bulletin: 200 characters
- **Cost per bulletin: ~$0.003** (0.3 cents)

### Usage Examples:

| Daily Bulletins | Monthly Cost |
|----------------|--------------|
| 10 | $0.90 |
| 50 | $4.50 |
| 100 | $9.00 |
| 500 | $45.00 |

**TTS Model:** `tts-1` (standard quality, fast)
- Quality: Good (not HD)
- Speed: ~2-3 seconds for 200 chars
- Alternative: `tts-1-hd` (better quality, slower, more expensive)

---

## 🔧 Advanced Configuration:

### Use HD Quality:

Edit `ttsService.js` line 69:
```javascript
model: "tts-1-hd",  // Higher quality (2x cost)
```

### Retry Logic:

Built-in retry (up to 3 attempts):
```javascript
generateSpeechWithRetry(text, userId, retries = 2)
```

### Fallback Behavior:

If TTS fails:
- ✅ Bulletin still returns (text only)
- ❌ Audio field shows error
- 📝 Error logged for debugging

```json
{
  "audio": {
    "available": false,
    "reason": "Failed to generate audio",
    "error": "Rate limit exceeded"
  }
}
```

---

## 🐛 Troubleshooting:

### Issue: "TTS Service: DISABLED"

**Cause:** OPENAI_API_KEY not set or ENABLE_TTS=false

**Fix:**
```bash
# Check environment
docker exec chatbot_service env | grep -E "OPENAI|TTS"

# Should show:
OPENAI_API_KEY=sk-proj-...
ENABLE_TTS=true
```

---

### Issue: "Audio directory not writable"

**Cause:** Permission issues

**Fix:**
```bash
# On host machine
chmod 755 chatbot/public
chmod 755 chatbot/public/audio

# Or recreate
rm -rf chatbot/public/audio
mkdir -p chatbot/public/audio
```

---

### Issue: Audio file not found (404)

**Cause:** Volume not mounted or file not generated

**Check:**
```bash
# List audio files in container
docker exec chatbot_service ls -la /app/public/audio

# List audio files on host
ls -la chatbot/public/audio
```

**Fix:** Ensure volume is mounted in docker-compose.yml

---

### Issue: "Rate limit exceeded"

**Cause:** Too many TTS requests

**Solutions:**
1. Wait a few minutes
2. Reduce request frequency
3. Upgrade OpenAI plan
4. Cache audio files (reuse them)

---

### Issue: Audio plays but no sound

**Causes:**
1. Empty/corrupt MP3 file
2. Browser/player issue
3. Volume muted

**Debug:**
```bash
# Check file size
ls -lh chatbot/public/audio/*.mp3

# Files should be > 10KB
# If file is tiny (< 1KB), generation failed
```

---

## 📝 API Reference:

### Endpoints:

#### GET /bulletin/user/:userId
Returns bulletin text only (no audio)

#### GET /bulletin/user/:userId?voice=true
Returns bulletin with audio

#### GET /audio/:filename
Serves audio file directly

#### GET /bulletin/tts/stats
Returns TTS statistics

---

## 🎯 Usage Examples:

### JavaScript/React:

```javascript
// Fetch bulletin with audio
const response = await fetch('http://localhost:4000/bulletin/user/1?voice=true');
const data = await response.json();

if (data.data.bulletin.audio?.available) {
  const audioUrl = `http://localhost:4000${data.data.bulletin.audio.url}`;
  
  // Play audio
  const audio = new Audio(audioUrl);
  audio.play();
}
```

### HTML:

```html
<!-- Audio player -->
<audio controls>
  <source src="http://localhost:4000/audio/bulletin_user1_1699123456.mp3" type="audio/mpeg">
  Your browser does not support audio.
</audio>
```

---

## ✅ Testing Checklist:

- [ ] Copied 3 files (ttsService.js, bulletin.js, index.js)
- [ ] Created public/audio directory
- [ ] Added volume mount to docker-compose.yml
- [ ] Set OPENAI_API_KEY environment variable
- [ ] Rebuilt: `docker-compose up -d --build chatbot`
- [ ] Logs show: "TTS Service: ENABLED"
- [ ] Health check shows tts: "enabled"
- [ ] Tested text-only: `curl .../bulletin/user/1`
- [ ] Tested with audio: `curl .../bulletin/user/1?voice=true`
- [ ] Audio URL returned in response
- [ ] Played audio file - HEARD THE BULLETIN! 🎉

---

## 🎉 Success Indicators:

**When working correctly:**
1. ✅ Logs show "TTS Service: ENABLED"
2. ✅ `?voice=true` returns audio URL
3. ✅ Audio files created in public/audio/
4. ✅ Can play audio in browser
5. ✅ Hear female voice (nova) speaking bulletin

---

## ⏭️ What's Next:

**Unit 3: Avatar UI Component**
- Create React component to display avatar
- Play audio with lip-sync animation
- Build the visual interface

**Unit 4: Side-by-Side Layout**
- Bulletin panel (left)
- Chat panel (right)
- Integrate everything!

---

## 📞 Need Help?

**Share these if you have issues:**
```bash
# Check logs
docker-compose logs chatbot | tail -50

# Check TTS status
curl http://localhost:4000/bulletin/tts/stats

# Check audio directory
ls -la chatbot/public/audio/

# Test with audio
curl http://localhost:4000/bulletin/user/1?voice=true
```

---

**Unit 2 Complete! Your bulletins can now SPEAK!** 🎤🎉

Let me know when you've tested it and heard the audio! 🔊
