# 🧠 Marketing Chatbot - Project Management System

A full-stack AI-powered project management assistant that helps teams track projects, tasks, and team members through natural language conversations.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Services](#services)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

## 🎯 Overview

This project is a comprehensive project management system with an AI chatbot interface powered by OpenAI. It allows users to interact with their project data through natural language queries, making project management more intuitive and accessible.

### Key Components

- **Tasks API** - RESTful API for managing projects, tasks, and users
- **AI Chatbot** - LangChain-powered agent that interacts with the Tasks API
- **Chatbot UI** - React-based web interface with multiple interaction modes
- **Avatar UI** - Akool streaming avatar for visual AI interaction
- **MySQL Database** - Stores all project, task, and user data
- **Adminer** - Web-based database management interface

## ✨ Features

- 🤖 **Natural Language Interface** - Ask questions in plain English
- 🎭 **Multiple Interaction Modes** - Text chat, voice chat, realtime voice, and streaming avatar
- 📊 **Project Management** - Track projects, tasks, and deadlines
- 👥 **Team Management** - Monitor team workload and assignments
- 📈 **Analytics Dashboard** - Get insights on project progress
- 🔄 **Real-time Updates** - Modify tasks and projects through chat
- 💾 **Conversation Memory** - Maintains context throughout the session
- 🎤 **Voice-Powered Interaction** - Speech-to-speech communication with AI
- 🎨 **Modern UI** - Clean, responsive React interface with tab navigation

### Example Queries

```
"What projects are currently in progress?"
"Show me all overdue tasks"
"Who is working on the Website Redesign project?"
"What's Carol's current workload?"
"Update task 5 to completed status"
"Give me a summary of project 1"
```

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐
│   Chatbot UI    │◄────►│   Avatar UI     │
│  (React - 4500) │      │   (Vite - 5173) │
│  • Text Chat    │      │  Akool Streaming│
│  • Voice Chat   │      │   Avatar + AI   │
│  • Realtime     │      └─────────────────┘
│  • Avatar Tab   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Chatbot API    │ (Node.js + LangChain - Port 4000)
│  (AI Agent)     │ • Text/Voice Chat
│                 │ • OpenAI Realtime API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Tasks API     │ (Express.js - Port 3000)
│   (Backend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL Database │ (Port 3306)
│   (Data Store)  │
└─────────────────┘
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Akool API Key** (Optional) - For streaming avatar functionality, get one from [Akool Platform](https://akool.com)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd marketing_chatbot
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start all services in the background. First-time startup may take 2-3 minutes to build images.

### 4. Verify Services Are Running

```bash
docker-compose ps
```

You should see all services with status "Up":

```
NAME              STATUS
avatar_ui         Up
chatbot-mysql     Up (healthy)
chatbot_service   Up
chatbot_ui        Up
db_adminer        Up (optional)
tasks_app         Up
```

### 5. Access the Application

Open your browser and navigate to:

- **Chatbot UI**: http://localhost:4500 (Main application with 4 interaction modes)
  - 💬 Text Chat - Traditional text-based conversation
  - 🎤 Voice Chat - Voice input with text-to-speech response
  - 🎙️ Realtime Voice - Real-time speech-to-speech interaction
  - 🎭 Avatar - Visual AI avatar (requires Akool API key)
- **Avatar UI**: http://localhost:5173/streaming/avatar (Direct avatar access)
- **Tasks API**: http://localhost:3000 (API endpoints)
- **Chatbot API**: http://localhost:4000 (AI agent)
- **Adminer**: http://localhost:8080 (Database management)

## 📁 Project Structure

```
taskmanagement_chatbot/
├── app/                    # Tasks API (Backend)
│   ├── index.js           # Express server with all API endpoints
│   ├── Dockerfile         # Container configuration
│   └── package.json       # Node.js dependencies
│
├── chatbot/               # AI Chatbot Service
│   ├── agent/            # LangChain agent logic
│   │   ├── agent.js      # Main agent orchestrator
│   │   ├── tools.js      # Function definitions for OpenAI
│   │   ├── toolExecutor.js  # Tool execution logic
│   │   └── memory.js     # Conversation memory manager
│   ├── routes/           # API routes
│   │   └── chat.js       # Chat endpoint
│   ├── services/         # Service integrations
│   │   └── realtimeVoiceChat.js  # OpenAI Realtime API
│   ├── index.js          # Server entry point
│   ├── Dockerfile        # Container configuration
│   └── package.json      # Node.js dependencies
│
├── chatbot-ui/           # React Frontend (Main UI)
│   ├── src/
│   │   ├── App.js        # Main component with tabs
│   │   ├── App.css       # Styles
│   │   ├── components/   # React components
│   │   │   ├── VoiceChat.jsx       # Voice chat component
│   │   │   ├── RealtimeVoiceChat.jsx  # Realtime voice
│   │   │   └── AvatarChat.jsx      # Avatar iframe wrapper
│   │   └── index.js      # React entry point
│   ├── public/           # Static assets
│   ├── Dockerfile        # Container configuration
│   └── package.json      # React dependencies
│
├── avatar-ui/            # Akool Streaming Avatar (TypeScript/Vite)
│   ├── src/              # TypeScript source code
│   │   ├── App.tsx       # Main avatar application
│   │   ├── components/   # Avatar UI components
│   │   ├── providers/    # Streaming providers (Agora, LiveKit, TRTC)
│   │   └── services/     # API services
│   ├── Dockerfile        # Container configuration
│   ├── vite.config.ts    # Vite configuration
│   └── package.json      # pnpm dependencies
│
├── db-init/              # Database initialization
│   └── init.sql          # Schema and sample data
│
├── docker-compose.yml    # Multi-container orchestration
├── .env.example          # Environment variable template
└── README.md            # This file
```

## 🔧 Services

### Tasks API (Port 3000)

RESTful API that provides all data operations for projects, tasks, and users.

**Technologies**: Node.js, Express, MySQL2

See [app/README.md](./app/README.md) for detailed API documentation.

### Chatbot Service (Port 4000)

AI-powered agent that processes natural language queries and interacts with the Tasks API.

**Technologies**: Node.js, LangChain, OpenAI, Express

See [chatbot/README.md](./chatbot/README.md) for agent architecture details.

### Chatbot UI (Port 4500)

Modern web interface for interacting with the AI assistant. Features 4 interaction modes:
- Text Chat: Traditional text-based conversation
- Voice Chat: Voice input with TTS response
- Realtime Voice: Speech-to-speech using OpenAI Realtime API
- Avatar: Embedded Akool streaming avatar

**Technologies**: React, Create React App

See [chatbot-ui/README.md](./chatbot-ui/README.md) for UI documentation.

### Avatar UI (Port 5173)

Akool streaming avatar interface with visual AI interaction. Supports multiple streaming providers (Agora, LiveKit, TRTC) and integrates with the task management system.

**Technologies**: TypeScript, React, Vite, Akool SDK

**Configuration**: Requires Akool API key in `avatar-ui/.env`

See [avatar-ui/README.md](./avatar-ui/README.md) and [avatar-ui/TASK_MANAGEMENT_INTEGRATION.md](./avatar-ui/TASK_MANAGEMENT_INTEGRATION.md) for details.

### MySQL Database (Port 3306)

Relational database storing all application data.

**Credentials** (default):
- Host: `localhost`
- Port: `3306`
- Database: `chatbot_db`
- User: `chatbot_user`
- Password: `chatbotpass`

### Adminer (Port 8080)

Web-based database management tool.

**Access**: http://localhost:8080
- System: `MySQL`
- Server: `mysql` (or `localhost:3306` from host)
- Username: `chatbot_user`
- Password: `chatbotpass`
- Database: `chatbot_db`

## 🔐 Environment Variables

### Required Variables

Create a `.env` file in the `chatbot/` directory:

```env
# OpenAI Configuration (Required for chatbot)
OPENAI_API_KEY=sk-proj-your-api-key-here
```

### Optional Variables for Avatar

Create/edit `avatar-ui/.env` to enable avatar functionality:

```env
# Akool Configuration (Optional - for avatar streaming)
VITE_OPENAPI_TOKEN=your-akool-api-key-here
VITE_AVATAR_ID=dvp_Tristan_cloth2_1080P
VITE_VOICE_ID=Xb7hH8MSUJpSbSDYk0k2
```

### Other Optional Variables

You can override default configurations in `docker-compose.yml`:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=chatbot_db
MYSQL_USER=chatbot_user
MYSQL_PASSWORD=chatbotpass

# API Configuration
DB_HOST=mysql
DB_PORT=3306
API_BASE_URL=http://app:3000
```

## 📚 API Documentation

### Tasks API Endpoints

#### Projects
- `GET /projects` - Get all projects
- `GET /projects/:projectId` - Get project by ID
- `GET /projects/search/:name` - Search projects by name
- `GET /projects/:projectId/summary` - Get project summary
- `GET /projects/:projectId/tasks` - Get all tasks for a project
- `GET /projects/:projectId/team` - Get team members on a project
- `PUT /projects/:projectId` - Update project

#### Tasks
- `GET /tasks` - Get all tasks
- `GET /tasks/id/:taskId` - Get task by ID
- `GET /tasks/user/:userId` - Get tasks for a user
- `GET /tasks/status/:status` - Get tasks by status
- `GET /tasks/priority/:priority` - Get tasks by priority
- `GET /tasks/overdue/all` - Get all overdue tasks
- `PUT /tasks/:taskId` - Update task

#### Users
- `GET /users` - Get all users
- `GET /users/:userId` - Get user by ID
- `GET /users/search/:name` - Search users by name
- `GET /users/:userId/workload` - Get user's workload

#### Analytics
- `GET /analytics/dashboard` - Get dashboard analytics

### Chatbot API Endpoints

- `POST /chat` - Send a message to the chatbot
- `POST /chat/clear` - Clear conversation memory

See individual README files for detailed request/response examples.

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs app
docker-compose logs chatbot
docker-compose logs chatbot-ui

# Restart all services
docker-compose restart

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Port Already in Use

If you get "port already allocated" errors:

```bash
# Find what's using the port (example for port 3000)
lsof -i :3000

# Stop the conflicting service or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check MySQL is healthy
docker-compose ps mysql

# Test database connection
docker exec chatbot-mysql mysql -u chatbot_user -pchatbotpass -e "SHOW DATABASES;"

# Check database logs
docker-compose logs mysql
```

### Chatbot Not Responding

1. **Check OpenAI API Key**: Verify your `.env` file has a valid key
2. **Check Logs**: `docker-compose logs chatbot`
3. **Verify API Connection**: `curl http://localhost:3000/projects`
4. **Check Network**: `docker network inspect marketing_chatbot_tasks_net`

### UI Can't Connect to Chatbot

1. **Clear Browser Cache**: Hard refresh with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Check Console**: Open browser DevTools → Console tab for errors
3. **Verify Environment Variable**: Check `REACT_APP_CHATBOT_API_URL` in docker-compose.yml
4. **Test Direct Connection**: `curl http://localhost:4000`

### "Empty reply from server" Error

This usually means the service isn't binding to the correct interface:

```bash
# For React apps, ensure HOST=0.0.0.0 is set
# Check docker-compose.yml has:
environment:
  HOST: 0.0.0.0
  PORT: 3000
```

## 🛠️ Development

### Running in Development Mode

To run services with live reload:

```bash
# Start only the database and adminer
docker-compose up mysql adminer -d

# Run app locally
cd app
npm install
npm start

# Run chatbot locally
cd chatbot
npm install
npm start

# Run UI locally
cd chatbot-ui
npm install
npm start
```

### Making Changes

1. **Code Changes**: Edit files in `app/`, `chatbot/`, or `chatbot-ui/`
2. **Rebuild**: `docker-compose up -d --build <service-name>`
3. **Test**: Check logs with `docker-compose logs -f <service-name>`

### Adding New API Endpoints

1. Edit `app/index.js`
2. Rebuild: `docker-compose up -d --build app`
3. Add corresponding tool in `chatbot/agent/tools.js`
4. Rebuild chatbot: `docker-compose up -d --build chatbot`

### Database Changes

1. Edit `db-init/init.sql`
2. Remove volume: `docker-compose down -v`
3. Restart: `docker-compose up -d`

## 🧪 Testing

### Manual API Testing

```bash
# Test Tasks API
curl http://localhost:3000/projects

# Test Chatbot
curl -X POST http://localhost:4000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all projects", "sessionId": "test-123"}'
```

### Health Checks

```bash
# Check all services
docker-compose ps

# Check MySQL health
docker-compose exec mysql mysqladmin ping -h localhost

# Check if ports are responding
curl -v http://localhost:3000
curl -v http://localhost:4000
curl -v http://localhost:4500
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f chatbot

# Last 100 lines
docker-compose logs --tail=100
```

### Resource Usage

```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df
```

## 🔒 Security Considerations

### Production Deployment

Before deploying to production:

1. **Change Default Passwords**: Update all database credentials
2. **Secure API Key**: Use secrets management (AWS Secrets Manager, HashiCorp Vault)
3. **Enable HTTPS**: Use reverse proxy (Nginx, Traefik) with SSL certificates
4. **Implement Authentication**: Add JWT or OAuth to protect endpoints
5. **Rate Limiting**: Prevent API abuse
6. **Update Dependencies**: Regularly update npm packages
7. **Environment Isolation**: Use separate `.env` files for dev/staging/prod

### Network Security

```yaml
# Example: Add network isolation
networks:
  frontend:
  backend:
  
# Only expose UI to public, keep APIs internal
```

## 🚢 Deployment

### Docker Compose (Simple)

Already configured! Just:

```bash
docker-compose up -d
```

### Kubernetes (Advanced)

Convert docker-compose.yml to Kubernetes manifests:

```bash
kompose convert -f docker-compose.yml
kubectl apply -f .
```

### Cloud Platforms

- **AWS**: Use ECS/Fargate or EKS
- **Google Cloud**: Use Cloud Run or GKE
- **Azure**: Use Container Instances or AKS
- **DigitalOcean**: Use App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 📞 Support

- **Documentation**: See individual README files in each service directory
- **Issues**: Report bugs via GitHub Issues
- **Questions**: Use GitHub Discussions

## 🎓 Learning Resources

- [LangChain Documentation](https://js.langchain.com/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

**Built with ❤️ using Node.js, React, LangChain, and OpenAI**