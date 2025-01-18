FROM node:alpine

RUN addgroup -g 1001 gateway

RUN adduser -D -u 1001 -G gateway gateway_user

WORKDIR /app

COPY package*.json ./

RUN chown -R gateway_user:gateway /app

USER gateway_user

RUN npx pnpm install

COPY --chown=gateway_user:gateway . .

EXPOSE 4000

CMD [ "npx" , "pnpm" , "start:dev" ]