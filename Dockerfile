# Specify the base image
FROM node:20.10

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY *.js* ./
RUN npm install
COPY src ./src
COPY public ./public
RUN ls -laR
RUN npm run build

# Expose a port (if needed)
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
