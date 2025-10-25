# 🤖 Chatbot Service - AI Agent

An intelligent conversational agent powered by OpenAI and LangChain that provides natural language access to the project management system.

## 🎯 Overview

The Chatbot Service is an AI-powered agent that acts as an intelligent interface between users and the Tasks API. It uses OpenAI's GPT models and LangChain's agent framework to understand natural language queries and execute appropriate actions.

## ✨ Features

- 🧠 **Natural Language Understanding** - Interprets user intent from conversational queries
- 🔧 **Function Calling** - Executes API calls based on user requests
- 💾 **Conversation Memory** - Maintains context throughout the session
- 🎯 **Smart Routing** - Automatically selects appropriate tools and APIs
- 🔄 **Multi-step Reasoning** - Chains multiple API calls for complex queries
- 📊 **Data Formatting** - Presents API responses in user-friendly formats

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Chatbot Service                │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │       Express Server            │  │
│  │      (Port 4000)                │  │
│  └─────────────┬───────────────────┘  │
│                │                       │
│  ┌─────────────▼───────────────────┐  │
│  │       Chat Routes               │  │
│  │   /chat, /chat/clear            │  │
│  └─────────────┬───────────────────┘  │
│                │                       │
│  ┌─────────────▼───────────────────┐  │
│  │      LangChain Agent            │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │  OpenAI Function Calling │   │  │
│  │  └──────────┬───────────────┘   │  │
│  │  ┌──────────▼───────────────┐   │  │
│  │  │   Tool Executor          │   │  │
│  │  └──────────┬───────────────┘   │  │
│  │  ┌──────────▼───────────────┐   │  │
│  │  │   Memory Manager         │   │  │
│  │  └──────────────────────────┘   │  │
│  └─────────────────────────────────┘  │
│                │                       │
│  ┌─────────────▼───────────────────┐  │
│  │      API Service Layer          │  │
│  │    (Tasks API Integration)      │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 │
                 ▼
          Tasks API (Port 3000)
```

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
cd ../  # Go to project root
docker-compose up -d chatbot
```

### Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export PORT=4000
export API_BASE_URL=http://localhost:3000
export OPENAI_API_KEY=sk-proj-your-api-key-here

# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

The chatbot will be available at `http://localhost:4000`

## 📦 Dependencies

```json
{
  "express": "^4.18.2",           // Web framework
  "cors": "^2.8.5",               // CORS middleware
  "axios": "^1.6.0",              // HTTP client for API calls
  "openai": "^4.27.0",            // OpenAI SDK
  "langchain": "^1.0.1",          // LangChain framework
  "@langchain/openai": "^1.0.0",  // LangChain OpenAI integration
  "@langchain/core": "^1.0.1",    // LangChain core utilities
  "dotenv": "^17.2.3",            // Environment variables
  "zod": "^3.25.76"               // Schema validation
}
```

## 🔌 API Endpoints

### Send Message
```http
POST /chat
```

Send a message to the chatbot and receive an AI-generated response.

**Request Body:**
```json
{
  "message": "Show me all projects in progress",
  "sessionId": "user-session-123"
}
```

**Response:**
```json
{
  "reply": "Here are the projects currently in progress:\n\n1. Website Redesign (Project ID: 1)\n   - Client: Alice Johnson\n   - Deadline: November 15, 2025\n   - Status: in_progress\n\nWould you like more details about any of these projects?"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What tasks are overdue?",
    "sessionId": "test-session"
  }'
```

### Clear Conversation
```http
POST /chat/clear
```

Clear the conversation history for a specific session.

**Request Body:**
```json
{
  "sessionId": "user-session-123"
}
```

**Response:**
```json
{
  "message": "Memory cleared for session: user-session-123"
}
```

## 🛠️ Agent Components

### 1. Agent (agent/agent.js)

The main orchestrator that:
- Receives user messages
- Maintains conversation context
- Selects and executes appropriate tools
- Formats responses

**Key Features:**
- OpenAI function calling for tool selection
- Automatic retry logic
- Error handling and graceful degradation

### 2. Tools (agent/tools.js)

Defines 20+ functions that the agent can call:

#### Project Tools
- `getAllProjects` - List all projects
- `getProjectById` - Get specific project details
- `searchProjectByName` - Search projects by name
- `getProjectSummary` - Get project statistics
- `getProjectTasks` - Get all tasks for a project
- `getProjectTeam` - Get team members on a project
- `updateProject` - Modify project details

