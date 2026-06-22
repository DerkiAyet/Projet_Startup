FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 7001
CMD ["npm", "run", "start:prod"]
CMD mkdir -p /app/uploads/images /app/uploads/videos && npm run start:prod #well these already exists but just in case one of the folders was added after the first build of container then we will have a prblm
# mkdir -p -> create the folder if doesn't exist