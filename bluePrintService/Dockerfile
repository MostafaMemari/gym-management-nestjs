FROM node:alpine

RUN addgroup -g 1001 permission
RUN adduser -D -u 1001 -G permission permission_group

WORKDIR /app

COPY package*.json ./

RUN chown -R permission_group:permission /app

USER permission_group
RUN npx pnpm install

COPY --chown=permission_group:permission . .

CMD [ "npx" , "pnpm" , "start:dev" ]