const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4700';

export interface TRTCCredentials {
  trtc_app_id: number;
  trtc_user_id: string;
  trtc_user_sig: string;
  trtc_room_id: string;
}

export interface Session {
  id: string;
  credentials: TRTCCredentials;
  stream_type: string;
  status: number;
}

export interface SessionCreateResponse {
  success: boolean;
  session?: Session;
  error?: string;
}

export interface ConfigResponse {
  avatar_id: string;
  voice_id: string;
  language: string;
  mode_type: number;
  stream_type: string;
}

// Get default configuration from backend
export async function getConfig(): Promise<ConfigResponse> {
  const response = await fetch(`${BACKEND_URL}/api/config`);
  return response.json();
}

// Create a new avatar session
export async function createSession(options?: Partial<{
  avatar_id: string;
  voice_id: string;
  language: string;
  mode_type: number;
}>): Promise<SessionCreateResponse> {
  const response = await fetch(`${BACKEND_URL}/api/session/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });
  return response.json();
}

// Close an avatar session
export async function closeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/session/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return response.json();
}

// Send message to chatbot
export async function sendToChatbot(message: string, sessionId?: string): Promise<{ success: boolean; response?: string; error?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  return response.json();
}

// Get chatbot status
export async function getChatbotStatus(): Promise<{ enabled: boolean; url: string }> {
  const response = await fetch(`${BACKEND_URL}/api/chat/status`);
  return response.json();
}
