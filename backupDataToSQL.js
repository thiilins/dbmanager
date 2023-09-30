const pgp = require('pg-promise')();
const { config } = require('dotenv');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const moment = require('moment')

const logError = require('./utils/logs/error');
const logInfo = require('./utils/logs/info');
const askForFileName = require('./utils/answers/fileName');
config();

const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const backupDir = "./backups/";


async function fetchSchemas() {
  const schemas = await db.any("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'pg_catalog', 'information_schema');");
  return schemas.map(s => s.schema_name);
}
async function fetchTables(schema) {
  const tables = await db.any(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1;`, schema);
  return tables.map(t => t.table_name);
}



const generateFile = async (filename) => {
  const userFileName = await askForFileName()
  const fileName = `${userFileName ?? filename}_${moment().format('YYYY-MM-DD-HHmmss')}.sql`;
  const backupFilePath = path.join(backupDir, fileName);
  await fs.promises.writeFile(backupFilePath, '');
  return backupFilePath
}
async function backup() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const { backupType } = await inquirer.prompt({
    type: 'list',
    name: 'backupType',
    message: 'Que tipo de backup você quer fazer?',
    choices: [
      { name: 'Banco', value: 'database' },
      { name: 'Schema', value: 'schema' },
      { name: 'Tabela', value: 'table' },
      { name: 'Sair', value: 'exit' }
    ]
  });


  const backupOptions = {
    database: async () => {
      const file = await generateFile(process.env.DB_NAME);
      const schemas = await fetchSchemas();
      for (const schema of schemas) {
        const tables = await fetchTables(schema);
        for (const table of tables) {
          const data = await db.any(`SELECT * FROM "${schema}"."${table}";`);
          const sql = data.map(row => pgp.as.format(`INSERT INTO "${schema}"."${table}" ($1:name) VALUES ($1:list);`, [row])).join("\n");
          await fs.promises.appendFile(file, `-- Backup para ${schema}.${table}\n${sql}\n`);
          logInfo(`>> Backup realizado para ${schema}.${table}`);
        }
      }
    },
    schema: async () => {
      const { chosenSchema } = await inquirer.prompt({
        type: 'list',
        name: 'chosenSchema',
        message: 'Escolha um schema:',
        choices: await fetchSchemas()
      });
      const file = await generateFile(chosenSchema);
      const tablesSchema = await fetchTables(chosenSchema);
      for (const table of tablesSchema) {
        const data = await db.any(`SELECT * FROM "${chosenSchema}"."${table}";`);
        const sql = data.map(row => pgp.as.format(`INSERT INTO "${chosenSchema}"."${table}" ($1:name) VALUES ($1:list);`, [row])).join("\n");
        await fs.promises.appendFile(file, `-- Backup para ${chosenSchema}.${table}\n${sql}\n`);
        logInfo(`>> Backup realizado para ${chosenSchema}.${table}`);
      }
    },
    table: async () => {
      const { schemaForTable } = await inquirer.prompt({
        type: 'list',
        name: 'schemaForTable',
        message: 'Escolha um schema:',
        choices: await fetchSchemas()
      });
      const { chosenTable } = await inquirer.prompt({
        type: 'list',
        name: 'chosenTable',
        message: 'Escolha uma tabela:',
        choices: await fetchTables(schemaForTable)
      });
      const file = await generateFile(`${schemaForTable}_${chosenTable}`);
      const data = await db.any(`SELECT * FROM "${schemaForTable}"."${chosenTable}";`);
      const sql = data.map(row => pgp.as.format(`INSERT INTO "${schemaForTable}"."${chosenTable}" ($1:name) VALUES ($1:list);`, [row])).join("\n");
      await fs.promises.appendFile(file, `-- Backup para ${schemaForTable}.${chosenTable}\n${sql}\n`);
      logInfo(`>> Backup realizado para ${schemaForTable}.${chosenTable}`);
    },
    exit: () => process.exit()
  }
  if (!!backupOptions[backupType]) {
    await backupOptions[backupType]();
  } else {
    logError("Opção inválida!");
  }
}


backup().catch(err => {
  logError(err);
  process.exit(1);
});
