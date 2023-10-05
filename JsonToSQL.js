const inquirer = require("inquirer");
const fs = require("fs").promises;
const ora = require('ora');
const moment = require('moment');
const logError = require("./utils/logs/error");
const generateFile = require("./utils/generateFile");

async function main() {
  const spinner = ora();

  const { schema } = await inquirer.prompt({
    type: "input",
    name: "schema",
    message: "Informe o nome do schema:",
  });

  const { table } = await inquirer.prompt({
    type: "input",
    name: "table",
    message: "Informe o nome da tabela:",
  });

  const { batchSize } = await inquirer.prompt({
    type: "input",
    name: "batchSize",
    message: "Informe a quantidade do batch:",
    validate: input => !isNaN(input) || 'Por favor, informe um número válido.',
    default: 100
  });

  spinner.start('Lendo arquivo JSON...');
  const jsonData = JSON.parse(await fs.readFile("path_to_your_json_file.json", "utf8"));
  spinner.succeed('Arquivo JSON lido com sucesso!');

  // O mapeamento pode ser carregado de um arquivo ou de uma variável.
  const mappings = ['name|nome', 'address|rua'];

  const sqlProps = mappings.map(mapping => mapping.split('|')[1]);
  const jsonProps = mappings.map(mapping => mapping.split('|')[0]);

  let inserts = [];
  for (let i = 0; i < jsonData.length; i += batchSize) {
    const batch = jsonData.slice(i, i + batchSize);
    const values = batch.map(item => {
      return `(${jsonProps.map(prop => `'${item[prop]}'`).join(', ')})`;
    }).join(', ');
    inserts.push(`INSERT INTO "${schema}"."${table}" (${sqlProps.join(', ')}) VALUES ${values};`);
  }

  spinner.start('Gerando instruções SQL...');
  const sqlFile = await generateFile(table); // Utiliza o nome da tabela como base para o nome do arquivo.
  await fs.promises.writeFile(sqlFile, inserts.join('\n'));
  spinner.succeed(`Instruções SQL salvas em "${sqlFile}"!`);
}

main().catch(error => {
  logError("Erro:", error);
});
