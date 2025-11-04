# UNIT 1: Bulletin Generator Service

## What We Built

A personalized news bulletin system that analyzes your database and creates role-based task briefings.

## Files Created

1. **bulletinGenerator.js** → Core service logic
2. **bulletin.js** → API routes
3. **INTEGRATION_INSTRUCTIONS.txt** → How to add to your existing app

## How It Works

### Step-by-Step Flow:

```
User Request
    ↓
GET /bulletin/user/1
    ↓
bulletin.js (route handler)
    ↓
bulletinGenerator.js
    ↓
Fetches data from Tasks API:
  - User info
  - Tasks (for employees)
  - Projects (for clients)
    ↓
Analyzes urgency:
  - Overdue tasks
  - Due today
  - Due within 3 days
    ↓
Generates script using templates:
  - Client template
  - Employee template
    ↓
Returns JSON with bulletin
```

## Code Explanation

### bulletinGenerator.js

**1. Data Fetching Functions:**
- `fetchUserData(userId)` - Gets user info from API
- `fetchUserTasks(userId)` - Gets user's tasks
- `fetchUserProjects(userId)` - Gets client's projects
- `fetchOverdueTasks()` - Gets all overdue tasks

**2. Analysis Functions:**
- `analyzeTaskUrgency(tasks)` - Categorizes tasks:
  - **Urgent**: Overdue or due today
  - **Due Soon**: Due within 3 days
  - **Upcoming**: Due later

**3. Template Functions:**
- `generateGreeting(userName)` - Time-based greeting (morning/afternoon/evening)
- `generateEmployeeBulletin()` - Script for workers
- `generateClientBulletin()` - Script for project owners

**4. Main Function:**
- `generateBulletin(userId)` - Orchestrates everything

### Example Output (Employee):

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "userName": "Alice Johnson",
    "userEmail": "alice@example.com",
    "role": "employee",
    "bulletin": {
      "greeting": "Good morning, Alice Johnson!",
      "summary": "3 active tasks, 1 urgent",
      "urgent": "Database Migration",
      "fullScript": "Good morning, Alice Johnson! Here's your task briefing. You have 3 active tasks. URGENT: 1 task requires immediate attention. Database Migration is due today. Coming up: 2 tasks are due within the next 3 days. Code Review is due in 2 days. 2 tasks are currently in progress. Have a productive day!",
      "metadata": {
        "totalTasks": 3,
        "urgentTasks": 1,
        "dueSoonTasks": 2,
        "inProgressTasks": 2,
        "pendingTasks": 1,
        "completedTasks": 0
      }
    },
    "timestamp": "2025-11-04T09:30:00.000Z"
  }
}
```

### Example Output (Client):

```json
{
  "success": true,
  "data": {
    "userId": 3,
    "userName": "Bob Smith",
    "userEmail": "bob@company.com",
    "role": "client",
    "bulletin": {
      "greeting": "Good morning, Bob Smith!",
      "summary": "2 projects, 1 in progress",
      "fullScript": "Good morning, Bob Smith! Here's your project update. You have 2 projects. 1 project is currently in progress. Active projects: Website Redesign. Progress: 75 percent complete. Your team is working hard to deliver quality results. Have a great day!",
      "metadata": {
        "totalProjects": 2,
        "projectsByStatus": {
          "pending": 0,
          "in_progress": 1,
          "completed": 1,
          "on_hold": 0
        }
      }
    },
    "timestamp": "2025-11-04T09:30:00.000Z"
  }
}
```

## Installation Steps

### 1. Copy Files to Your Repository

```bash
# Copy to your local repo
cp bulletinGenerator.js YOUR_REPO/chatbot/services/
cp bulletin.js YOUR_REPO/chatbot/routes/
```

### 2. Update Your chatbot/index.js

Add these two lines (see INTEGRATION_INSTRUCTIONS.txt):

```javascript
const bulletinRoutes = require('./routes/bulletin');
app.use('/bulletin', bulletinRoutes);
```

### 3. Install Dependencies (if needed)

Your chatbot already has `axios`, so no new packages needed!

### 4. Restart Your Docker Container

```bash
# Rebuild and restart chatbot service
docker-compose up -d --build chatbot
```

## Testing

### Test 1: Service Health Check

```bash
curl http://localhost:4000/bulletin/test
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulletin service is running",
  "timestamp": "2025-11-04T09:30:00.000Z",
  "endpoints": {
    "getUserBulletin": "GET /bulletin/user/:userId"
  }
}
```

### Test 2: Generate Bulletin for User

```bash
# For employee (user ID 1)
curl http://localhost:4000/bulletin/user/1

# For client (user ID 3)
curl http://localhost:4000/bulletin/user/3
```

### Test 3: From Your Browser

Open: `http://localhost:4000/bulletin/user/1`

## Key Features

✅ **Role-Based Content**
- Clients see project summaries
- Employees see their task list

✅ **Smart Urgency Detection**
- Highlights overdue tasks
- Warns about today's deadlines
- Shows upcoming due dates

✅ **Time-Aware Greetings**
- Morning (5am-12pm)
- Afternoon (12pm-5pm)
- Evening (5pm-9pm)
- Night (9pm-5am)

✅ **Natural Language**
- Reads like a human briefing
- Ready for text-to-speech
- Proper grammar and pacing

✅ **Detailed Metadata**
- Task counts by status
- Project progress percentages
- Completion statistics

## What's Next?

### Unit 2: TTS Integration
We'll add OpenAI Text-to-Speech to convert these scripts into audio files.

### Unit 3: Enhanced Chat
We'll make your existing chatbot speak its responses.

### Unit 4: Avatar UI
We'll create a React component to display the avatar and play audio.

## Troubleshooting

### Error: "Failed to fetch user data"

**Solution:** Make sure Tasks API is running:
```bash
curl http://localhost:3000/users/1
```

### Error: "Cannot find module './services/bulletinGenerator'"

**Solution:** Make sure file is in correct location:
```
chatbot/
  services/
    bulletinGenerator.js  ← Must be here
```

### Error: "axios is not defined"

**Solution:** Install axios in chatbot directory:
```bash
cd chatbot
npm install axios
```

## Configuration

You can customize these environment variables:

```bash
# In your .env or docker-compose.yml
API_BASE_URL=http://app:3000  # Your Tasks API URL
```

## Questions?

This is Unit 1 complete! The bulletin generator is working and ready to test.

**Next step:** Once you confirm this works, we'll add TTS (Unit 2) to make it speak!
