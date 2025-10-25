// memory.js - Conversation memory with proper message handling
const conversationHistory = new Map();

export function getHistory(sessionId) {
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }
  return conversationHistory.get(sessionId);
}

export function addMessage(sessionId, message) {
  const history = getHistory(sessionId);
  
  // Store serialized version of the message
  const serialized = {
    role: message.role || message._getType(),
    content: message.content,
    additional_kwargs: message.additional_kwargs || {},
    tool_calls: message.tool_calls || [],
    tool_call_id: message.tool_call_id,
    name: message.name
  };
  
  history.push(serialized);
  
  // Limit history to last 20 messages to avoid token limits
  if (history.length > 20) {
    history.splice(0, 2); // Remove oldest pair
  }
}

export function clearHistory(sessionId) {
  conversationHistory.delete(sessionId);
}

export function getFormattedHistory(sessionId) {
  const history = getHistory(sessionId);
  // Return messages in simple format for LangChain
  return history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}