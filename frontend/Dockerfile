FROM node:22-alpine AS build

# Build stage compiles the Vite SPA into static files.
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

# Runtime stage serves the built SPA and proxies /api through nginx.conf.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
