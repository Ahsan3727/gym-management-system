# Uses a frontend build created OUTSIDE Hyperlift (committed as frontend/dist),
# because Hyperlift's build container runs out of memory during `vite build`.
FROM node:20-alpine
WORKDIR /app

# PORT matches Hyperlift's default app port (8080)
ENV NODE_ENV=production \
    PORT=8080

# Backend production dependencies (cached layer)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Backend source + prebuilt frontend (served by Express from ../frontend/dist)
COPY backend/ ./backend/
COPY frontend/dist ./frontend/dist

WORKDIR /app/backend
USER node
CMD ["node", "server.js"]
