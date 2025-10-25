# Quick API Test Commands

Run these commands in your terminal to test your API. Make sure your API is running on `http://localhost:3000`

## 1. Health Check
```bash
curl http://localhost:3000/health
```

## 2. Project Endpoints

### Get all projects
```bash
curl http://localhost:3000/projects
```

### Get specific project (replace 1 with actual project ID)
```bash
curl http://localhost:3000/projects/1
```

### Search projects by name
```bash
curl http://localhost:3000/projects/search/Website
```

### Get project summary with task statistics
```bash
curl http://localhost:3000/projects/1/summary
```

### Get all tasks for a project
```bash
curl http://localhost:3000/projects/1/tasks
```

### Get team members working on a project
```bash
curl http://localhost:3000/projects/1/team
```

## 3. Task Endpoints

### Get all tasks
```bash
curl http://localhost:3000/tasks
```

### Get specific task
```bash
curl http://localhost:3000/tasks/id/1
```

### Get tasks for a specific user
```bash
curl http://localhost:3000/tasks/user/1
```

### Get tasks by status
```bash
curl http://localhost:3000/tasks/status/in_progress
curl http://localhost:3000/tasks/status/completed
curl http://localhost:3000/tasks/status/pending
curl http://localhost:3000/tasks/status/blocked
```

### Get tasks by priority
```bash
curl http://localhost:3000/tasks/priority/high
curl http://localhost:3000/tasks/priority/medium
curl http://localhost:3000/tasks/priority/low
```

### Get all overdue tasks
```bash
curl http://localhost:3000/tasks/overdue/all
```

## 4. User Endpoints

### Get all users
```bash
curl http://localhost:3000/users
```

### Get specific user
```bash
curl http://localhost:3000/users/1
```

### Search users by name
```bash
curl http://localhost:3000/users/search/Alice
```

### Get user workload summary
```bash
curl http://localhost:3000/users/1/workload
```

## 5. Analytics Endpoints

### Get dashboard statistics
```bash
curl http://localhost:3000/analytics/dashboard
```

## 6. Update Endpoints

### Update task status
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### Update task assignee
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"assigned_to":"2"}'
```

### Update task priority
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"priority":"high"}'
```

### Update multiple task fields
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","priority":"high","assigned_to":"2"}'
```

### Update project
```bash
curl -X PUT http://localhost:3000/projects/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

---

## Test with Pretty Output (requires jq)

If you have `jq` installed, you can format the JSON output:

```bash
# Install jq on Mac
brew install jq

# Then use it like this:
curl http://localhost:3000/projects | jq '.'
curl http://localhost:3000/tasks | jq '.'
curl http://localhost:3000/users | jq '.'
```

## Quick Test Script

Save this as `test-api.sh` and run with `bash test-api.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Project Management API"
echo "=================================="

echo -e "\n📁 Testing Projects..."
curl -s http://localhost:3000/projects | jq '.[] | {id, name, status}'

echo -e "\n✅ Testing Tasks..."
curl -s http://localhost:3000/tasks | jq '.[] | {id, title, status, assigned_to_name}'

echo -e "\n👤 Testing Users..."
curl -s http://localhost:3000/users | jq '.[] | {id, name, email, role}'

echo -e "\n📊 Testing Analytics..."
curl -s http://localhost:3000/analytics/dashboard | jq '.'

echo -e "\n✅ All tests completed!"
```

Make it executable:
```bash
chmod +x test-api.sh
./test-api.sh