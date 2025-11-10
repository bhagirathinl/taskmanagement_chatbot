# Task Management System Integration

This document describes how the Akool Streaming Avatar is integrated with your task management system.

## Overview

The avatar now has the ability to query your task management system and provide natural language responses about tasks, projects, users, and analytics. This is implemented using a **Smart Middleware** approach that intercepts user messages and routes task-related queries to your API.

## Architecture

```
User Message
    ↓
StreamingContext.sendMessage()
    ↓
TaskQueryMiddleware.detectIntent() ← Checks if message is task-related
    ↓
[If Task Query]
    ↓
TaskManagementService.executeQuery() ← Calls your API
    ↓
TaskQueryMiddleware.formatResponse() ← Formats in natural language
    ↓
Provider.sendMessage(formatted response) → Avatar speaks the response
```

## Features

### 1. Automatic Query Detection

The middleware automatically detects task-related queries using keyword matching and pattern recognition. No need for special syntax!

### 2. Supported Queries

#### All Tasks
- "Show me all tasks"
- "List all tasks"
- "What are the tasks?"

#### Task by ID
- "Show me task 5"
- "Get task ID 12"
- "What is task 3?"

#### Tasks by User
- "Show tasks for user 3"
- "Get user 4 tasks"
- "What tasks does user 2 have?"

#### Tasks by Status
- "Show me pending tasks"
- "What are the completed tasks?"
- "List tasks in progress"
- "Show me tasks on hold"

#### Overdue Tasks
- "What tasks are overdue?"
- "Show me late tasks"
- "Which tasks missed their deadline?"

#### Project Tasks
- "Show tasks for project 1"
- "What are project 2 tasks?"
- "List project 3 tasks"

#### Project Summary
- "Show project 1 summary"
- "Get summary for project 2"

#### User Workload
- "What is user 3's workload?"
- "Show workload for user 4"
- "How much work does user 2 have?"

#### Dashboard Analytics
- "Show me the dashboard"
- "Get analytics"
- "What are the statistics?"
- "Give me an overview"

#### All Projects
- "Show all projects"
- "List projects"
- "What projects are there?"

### 3. Natural Language Responses

The middleware formats API responses into natural language that the avatar can speak naturally. For example:

**Query:** "Show me all tasks"

**API Response:**
```json
[
  {
    "id": 1,
    "description": "Create wireframes",
    "status": "completed",
    "assigned_to_name": "Carol Lee",
    "due_date": "2025-10-10"
  },
  // ... more tasks
]
```

**Formatted Response:**
"I found 7 tasks. Task 1: Create wireframes (completed, assigned to Carol Lee, due 2025-10-10). Task 2: Develop responsive layout (in progress, assigned to David Kim, due 2025-10-25). And 5 more tasks."

## Configuration

### 1. Environment Variables (Optional)

Add to your `.env` file:

```env
VITE_TASK_API_BASE_URL=http://localhost:3000
```

### 2. UI Configuration

In the application UI:

1. Navigate to the **Configuration Panel**
2. Scroll to the **TASK MANAGEMENT API** section
3. Check **"Enable Task Management Integration"**
4. Enter your **Task API Base URL** (default: `http://localhost:3000`)
5. Start the streaming session

### 3. Runtime Configuration

The settings are persisted in localStorage, so you only need to configure once.

## Usage

### Step 1: Start Your Task Management API

Ensure your task management API is running:

```bash
cd /Users/bhagirathi/projects/git-apps/taskmanagement_chatbot
docker-compose up -d
```

The API should be available at `http://localhost:3000`

### Step 2: Start the Avatar Application

```bash
cd /Users/bhagirathi/projects/git-apps/akool-streaming-avatar-react-demo
pnpm install
pnpm dev
```

### Step 3: Configure and Connect

1. Configure your Akool API credentials
2. Enable Task Management Integration
3. Verify the Task API Base URL is correct
4. Start streaming session
5. Ask task-related questions!

### Step 4: Test Queries

Try these sample queries:

- "Show me all tasks"
- "What tasks are overdue?"
- "Get tasks for user 3"
- "Show me the dashboard"
- "What are the pending tasks?"

## Implementation Details

### Files Created/Modified

#### New Files:
1. **`src/services/taskManagementService.ts`**
   - Service wrapper for your task management API
   - Provides type-safe methods for all API endpoints
   - Handles errors and network issues

2. **`src/services/taskQueryMiddleware.ts`**
   - Intent detection using pattern matching
   - Query execution via TaskManagementService
   - Response formatting for natural language

#### Modified Files:
1. **`src/stores/configurationStore.ts`**
   - Added `taskApiEnabled` (boolean)
   - Added `taskApiBaseUrl` (string)
   - Added setters for both settings
   - Persisted to localStorage

2. **`src/contexts/StreamingContext.tsx`**
   - Integrated TaskQueryMiddleware
   - Intercepts `sendMessage()` calls
   - Processes task queries before sending to provider

