const generateBatchInsert = require('../generateBatchInsert')
const generateFile = require("../generateFile");
const fs = require("fs");

async function saveDataToSQL(db_name, schema, table, data, pgp) {
  const batchSize = 100;
  const filePath = await generateFile({ db_name, schema, table, extension: 'sql' });
  try {
    for (let i = 0; i < data.length; i += batchSize) {
      const batchData = data.slice(i, i + batchSize);
      const sql = generateBatchInsert(schema, table, batchData, pgp);
      await fs.promises.appendFile(
        filePath,
        `-- Backup para ${schema}.${table}\n${sql}\n`
      );
    }

  } catch (err) {
    console.error({
      error: err,
      message: `Erro ao salvar dados da tabela ${schema}.${table} em ${filePath}`
    })
    process.exit()
  }
}
module.exports = saveDataToSQL;