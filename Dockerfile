FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

ENV PORT=4141
EXPOSE 4141

CMD ["npm", "start"]
