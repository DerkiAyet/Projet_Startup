# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps   # for the react new version

# These build args get baked into the React bundle at build time
ARG REACT_APP_API_URL_GATEWAY=http://localhost:8082
ENV REACT_APP_API_URL_GATEWAY=$REACT_APP_API_URL_GATEWAY

ARG REACT_APP_NOTIFICATION_URL=http://localhost:7003  
ENV REACT_APP_NOTIFICATION_URL=$REACT_APP_NOTIFICATION_URL 

COPY . .
RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 

EXPOSE 3000

# Tell nginx to listen on port 3000 to match your compose config
RUN sed -i 's/listen\s*80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]