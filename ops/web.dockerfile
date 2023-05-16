FROM node:18.16.0-bullseye-slim

WORKDIR /usr/client/web
COPY ./package*.json ./
RUN npm ci
RUN npm install http-server
COPY . .
COPY ./ops/.env.prod .env
RUN npm run build:web

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000
CMD [ "http-server", "build", "--port", "3000" ]
