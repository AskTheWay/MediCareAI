FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN mkdir -p /app/node_modules/.cache && chmod -R 777 /app/node_modules/.cache

EXPOSE 3000

CMD ["npm", "run", "dev"]
