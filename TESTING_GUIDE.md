# 🧪 UNIT 1 TESTING GUIDE

## 📁 Files to Copy to Your Repository

Copy these files to your local repository:

```
YOUR_REPO/chatbot/
├── services/
│   └── bulletinGenerator.js  ← Copy from outputs
├── routes/
│   └── bulletin.js           ← Copy from outputs
└── index.js                  ← Replace with new version
```

## 🚀 Installation Steps

### Step 1: Copy Files

```bash
# Navigate to your local repository
cd /path/to/taskmanagement_chatbot

# Copy bulletin generator service
cp /path/to/downloaded/bulletinGenerator.js chatbot/services/

# Copy bulletin routes
cp /path/to/downloaded/bulletin.js chatbot/routes/

# Copy updated index.js (or manually add the 2 lines)
cp /path/to/downloaded/index.js chatbot/
```

### Step 2: Verify File Structure

```bash
# Check files are in correct location
ls -la chatbot/services/bulletinGenerator.js
ls -la chatbot/routes/bulletin.js
ls -la chatbot/index.js
```

### Step 3: Rebuild and Restart

```bash
# Rebuild the chatbot service
docker-compose up -d --build chatbot

# Check if it's running
docker-compose ps

# View logs to ensure no errors
docker-compose logs -f chatbot
```

You should see output like:
```
🚀 Chatbot service running on port 4000
📝 Chat endpoint: http://localhost:4000/chat
📰 Bulletin endpoint: http://localhost:4000/bulletin
❤️  Health check: http://localhost:4000/health
```

## 🧪 Testing Commands

### Test 1: Health Check

```bash
curl http://localhost:4000/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "service": "chatbot",
  "endpoints": {
    "chat": "/chat",
    "bulletin": "/bulletin",
    "health": "/health"
  }
}
```

✅ **Pass:** Service is running
❌ **Fail:** Check if chatbot container is up

---

### Test 2: Bulletin Service Test

```bash
curl http://localhost:4000/bulletin/test
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Bulletin service is running",
  "timestamp": "2025-11-04T...",
  "endpoints": {
    "getUserBulletin": "GET /bulletin/user/:userId"
  }
}
```

✅ **Pass:** Bulletin service loaded correctly
❌ **Fail:** Check if bulletin.js file is in routes folder

---

### Test 3: Generate Bulletin for User 1

```bash
curl http://localhost:4000/bulletin/user/1
```

**Expected Output (for Employee):**
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
      "fullScript": "Good morning, Alice Johnson! Here's your task briefing...",
      "metadata": {
        "totalTasks": 3,
        "urgentTasks": 1,
        "dueSoonTasks": 2,
        "inProgressTasks": 2,
        "pendingTasks": 1,
        "completedTasks": 0
      }
    },
    "timestamp": "2025-11-04T..."
  }
}
```

✅ **Pass:** Bulletin generated successfully
❌ **Fail:** Check error message (see troubleshooting below)

---

### Test 4: Generate Bulletin for User 3 (Client)

```bash
curl http://localhost:4000/bulletin/user/3
```

**Expected Output (for Client):**
```json
{
  "success": true,
  "data": {
    "userId": 3,
    "userName": "Carol Chen",
    "userEmail": "carol@company.com",
    "role": "client",
    "bulletin": {
      "greeting": "Good morning, Carol Chen!",
      "summary": "1 projects, 1 in progress",
      "fullScript": "Good morning, Carol Chen! Here's your project update...",
      "metadata": {
        "totalProjects": 1,
        "projectsByStatus": {
          "pending": 0,
          "in_progress": 1,
          "completed": 0,
          "on_hold": 0
        }
      }
    },
    "timestamp": "2025-11-04T..."
  }
}
```

✅ **Pass:** Client bulletin generated successfully

---

### Test 5: Test All Users

```bash
# Test each user in your database
for i in {1..5}; do
  echo "=== Testing User $i ==="
  curl http://localhost:4000/bulletin/user/$i
  echo -e "\n"
