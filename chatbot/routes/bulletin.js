/**
 * Bulletin Routes with TTS Support (ES6 Module)
 * API endpoints for generating and retrieving bulletins with optional audio
 */

import express from 'express';
import { generateBulletin } from '../services/bulletinGenerator.js';
import { 
  generateSpeechWithRetry, 
  isTTSAvailable, 
  getTTSStats 
} from '../services/ttsService.js';

const router = express.Router();

/**
 * GET /bulletin/user/:userId?voice=true
 * Generate a personalized bulletin for a specific user
 * Optional: Add ?voice=true to include audio
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const includeVoice = req.query.voice === 'true';

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number'
      });
    }

    console.log(`📰 Generating bulletin for user ${userId}${includeVoice ? ' with audio' : ''}...`);
    
    // Generate bulletin
    const bulletin = await generateBulletin(userId);

    // Generate audio if requested and TTS is available
    if (includeVoice) {
      if (!isTTSAvailable()) {
        console.warn('⚠️  Audio requested but TTS is not available');
        bulletin.audio = {
          available: false,
          reason: 'TTS service not initialized. Check OPENAI_API_KEY.'
        };
      } else {
        try {
          const audioInfo = await generateSpeechWithRetry(
            bulletin.bulletin.fullScript,
            userId
          );

          // Add audio info to bulletin
          bulletin.bulletin.audio = {
            available: true,
            url: audioInfo.audioUrl,
            filename: audioInfo.filename,
            duration: audioInfo.estimatedDuration,
            voice: audioInfo.voice,
            fileSize: audioInfo.fileSize
          };

          console.log(`✅ Bulletin with audio generated for user ${userId}`);
        } catch (audioError) {
          console.error('❌ Error generating audio:', audioError.message);
          bulletin.bulletin.audio = {
            available: false,
            reason: 'Failed to generate audio',
            error: audioError.message
          };
        }
      }
    }

    res.json({
      success: true,
      data: bulletin
    });

  } catch (error) {
    console.error('Error in bulletin generation:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID ${req.params.userId}`
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate bulletin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /bulletin/test
 * Test endpoint to verify bulletin service is working
 */
router.get('/test', async (req, res) => {
  const ttsStats = await getTTSStats();
  
  res.json({
    success: true,
    message: 'Bulletin service is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      getUserBulletin: 'GET /bulletin/user/:userId',
      getUserBulletinWithVoice: 'GET /bulletin/user/:userId?voice=true',
      ttsStats: 'GET /bulletin/tts/stats'
    },
    tts: ttsStats
  });
});

/**
 * GET /bulletin/tts/stats
 * Get TTS service statistics
 */
router.get('/tts/stats', async (req, res) => {
  try {
    const stats = await getTTSStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;