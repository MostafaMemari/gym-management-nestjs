FROM node:alpine

RUN addgroup -g 1001 student
RUN adduser -D -u 1001 -G student student_group

WORKDIR /app

COPY package*.json ./
RUN chown -R student_group:student /app

USER student_group
RUN npx pnpm install

COPY --chown=student_group:student . .

CMD [ "npx" , "pnpm" , "start:dev" ]