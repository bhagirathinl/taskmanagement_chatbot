# 💬 Chatbot UI - Frontend Interface

A modern, responsive React web application for interacting with the AI project management assistant.

## 🎯 Overview

The Chatbot UI provides an intuitive chat interface where users can communicate with the AI assistant in natural language to manage projects, tasks, and team members.

## ✨ Features

- 💬 **Real-time Chat Interface** - Smooth, responsive messaging
- 🎨 **Modern Design** - Clean, professional UI with typing indicators
- 📱 **Responsive Layout** - Works on desktop, tablet, and mobile
- 🔄 **Auto-scroll** - Automatically scrolls to latest messages
- 💾 **Session Persistence** - Maintains conversation context
- ⌨️ **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line
- 🎭 **Message History** - View full conversation thread
- 🧹 **Clear Chat** - Reset conversation when needed

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
cd ../  # Go to project root
docker-compose up -d chatbot-ui
```

Access at: http://localhost:4500

### Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export HOST=0.0.0.0
export PORT=3000
export REACT_APP_CHATBOT_API_URL=http://localhost:4000

# Start development server
npm start
```

The UI will be available at `http://localhost:3000`

## 📦 Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-scripts": "5.0.1",
  "web-vitals": "^2.1.4",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^13.5.0"
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         React Application           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │        App Component          │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │   State Management      │ │ │
│  │  │  - chatHistory          │ │ │
│  │  │  - message              │ │ │
│  │  │  - loading              │ │ │
│  │  │  - sessionId            │ │ │
│  │  └─────────────────────────┘ │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │    Chat Container       │ │ │
│  │  │  - Message Display      │ │ │
│  │  │  - Auto-scroll          │ │ │
│  │  │  - Typing Indicator     │ │ │
│  │  └─────────────────────────┘ │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │     Input Area          │ │ │
│  │  │  - Text Input           │ │ │
│  │  │  - Send Button          │ │ │
│  │  │  - Clear Button         │ │ │
│  │  └─────────────────────────┘ │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              │
              ▼
    Chatbot API (Port 4000)
```

## 🎨 User Interface

### Main Components

#### Header
```jsx
<h1>🧠 Project Management Assistant</h1>
```

Simple, clean header that identifies the application.

#### Chat Container
```jsx
<div className="chat-container" ref={chatContainerRef}>
  {/* Messages display here */}
</div>
```

Scrollable container that displays the conversation history.

#### Message Display
```jsx
<div className="message user">
  <strong>👤 You:</strong>
  <pre>{message.content}</pre>
</div>

<div className="message assistant">
  <strong>🤖 Assistant:</strong>
  <pre>{message.content}</pre>
</div>
```

User and assistant messages with distinct styling.

#### Input Area
```jsx
<textarea
  rows={3}
  value={message}
  onChange={e => setMessage(e.target.value)}
  onKeyPress={handleKeyPress}
  placeholder="Ask me about projects, tasks, or team members..."
/>
```

Multi-line text input for composing messages.

#### Action Buttons
```jsx
<button onClick={sendMessage} disabled={loading}>
  {loading ? '⏳ Thinking...' : '📤 Send'}
</button>

<button onClick={clearChat} className="clear-btn">
  🗑️ Clear
</button>
```

## 💻 Component Code

### App.js - Main Component

```jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // State management
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  
  // Reference for auto-scroll
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  // Send message to chatbot
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const res = await fetch(
        `${process.env.REACT_APP_CHATBOT_API_URL}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId })
        }
      );
      
      const data = await res.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: data.reply 
      };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = { 
        role: 'assistant', 
        content: '⚠️ Failed to reach chatbot.' 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation
  const clearChat = async () => {
    setChatHistory([]);
    try {
      await fetch(
        `${process.env.REACT_APP_CHATBOT_API_URL}/chat/clear`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        }
      );
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  // Keyboard shortcuts
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="App">
      <h1>🧠 Project Management Assistant</h1>
      
      <div className="chat-container" ref={chatContainerRef}>
        {chatHistory.length === 0 && (
          <div className="empty-state">
            💬 Start by asking about projects, tasks, or team members!
          </div>
        )}
        
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>
              {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}:
            </strong>
            <pre>{msg.content}</pre>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant loading">
            <strong>🤖 Assistant:</strong>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <textarea
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about projects, tasks, or team members..."
          disabled={loading}
        />
        <div className="button-group">
          <button 
            onClick={sendMessage} 
            disabled={loading || !message.trim()}
          >
            {loading ? '⏳ Thinking...' : '📤 Send'}
          </button>
          <button 
            onClick={clearChat} 
            className="clear-btn" 
            disabled={loading}
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
```

## 🎨 Styling

### App.css - Main Styles

Key style features:

- **Gradient Background**: Modern purple-blue gradient
- **Card-based Layout**: Elevated chat container with shadow
- **Message Bubbles**: Distinct styles for user vs assistant
- **Animations**: Smooth transitions and typing indicator
- **Responsive Design**: Adapts to different screen sizes

### Color Scheme

```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --user-bg: #e0e7ff;
  --assistant-bg: #f3f4f6;
  --border-color: #e5e7eb;
  --text-color: #1f2937;
}
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in `chatbot-ui/` directory:

```env
# Backend API URL
REACT_APP_CHATBOT_API_URL=http://localhost:4000

# Development server settings
HOST=0.0.0.0
PORT=3000
```

**Important:** Environment variables in React must start with `REACT_APP_`

### Docker Configuration

For Docker deployment, set in `docker-compose.yml`:

```yaml
chatbot-ui:
  environment:
    HOST: 0.0.0.0                              # Required for Docker
    PORT: 3000                                  # Internal port
    REACT_APP_CHATBOT_API_URL: http://localhost:4000  # API URL
  ports:
    - "4500:3000"  # Map host 4500 to container 3000
```

## 🚀 Features in Detail

### Session Management

Each chat session gets a unique ID:

```javascript
const [sessionId] = useState(() => `session-${Date.now()}`);
```

This maintains conversation context across multiple messages.

### Auto-scroll

Messages automatically scroll to bottom:

```javascript
useEffect(() => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop = 
      chatContainerRef.current.scrollHeight;
  }
}, [chatHistory, loading]);
```

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message

```javascript
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};
```

### Loading States

Visual feedback while waiting for responses:

```javascript
{loading && (
  <div className="message assistant loading">
    <strong>🤖 Assistant:</strong>
    <div className="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  </div>
)}
```

### Error Handling

Graceful error messages:

```javascript
catch (err) {
  console.error('Error:', err);
  const errorMessage = { 
    role: 'assistant', 
    content: '⚠️ Failed to reach chatbot.' 
  };
  setChatHistory(prev => [...prev, errorMessage]);
}
```

## 📱 Responsive Design

The UI adapts to different screen sizes:

```css
/* Mobile */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 250px);
  }
  
  textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .App {
    max-width: 90%;
  }
}
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Files

