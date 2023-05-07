FROM node:18-bullseye-slim

WORKDIR /usr/server/api
COPY package*.json ./
RUN npm install
COPY . .
RUN ./node_modules/.bin/prisma generate
RUN ./node_modules/.bin/tsc --project server/tsconfig.json

ENV NODE_ENV production
ENV PORT 3030

EXPOSE 3030
CMD [ "node", "server/api.js" ]


