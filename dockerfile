# syntax=docker/dockerfile:1.7
# Build Stage (Vite/rolldown require Node 20.19+ or 22.12+)
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json separately to leverage caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Infisical CLI.
RUN npm install -g @infisical/cli

# Copy the rest of the source code
COPY . .

# Infisical config.
ARG INFISICAL_ENV=prod
ARG INFISICAL_DOMAIN=https://app.infisical.com

# Build app with Infisical-injected secrets.
RUN --mount=type=secret,id=infisical_token \
    INFISICAL_TOKEN="$(cat /run/secrets/infisical_token)" && \
    infisical run --token="$INFISICAL_TOKEN" --domain="$INFISICAL_DOMAIN" --env="$INFISICAL_ENV" -- npm run build

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
