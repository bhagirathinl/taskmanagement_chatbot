import { useState, useEffect } from 'react';
import AvatarStream from './AvatarStream';
import { createSession, type TRTCCredentials } from '../services/avatarApi';

export default function EmbeddedAvatar() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<TRTCCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-start session on mount
  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await createSession();

      if (!response.success || !response.session) {
        throw new Error(response.error || 'Failed to create avatar session');
      }

      setSessionId(response.session.id);
      setCredentials(response.session.credentials);
    } catch (err) {
      console.error('Session creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to start avatar session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleRetry = () => {
    setSessionId(null);
    setCredentials(null);
    startSession();
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Starting avatar session...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h3>Avatar Error</h3>
          <p>{error}</p>
          <button onClick={handleRetry} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No session yet
  if (!sessionId || !credentials) {
    return (
      <div style={styles.container}>
        <div style={styles.startBox}>
          <h3>Avatar Chat</h3>
          <p>Talk to the AI chatbot through a virtual avatar.</p>
          <button onClick={startSession} style={styles.startButton}>
            Start Avatar
          </button>
        </div>
      </div>
    );
  }

  // Active session - show avatar stream
  return (
    <div style={styles.container}>
      <AvatarStream
        initialCredentials={credentials}
        initialSessionId={sessionId}
        onError={handleError}
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '20px',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #333',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#2c3e50',
    borderRadius: '12px',
    maxWidth: '400px',
  },
  startBox: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#2c3e50',
    borderRadius: '12px',
    maxWidth: '400px',
  },
  startButton: {
    marginTop: '20px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  retryButton: {
    marginTop: '20px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
