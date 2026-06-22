FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 7002
CMD mkdir -p /app/uploads/images /app/uploads/solutions /app/uploads/files /app/uploads/attachments && npm run start:prod