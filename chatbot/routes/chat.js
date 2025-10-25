// routes/chat.js
import express from 'express';
import { getChatResponse } from '../agent/agent.js';
import { getFormattedHistory, addMessage, clearHistory } from '../agent/memory.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`\n📩 Received message for session ${sessionId}:`, message);

    // Get formatted conversation history (simple {role, content} format)
    const conversationHistory = getFormattedHistory(sessionId);
    console.log(`📚 Loading ${conversationHistory.length} previous messages`);

    // Get AI response with conversation context
    const reply = await getChatResponse(message, conversationHistory);

    // Save user message and assistant reply
    addMessage(sessionId, { role: 'user', content: message });
    addMessage(sessionId, { role: 'assistant', content: reply });

    console.log(`✅ Response generated, history now has ${getFormattedHistory(sessionId).length} messages\n`);

    res.json({ reply, sessionId });
  } catch (error) {
    console.error('❌ Error in chat route:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Endpoint to clear conversation history
router.post('/clear', (req, res) => {
  try {
    const { sessionId = 'default' } = req.body;
    clearHistory(sessionId);
    console.log(`🗑️ Cleared history for session ${sessionId}`);
    res.json({ message: 'Conversation cleared', sessionId });
  } catch (error) {
    console.error('❌ Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Optional: Get current history (for debugging)
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = getFormattedHistory(sessionId);
    res.json({ sessionId, messageCount: history.length, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;