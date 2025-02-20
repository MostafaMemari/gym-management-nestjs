#!/bin/sh
set -e

echo "Waiting for MySQL DB to start..."
# ./wait-for.sh student_service_db:3306 -- echo "MySQL is up!"

echo "Migrating the database..."
npx pnpm migration:run

echo "Starting the server..."
exec npx pnpm start:dev
