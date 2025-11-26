import { useEffect, useRef, useState, useCallback } from 'react';
import TRTC from 'trtc-sdk-v5';
import { sendToChatbot, createSession, closeSession, type TRTCCredentials } from '../services/avatarApi';

interface AvatarStreamProps {
  initialCredentials: TRTCCredentials;
  initialSessionId: string;
  onError: (error: string) => void;
}

interface StreamMessage {
  v: number;
  type: string;
  mid: string;
  idx?: number;
  fin?: boolean;
  pld: {
    text?: string;
    from?: string;
    cmd?: string;
    code?: number;
    msg?: string;
  };
}

export default function AvatarStream({ initialCredentials, initialSessionId, onError }: AvatarStreamProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const videoInnerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<TRTC | null>(null);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const processingRef = useRef(false);
  const sessionIdRef = useRef(initialSessionId);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [isConnected, setIsConnected] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const [lastMessage, setLastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Send message to avatar via TRTC custom message
  const sendMessageToAvatar = useCallback(async (text: string) => {
    const client = clientRef.current;
    if (!client) return;

    const message: StreamMessage = {
      v: 2,
      type: 'chat',
      mid: `msg-${Date.now()}`,
      idx: 0,
      fin: true,
      pld: { text },
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    try {
      client.sendCustomMessage({
        cmdId: 1,
        data: data.buffer,
      });
      console.log('Sent message to avatar:', text);
    } catch (err) {
      console.error('Failed to send message to avatar:', err);
    }
  }, []);

  // Send interrupt command to avatar
  const sendInterrupt = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    const message = {
      v: 2,
      type: 'command',
      mid: `interrupt-${Date.now()}`,
      pld: { cmd: 'interrupt' },
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    try {
      client.sendCustomMessage({
        cmdId: 1,
        data: data.buffer,
      });
      console.log('Sent interrupt to avatar');
    } catch (err) {
      console.error('Failed to send interrupt:', err);
    }
  }, []);

  // Handle incoming messages from avatar
  const handleMessage = useCallback(async (event: { userId: string; data: ArrayBuffer }) => {
    try {
      const text = new TextDecoder().decode(event.data);
      const message: StreamMessage = JSON.parse(text);

      console.log('Received message:', message);

      if (message.type === 'chat' && message.pld?.text) {
        const from = message.pld.from === 'user' ? 'You' : 'Avatar';
        setLastMessage(`${from}: ${message.pld.text}`);

        // If this is a user voice transcription, send to chatbot
        if (message.pld.from === 'user' && !processingRef.current) {
          processingRef.current = true;
          setIsProcessing(true);
          setStatus('Processing your message...');

          try {
            // Interrupt avatar's current speech
            await sendInterrupt();

            // Send to chatbot
            console.log('Sending to chatbot:', message.pld.text);
            const response = await sendToChatbot(message.pld.text);

            if (response.success && response.response) {
              console.log('Chatbot response:', response.response);
              setLastMessage(`Chatbot: ${response.response}`);

              // Send chatbot response to avatar
              await sendMessageToAvatar(response.response);
              setStatus('Avatar is speaking...');
            } else {
              console.error('Chatbot error:', response.error);
              setStatus('Chatbot error - using repeat mode');
            }
          } catch (err) {
            console.error('Chatbot processing failed:', err);
            setStatus('Processing failed');
          } finally {
            processingRef.current = false;
            setIsProcessing(false);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to parse message:', err);
    }
  }, [sendInterrupt, sendMessageToAvatar]);

  // Connect to TRTC
  const connectToTRTC = useCallback(async (creds: TRTCCredentials) => {
    // Clean up existing client
    if (clientRef.current) {
      try {
        await clientRef.current.exitRoom();
        clientRef.current.destroy();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
      clientRef.current = null;
    }

    const client = TRTC.create();
    clientRef.current = client;

    try {
      setStatus('Joining room...');
      console.log('TRTC Credentials:', creds);

      // Set up event handlers
      client.on(TRTC.EVENT.REMOTE_VIDEO_AVAILABLE, async ({ userId, streamType }: { userId: string; streamType: any }) => {
        console.log('Remote video available:', userId, streamType);
        if (videoInnerRef.current && mountedRef.current) {
          await client.startRemoteVideo({
            userId,
            streamType,
            view: videoInnerRef.current,
            option: {
              fillMode: 'cover',
            },
          });

          // Function to force video styles
          const forceVideoStyles = () => {
            if (!videoInnerRef.current) return;

            // Style the inner container
            videoInnerRef.current.style.width = '100%';
            videoInnerRef.current.style.height = '100%';
            videoInnerRef.current.style.display = 'flex';
            videoInnerRef.current.style.alignItems = 'center';
            videoInnerRef.current.style.justifyContent = 'center';

            // Style the video element
            const video = videoInnerRef.current.querySelector('video');
            if (video) {
              video.style.width = '100%';
              video.style.height = '100%';
              video.style.objectFit = 'cover';
              video.style.objectPosition = 'center center';
              video.style.maxWidth = '100%';
              video.style.maxHeight = '100%';
            }

            // Style all TRTC wrapper divs inside the inner container
            const allDivs = videoInnerRef.current.querySelectorAll('div');
            allDivs.forEach(div => {
              const el = div as HTMLElement;
              el.style.width = '100%';
              el.style.height = '100%';
              el.style.display = 'flex';
              el.style.alignItems = 'center';
              el.style.justifyContent = 'center';
            });
          };

          // Force styles immediately and after delays
          forceVideoStyles();
          setTimeout(forceVideoStyles, 100);
          setTimeout(forceVideoStyles, 300);
          setTimeout(forceVideoStyles, 500);
          setTimeout(forceVideoStyles, 1000);
        }
      });

      client.on(TRTC.EVENT.REMOTE_AUDIO_AVAILABLE, async ({ userId }: { userId: string }) => {
        console.log('Remote audio available:', userId);
      });

      // Handle autoplay failure - auto resume
      client.on(TRTC.EVENT.AUTOPLAY_FAILED, async () => {
        console.log('Autoplay failed, attempting to resume...');
        try {
          await client.resumeVideo();
          await client.resumeAudio();
          console.log('Playback resumed');
        } catch (e) {
          console.warn('Auto-resume failed:', e);
        }
      });

      client.on(TRTC.EVENT.CUSTOM_MESSAGE, handleMessage);

      client.on(TRTC.EVENT.KICKED_OUT, () => {
        if (mountedRef.current) {
          setStatus('Disconnected (session ended)');
          setIsConnected(false);
          setIsDisconnected(true);
        }
      });

      // Join the room
      const roomIdNum = parseInt(creds.trtc_room_id);
      const enterRoomParams: {
        sdkAppId: number;
        userId: string;
        userSig: string;
        roomId?: number;
        strRoomId?: string;
      } = {
        sdkAppId: creds.trtc_app_id,
        userId: creds.trtc_user_id,
        userSig: creds.trtc_user_sig,
      };

      if (!isNaN(roomIdNum) && roomIdNum >= 1 && roomIdNum <= 4294967294) {
        enterRoomParams.roomId = roomIdNum;
      } else {
        enterRoomParams.strRoomId = creds.trtc_room_id;
      }

      await client.enterRoom(enterRoomParams);

      if (mountedRef.current) {
        setIsConnected(true);
        setIsDisconnected(false);
        setStatus('Connected - Click on video if no sound, then "Enable Mic" to speak');
        console.log('Connected to TRTC room');
      }
    } catch (err) {
      console.error('Connection failed:', err);
      if (mountedRef.current) {
        setStatus('Connection failed');
        onError(err instanceof Error ? err.message : 'Connection failed');
      }
    }
  }, [handleMessage, onError]);

  // Initial connection
  useEffect(() => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    mountedRef.current = true;

    connectToTRTC(credentials);

    return () => {
      mountedRef.current = false;
      connectingRef.current = false;
      if (clientRef.current) {
        clientRef.current.exitRoom().catch(console.error);
        clientRef.current.destroy();
        clientRef.current = null;
      }
    };
  }, []);

  // Toggle microphone
  const toggleMic = async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      if (isMicEnabled) {
        await client.stopLocalAudio();
        setIsMicEnabled(false);
        setStatus('Microphone disabled');
      } else {
        await client.startLocalAudio();
        setIsMicEnabled(true);
        setStatus('Microphone enabled - Speak now!');
      }
    } catch (err) {
      console.error('Mic toggle failed:', err);
      onError(err instanceof Error ? err.message : 'Microphone error');
    }
  };

  // Disconnect (keeps video visible, shows reconnect button)
  const disconnect = async () => {
    const client = clientRef.current;
    if (client) {
      try {
        await client.stopLocalAudio();
        await client.exitRoom();
      } catch (e) {
        console.warn('Disconnect error:', e);
      }
    }

    // Close the Akool session
    if (sessionIdRef.current) {
      try {
        await closeSession(sessionIdRef.current);
      } catch (e) {
        console.warn('Close session error:', e);
      }
    }

    setIsConnected(false);
    setIsMicEnabled(false);
    setIsDisconnected(true);
    setStatus('Disconnected');
  };

  // Resume playback (for autoplay policy)
  const resumePlayback = async () => {
    const client = clientRef.current;
    if (client) {
      try {
        await client.resumeVideo();
        await client.resumeAudio();
        console.log('Playback resumed via click');
      } catch (e) {
        console.warn('Resume failed:', e);
      }
    }
  };

  // Reconnect with new session
  const reconnect = async () => {
    setIsReconnecting(true);
    setStatus('Creating new session...');

    try {
      const response = await createSession();

      if (!response.success || !response.session) {
        throw new Error(response.error || 'Failed to create session');
      }

      sessionIdRef.current = response.session.id;
      setCredentials(response.session.credentials);
      setIsDisconnected(false);

      await connectToTRTC(response.session.credentials);
    } catch (err) {
      console.error('Reconnect failed:', err);
      setStatus('Reconnection failed');
      onError(err instanceof Error ? err.message : 'Reconnection failed');
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Video Display - click to resume if autoplay blocked */}
      <div id="avatar-video-container" ref={videoRef} style={styles.videoContainer} onClick={resumePlayback}>
        {/* Inner container for TRTC video - kept separate from overlays */}
        <div ref={videoInnerRef} style={styles.videoInner}></div>

        {/* Loading overlay */}
        {!isConnected && !isDisconnected && (
          <div style={styles.placeholder}>
            <div style={styles.loader}></div>
            <p>Connecting to avatar...</p>
          </div>
        )}

        {/* Disconnected overlay with reconnect button */}
        {isDisconnected && (
          <div style={styles.disconnectedOverlay}>
            <button
              onClick={reconnect}
              style={styles.reconnectButton}
              disabled={isReconnecting}
            >
              {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isConnected ? (isProcessing ? '#f39c12' : '#27ae60') : '#e74c3c',
        }}></span>
        <span>{status}</span>
      </div>

      {/* Last Message */}
      {lastMessage && (
        <div style={styles.messageBar}>
          {lastMessage}
        </div>
      )}

      {/* Controls */}
      <div style={styles.controls}>
        {isConnected && (
          <>
            <button
              onClick={toggleMic}
              style={{
                ...styles.button,
                backgroundColor: isMicEnabled ? '#e74c3c' : '#27ae60',
              }}
            >
              {isMicEnabled ? 'Disable Mic' : 'Enable Mic'}
            </button>

            <button
              onClick={disconnect}
              style={{ ...styles.button, backgroundColor: '#7f8c8d' }}
            >
              Disconnect
            </button>
          </>
        )}

        {isDisconnected && (
          <button
            onClick={reconnect}
            style={{ ...styles.button, backgroundColor: '#27ae60' }}
            disabled={isReconnecting}
          >
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </button>
        )}
      </div>

      {/* Style TRTC video and hide autoplay overlay */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Style video element to fill and center */
        #avatar-video-container video {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          object-position: center center !important;
          display: block !important;
          margin: 0 auto !important;
        }

        /* Hide TRTC's autoplay overlay */
        .trtc_autoplay_mask,
        .trtc_autoplay_wrapper,
        [class*="trtc_autoplay"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  videoContainer: {
    width: '100%',
    height: '400px',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
  },
  videoInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    gap: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  disconnectedOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  reconnectButton: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '4px solid #333',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#2c3e50',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#fff',
  },
  messageBar: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#34495e',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    color: '#fff',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};
