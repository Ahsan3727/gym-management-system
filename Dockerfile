# ---------- Stage 1: build the React/Vite frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: production image (Express API + built frontend) ----------
FROM node:20-alpine
WORKDIR /app

# PORT matches Hyperlift's default app port (8080).
# Setting these here saves two of Hyperlift's 20 environment-variable slots.
ENV NODE_ENV=production \
    PORT=8080

# Install backend dependencies first so Docker can cache this layer
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Backend source + the built frontend (served by Express from ../frontend/dist)
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
USER node
CMD ["node", "server.js"]
