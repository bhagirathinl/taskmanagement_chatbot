import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  
  // ✅ Add ref for chat container
  const chatContainerRef = useRef(null);
  const API_URL = process.env.REACT_APP_CHATBOT_API_URL;;

  // ✅ Auto-scroll to bottom whenever chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]); // Trigger on chat updates or loading state

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
      await fetch('http://localhost:4000/chat/clear', {
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
      <h1>🧠 Project Management Assistant</h1>
      
      {/* ✅ Add ref to chat container */}
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
  );
}

export default App;