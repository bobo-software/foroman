# Build Stage (Vite/rolldown require Node 20.19+ or 22.12+)
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json separately to leverage caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build-time args for Vite env (pass via --build-arg; avoid committing secrets to Dockerfile).
# Defaults to empty so build succeeds when not provided (e.g. local build).
ARG VITE_SKAFTIN_ACCESS_TOKEN=""
ARG VITE_SKAFTIN_API_KEY=""
ARG VITE_SKAFTIN_API_URL=""

ENV VITE_SKAFTIN_ACCESS_TOKEN="$VITE_SKAFTIN_ACCESS_TOKEN"
ENV VITE_SKAFTIN_API_KEY="$VITE_SKAFTIN_API_KEY"
ENV VITE_SKAFTIN_API_URL="$VITE_SKAFTIN_API_URL"

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
