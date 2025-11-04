import React, { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';
import './BulletinView.css';

/**
 * BulletinView Component
 * Displays bulletin with avatar, audio player, and text transcript
 */
const BulletinView = ({ userId = 1 }) => {
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:4000';

  // Fetch bulletin on mount
  useEffect(() => {
    fetchBulletin();
  }, [userId]);

  const fetchBulletin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CHATBOT_API_URL}/bulletin/user/${userId}?voice=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bulletin');
      }

      const data = await response.json();
      
      if (data.success) {
        setBulletin(data.data);
      } else {
        throw new Error('Invalid bulletin data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching bulletin:', err);
    } finally {
      setLoading(false);
    }
  };

  // Audio event handlers
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bulletin-view loading">
        <div className="spinner"></div>
        <p>Loading your bulletin...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bulletin-view error">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={fetchBulletin} className="btn-retry">
          Try Again
        </button>
      </div>
    );
  }

  // No bulletin state
  if (!bulletin) {
    return (
      <div className="bulletin-view empty">
        <p>No bulletin available</p>
        <button onClick={fetchBulletin} className="btn-load">
          Load Bulletin
        </button>
      </div>
    );
  }

  const hasAudio = bulletin.bulletin?.audio?.available;
  const audioUrl = hasAudio ? `${CHATBOT_API_URL}${bulletin.bulletin.audio.url}` : null;

  return (
    <div className="bulletin-view">
      {/* Header */}
      <div className="bulletin-header">
        <h2>📰 Daily Bulletin</h2>
        <div className="bulletin-meta">
          <span className="user-name">{bulletin.userName}</span>
          <span className="timestamp">
            {new Date(bulletin.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Avatar */}
      <Avatar 
        audioUrl={audioUrl}
        isPlaying={isPlaying}
        onPlayStateChange={setIsPlaying}
      />

      {/* Audio Player */}
      {hasAudio && audioUrl && (
        <div className="audio-player">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Play/Pause Button */}
          <button
            className="btn-play-pause"
            onClick={isPlaying ? handlePause : handlePlay}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* Progress Bar */}
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Replay Button */}
          <button className="btn-replay" onClick={handleReplay} title="Replay">
            🔄
          </button>
        </div>
      )}

      {/* Text Transcript */}
      <div className="bulletin-transcript">
        <h3>Transcript</h3>
        <div className="transcript-text">
          {bulletin.bulletin.fullScript}
        </div>
      </div>

      {/* Metadata */}
      {bulletin.bulletin.metadata && (
        <div className="bulletin-metadata">
          <div className="metadata-item">
            <span className="label">Total Tasks:</span>
            <span className="value">{bulletin.bulletin.metadata.totalTasks || 0}</span>
          </div>
          {bulletin.bulletin.metadata.urgentTasks !== undefined && (
            <div className="metadata-item urgent">
              <span className="label">Urgent:</span>
              <span className="value">{bulletin.bulletin.metadata.urgentTasks}</span>
            </div>
          )}
          <div className="metadata-item">
            <span className="label">Generated by:</span>
            <span className="value">{bulletin.bulletin.metadata.generatedBy || 'template'}</span>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button className="btn-refresh" onClick={fetchBulletin}>
        🔄 Refresh Bulletin
      </button>
    </div>
  );
};

export default BulletinView;
