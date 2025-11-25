require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Akool API configuration
const AKOOL_API_HOST = process.env.AKOOL_API_HOST || 'https://openapi.akool.com';
const AKOOL_API_TOKEN = process.env.AKOOL_API_TOKEN;

// Default session options from .env
const getDefaultSessionOptions = () => ({
  avatar_id: process.env.DEFAULT_AVATAR_ID || 'dvp_Alinna_realisticbg_20241224',
  voice_id: process.env.DEFAULT_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2',
  language: process.env.DEFAULT_LANGUAGE || 'en',
  duration: parseInt(process.env.DEFAULT_DURATION) || 600,
  mode_type: parseInt(process.env.DEFAULT_MODE_TYPE) || 2, // 2 = Repeat mode
  stream_type: process.env.DEFAULT_STREAM_TYPE || 'trtc',
});

// Helper function to call Akool API
async function callAkoolApi(endpoint, method, body) {
  const response = await fetch(`${AKOOL_API_HOST}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${AKOOL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (data.code !== 1000) {
    throw new Error(data.msg || 'Akool API error');
  }

  return data.data;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get default configuration
app.get('/api/config', (req, res) => {
  const defaults = getDefaultSessionOptions();
  res.json({
    avatar_id: defaults.avatar_id,
    voice_id: defaults.voice_id,
    language: defaults.language,
    mode_type: defaults.mode_type,
    stream_type: defaults.stream_type,
  });
});

// Create avatar session
app.post('/api/session/create', async (req, res) => {
  try {
    const defaults = getDefaultSessionOptions();

    // Merge request body with defaults
    const sessionOptions = {
      avatar_id: req.body.avatar_id || defaults.avatar_id,
      voice_id: req.body.voice_id || defaults.voice_id,
      language: req.body.language || defaults.language,
      duration: req.body.duration || defaults.duration,
      mode_type: req.body.mode_type !== undefined ? req.body.mode_type : defaults.mode_type,
      stream_type: req.body.stream_type || defaults.stream_type,
    };

    // Add optional fields if provided
    if (req.body.background_url) {
      sessionOptions.background_url = req.body.background_url;
    }
    if (req.body.voice_url) {
      sessionOptions.voice_url = req.body.voice_url;
    }
    if (req.body.knowledge_id) {
      sessionOptions.knowledge_id = req.body.knowledge_id;
    }

    console.log('Creating session with options:', sessionOptions);

    const session = await callAkoolApi(
      '/api/open/v4/liveAvatar/session/create',
      'POST',
      sessionOptions
    );

    console.log('Session created:', session._id);

    res.json({
      success: true,
      session: {
        id: session._id,
        credentials: session.credentials,
        stream_type: session.stream_type,
        status: session.status,
      },
    });
  } catch (error) {
    console.error('Failed to create session:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Close avatar session
app.post('/api/session/close', async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'session_id is required',
      });
    }

    await callAkoolApi('/api/open/v4/liveAvatar/session/close', 'POST', {
      id: session_id,
    });

    console.log('Session closed:', session_id);

    res.json({
      success: true,
      message: 'Session closed successfully',
    });
  } catch (error) {
    console.error('Failed to close session:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get available avatars
app.get('/api/avatars', async (req, res) => {
  try {
    const data = await callAkoolApi(
      '/api/open/v4/liveAvatar/avatar/list?page=1&size=100',
      'GET'
    );

    res.json({
      success: true,
      avatars: data.result || [],
    });
  } catch (error) {
    console.error('Failed to get avatars:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get available voices
app.get('/api/voices', async (req, res) => {
  try {
    const type = req.query.type || 2; // Default to Akool voices
    const data = await callAkoolApi(
      `/api/open/v4/voice/list?support_stream=1&type=${type}`,
      'GET'
    );

    res.json({
      success: true,
      voices: data.result || [],
    });
  } catch (error) {
    console.error('Failed to get voices:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Chatbot configuration
const CHATBOT_API_URL = process.env.CHATBOT_API_URL || 'http://localhost:4000';
const CHATBOT_ENABLED = process.env.CHATBOT_ENABLED === 'true';

// Send message to chatbot and get response
app.post('/api/chat', async (req, res) => {
  try {
    if (!CHATBOT_ENABLED) {
      return res.json({
        success: false,
        error: 'Chatbot is disabled',
      });
    }

    const { message, session_id } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      });
    }

    console.log('Sending to chatbot:', message);

    const response = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: session_id || 'avatar-session',
      }),
    });

    const data = await response.json();
    console.log('Chatbot response:', data);

    res.json({
      success: true,
      response: data.reply || data.response || data.message || data.text || JSON.stringify(data),
    });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get chatbot status
app.get('/api/chat/status', (req, res) => {
  res.json({
    enabled: CHATBOT_ENABLED,
    url: CHATBOT_API_URL,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple Avatar Backend running on port ${PORT}`);
  console.log(`Mode Type: ${process.env.DEFAULT_MODE_TYPE} (${process.env.DEFAULT_MODE_TYPE == 1 ? 'Repeat' : 'AI'})`);
  console.log(`Stream Type: ${process.env.DEFAULT_STREAM_TYPE}`);
  console.log(`Chatbot: ${CHATBOT_ENABLED ? 'Enabled' : 'Disabled'} (${CHATBOT_API_URL})`);
});