- `App.test.js` - Component tests
- `setupTests.js` - Test configuration

### Manual Testing

1. **Send Message**: Type message and click Send
2. **Keyboard Shortcut**: Press Enter to send
3. **Clear Chat**: Click Clear button
4. **Error Handling**: Disconnect backend and try sending
5. **Long Messages**: Test with lengthy responses
6. **Mobile View**: Test on different screen sizes

## 🐛 Debugging

### Common Issues

**"Failed to reach chatbot"**
- Check if chatbot service is running: `docker-compose ps chatbot`
- Verify API URL in environment variables
- Check browser console for CORS errors

**UI not loading**
- Check if React dev server is running
- Verify HOST=0.0.0.0 is set (for Docker)
- Check browser console for errors

**Messages not displaying**
- Check React DevTools for state updates
- Verify API response format
- Check console for JSON parsing errors

### Browser Console

Open DevTools (F12) to see:
- Network requests
- Console logs
- React component tree
- State updates

## 🎯 Usage Examples

### Basic Conversation

1. Open http://localhost:4500
2. Type: "Show me all projects"
3. Click Send or press Enter
4. View response from assistant

### Complex Query

1. Ask: "What tasks are overdue and who are they assigned to?"
2. Assistant lists overdue tasks with assignees
3. Follow-up: "What's the status of project 1?"
4. Context maintained throughout conversation

## 🔐 Security

### Production Considerations

1. **Environment Variables**: Never commit `.env` to git
2. **API URLs**: Use environment-specific URLs
3. **HTTPS**: Always use HTTPS in production
4. **CSP Headers**: Implement Content Security Policy
5. **Input Sanitization**: React handles this by default

### Best Practices

```javascript
// Validate input
if (!message.trim()) return;

// Limit message length
const maxLength = 2000;
const truncated = message.slice(0, maxLength);

// Sanitize before display (React does this automatically)
<pre>{msg.content}</pre>  // Safe
```

## 🚀 Deployment

### Production Build

```bash
# Create optimized build
npm run build

# Serve with static server
npx serve -s build -p 4500
```

### Docker Production

Update Dockerfile for production:

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-specific Builds

```bash
# Development
npm start

# Staging
REACT_APP_CHATBOT_API_URL=https://staging-api.example.com npm run build

# Production
REACT_APP_CHATBOT_API_URL=https://api.example.com npm run build
```

## 📊 Performance

### Optimization Tips

1. **Code Splitting**: React already implements this
2. **Lazy Loading**: Load components on demand
3. **Memoization**: Use `React.memo` for expensive components
4. **Debouncing**: Debounce input if implementing search

### Monitoring

```javascript
// Track render performance
import { reportWebVitals } from './reportWebVitals';

reportWebVitals(console.log);
```

## 🎨 Customization

### Changing Colors

Edit `App.css`:

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

### Adding Features

**Add file upload:**
```jsx
<input 
  type="file" 
  onChange={handleFileUpload}
  accept="image/*"
/>
```

**Add voice input:**
```jsx
const startListening = () => {
  const recognition = new window.webkitSpeechRecognition();
  recognition.onresult = (event) => {
    setMessage(event.results[0][0].transcript);
  };
  recognition.start();
};
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- [React Hooks](https://react.dev/reference/react)
- [CSS Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

## 🤝 Contributing

When adding new features:

1. Maintain existing design patterns
2. Follow React best practices
3. Add appropriate error handling
4. Test on multiple browsers
5. Update this documentation

## 🔄 Changelog

**v0.1.0** (Current)
- Initial release
- Real-time chat interface
- Auto-scroll functionality
- Typing indicator
- Clear chat feature
- Keyboard shortcuts

---

**Part of the Marketing Chatbot Project** | [Back to Main README](../README.md)