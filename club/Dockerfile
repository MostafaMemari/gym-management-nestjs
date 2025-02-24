FROM node:alpine

RUN addgroup -g 1001 club
RUN adduser -D -u 1001 -G club club_group

WORKDIR /app

COPY package*.json ./
RUN mkdir logs
RUN chown -R club_group:club /app

USER club_group
RUN npx pnpm install

COPY --chown=club_group:club . .

CMD npx pnpm migration:run && npx pnpm start:dev