const generateBatchInsert = (schema, table, data, pgp) => {
  if (!data || !data.length) return "";
  const columnNames = pgp.as.format("$1:name", [data[0]]);
  const values = data
    .map((row) => `(${pgp.as.format("$1:list", [row])})`)
    .join(", ");
  return `INSERT INTO "${schema}"."${table}" ${columnNames} VALUES ${values};\n`;
};
module.exports = generateBatchInsert