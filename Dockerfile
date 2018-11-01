FROM node:9.3.0-alpine
WORKDIR /usr/src/app
ADD . .
RUN npm install
CMD ["node", "server.js"]