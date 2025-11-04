/**
 * Chatbot Service Entry Point with TTS Support (ES6 Module)
 * Main server file with chat, bulletin, and audio routes
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';
import bulletinRoutes from './routes/bulletin.js';

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static audio files
const audioPath = path.join(__dirname, 'public', 'audio');
app.use('/audio', express.static(audioPath));
console.log(`🔊 Serving audio files from: ${audioPath}`);

// Routes
app.use('/chat', chatRoutes);
app.use('/bulletin', bulletinRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'chatbot',
    version: '2.0.0',
    features: {
      chat: 'enabled',
      bulletin: 'enabled',
      tts: process.env.ENABLE_TTS !== 'false' ? 'enabled' : 'disabled',
      ai_bulletin: process.env.USE_AI_BULLETIN === 'true' ? 'enabled' : 'disabled'
    },
    endpoints: {
      chat: '/chat',
      bulletin: '/bulletin',
      audio: '/audio',
      health: '/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Management Chatbot API with TTS',
    version: '2.0.0',
    services: {
      chat: 'AI-powered task management assistant',
      bulletin: 'Personalized news bulletin generator',
      tts: 'Text-to-speech audio generation'
    },
    endpoints: {
      'POST /chat': 'Send a chat message',
      'POST /chat/clear': 'Clear conversation memory',
      'GET /bulletin/user/:userId': 'Get personalized bulletin (text)',
      'GET /bulletin/user/:userId?voice=true': 'Get bulletin with audio',
      'GET /bulletin/test': 'Test bulletin service',
      'GET /bulletin/tts/stats': 'Get TTS statistics',
      'GET /audio/:filename': 'Get audio file',
      'GET /health': 'Health check'
    },
    features: {
      aiGeneration: process.env.USE_AI_BULLETIN === 'true',
      textToSpeech: process.env.ENABLE_TTS !== 'false',
      voice: process.env.TTS_VOICE || 'nova'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chatbot service running on port ${PORT}`);
  console.log(`📝 Chat endpoint: http://localhost:${PORT}/chat`);
  console.log(`📰 Bulletin endpoint: http://localhost:${PORT}/bulletin`);
  console.log(`🔊 Audio endpoint: http://localhost:${PORT}/audio`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  
  // Log feature status
  console.log('\n🎯 Features:');
  console.log(`   AI Bulletins: ${process.env.USE_AI_BULLETIN === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Text-to-Speech: ${process.env.ENABLE_TTS !== 'false' ? '✅ Enabled' : '❌ Disabled'}`);
  if (process.env.ENABLE_TTS !== 'false') {
    console.log(`   Voice: ${process.env.TTS_VOICE || 'nova'}`);
  }
  console.log('');
});