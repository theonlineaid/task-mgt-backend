# Use the official Node.js image.
FROM node:18

# Set the working directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of your application code.
COPY . .

# Install TypeScript globally.
RUN npm install -g typescript

# Expose the application port.
EXPOSE 5000

# Command to run the application.
CMD ["npm", "start"]
