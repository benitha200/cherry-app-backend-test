# Use the official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema first
COPY prisma ./prisma

# Generate Prisma client with correct binary targets
RUN npx prisma generate

#  Apply migrations
RUN npx prisma migrate deploy

# Copy the rest of your application files
COPY . .

# Expose the port your Express app runs on (default 3000)
EXPOSE 3000

# Define the command to run the app in prod
CMD ["node", "index.js"]