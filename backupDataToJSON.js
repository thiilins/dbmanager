const pgp = require("pg-promise")();
const { config } = require("dotenv");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const ora = require('ora');

config();

const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

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

async function extractData() {
  const { extractionType } = await inquirer.prompt({
    type: "list",
    name: "extractionType",
    message: "Que tipo de extração você quer fazer?",
    choices: [
      { name: "Banco", value: "database" },
      { name: "Schema", value: "schema" },
      { name: "Tabela", value: "table" },
      { name: "Sair", value: "exit" },
    ],
  });

  let data = {};
  const backupOptions = {
    database: async () => {
      const { chosenSchema } = await inquirer.prompt({
        type: "list",
        name: "chosenSchema",
        message: "Escolha um schema:",
        choices: await fetchSchemas(),
      });
      data[chosenSchema] = {};
      const tablesSchema = await fetchTables(chosenSchema);
      for (const table of tablesSchema) {
        data[chosenSchema][table] = await db.any(`SELECT * FROM "${chosenSchema}"."${table}";`);
      }
    }, schema: '', table: ''
  }

  switch (extractionType) {
    case "database":
      const schemas = await fetchSchemas();
      for (const schema of schemas) {
        data[schema] = {};
        const tables = await fetchTables(schema);
        for (const table of tables) {
          data[schema][table] = await db.any(`SELECT * FROM "${schema}"."${table}";`);
        }
      }
      break;
    case "schema":

      break;
    case "table":
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
      data[schemaForTable] = {};
      data[schemaForTable][chosenTable] = await db.any(`SELECT * FROM "${schemaForTable}"."${chosenTable}";`);
      break;
    case "exit":
      process.exit();
  }

  const { fileOption } = await inquirer.prompt({
    type: "list",
    name: "fileOption",
    message: "Você deseja salvar em arquivos separados ou em um único arquivo?",
    choices: [
      { name: "Arquivos separados", value: "separate" },
      { name: "Único arquivo", value: "single" },
    ],
  });

  if (fileOption === "single") {
    await fs.writeFile("backup.json", JSON.stringify(data, null, 2));
  } else {
    for (const schema in data) {
      for (const table in data[schema]) {
        const fileName = `${schema}_${table}.json`;
        await fs.writeFile(fileName, JSON.stringify(data[schema][table], null, 2));
      }
    }
  }
}

extractData()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    pgp.end();
  });
