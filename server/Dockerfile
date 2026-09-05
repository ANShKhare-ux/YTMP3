FROM node:20-slim

# Install system dependencies: ffmpeg, python3, curl
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Ensure bin and downloads directories exist
RUN mkdir -p bin downloads

ENV PORT=3001
EXPOSE 3001

CMD ["node", "index.js"]
