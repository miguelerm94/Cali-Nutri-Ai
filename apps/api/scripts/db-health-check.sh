#!/bin/sh
# Verifica conectividad a PostgreSQL antes de levantar el API (usado en Docker/CI).
set -e
echo "⏳ Esperando PostgreSQL en $DATABASE_URL..."
until node -e "
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  c.connect().then(() => c.end()).then(() => process.exit(0)).catch(() => process.exit(1));
"; do
  sleep 1
done
echo "✅ PostgreSQL disponible."
