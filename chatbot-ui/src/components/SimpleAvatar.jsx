import React from 'react';

const AVATAR_UI_URL = process.env.REACT_APP_AVATAR_UI_URL || 'http://localhost:5400';

function SimpleAvatar() {
  return (
    <div className="simple-avatar-container">
      <div className="avatar-header">
        <p>Streaming Avatar powered by Akool - connects to your chatbot</p>
        <a
          href={AVATAR_UI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="open-external-btn"
        >
          Open in New Window
        </a>
      </div>
      <iframe
        src={AVATAR_UI_URL}
        title="Avatar UI"
        className="avatar-iframe"
        allow="microphone; camera; autoplay"
      />
      <style>{`
        .simple-avatar-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .avatar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: #2c3e50;
          border-radius: 8px 8px 0 0;
        }
        .avatar-header p {
          margin: 0;
          color: #888;
          font-size: 14px;
        }
        .open-external-btn {
          padding: 8px 16px;
          background: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 13px;
          transition: background 0.2s;
        }
        .open-external-btn:hover {
          background: #2980b9;
        }
        .avatar-iframe {
          flex: 1;
          width: 100%;
          min-height: 600px;
          border: none;
          border-radius: 0 0 8px 8px;
          background: #1a1a2e;
        }
      `}</style>
    </div>
  );
}

export default SimpleAvatar;
