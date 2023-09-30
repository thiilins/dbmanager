const pgp = require("pg-promise")();
const { config } = require("dotenv");
const inquirer = require("inquirer");
const fs = require("fs");
const ora = require('ora');
const logError = require("./utils/logs/error");
const generateFile = require("./utils/generateFile");
config();

const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const batchSize = 100;

async function fetchSchemas() {
  const schemas = await db.any(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'pg_catalog', 'information_schema');"
  );
  return schemas.map((s) => s.schema_name);
}
async function fetchTables(schema) {
  const tables = await db.any(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1;`,
    schema
  );
  return tables.map((t) => t.table_name);
}

async function backup() {
  const { backupType } = await inquirer.prompt({
    type: "list",
    name: "backupType",
    message: "Que tipo de backup você quer fazer?",
    choices: [
      { name: "Banco", value: "database" },
      { name: "Schema", value: "schema" },
      { name: "Tabela", value: "table" },
      { name: "Sair", value: "exit" },
    ],
  });

  const generateBatchInsert = (schema, table, data) => {
    if (!data || !data.length) return "";
    const columnNames = pgp.as.format("$1:name", [data[0]]);
    const values = data
      .map((row) => `(${pgp.as.format("$1:list", [row])})`)
      .join(", ");
    return `INSERT INTO "${schema}"."${table}" ${columnNames} VALUES ${values};\n`;
  };
  const backupOptions = {
    database: async () => {
      const file = await generateFile(process.env.DB_NAME);
      const schemas = await fetchSchemas();
      for (const schema of schemas) {
        const tables = await fetchTables(schema);
        for (const table of tables) {
          const spinner = ora(`Realizando backup de ${schema}.${table}...`).start();
          const data = await db.any(`SELECT * FROM "${schema}"."${table}";`);
          for (let i = 0; i < data.length; i += batchSize) {
            const batchData = data.slice(i, i + batchSize);
            const sql = generateBatchInsert(schema, table, batchData);
            await fs.promises.appendFile(
              file,
              `-- Backup para ${schema}.${table}\n${sql}\n`
            );
          }
          spinner.succeed(`Backup para ${schema}.${table} Finalizado!`);
        }
      }
    },
    schema: async () => {
      const { chosenSchema } = await inquirer.prompt({
        type: "list",
        name: "chosenSchema",
        message: "Escolha um schema:",
        choices: await fetchSchemas(),
      });
      const file = await generateFile(chosenSchema);
      const tablesSchema = await fetchTables(chosenSchema);
      for (const table of tablesSchema) {
        const spinner = ora(`Realizando backup de ${chosenSchema}.${table}...`).start();
        const data = await db.any(
          `SELECT * FROM "${chosenSchema}"."${table}";`
        );
        for (let i = 0; i < data.length; i += batchSize) {
          const batchData = data.slice(i, i + batchSize);
          const sql = generateBatchInsert(chosenSchema, table, batchData);
          await fs.promises.appendFile(
            file,
            `-- Backup para ${chosenSchema}.${table}\n${sql}\n`
          );
        }
        spinner.succeed(`Backup para ${chosenSchema}.${table} Finalizado!`);
      }
    },
    table: async () => {
      const { schemaForTable } = await inquirer.prompt({
        type: "list",
        name: "schemaForTable",
        message: "Escolha um schema:",
        choices: await fetchSchemas(),
      });
      const { chosenTable } = await inquirer.prompt({
        type: "list",
        name: "chosenTable",
        message: "Escolha uma tabela:",
        choices: await fetchTables(schemaForTable),
      });

      const file = await generateFile(`${schemaForTable}_${chosenTable}`);
      const spinner = ora(`Realizando backup de ${chosenSchema}.${chosenTable}...`).start();
      const data = await db.any(
        `SELECT * FROM "${schemaForTable}"."${chosenTable}";`
      );
      for (let i = 0; i < data.length; i += batchSize) {
        const batchData = data.slice(i, i + batchSize);
        const sql = generateBatchInsert(schema, table, batchData);
        await fs.promises.appendFile(
          file,
          `-- Backup para ${schemaForTable}.${chosenTable}\n${sql}\n`
        );
      }
      spinner.succeed(`Backup para ${chosenSchema}.${chosenTable} Finalizado!`);
    },
    exit: () => process.exit(),
  };
  if (!!backupOptions[backupType]) {
    await backupOptions[backupType]();
  } else {
    logError("Opção inválida!");
  }
}

backup()
  .catch((err) => {
    logError(err);
    process.exit(1);
  })
  .finally(() => {
    pgp.end();
  });
