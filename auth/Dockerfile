FROM node:alpine

RUN addgroup -g 1001 auth
RUN adduser -D -u 1001 -G auth auth_user

WORKDIR /app

COPY package*.json ./

RUN chown -R auth_user:auth /app

USER auth_user
RUN npx pnpm install

COPY --chown=auth_user:auth . .

CMD [ "npx" , "pnpm" , "start:dev" ]