FROM node:10.12.0-alpine

WORKDIR /tradingtracker

COPY ./dist ./dist
COPY ./server/server.js .
COPY ./server/package.json .
COPY ./server/package-lock.json .

RUN npm install --production
RUN npm install pm2 -g
ENV NODE_ENV=production

EXPOSE 4003
CMD [ "pm2-runtime", "npm", "--", "start" ]
USER node