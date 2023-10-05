async function fetchSchemas(db) {
  return (await db.any(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'pg_catalog', 'information_schema');"
  )).map(s => s.schema_name);
}

module.exports = fetchSchemas;