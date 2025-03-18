FROM node:alpine

RUN addgroup -g 1001 academy
RUN adduser -D -u 1001 -G academy academy_group

WORKDIR /app

COPY package*.json ./
RUN mkdir logs
RUN chown -R academy_group:academy /app

USER academy_group
RUN npx pnpm install

COPY --chown=academy_group:academy . .

CMD npx pnpm migration:run && npx pnpm start:dev