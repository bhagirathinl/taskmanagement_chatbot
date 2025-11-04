/**
 * Bulletin Routes (ES6 Module)
 * API endpoints for generating and retrieving bulletins
 */

import express from 'express';
import { generateBulletin } from '../services/bulletinGenerator.js';

const router = express.Router();

/**
 * GET /bulletin/user/:userId
 * Generate a personalized bulletin for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number'
      });
    }

    console.log(`Generating bulletin for user ${userId}...`);
    const bulletin = await generateBulletin(userId);

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
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Bulletin service is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      getUserBulletin: 'GET /bulletin/user/:userId'
    }
  });
});

export default router;