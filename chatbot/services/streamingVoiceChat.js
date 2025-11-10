/**
 * Streaming Voice Chat Service (ES6 Module)
 * WebSocket-based real-time voice chat with streaming TTS
 */

import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getChatResponse } from '../agent/agent.js';
import { getFormattedHistory, addMessage } from '../agent/memory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const VOICE = process.env.TTS_VOICE || 'nova';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Initialize WebSocket server for streaming voice chat
 */
export function initializeVoiceChatWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/voice-chat' });

  console.log('🎤 WebSocket voice chat server initialized at /ws/voice-chat');

  wss.on('connection', (ws) => {
    console.log('🔌 New voice chat WebSocket connection');

    let sessionId = `session-${Date.now()}`;
    let audioChunks = [];
    let isProcessing = false;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'init':
            sessionId = message.sessionId || sessionId;
            console.log(`📱 Voice chat session initialized: ${sessionId}`);
            ws.send(JSON.stringify({
              type: 'ready',
              sessionId: sessionId
            }));
            break;

          case 'audio-chunk':
            // Accumulate audio chunks
            audioChunks.push(Buffer.from(message.data, 'base64'));
            break;

          case 'audio-end':
            if (isProcessing) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Already processing a request'
              }));
              return;
            }

            isProcessing = true;
            await processAudioMessage(ws, sessionId, audioChunks);
            audioChunks = [];
            isProcessing = false;
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log(`🔌 Voice chat WebSocket connection closed for session ${sessionId}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

/**
 * Process accumulated audio chunks
 */
async function processAudioMessage(ws, sessionId, audioChunks) {
  let tempAudioPath = null;

  try {
    // Step 1: Save audio chunks to temporary file
    const timestamp = Date.now();
    tempAudioPath = path.join(UPLOADS_DIR, `temp_${sessionId}_${timestamp}.webm`);
    const audioBuffer = Buffer.concat(audioChunks);
    fs.writeFileSync(tempAudioPath, audioBuffer);

    console.log(`🎧 Processing audio (${audioBuffer.length} bytes) for session ${sessionId}`);

    // Step 2: Transcribe with Whisper
    ws.send(JSON.stringify({
      type: 'transcribing',
      message: 'Transcribing your message...'
    }));

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempAudioPath),
      model: 'whisper-1',
      language: 'en'
    });

    const userMessage = transcription.text;
    console.log(`📝 Transcribed: "${userMessage}"`);

    ws.send(JSON.stringify({
      type: 'transcription',
      text: userMessage
    }));

    // Step 3: Get conversation history
    const conversationHistory = getFormattedHistory(sessionId);

    // Step 4: Get AI response using agent with tools
    ws.send(JSON.stringify({
      type: 'thinking',
      message: 'Thinking...'
    }));

    // Use the agent which has access to task management tools
    const fullResponse = await getChatResponse(userMessage, conversationHistory);

    console.log(`🤖 AI Response: "${fullResponse.substring(0, 100)}..."`);

    // Send the full text immediately (no delay)
    ws.send(JSON.stringify({
      type: 'text-complete',
      text: fullResponse
    }));

    // Save to history
    addMessage(sessionId, { role: 'user', content: userMessage });
    addMessage(sessionId, { role: 'assistant', content: fullResponse });

    // Step 5: Generate and stream TTS audio immediately
    ws.send(JSON.stringify({
      type: 'generating-audio',
      message: 'Generating voice response...'
    }));

    await streamTTSAudio(ws, fullResponse);

    ws.send(JSON.stringify({
      type: 'complete',
      message: 'Response complete'
    }));

    // Clean up temp file
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }

  } catch (error) {
    console.error('Error processing audio message:', error);

    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));

    // Clean up on error
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  }
}

/**
 * Stream TTS audio to WebSocket client
 */
async function streamTTSAudio(ws, text) {
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: VOICE,
      input: text,
      response_format: 'mp3',
      speed: 1.0
    });

    // Convert response to buffer and send
    const buffer = Buffer.from(await response.arrayBuffer());

    // Send audio in larger chunks for smoother playback
    const chunkSize = 32768; // 32KB chunks for faster delivery
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, i + chunkSize);

      ws.send(JSON.stringify({
        type: 'audio-chunk',
        data: chunk.toString('base64'),
        isLast: i + chunkSize >= buffer.length
      }));

      // No delay - send chunks as fast as possible
    }

    console.log(`🔊 Streamed ${buffer.length} bytes of audio`);

  } catch (error) {
    console.error('Error streaming TTS audio:', error);
    throw error;
  }
}
