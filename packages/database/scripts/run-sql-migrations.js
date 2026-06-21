/**
 * Ejecuta los archivos SQL raw en el orden canónico definido en schema_v2.md
 * "## Orden de Ejecución en Producción":
 *   1. prisma migrate deploy        (ejecutado por separado, antes de este script)
 *   2. 01_materialized_views_v2.sql
 *   3. 02_rls_policies_v2.sql
 *   4. 03_check_constraints_v2.sql
 *
 * Uso: DATABASE_URL=... node scripts/run-sql-migrations.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SQL_ORDER = [
  '01_materialized_views_v2.sql',
  '02_rls_policies_v2.sql',
  '03_check_constraints_v2.sql',
];

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Falta DATABASE_URL o DIRECT_URL en el entorno.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Conectado a PostgreSQL. Ejecutando SQL canónico en orden...\n');

  for (const file of SQL_ORDER) {
    const fullPath = path.join(__dirname, '..', 'prisma', 'sql', file);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ No se encontró ${file} en prisma/sql/`);
      process.exit(1);
    }
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`▶ Ejecutando ${file} ...`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file} aplicado correctamente.\n`);
    } catch (err) {
      console.error(`  ✗ Error aplicando ${file}:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  console.log('✅ Capa SQL canónica (MV + RLS + CHECK constraints) aplicada completamente.');
  await client.end();
}

main();
