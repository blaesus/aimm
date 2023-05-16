FROM node:18.16.0-bullseye-slim

WORKDIR /usr/server/admin
COPY package*.json ./
RUN npm install
COPY . .
COPY ./ops/.env.prod .env
RUN ./node_modules/.bin/prisma generate
RUN ./node_modules/.bin/tsc --project server/tsconfig.json

ENV NODE_ENV production
ENV PORT 4100

EXPOSE 4100
CMD [ "node", "server/admin.js" ]


