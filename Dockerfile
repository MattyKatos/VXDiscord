# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose port (if you have a web dashboard, otherwise not needed)
# EXPOSE 3000

# Default command
CMD ["npm", "start"]
