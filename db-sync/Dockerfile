FROM node:16-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install --production

# Copy application code
COPY . .

# Expose service port
EXPOSE 8080

# Start the application
CMD ["node", "app.js"]