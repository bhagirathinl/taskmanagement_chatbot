/**
 * Chatbot Service Entry Point (ES6 Module)
 * Main server file with chat and bulletin routes
 */

import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import bulletinRoutes from './routes/bulletin.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/chat', chatRoutes);
app.use('/bulletin', bulletinRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'chatbot',
    endpoints: {
      chat: '/chat',
      bulletin: '/bulletin',
      health: '/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Management Chatbot API',
    version: '1.0.0',
    services: {
      chat: 'AI-powered task management assistant',
      bulletin: 'Personalized news bulletin generator'
    },
    endpoints: {
      'POST /chat': 'Send a chat message',
      'POST /chat/clear': 'Clear conversation memory',
      'GET /bulletin/user/:userId': 'Get personalized bulletin',
      'GET /bulletin/test': 'Test bulletin service',
      'GET /health': 'Health check'
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
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});