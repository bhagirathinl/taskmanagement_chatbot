/**
 * Voice Chat Routes (ES6 Module)
 * API endpoints for voice chat with speech-to-text and text-to-speech
 */

import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getChatResponse } from '../agent/agent.js';
import { getFormattedHistory, addMessage, clearHistory } from '../agent/memory.js';
import { generateSpeechWithRetry, isTTSAvailable } from '../services/ttsService.js';

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize OpenAI client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Configure multer for audio file uploads
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit (OpenAI's limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/mp4'
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|webm|m4a|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file format. Supported: mp3, wav, webm, m4a, ogg'));
    }
  }
});

/**
 * POST /voice-chat
 * Handle voice chat: transcribe audio, get AI response, generate speech
 */
router.post('/', upload.single('audio'), async (req, res) => {
  let audioFilePath = null;

  try {
    const { sessionId = 'default' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    audioFilePath = req.file.path;
    console.log(`\n🎤 Received audio file for session ${sessionId}: ${req.file.originalname}`);

    // Step 1: Transcribe audio using OpenAI Whisper
    console.log('🎧 Transcribing audio with Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en' // Optional: can be omitted for auto-detection
    });

    const userMessage = transcription.text;
    console.log(`📝 Transcribed: "${userMessage}"`);

    // Step 2: Get formatted conversation history
    const conversationHistory = getFormattedHistory(sessionId);
    console.log(`📚 Loading ${conversationHistory.length} previous messages`);

    // Step 3: Get AI response
    console.log('🤖 Getting AI response...');
    const reply = await getChatResponse(userMessage, conversationHistory);
    console.log(`✅ AI Response: "${reply.substring(0, 100)}..."`);

    // Step 4: Save to history
    addMessage(sessionId, { role: 'user', content: userMessage });
    addMessage(sessionId, { role: 'assistant', content: reply });

    // Step 5: Generate audio response if TTS is available
    let audioResponse = null;
    if (isTTSAvailable()) {
      try {
        console.log('🔊 Generating audio response...');
        const audioInfo = await generateSpeechWithRetry(
          reply,
          sessionId.replace(/[^a-zA-Z0-9]/g, '_') // Sanitize session ID for filename
        );

        audioResponse = {
          available: true,
          url: audioInfo.audioUrl,
          filename: audioInfo.filename,
          duration: audioInfo.estimatedDuration,
          voice: audioInfo.voice
        };
        console.log(`✅ Audio response generated: ${audioInfo.filename}`);
      } catch (audioError) {
        console.error('❌ Error generating audio response:', audioError.message);
        audioResponse = {
          available: false,
          reason: 'Failed to generate audio response',
          error: audioError.message
        };
      }
    } else {
      audioResponse = {
        available: false,
        reason: 'TTS service not available'
      };
    }

    // Step 6: Clean up uploaded audio file
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
      console.log('🗑️  Cleaned up uploaded audio file');
    }

    // Return response
    res.json({
      success: true,
      transcription: userMessage,
      reply: reply,
      audio: audioResponse,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('❌ Error in voice chat route:', error);

    // Clean up uploaded file on error
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      try {
        fs.unlinkSync(audioFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /voice-chat/clear
 * Clear voice chat conversation history
 */
router.post('/clear', (req, res) => {
  try {
    const { sessionId = 'default' } = req.body;
    clearHistory(sessionId);
    console.log(`🗑️ Cleared voice chat history for session ${sessionId}`);
    res.json({ message: 'Voice chat conversation cleared', sessionId });
  } catch (error) {
    console.error('❌ Error clearing voice chat history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

/**
 * GET /voice-chat/test
 * Test voice chat endpoint
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Voice chat service is running',
    features: {
      speechToText: OPENAI_API_KEY ? 'enabled' : 'disabled',
      textToSpeech: isTTSAvailable() ? 'enabled' : 'disabled'
    },
    endpoints: {
      voiceChat: 'POST /voice-chat (with audio file)',
      clearHistory: 'POST /voice-chat/clear',
      test: 'GET /voice-chat/test'
    }
  });
});

export default router;
