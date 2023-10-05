const ora = require("ora");
const logError = require("./logs/error");
const fetchSchemas = require("./fetchData/fetchSchema");
const fetchTables = require("./fetchData/fetchTable");
const saveDataToSQL = require("./saveFormats/saveToSQL");
const saveDataToJson = require("./saveFormats/saveToJSON");
require('events').EventEmitter.defaultMaxListeners = 50;

async function sqlExtractorData(
  { db, pgp },
  operationType,
  format,
  { db_name, chosenSchema, chosenTable }
) {
  const options = {
    database: async () => {
      const spinner = ora(`Iniciando Backup do Banco ${db_name}`).start();
      const schemas = await fetchSchemas(db);
      for (const schema of schemas) {
        spinner.indent = 1;
        spinner.start(`Iniciando Backup do Schema ${schema}...`);
        const tables = await fetchTables(db, schema);
        for (const table of tables) {
          spinner.indent = 2;
          spinner.start(`Iniciando Backup da Tabela ${schema}.${table}...`);
          const data = await db.any(`SELECT * FROM "${schema}"."${table}";`);
          if (data.length > 0) {
            spinner.info(`Iniciando backup de ${data.length} registros`)
            if (format === "sql") {
              await saveDataToSQL(db_name, schema, table, data, pgp);
            } else if (format === "json") {
              await saveDataToJson(db_name, schema, table, data);
            } else {
              spinner.fail(`Formato ${format} não suportado!`);
              process.exit()
            }
          } else {
            spinner.fail(`Tabela ${schema}.${table} vazia!`);
          }
          spinner.indent = 2;
          spinner.succeed(`Backup para ${schema}.${table} Finalizado!`);
        }
        spinner.indent = 1;
        spinner.succeed(`Backup do Schema ${schema} Finalizado!`);
      }
      spinner.indent = 0;
      spinner.succeed(`Backup do banco ${db_name} Finalizado!`);
    },
    schema: async () => {
      const spinner = ora(
        `Iniciando Backup do Schema ${chosenSchema}...`
      ).start();
      const tables = await fetchTables(db, chosenSchema);
      for (const table of tables) {
        spinner.indent = 1;
        spinner.start(`Iniciando Backup da Tabela ${chosenSchema}.${table}...`);
        const data = await db.any(
          `SELECT * FROM "${chosenSchema}"."${table}";`
        );
        if (data.length > 0) {
          spinner.info(`Iniciando backup de ${data.length} registros`)
          if (format === "sql") {
            await saveDataToSQL(db_name, chosenSchema, table, data, pgp);
          } else if (format === "json") {
            await saveDataToJson(db_name, chosenSchema, table, data);
          } else {
            spinner.fail(`Formato ${format} não suportado!`);
            process.exit()
          }
        } else {
          spinner.fail(`Tabela ${chosenSchema}.${table} vazia!`);
        }
        spinner.indent = 1;
        spinner.succeed(`Backup para ${chosenSchema}.${table} Finalizado!`);
      }
      spinner.indent = 0;
      spinner.succeed(`Backup do Schema ${schema} Finalizado!`);
    },
    table: async () => {
      const spinner = ora(
        `Iniciando Backup da Tabela ${chosenSchema}.${chosenTable}...`
      ).start();
      spinner.indent = 0;
      const data = await db.any(
        `SELECT * FROM "${chosenSchema}"."${chosenTable}";`
      );
      if (data.length > 0) {
        spinner.info(`Iniciando backup de ${data.length} registros`)
        if (format === "sql") {
          await saveDataToSQL(db_name, chosenSchema, chosenTable, data, pgp);
        } else if (format === "json") {
          await saveDataToJson(db_name, chosenSchema, chosenTable, data);
        } else {
          spinner.fail(`Formato ${format} não suportado!`);
          process.exit()
        }
      } else {
        spinner.fail(`Tabela ${chosenSchema}.${chosenTable} vazia!`);
      }
      spinner.indent = 0;
      spinner.succeed(`Backup para ${chosenSchema}.${chosenTable} Finalizado!`);
    },
    exit: () => process.exit(),
  };
  if (!!options[operationType]) {
    await options[operationType]();
  } else {
    logError("Opção inválida!");
  }
}
module.exports = sqlExtractorData;
