FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM dependencies AS build
ARG APP_NAME
COPY . .
RUN npm run build -- ${APP_NAME} \
  && mkdir -p /out \
  && cp -R dist/apps/${APP_NAME}/. /out/

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npm cache clean --force
COPY --from=build /out ./dist
USER node
CMD ["node", "dist/main.js"]
