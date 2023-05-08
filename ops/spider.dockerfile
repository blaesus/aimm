FROM node:18.16.0-bullseye-slim

WORKDIR /usr/server/spider
COPY package*.json ./
RUN npm install
COPY . .
COPY ./ops/.env.prod .env
RUN ./node_modules/.bin/prisma generate
RUN ./node_modules/.bin/tsc --project server/tsconfig.spider.json

ENV NODE_ENV production
ENV PORT 4010

EXPOSE 4010
CMD [ "node", "server/spider.js" ]


