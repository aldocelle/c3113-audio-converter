# --- Build stage: compile the Vite app ---
FROM node:20-alpine AS build

WORKDIR /app

# Vite inlines VITE_* vars at build time, so the API URL must be present here.
# Railway passes this via a build arg / build-time variable.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Serve stage: nginx serves the static build ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Railway provides $PORT; nginx template substitution wires it in at startup.
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
