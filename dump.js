const pgp = require('pg-promise')();
const { config } = require('dotenv');
const inquirer = require('inquirer');
const { exec } = require('child_process');
const generateFile = require("./utils/generateFile");
const ora = require('ora'); // Adicionado

const logError = require('./utils/logs/error');
const logInfo = require('./utils/logs/info');

config();

const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fetchSchemas() {
  const schemas = await db.any("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'pg_catalog', 'information_schema');");
  return schemas.map(s => s.schema_name);
}

const runPgDump = (schemas, haveData, haveInserts, fileName) => {
  const schemaString = schemas.join(' -n ');
  const contentType = haveData ? '--schema-only' : ''
  process.env.PGPASSWORD = process.env.DB_PASSWORD;
  const insertOption = haveInserts ? '--inserts' : '';

  const command = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f "./${fileName}" --no-owner ${contentType} ${insertOption} -n ${schemaString}`;

  return new Promise((resolve, reject) => {
    const spinner = ora('Realizando backup...').start();
    exec(command, (error, stdout, stderr) => {
      if (error) {
        spinner.fail('Erro durante o backup');
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        spinner.fail('Erro durante o backup');
        reject(`Error: ${stderr}`);
        return;
      }

      spinner.succeed('Backup realizado com sucesso');
      resolve(stdout);
    });
  });
};

async function selectAndBackup() {
  const schemas = await fetchSchemas();
  const { selectedSchemas, haveData, haveInserts } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedSchemas',
    message: 'Selecione os schemas para backup:',
    choices: schemas
  }, {
    type: 'list',
    name: 'includeData',
    message: 'Você deseja incluir (Padrão: Estrutura Apenas):',
    choices: [
      { name: 'Estrutura Apenas', value: false },
      { name: 'Dados e Estrutura', value: true }
    ],
    default: false
  }, {
    type: 'confirm',
    name: 'useInserts',
    message: 'Você deseja usar o formato INSERT em vez de COPY? (Padrão: Não)',
    default: false
  }]);

  if (selectedSchemas.length > 0) {
    try {
      const fileName = await generateFile(selectedSchemas.join('_'));
      await runPgDump(selectedSchemas, haveData, haveInserts, fileName);
    } catch (err) {
      logError(`Erro ao fazer backup: ${err}`);
    }
  } else {
    logInfo('Nenhum schema selecionado. Saindo.');
  }
}

selectAndBackup().catch(err => {
  logError(err);
  process.exit(1);
}).finally(() => {
  pgp.end();
});
