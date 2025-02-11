FROM node:alpine

RUN addgroup -g 1001 redis
RUN adduser -D -u 1001 -G redis redis_group

WORKDIR /app

COPY package*.json ./

RUN chown -R redis_group:redis /app

USER redis_group
RUN npx pnpm install

COPY --chown=redis_group:redis . .

CMD [ "npx" , "pnpm" , "start:dev" ]