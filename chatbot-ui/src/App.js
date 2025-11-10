import React, { useState, useEffect, useRef } from 'react';
import VoiceChat from './components/VoiceChat';
import RealtimeVoiceChat from './components/RealtimeVoiceChat';
import AvatarChat from './components/AvatarChat';
import './App.css';

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState('chat');

  // Chat state
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const chatContainerRef = useRef(null);

  const API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:4000';

  // Auto-scroll to bottom whenever chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId })
      });

      const data = await res.json();
      const assistantMessage = { role: 'assistant', content: data.reply };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = { role: 'assistant', content: '⚠️ Failed to reach chatbot.' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    setChatHistory([]);
    try {
      await fetch(`${API_URL}/chat/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🧠 AI Project Manager</h1>
        
        {/* Tab Navigation */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Text Chat
          </button>
          <button
            className={`tab ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveTab('voice')}
          >
            🎤 Voice Chat
          </button>
          <button
            className={`tab ${activeTab === 'realtime' ? 'active' : ''}`}
            onClick={() => setActiveTab('realtime')}
          >
            🎙️ Realtime Voice
          </button>
          <button
            className={`tab ${activeTab === 'avatar' ? 'active' : ''}`}
            onClick={() => setActiveTab('avatar')}
          >
            🎭 Avatar
          </button>
        </div>
      </header>

      <main className="app-content">
        {/* Text Chat Tab */}
        {activeTab === 'chat' && (
          <div className="tab-content">
            <div className="chat-section">
              <div className="chat-container" ref={chatContainerRef}>
                {chatHistory.length === 0 && (
                  <div className="empty-state">
                    💬 Start by asking about projects, tasks, or team members!
                  </div>
                )}

                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <strong>{msg.role === 'user' ? '👤 You' : '🤖 Assistant'}:</strong>
                    <pre>{msg.content}</pre>
                  </div>
                ))}

                {loading && (
                  <div className="message assistant loading">
                    <strong>🤖 Assistant:</strong>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
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
                  <button onClick={sendMessage} disabled={loading || !message.trim()}>
                    {loading ? '⏳ Thinking...' : '📤 Send'}
                  </button>
                  <button onClick={clearChat} className="clear-btn" disabled={loading}>
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Chat Tab */}
        {activeTab === 'voice' && (
          <div className="tab-content">
            <VoiceChat />
          </div>
        )}

        {/* Realtime Voice Chat Tab */}
        {activeTab === 'realtime' && (
          <div className="tab-content">
            <RealtimeVoiceChat />
          </div>
        )}

        {/* Avatar Chat Tab */}
        {activeTab === 'avatar' && (
          <div className="tab-content">
            <AvatarChat />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
