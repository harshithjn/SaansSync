FROM node:20-alpine

WORKDIR /app

# Copy the backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend files
COPY backend/ .

# Build the project (includes prisma generation if configured)
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
