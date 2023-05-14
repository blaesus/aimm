FROM node:18.16.0-bullseye-slim

WORKDIR /usr/client/web
COPY client/web/package*.json ./
RUN npm ci
RUN npm install http-server
COPY ./client/web .
COPY ./ops/.env.prod .env
RUN npm run build

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000
CMD [ "http-server", "build", "--port", "3000" ]


