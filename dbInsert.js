const fs = require('fs').promises;
const path = require('path');
const pgp = require('pg-promise')();
const { config } = require('dotenv');
const inquirer = require('inquirer');
const logError = require('./utils/logs/error');
const logInfo = require('./utils/logs/info');
const ora = require('ora');

config();

const dirPath = "./SQL/";


const askChunkSize = async () => {
  const { userChunkSize } = await inquirer.prompt({
    type: 'input',
    name: 'userChunkSize',
    message: 'Informe o tamanho do chunk (ou deixe em branco para usar o padrão: [1000]):',
    validate: (input) => {
      if (input.trim() === '') {
        return true; // Válido se em branco
      }
      return /^[0-9]+$/.test(input) || 'Por favor, informe um número válido.';
    },
  });

  const CHUNK_SIZE = process.env.CHUNK_SIZE ?? 10000;
  return userChunkSize ? parseInt(userChunkSize) : parseInt(CHUNK_SIZE);
};

const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const processSQLFile = async (filePath, filename) => {
  const CHUNK_SIZE = await askChunkSize();
  const spinner = ora(`Inserindo dados do arquivo: ${filename}...`).start();
  const sqlContent = await fs.readFile(filePath, 'utf8');
  const insertQueries = sqlContent.split(";").filter((query) => query.trim() !== "");
  const totalChunks = Math.ceil(insertQueries.length / CHUNK_SIZE);

  try {
    for (let i = 0; i < insertQueries.length; i += CHUNK_SIZE) {
      const currentChunk = i / CHUNK_SIZE + 1;
      spinner.indent = 1
      spinner.color = 'red'
      spinner.start(`Inserindo chunk ${currentChunk} de ${totalChunks}`)
      const chunk = insertQueries.slice(i, i + CHUNK_SIZE).join(";");
      await db.none(chunk);
      spinner.succeed(`Chunk inserido com sucesso: ${currentChunk} de ${totalChunks}`)
    }
    spinner.indent = 0
    spinner.succeed(`Dados do arquivo: ${filename} inseridos com sucesso!`);
  } catch (err) {
    spinner.indent = 0
    spinner.fail(`Erro ao inserir dados do arquivo: ${filename}`);
    spinner.fail(`Erro: ${err}`);
  }

}


(async () => {
  try {
    const files = await fs.readdir(dirPath);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    for (let file of sqlFiles) {
      const filePath = path.join(dirPath, file);
      await processSQLFile(filePath, file);
    }
  } catch (err) {
    console.log(err)
  }
  finally {
    pgp.end();
    process.exit();

  }
})();