#### Task Tools
- `getAllTasks` - List all tasks
- `getTaskById` - Get specific task details
- `getTasksByUser` - Get tasks for a user
- `getTasksByStatus` - Filter tasks by status
- `getTasksByPriority` - Filter tasks by priority
- `getOverdueTasks` - Find overdue tasks
- `updateTaskStatus` - Change task status

#### User Tools
- `getAllUsers` - List all users
- `getUserById` - Get user details
- `searchUserByName` - Search users
- `getUserWorkload` - Get user's task load

#### Analytics Tools
- `getDashboardAnalytics` - Get system-wide statistics

### 3. Tool Executor (agent/toolExecutor.js)

Executes the selected tools by making HTTP requests to the Tasks API.

**Features:**
- Async/await execution
- Error handling
- Response formatting
- Request logging

**Example Function:**
```javascript
async function getAllProjects() {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects`);
    return JSON.stringify(response.data, null, 2);
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
```

### 4. Memory Manager (agent/memory.js)

Manages conversation history per session.

**Features:**
- Session-based storage
- Message history tracking
- Context window management
- Memory cleanup

**Usage:**
```javascript
import { saveMessage, getHistory, clearMemory } from './memory.js';

// Save a message
saveMessage(sessionId, { role: 'user', content: 'Hello' });

// Retrieve history
const history = getHistory(sessionId);

// Clear session
clearMemory(sessionId);
```

## 💬 Example Conversations

### Basic Queries

**User:** "Show me all projects"
**Agent:** Lists all projects with IDs, names, and status

**User:** "What's the status of project 1?"
**Agent:** Provides detailed information about project 1

**User:** "Who is working on the Website Redesign?"
**Agent:** Lists team members and their tasks

### Complex Queries

**User:** "Show me all overdue tasks and who they're assigned to"
**Agent:** 
1. Calls `getOverdueTasks`
2. Formats results with assignee information
3. Presents organized list

**User:** "What's Carol's workload this week?"
**Agent:**
1. Calls `searchUserByName` to find Carol's ID
2. Calls `getUserWorkload` with the ID
3. Summarizes pending and in-progress tasks

### Updates

**User:** "Mark task 5 as completed"
**Agent:**
1. Calls `updateTaskStatus` with task_id=5, status=completed
2. Confirms the update
3. Shows updated task information

## 🧠 How It Works

### 1. User Sends Message

```javascript
POST /chat
{
  "message": "Show me all in-progress tasks",
  "sessionId": "abc123"
}
```

### 2. Agent Processes Query

The agent:
1. Retrieves conversation history from memory
2. Sends message to OpenAI with available tools
3. OpenAI determines which function(s) to call

### 3. Tool Execution

```javascript
// OpenAI selects: getTasksByStatus
const result = await getTasksByStatus({ status: "in_progress" });
```

### 4. Response Generation

The agent:
1. Receives API results
2. Sends results back to OpenAI
3. Gets natural language response
4. Returns to user

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-your-api-key-here
API_BASE_URL=http://app:3000

# Optional
PORT=4000                    # Server port (default: 4500)
NODE_ENV=development         # Environment
```

### OpenAI Model Configuration

The agent uses GPT-4 Turbo by default:

```javascript
const model = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY
});
```

**Model Options:**
- `gpt-4-turbo-preview` - Best reasoning, higher cost
- `gpt-4` - Balanced performance
- `gpt-3.5-turbo` - Faster, lower cost (may have reduced accuracy)

## 🎯 Best Practices

### 1. Tool Design

- Keep tool descriptions clear and specific
- Include examples in descriptions
- Validate parameters
- Return structured JSON when possible

### 2. Error Handling

```javascript
try {
  const result = await executeFunction(name, params);
  return result;
} catch (error) {
  console.error(`Tool execution failed: ${error.message}`);
  return `I encountered an error: ${error.message}`;
}
```

### 3. Memory Management

- Clear old sessions periodically
- Limit history length to prevent token overflow
- Store only relevant messages

### 4. Response Formatting

```javascript
// Good: Structured and readable
"Here are 3 overdue tasks:
1. Task #5: Develop responsive layout (Due: Oct 25)
2. Task #7: Design mockups (Due: Oct 20)
3. Task #9: Write documentation (Due: Oct 22)"

// Bad: Raw JSON dump
"[{id:5,description:'...',due_date:'2025-10-25'}...]"
```

