FROM node:alpine

RUN addgroup -g 1001 user
RUN adduser -D -u 1001 -G user user_group

WORKDIR /app

COPY package*.json ./

RUN chown -R user_group:user /app

USER user_group
RUN npx pnpm install

COPY --chown=user_group:user . .

CMD npx pnpm prisma generate && npx pnpm prisma migrate deploy && npx pnpm start:dev