# Use the official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema first
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of your application files
COPY . .

# Expose the port your Express app runs on (default 3000)
EXPOSE 3000

# Start script: run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]