## 🐛 Debugging

### Enable Verbose Logging

```javascript
// In agent.js
console.log('🔍 Tool selection:', functionCall);
console.log('📤 Tool result:', result);
console.log('💬 Final response:', response);
```

### Test Individual Tools

```bash
# Test tool directly
node -e "
const { getProjectById } = require('./agent/toolExecutor.js');
getProjectById({ projectId: '1' }).then(console.log);
"
```

### Check OpenAI Requests

```javascript
// Log OpenAI API calls
console.log('🤖 Sending to OpenAI:', {
  messages: messages.slice(-3), // Last 3 messages
  tools: tools.map(t => t.function.name)
});
```

## 🧪 Testing

### Manual Testing

```bash
# Test basic query
curl -X POST http://localhost:4000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all projects", "sessionId": "test"}'

# Test with context
curl -X POST http://localhost:4000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more about project 1", "sessionId": "test"}'

# Clear memory
curl -X POST http://localhost:4000/chat/clear \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test"}'
```

### Unit Testing

Create `test.js`:

```javascript
import { getAllProjects, getProjectById } from './agent/toolExecutor.js';

async function runTests() {
  console.log('Testing getAllProjects...');
  const projects = await getAllProjects();
  console.log(projects);

  console.log('\nTesting getProjectById...');
  const project = await getProjectById({ projectId: '1' });
  console.log(project);
}

runTests();
```

## 📊 Performance

### Optimization Tips

1. **Cache API Responses**: Implement Redis for frequently accessed data
2. **Limit Context Window**: Keep conversation history under 4000 tokens
3. **Parallel Tool Execution**: Execute independent tools concurrently
4. **Model Selection**: Use GPT-3.5-turbo for simple queries

### Monitoring

```javascript
// Track response times
const startTime = Date.now();
const response = await agent.invoke(message);
const duration = Date.now() - startTime;
console.log(`Response time: ${duration}ms`);
```

## 🔐 Security

### API Key Protection

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Monitor usage at platform.openai.com

### Input Validation

```javascript
// Validate session IDs
if (!sessionId || typeof sessionId !== 'string') {
  return res.status(400).json({ error: 'Invalid session ID' });
}

// Sanitize user input
const sanitizedMessage = message.trim().slice(0, 2000);
```

### Rate Limiting

```javascript
// Implement per-session rate limiting
const requestCount = getRequestCount(sessionId);
if (requestCount > 20) {
  return res.status(429).json({ 
    error: 'Too many requests. Please try again later.' 
  });
}
```

## 🚀 Advanced Features

### Adding New Tools

1. Define the tool in `agent/tools.js`:

```javascript
{
  type: "function",
  function: {
    name: "createNewProject",
    description: "Create a new project with name and client",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        clientId: { type: "string", description: "Client ID" }
      },
      required: ["name", "clientId"]
    }
  }
}
```

2. Implement in `agent/toolExecutor.js`:

```javascript
async function createNewProject({ name, clientId }) {
  const response = await axios.post(`${API_BASE_URL}/projects`, {
    name,
    client_id: clientId
  });
  return JSON.stringify(response.data);
}
```

3. Add to executor map:

```javascript
const functionMap = {
  // ... existing functions
  createNewProject
};
```

### Custom Memory Strategies

```javascript
// Implement sliding window
function getRecentHistory(sessionId, maxMessages = 10) {
  const history = getHistory(sessionId);
  return history.slice(-maxMessages);
}

// Implement summarization
async function summarizeHistory(sessionId) {
  const history = getHistory(sessionId);
  const summary = await openai.createCompletion({
    prompt: `Summarize this conversation:\n${JSON.stringify(history)}`,
    max_tokens: 100
  });
  return summary;
}
```

## 📚 Resources

- [LangChain Documentation](https://js.langchain.com/docs/)
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Agent Best Practices](https://js.langchain.com/docs/modules/agents/)

## 🤝 Contributing

When extending the chatbot:

1. Add clear tool descriptions
2. Implement error handling
3. Test with various queries
4. Update documentation
5. Consider token limits

## 🔄 Changelog

**v1.1.0**
- Added conversation memory
- Implemented 20+ tools
- Added error handling
- Improved response formatting

**v1.0.0**
- Initial release
- Basic function calling
- Core tool set

---

**Part of the Marketing Chatbot Project** | [Back to Main README](../README.md)