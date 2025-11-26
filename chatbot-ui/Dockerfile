# Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build args for environment variables
ARG REACT_APP_CHATBOT_API_URL
ARG REACT_APP_AVATAR_BACKEND_URL
ENV REACT_APP_CHATBOT_API_URL=$REACT_APP_CHATBOT_API_URL
ENV REACT_APP_AVATAR_BACKEND_URL=$REACT_APP_AVATAR_BACKEND_URL

RUN npm run build

# Production stage - serve static files
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]