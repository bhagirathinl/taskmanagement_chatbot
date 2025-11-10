import React, { useState, useEffect, useRef } from 'react';
import './VoiceChat.css';

function VoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Click microphone to start');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws/voice-chat';

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setStatus('Connected. Click microphone to speak');

      // Send init message
      ws.send(JSON.stringify({
        type: 'init',
        sessionId: sessionIdRef.current
      }));
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'ready':
          console.log('Session ready:', message.sessionId);
          break;

        case 'transcribing':
          setStatus('Transcribing...');
          break;

        case 'transcription':
          setTranscript(message.text);
          setStatus('Got it! Thinking...');
          setChatHistory(prev => [...prev, { role: 'user', text: message.text }]);
          break;

        case 'thinking':
          setAiResponse('');
          setStatus('Thinking...');
          break;

        case 'text-complete':
          setAiResponse(message.text);
          setStatus('Generating voice...');
          break;

        case 'generating-audio':
          setStatus('Speaking...');
          break;

        case 'audio-chunk':
          // Queue audio chunk for playback
          const audioData = Uint8Array.from(atob(message.data), c => c.charCodeAt(0));
          audioQueueRef.current.push(audioData);

          // Start playback immediately when first chunk arrives
          if (!isPlayingRef.current) {
            playAudioQueue();
          }
          break;

        case 'complete':
          setStatus('Response complete. Click to speak again');
          setIsProcessing(false);
          setChatHistory(prev => [...prev, { role: 'assistant', text: aiResponse }]);
          break;

        case 'error':
          console.error('WebSocket error:', message.message);
          setStatus(`Error: ${message.message}`);
          setIsProcessing(false);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setStatus('Connection error. Retrying...');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setStatus('Disconnected. Reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setStatus('Recording... Click again to stop');

    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('Error: Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      setStatus('Processing...');
    }
  };

  const sendAudio = async (audioBlob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setStatus('Not connected to server');
      return;
    }

    try {
      // Convert blob to base64 and send chunks
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = btoa(
          new Uint8Array(reader.result).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        // Send audio in chunks
        const chunkSize = 32768; // 32KB chunks
        for (let i = 0; i < base64Audio.length; i += chunkSize) {
          const chunk = base64Audio.slice(i, i + chunkSize);
          wsRef.current.send(JSON.stringify({
            type: 'audio-chunk',
            data: chunk
          }));
        }

        // Signal end of audio
        wsRef.current.send(JSON.stringify({
          type: 'audio-end'
        }));

        setStatus('Sent! Waiting for response...');
      };

      reader.readAsArrayBuffer(audioBlob);

    } catch (error) {
      console.error('Error sending audio:', error);
      setStatus('Error sending audio');
      setIsProcessing(false);
    }
  };

  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setStatus('Playing audio...');

    try {
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Combine all queued chunks
      const allChunks = audioQueueRef.current;
      audioQueueRef.current = [];

      // Calculate total length
      const totalLength = allChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of allChunks) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }

      // Create blob and decode
      const audioBlob = new Blob([combinedArray], { type: 'audio/mp3' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Play audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onended = () => {
        isPlayingRef.current = false;
        // Check if there are more chunks to play
        if (audioQueueRef.current.length > 0) {
          setTimeout(() => playAudioQueue(), 50);
        } else {
          setStatus('Response complete. Click to speak again');
        }
      };

      source.start(0);

    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
      setStatus('Error playing audio');
    }
  };

  const toggleRecording = () => {
    if (isProcessing) {
      return; // Don't allow recording while processing
    }

    if (isRecording) {
      stopRecording();
    } else {
      setTranscript('');
      setAiResponse('');
      startRecording();
    }
  };

  return (
    <div className="voice-chat">
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="voice-control">
        <button
          className={`mic-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={toggleRecording}
          disabled={!isConnected || isProcessing}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>
        <p className="status-text">{status}</p>
      </div>

      {transcript && (
        <div className="message-box user-message">
          <strong>You:</strong>
          <p>{transcript}</p>
        </div>
      )}

      {aiResponse && (
        <div className="message-box ai-message">
          <strong>Assistant:</strong>
          <p>{aiResponse}</p>
        </div>
      )}

      <div className="chat-history">
        <h3>Chat History</h3>
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`history-message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VoiceChat;
