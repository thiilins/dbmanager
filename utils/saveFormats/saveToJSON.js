const generateFile = require("../generateFile");
async function saveDataToJson(db_name, schema, table, data) {
  const filePath = await generateFile({ db_name, schema, table, extension: 'json' });
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error({
      error: err,
      message: `Erro ao salvar dados da tabela ${schema}.${table} em ${filePath}`
    })
    process.exit()
  }
}
module.exports = saveDataToJson;