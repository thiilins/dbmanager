async function fetchTables(db, schema) {
  return (await db.any(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1;`,
    schema
  )).map(t => t.table_name);
}
module.exports = fetchTables