done
```

---

### Test 6: Test from Browser

Open your browser and visit:

1. **Health Check:**
   ```
   http://localhost:4000/health
   ```

2. **Bulletin Test:**
   ```
   http://localhost:4000/bulletin/test
   ```

3. **User Bulletin:**
   ```
   http://localhost:4000/bulletin/user/1
   ```

You should see nicely formatted JSON in your browser.

---

## 🐛 Troubleshooting

### Error: "Cannot find module './services/bulletinGenerator'"

**Cause:** File not in correct location

**Solution:**
```bash
# Check file exists
ls chatbot/services/bulletinGenerator.js

# If missing, copy it again
cp bulletinGenerator.js chatbot/services/
```

---

### Error: "Failed to fetch user data"

**Cause:** Tasks API not responding

**Solution:**
```bash
# Check if Tasks API is running
docker-compose ps app

# Test Tasks API directly
curl http://localhost:3000/users/1

# If API is down, restart it
docker-compose restart app
```

---

### Error: "User not found"

**Cause:** User ID doesn't exist in database

**Solution:**
```bash
# Check what users exist in your database
curl http://localhost:3000/users

# Use a valid user ID from the response
```

---

### Error: "ECONNREFUSED" or "Network error"

**Cause:** Services can't communicate

**Solution:**
```bash
# Check all services are up
docker-compose ps

# Check docker network
docker network ls
docker network inspect taskmanagement_chatbot_tasks_net

# Restart all services
docker-compose restart
```

---

### Logs Show: "axios is not defined"

**Cause:** axios not installed

**Solution:**
```bash
# Install axios in chatbot directory
cd chatbot
npm install axios

# Or rebuild container (recommended)
docker-compose up -d --build chatbot
```

---

### Empty Bulletin / No Tasks

**Cause:** User has no tasks/projects

**Solution:** This is actually correct behavior! The bulletin will say:
- Employees: "You have no active tasks at the moment"
- Clients: "You currently have no active projects"

---

## ✅ Success Checklist

Before moving to Unit 2, verify:

- [ ] All 3 files copied to correct locations
- [ ] Chatbot container rebuilt and running
- [ ] Health check returns success
- [ ] Bulletin test endpoint works
- [ ] Can generate bulletin for at least 1 user
- [ ] Bulletin content looks correct
- [ ] No errors in `docker-compose logs chatbot`

---

## 📊 What to Check in the Bulletin

**For Employees, verify:**
- ✅ Greeting uses correct name
- ✅ Task count is accurate
- ✅ Urgent tasks are highlighted
- ✅ Due dates are mentioned
- ✅ Status breakdown (in progress, pending)

**For Clients, verify:**
- ✅ Greeting uses correct name
- ✅ Project count is accurate
- ✅ Project status breakdown correct
- ✅ Active projects listed
- ✅ Deadlines mentioned

---

## 🎯 Expected Behavior

### Employee with Tasks:
```
"Good morning, [Name]! Here's your task briefing. 
You have X active tasks. 
[If urgent] URGENT: Y tasks require immediate attention. 
[List urgent tasks]
[If due soon] Coming up: Z tasks are due within 3 days.
Have a productive day!"
```

### Employee with No Tasks:
```
"Good morning, [Name]! Great news! 
You have no active tasks at the moment. 
Enjoy your day!"
```

### Client with Projects:
```
"Good morning, [Name]! Here's your project update. 
You have X projects. 
[Status breakdown]
Active projects: [Project names with progress]
Your team is working hard to deliver quality results. 
Have a great day!"
```

---

## 📝 Testing Checklist

```
[ ] Test 1: Health Check - PASSED
[ ] Test 2: Bulletin Service Test - PASSED
[ ] Test 3: Employee Bulletin - PASSED
[ ] Test 4: Client Bulletin - PASSED
[ ] Test 5: All Users - PASSED
[ ] Test 6: Browser Access - PASSED
[ ] Logs: No errors - PASSED
```

---

## ⏭️ Once All Tests Pass

Reply with: **"Unit 1 tested and working!"**

Then we'll move to **Unit 2: TTS Integration** to make these bulletins speak! 🎤

---

## 🆘 Need Help?

If you encounter any errors:
1. Copy the exact error message
2. Run: `docker-compose logs chatbot --tail=50`
3. Share the output with me
4. I'll help debug!
