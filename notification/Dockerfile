FROM node:alpine

RUN addgroup -g 1001 notification
RUN adduser -D -u 1001 -G notification notification_group

WORKDIR /app

COPY package*.json ./

RUN chown -R notification_group:notification /app

USER notification_group
RUN npx pnpm install

COPY --chown=notification_group:notification . .

CMD [ "npx" , "pnpm" , "start:dev" ]