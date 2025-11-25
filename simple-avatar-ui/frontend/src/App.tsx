import { useState, useEffect, useRef } from 'react';
import AvatarStream from './components/AvatarStream';
import { createSession, type Session } from './services/api';

type AppState = 'loading' | 'connected' | 'error';

function App() {
  const [state, setState] = useState<AppState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Auto-start avatar session on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    startSession();
  }, []);

  // Start avatar session
  const startSession = async () => {
    setState('loading');
    setError(null);

    try {
      const response = await createSession();

      if (!response.success || !response.session) {
        throw new Error(response.error || 'Failed to create session');
      }

      setSession(response.session);
      setState('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  // Handle stream errors
  const handleError = (errorMessage: string) => {
    console.error('Stream error:', errorMessage);
    // Don't change state - let AvatarStream handle reconnection
  };

  return (
    <div style={styles.app}>
      <main style={styles.main}>
        {state === 'loading' && (
          <div style={styles.loadingScreen}>
            <div style={styles.spinner}></div>
            <p>Connecting to avatar...</p>
          </div>
        )}

        {state === 'connected' && session && (
          <AvatarStream
            initialCredentials={session.credentials}
            initialSessionId={session.id}
            onError={handleError}
          />
        )}

        {state === 'error' && (
          <div style={styles.errorScreen}>
            <div style={styles.errorIcon}>❌</div>
            <h2>Connection Error</h2>
            <p style={styles.errorMessage}>{error}</p>
            <button onClick={startSession} style={styles.retryButton}>
              Retry
            </button>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingScreen: {
    textAlign: 'center',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #333',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  errorScreen: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  errorMessage: {
    color: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  retryButton: {
    padding: '12px 32px',
    fontSize: '16px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default App;
