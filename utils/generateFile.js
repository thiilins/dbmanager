const path = require('path');
const moment = require('moment');
const fs = require('fs');
const ora = require('ora');

const generateFile = async ({ db_name, schema, table, extension = 'sql' }) => {
  const backupDirectory = path.join('backups', db_name, schema);

  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory, { recursive: true });
  }

  const fileName = `${table}_${moment().format('YYYY-MM-DD-HHmmss')}.${extension}`;
  const backupFilePath = path.join(backupDirectory, fileName);
  const spinner = ora(`Criando Arquivo em: ./${backupFilePath}`).start();

  try {
    await fs.promises.writeFile(backupFilePath, '');
    spinner.info(`Arquivo criado com sucesso em: ./${backupFilePath}`);
    return backupFilePath;
  } catch (err) {
    spinner.fail(`Erro ao criar arquivo: ${err.message}`);
    throw err; // Lança o erro para ser tratado por quem chama a função
  }
}

module.exports = generateFile;