3. **`src/components/ConfigurationPanel/index.tsx`**
   - Added "TASK MANAGEMENT API" section
   - Checkbox to enable/disable integration
   - Input field for base URL
   - Help text with example queries

## API Endpoints Used

The integration uses these endpoints from your task management API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tasks` | GET | Get all tasks |
| `/tasks/id/:taskId` | GET | Get task by ID |
| `/tasks/user/:userId` | GET | Get tasks for user |
| `/tasks/status/:status` | GET | Get tasks by status |
| `/tasks/overdue/all` | GET | Get overdue tasks |
| `/projects` | GET | Get all projects |
| `/projects/:id/summary` | GET | Get project summary |
| `/projects/:id/tasks` | GET | Get project tasks |
| `/users/:id/workload` | GET | Get user workload |
| `/analytics/dashboard` | GET | Get dashboard analytics |

## Extending the Integration

### Adding New Query Types

To add support for new queries:

1. **Add pattern matching in `detectIntent()`:**

```typescript
// In taskQueryMiddleware.ts
if (lowerMessage.match(/high\s+priority/i)) {
  return {
    isTaskQuery: true,
    queryType: 'high_priority_tasks',
    parameters: {},
    confidence: 0.85,
  };
}
```

2. **Add API call in `executeQuery()`:**

```typescript
case 'high_priority_tasks':
  return await this.taskService.getTasksByPriority('high');
```

3. **Add formatter in `formatResponse()`:**

```typescript
case 'high_priority_tasks':
  return this.formatHighPriorityTasks(data as Task[]);
```

### Adding New API Methods

To support new endpoints:

1. **Add method to `TaskManagementService`:**

```typescript
async getTasksByPriority(priority: string): Promise<Task[]> {
  return this.fetchApi<Task[]>(`/tasks/priority/${priority}`);
}
```

2. Add corresponding types if needed
3. Update middleware to use the new method

## Troubleshooting

### Avatar doesn't respond to task queries

1. **Check Task API is enabled:**
   - Open Configuration Panel
   - Verify "Enable Task Management Integration" is checked

2. **Verify Task API is running:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check browser console for errors:**
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed API calls

4. **Verify Task API URL:**
   - Ensure it matches your running API
   - Default: `http://localhost:3000`

### CORS errors

If you see CORS errors in the console, your task management API needs to allow requests from the avatar app:

Add to your task API (in `taskmanagement_chatbot/app/index.js`):

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### Queries not being detected

1. **Check query patterns:**
   - Ensure your query matches supported patterns
   - Check `taskQueryMiddleware.ts` for pattern matching logic

2. **Check confidence threshold:**
   - Middleware only processes queries with confidence >= 0.7
   - Lower the threshold if needed

3. **Enable logging:**
   - Open Developer Tools Console
   - Look for "Task query detected and processed" messages

## Performance Considerations

### Response Limits

The middleware limits the number of items shown in responses to avoid overwhelming the user:

- All tasks: Shows first 5, mentions count of remaining
- User tasks: Shows first 3
- Status-based tasks: Shows first 5

### Caching (Future Enhancement)

Consider implementing caching for frequently accessed data:

```typescript
// Example: Cache dashboard analytics for 5 minutes
private dashboardCache: { data: DashboardAnalytics; timestamp: number } | null = null;

async getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const now = Date.now();
  if (this.dashboardCache && now - this.dashboardCache.timestamp < 300000) {
    return this.dashboardCache.data;
  }

  const data = await this.fetchApi<DashboardAnalytics>('/analytics/dashboard');
  this.dashboardCache = { data, timestamp: now };
  return data;
}
```

## Security Considerations

### Current Implementation

- No authentication required (task API is open)
- All API calls from browser (client-side)
- Task API URL configurable by user

### Production Recommendations

1. **Add Authentication:**
   - Implement JWT tokens or API keys
   - Store credentials securely
   - Don't expose in client-side code

2. **Use Backend Proxy:**
   - Route API calls through your backend
   - Keep task API credentials server-side
   - Implement rate limiting

3. **Input Validation:**
   - Validate user IDs, project IDs, etc.
   - Sanitize query parameters
   - Prevent injection attacks

## Future Enhancements

### 1. Task Creation

Allow avatar to create tasks:
- "Create a task for user 3 to review the homepage"
- Requires POST endpoint support

### 2. Task Updates

Allow avatar to update task status:
- "Mark task 5 as completed"
- Requires PUT endpoint support

### 3. Complex Queries

Support more complex queries:
- "Show me tasks due this week"
- "Who has the most overdue tasks?"
- Requires date parsing and aggregation

### 4. Voice Commands

Optimize for voice interactions:
- Shorter responses for better speech synthesis
- Confirmation prompts for actions
- Contextual follow-up questions

### 5. Real-time Updates

Subscribe to task updates:
- WebSocket connection to task API
- Push notifications for new/updated tasks
- Real-time dashboard refresh

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify your task API is running and accessible
3. Review the query patterns in `taskQueryMiddleware.ts`
4. Check the configuration in localStorage

## License

This integration is part of the Akool Streaming Avatar React Demo project.
