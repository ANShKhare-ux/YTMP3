FROM node:20-slim

# Install system dependencies: ffmpeg, python3, curl
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root and package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install client and server dependencies
RUN npm --prefix client install
RUN npm --prefix server install --omit=dev

# Copy source code
COPY . .

# Build the client React app
RUN npm --prefix client run build

# Create bin and downloads folders
RUN mkdir -p server/bin server/downloads

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server/index.js"]
