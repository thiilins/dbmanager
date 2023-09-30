const fs = require('fs').promises;
const path = require('path');
const pgp = require('pg-promise')();
const { config } = require('dotenv');
const inquirer = require('inquirer');
const logError = require('./utils/logs/error');
const logInfo = require('./utils/logs/info');
config();

const dirPath = "./SQL/";
const CHUNK_SIZE = 10000;



const db = pgp({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const processSQLFile = async (filePath, filename) => {
  const sqlContent = await fs.readFile(filePath, 'utf8');
  const insertQueries = sqlContent.split(";").filter((query) => query.trim() !== "");

  const totalChunks = Math.ceil(insertQueries.length / CHUNK_SIZE);

  for (let i = 0; i < insertQueries.length; i += CHUNK_SIZE) {
    const chunk = insertQueries.slice(i, i + CHUNK_SIZE).join(";");
    await db.none(chunk);
    const currentChunk = i / CHUNK_SIZE + 1;
    logInfo(`:: ${filename} :: Dados inseridos com sucesso: Chunk ${currentChunk} de ${totalChunks}`);
  }
}

const askParallelExecution = async () => {
  const { executeInParallel } = await inquirer.prompt({
    type: 'list',
    name: 'executeInParallel',
    message: 'Deseja executar os arquivos em paralelo?',
    choices: [
      { name: 'Sim', value: true },
      { name: 'Não', value: false },
    ],
    default: false, // Padrão para "Não"
  });

  return executeInParallel;
}

(async () => {
  try {
    const files = await fs.readdir(dirPath);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    const executeInParallel = await askParallelExecution();
    if (executeInParallel) {
      const promises = sqlFiles.map(async file => {
        const filePath = path.join(dirPath, file);
        logInfo(`>> Arquivo: ${file} - INICIADO  <<`);
        await processSQLFile(filePath, file);
        logInfo(`>> Arquivo: ${file} - FINALIZADO <<`);
      });
      await Promise.all(promises);
    } else {
      for (let file of sqlFiles) {
        const filePath = path.join(dirPath, file);
        logInfo(`>> Arquivo: ${file} - INICIADO  <<`);
        try {
          await processSQLFile(filePath, file);
          logInfo(`>> Arquivo: ${file} - FINALIZADO <<`);
        } catch (err) {
          logError(`!! Erro ao processar o arquivo ${file}: ${err}`);
        }
      }
    }
  } catch (err) {
    logError("Erro geral:", err);
  } finally {
    pgp.end();
    process.exit();
  }
})();
