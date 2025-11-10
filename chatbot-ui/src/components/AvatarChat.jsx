import React from 'react';
import './AvatarChat.css';

function AvatarChat() {
  const AVATAR_URL = 'http://localhost:5173/streaming/avatar';

  return (
    <div className="avatar-chat-container">
      <div className="avatar-info">
        <h3>🎭 Akool Streaming Avatar</h3>
        <p>Interact with a visual AI assistant using voice or text. Already connected to your task management system!</p>
      </div>
      <div className="avatar-iframe-wrapper">
        <iframe
          src={AVATAR_URL}
          className="avatar-iframe"
          title="Akool Avatar Chat"
          allow="camera; microphone; autoplay; display-capture"
        />
      </div>
    </div>
  );
}

export default AvatarChat;
