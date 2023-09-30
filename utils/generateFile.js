const askForFileName = require('./fileName');
const path = require('path');
const moment = require('moment')
const fs = require('fs');
const logInfo = require('./logs/info');

const generateFile = async (filename, backupDir = "backups/") => {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const userFileName = await askForFileName()
  const fileName = `${userFileName ?? filename}_${moment().format('YYYY-MM-DD-HHmmss')}.sql`;
  const backupFilePath = path.join(backupDir, fileName);
  await fs.promises.writeFile(backupFilePath, '');
  logInfo(` Arquivo de Saída:  ./${backupFilePath}`)
  return backupFilePath
}
module.exports = generateFile;