# Stage 1: Build the React application
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application source code
COPY . .

EXPOSE 3000

# Start
CMD ["yarn", "start"]
