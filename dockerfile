# Build Stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json separately to leverage caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Accept VITE_SKAFTIN_ACCESS_TOKEN as a build argument
ENV VITE_SKAFTIN_ACCESS_TOKEN=${VITE_SKAFTIN_ACCESS_TOKEN}

# Accept VITE_SKAFTIN_API_KEY as a build argument
ENV VITE_SKAFTIN_API_KEY=${VITE_SKAFTIN_API_KEY}

# Accept VITE_SKAFTIN_API_URL as a build argument
ENV VITE_SKAFTIN_API_URL=${VITE_SKAFTIN_API_URL}

# Build the project and check for any build errors
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy the built files from the build stage (dist directory)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 82

# Run the application with nginx
CMD ["nginx", "-g", "daemon off;"]
