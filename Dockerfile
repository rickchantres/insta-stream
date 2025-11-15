FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY .env.example .env

# Create directories
RUN mkdir -p uploads stream

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
