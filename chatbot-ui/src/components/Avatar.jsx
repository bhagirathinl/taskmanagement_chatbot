import React, { useState, useRef, useEffect } from 'react';
import './Avatar.css';

/**
 * Avatar Component
 * 2D animated character that plays audio bulletins with lip-sync animation
 */
const Avatar = ({ audioUrl, isPlaying, onPlayStateChange }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthState, setMouthState] = useState('closed'); // closed, half, open
  const animationInterval = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      startSpeaking();
    } else {
      stopSpeaking();
    }

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, [isPlaying]);

  const startSpeaking = () => {
    setIsSpeaking(true);
    
    // Animate mouth while speaking (random pattern for natural look)
    animationInterval.current = setInterval(() => {
      const states = ['closed', 'half', 'open', 'half'];
      const randomState = states[Math.floor(Math.random() * states.length)];
      setMouthState(randomState);
    }, 150); // Change mouth position every 150ms
  };

  const stopSpeaking = () => {
    setIsSpeaking(false);
    setMouthState('closed');
    
    if (animationInterval.current) {
      clearInterval(animationInterval.current);
      animationInterval.current = null;
    }
  };

  return (
    <div className="avatar-container">
      <div className={`avatar-character ${isSpeaking ? 'speaking' : ''}`}>
        {/* Avatar Head */}
        <div className="avatar-head">
          {/* Face */}
          <div className="avatar-face">
            {/* Eyes */}
            <div className="avatar-eyes">
              <div className="avatar-eye left">
                <div className="avatar-pupil"></div>
              </div>
              <div className="avatar-eye right">
                <div className="avatar-pupil"></div>
              </div>
            </div>

            {/* Mouth - animated based on speaking state */}
            <div className={`avatar-mouth ${mouthState}`}>
              {mouthState === 'closed' && (
                <div className="mouth-closed"></div>
              )}
              {mouthState === 'half' && (
                <div className="mouth-half"></div>
              )}
              {mouthState === 'open' && (
                <div className="mouth-open"></div>
              )}
            </div>
          </div>
        </div>

        {/* Audio waves indicator when speaking */}
        {isSpeaking && (
          <div className="audio-waves">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="avatar-status">
        {isSpeaking ? (
          <span className="status-speaking">🎤 Speaking...</span>
        ) : (
          <span className="status-idle">💬 Ready</span>
        )}
      </div>
    </div>
  );
};

export default Avatar;
