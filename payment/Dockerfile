FROM node:alpine

RUN addgroup -g 1001 payment
RUN adduser -D -u 1001 -G payment payment_group

WORKDIR /app

COPY package*.json ./

RUN chown -R payment_group:payment /app

USER payment_group
RUN npx pnpm install

COPY --chown=payment_group:payment . .

CMD [ "npx" , "pnpm" , "start:dev" ]