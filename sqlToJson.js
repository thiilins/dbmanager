const inquirer = require("inquirer");
const fs = require("fs").promises;
const ora = require('ora');
const logError = require("./utils/logs/error");
const generateFile = require("./utils/generateFile");

async function main() {
  const spinner = ora();

  const { inputFilePath } = await inquirer.prompt({
    type: "input",
    name: "inputFilePath",
    message: "Informe o caminho do arquivo SQL:",
  });

  spinner.start('Lendo arquivo SQL...');
  const sqlContent = await fs.readFile(inputFilePath, "utf8");
  spinner.succeed('Arquivo SQL lido com sucesso!');

  // Dividir por instruções "INSERT INTO"
  const inserts = sqlContent.split(/INSERT INTO/i).slice(1);

  const jsonData = [];

  for (const insert of inserts) {
    const match = /.*?"(.*?)\."(.*?)".*?\((.*?)\).*?VALUES (.*?);$/is.exec(insert);
    if (!match) continue;

    const columns = match[3].split(',').map(col => col.trim().replace(/"/g, ''));
    const values = match[4].split('),').map(valueSet =>
      valueSet.replace(/[()]/g, '').split(',').map(val => val.trim().replace(/'/g, ''))
    );

    for (const valueSet of values) {
      const obj = {};
      for (let i = 0; i < columns.length; i++) {
        obj[columns[i]] = valueSet[i];
      }
      jsonData.push(obj);
    }
  }

  spinner.start('Gerando arquivo JSON...');
  const outputFilePath = inputFilePath.replace(/\.sql$/, '.json');
  await fs.writeFile(outputFilePath, JSON.stringify(jsonData, null, 2));
  spinner.succeed(`Dados convertidos e salvos em "${outputFilePath}"!`);
}

main().catch(error => {
  logError("Erro:", error);
});
