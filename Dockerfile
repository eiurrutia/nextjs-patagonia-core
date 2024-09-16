# Build stage
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Install Python and other build dependencies
RUN apk add --no-cache python3 make g++ bash

# Copy package.json and package-lock.json files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Set the working directory inside the container
WORKDIR /app

# Copy the necessary files for production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Set environment variables for production
ENV NODE_ENV=development

# Expose the application port
EXPOSE 3000

# Command to start the application
CMD ["npm", "run", "dev"]
