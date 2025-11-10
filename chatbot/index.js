/**
 * Chatbot Service Entry Point with TTS Support (ES6 Module)
 * Main server file with chat, bulletin, and audio routes
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import chatRoutes from './routes/chat.js';
import voiceChatRoutes from './routes/voiceChat.js';
import realtimeVoiceChatRoutes from './services/realtimeVoiceChat.js';
import { initializeVoiceChatWebSocket } from './services/streamingVoiceChat.js';

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
// Parse raw SDP payloads for realtime voice chat
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

// Serve static audio files
const audioPath = path.join(__dirname, 'public', 'audio');
app.use('/audio', express.static(audioPath));
console.log(`🔊 Serving audio files from: ${audioPath}`);

// Routes
app.use('/chat', chatRoutes);
app.use('/voice-chat', voiceChatRoutes);
app.use('/realtime-voice', realtimeVoiceChatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'chatbot',
    version: '2.0.0',
    features: {
      chat: 'enabled',
      tts: process.env.ENABLE_TTS !== 'false' ? 'enabled' : 'disabled'
    },
    endpoints: {
      chat: '/chat',
      audio: '/audio',
      health: '/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Management Chatbot API',
    version: '2.0.0',
    services: {
      chat: 'AI-powered task management assistant',
      voiceChat: 'Voice chat with speech-to-text and text-to-speech'
    },
    endpoints: {
      'POST /chat': 'Send a text chat message',
      'POST /chat/clear': 'Clear conversation memory',
      'POST /voice-chat': 'Send voice message (audio file)',
      'POST /voice-chat/clear': 'Clear voice chat memory',
      'POST /realtime-voice/session': 'Create realtime voice session (WebRTC)',
      'POST /realtime-voice/execute-tool': 'Execute tool call from realtime session',
      'GET /audio/:filename': 'Get audio file',
      'GET /health': 'Health check'
    },
    features: {
      textToSpeech: process.env.ENABLE_TTS !== 'false',
      voice: process.env.TTS_VOICE || 'nova'
    }
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket for streaming voice chat
initializeVoiceChatWebSocket(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chatbot service running on port ${PORT}`);
  console.log(`📝 Chat endpoint: http://localhost:${PORT}/chat`);
  console.log(`🎤 Voice Chat WebSocket: ws://localhost:${PORT}/ws/voice-chat`);
  console.log(`🎙️  Realtime Voice endpoint: http://localhost:${PORT}/realtime-voice`);
  console.log(`🔊 Audio endpoint: http://localhost:${PORT}/audio`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);

  // Log feature status
  console.log('\n🎯 Features:');
  console.log(`   Text Chat: ✅ Enabled`);
  console.log(`   Streaming Voice Chat: ✅ Enabled (WebSocket)`);
  console.log(`   Realtime Voice Chat: ✅ Enabled (OpenAI Realtime API)`);
  console.log(`   Text-to-Speech: ${process.env.ENABLE_TTS !== 'false' ? '✅ Enabled' : '❌ Disabled'}`);
  if (process.env.ENABLE_TTS !== 'false') {
    console.log(`   Voice: ${process.env.TTS_VOICE || 'nova'}`);
  }
  console.log('');
});