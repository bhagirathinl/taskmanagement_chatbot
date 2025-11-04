/**
 * Text-to-Speech Service (ES6 Module)
 * Converts bulletin text to audio using OpenAI TTS
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TTS_ENABLED = process.env.ENABLE_TTS !== 'false'; // Enabled by default
const VOICE = process.env.TTS_VOICE || 'nova'; // Female voice
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

// Initialize OpenAI client
let openai = null;
if (TTS_ENABLED && OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
  console.log(`🎤 TTS Service: ENABLED (Voice: ${VOICE})`);
} else if (TTS_ENABLED && !OPENAI_API_KEY) {
  console.warn('⚠️  TTS is enabled but OPENAI_API_KEY is not set. TTS will be disabled.');
} else {
  console.log('🔇 TTS Service: DISABLED');
}

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log(`📁 Created audio directory: ${AUDIO_DIR}`);
}

/**
 * Generate speech from text using OpenAI TTS
 * @param {string} text - Text to convert to speech
 * @param {number} userId - User ID (for filename)
 * @returns {Promise<Object>} Audio file info
 */
async function generateSpeech(text, userId) {
  if (!openai) {
    throw new Error('TTS service not initialized. Check OPENAI_API_KEY.');
  }

  try {
    console.log(`🎤 Generating speech for user ${userId}...`);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `bulletin_user${userId}_${timestamp}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Standard quality (faster, cheaper)
      voice: VOICE,
      input: text,
      response_format: "mp3",
      speed: 1.0 // Normal speed
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Save to file
    await fs.promises.writeFile(filepath, buffer);

    // Calculate estimated duration (rough estimate: ~150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60; // seconds

    console.log(`✅ Audio generated: ${filename} (${buffer.length} bytes, ~${estimatedDuration.toFixed(1)}s)`);

    return {
      filename,
      filepath,
      audioUrl: `/audio/${filename}`,
      fileSize: buffer.length,
      estimatedDuration: parseFloat(estimatedDuration.toFixed(1)),
      voice: VOICE,
      text: text
    };

  } catch (error) {
    console.error('❌ Error generating speech:', error.message);
    throw error;
  }
}

/**
 * Generate speech with retry logic
 * @param {string} text - Text to convert
 * @param {number} userId - User ID
 * @param {number} retries - Number of retries (default: 2)
 * @returns {Promise<Object>} Audio file info
 */
async function generateSpeechWithRetry(text, userId, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await generateSpeech(text, userId);
    } catch (error) {
      if (attempt <= retries) {
        console.warn(`⚠️  TTS attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

/**
 * Check if TTS is available
 * @returns {boolean}
 */
function isTTSAvailable() {
  return TTS_ENABLED && openai !== null;
}

/**
 * Clean up old audio files (older than 24 hours)
 * Call this periodically to save disk space
 */
async function cleanupOldAudioFiles() {
  try {
    const files = await fs.promises.readdir(AUDIO_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.mp3')) {
        const filepath = path.join(AUDIO_DIR, file);
        const stats = await fs.promises.stat(filepath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.promises.unlink(filepath);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old audio files`);
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up audio files:', error.message);
    return 0;
  }
}

/**
 * Get available voices
 * @returns {Array<string>}
 */
function getAvailableVoices() {
  return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
}

/**
 * Get TTS statistics
 * @returns {Promise<Object>}
 */
async function getTTSStats() {
  try {
    const files = await fs.promises.readdir(AUDIO_DIR);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));
    
    let totalSize = 0;
    for (const file of mp3Files) {
      const filepath = path.join(AUDIO_DIR, file);
      const stats = await fs.promises.stat(filepath);
      totalSize += stats.size;
    }

    return {
      enabled: isTTSAvailable(),
      voice: VOICE,
      audioDirectory: AUDIO_DIR,
      cachedFiles: mp3Files.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    return {
      enabled: isTTSAvailable(),
      voice: VOICE,
      error: error.message
    };
  }
}

// Cleanup old files on startup
cleanupOldAudioFiles().catch(console.error);

// Schedule periodic cleanup (every 6 hours)
setInterval(() => {
  cleanupOldAudioFiles().catch(console.error);
}, 6 * 60 * 60 * 1000);

export {
  generateSpeech,
  generateSpeechWithRetry,
  isTTSAvailable,
  cleanupOldAudioFiles,
  getAvailableVoices,
  getTTSStats,
  AUDIO_DIR
};
