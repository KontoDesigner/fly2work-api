FROM node:9.3.0-alpine
WORKDIR /usr/src/app
ADD . .
RUN npm install
# RUN npm test
CMD ["node", "server.js"]