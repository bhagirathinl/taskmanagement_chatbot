import React, { useState, useRef, useEffect } from 'react';
import './RealtimeVoiceChat.css';

function RealtimeVoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Click Connect to start');
  const [messages, setMessages] = useState([]);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const currentAssistantMessageRef = useRef(null);

  const API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:4000';

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      updateStatus('Connecting...');

      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Set up audio
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.getTracks().forEach(track => peerConnection.addTrack(track, mediaStream));

      // Set up data channel for events
      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("message", (e) => {
        handleServerMessage(JSON.parse(e.data));
      });

      // Handle incoming audio
      peerConnection.ontrack = (e) => {
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.srcObject = e.streams[0];
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send SDP to our backend
      const response = await fetch(`${API_URL}/realtime-voice/session`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${errorText}`);
      }

      const answerSdp = await response.text();
      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setIsConnected(true);
      updateStatus('Connected - Speak now!');
      addMessage('system', 'Connected! Start speaking to chat with the AI assistant.');

    } catch (error) {
      console.error('Error connecting:', error);
      addMessage('system', `Error: ${error.message}`);
      updateStatus('Disconnected');
      disconnect();
    }
  };

  const disconnect = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsConnected(false);
    updateStatus('Disconnected');
    currentAssistantMessageRef.current = null;
  };

  const handleServerMessage = async (message) => {
    console.log('Received message:', message.type);

    switch (message.type) {
      case 'error':
        addMessage('system', message.message || 'An error occurred');
        break;

      case 'conversation.item.created':
        if (message.item && message.item.role) {
          console.log('Conversation item created:', message.item.role);
        }
        break;

      case 'response.audio_transcript.delta':
        if (message.delta) {
          updateTranscript('assistant', message.delta, true);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript) {
          addMessage('user', message.transcript);
        }
        break;

      case 'input_audio_buffer.speech_started':
        console.log('Speech started');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped');
        break;

      case 'response.function_call_arguments.done':
        // OpenAI is requesting a function call
        console.log('Function call requested:', message);
        await handleFunctionCall(message);
        break;

      case 'response.done':
        console.log('Response completed');
        currentAssistantMessageRef.current = null;
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handleFunctionCall = async (message) => {
    try {
      const { call_id, name, arguments: args } = message;

      addMessage('system', `🔧 Calling function: ${name}...`);

      // Execute the function via our server
      const response = await fetch(`${API_URL}/realtime-voice/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionCall: {
            name: name,
            arguments: args
          }
        })
      });

      const result = await response.json();

      console.log('Function result:', result);

      // Send the function output back through the data channel
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: call_id,
            output: JSON.stringify(result)
          }
        }));

        // Request the assistant to respond
        dataChannelRef.current.send(JSON.stringify({
          type: 'response.create'
        }));
      }

      if (result.success) {
        addMessage('system', `✅ Function ${name} executed successfully`);
      } else {
        addMessage('system', `❌ Function ${name} failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Error handling function call:', error);
      addMessage('system', `Error executing function: ${error.message}`);
    }
  };

  const updateTranscript = (role, text, append = false) => {
    if (role === 'assistant' && append) {
      if (currentAssistantMessageRef.current === null) {
        // Start a new assistant message
        currentAssistantMessageRef.current = text;
        setMessages(prev => [...prev, { role: 'assistant', text }]);
      } else {
        // Append to existing assistant message
        currentAssistantMessageRef.current += text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.text = currentAssistantMessageRef.current;
          }
          return newMessages;
        });
      }
    } else {
      currentAssistantMessageRef.current = null;
      addMessage(role, text);
    }
  };

  const addMessage = (role, text) => {
    setMessages(prev => [...prev, { role, text }]);
    currentAssistantMessageRef.current = null;
  };

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
  };

  return (
    <div className="realtime-voice-chat">
      <div className="connection-section">
        <div className="status-bar">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{status}</span>
        </div>
        <div className="button-group">
          <button
            className="connect-btn"
            onClick={connect}
            disabled={isConnected}
          >
            Connect
          </button>
          <button
            className="disconnect-btn"
            onClick={disconnect}
            disabled={!isConnected}
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="transcript-container">
        <h3>Conversation</h3>
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="role">
                {msg.role === 'user' ? '👤 You' : msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}
              </div>
              <div className="text">{msg.text}</div>
            </div>
          ))}
        </div>
      </div>

      {isConnected && (
        <div className="visualizer">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      )}
    </div>
  );
}

export default RealtimeVoiceChat;
