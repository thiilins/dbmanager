const pgp = require("pg-promise")();
const { config } = require("dotenv");
const inquirer = require("inquirer");
const logError = require("./utils/logs/error");
const fetchSchemas = require("./utils/fetchData/fetchSchema");
const fetchTables = require("./utils/fetchData/fetchTable");
const extractor = require("./utils/extractor");

config();

const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function extractorData() {
  const { format } = await inquirer.prompt({
    type: "list",
    name: "format",
    message: "Escolha o formato de saída:",
    choices: [{ name: "SQL", value: "sql" },
    { name: "JSON", value: "json" },]
  });

  const { operationType } = await inquirer.prompt({
    type: "list",
    name: "operationType",
    message: "Que tipo de backup/extração você quer fazer?",
    choices: [
      { name: "Banco", value: "database" },
      { name: "Schema", value: "schema" },
      { name: "Tabela", value: "table" },
      { name: "Sair", value: "exit" },
    ],
  });
  if (operationType === "exit") {
    process.exit();
  }
  const origin = { db_name: process.env.DB_NAME };
  if (operationType === "schema" || operationType === "table") {
    const { chosenSchema } = await inquirer.prompt({
      type: "list",
      name: "chosenSchema",
      message: "Escolha um schema:",
      choices: await fetchSchemas(db),
    });
    if (operationType === "table") {
      const { chosenTable } = await inquirer.prompt({
        type: "list",
        name: "chosenTable",
        message: "Escolha uma tabela:",
        choices: await fetchTables(db, chosenSchema),
      });
      origin.chosenSchema = chosenSchema;
      origin.chosenTable = chosenTable;
    }
  }

  await extractor({ db, pgp }, operationType, format, { ...origin });
}

extractorData()
  .catch((err) => {
    logError(err);
    process.exit(1);
  })
  .finally(() => {
    pgp.end();
    process.exit()
  });
