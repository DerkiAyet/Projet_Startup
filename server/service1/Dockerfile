FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 7000
CMD ["npm", "run", "start:prod"]
CMD mkdir -p /app/uploads/subjects /app/uploads/profiles && && npm run start:prod 