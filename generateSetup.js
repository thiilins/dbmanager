const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs').promises;

async function generateEnv() {
  const spinner = ora('Configurando variáveis de ambiente...').start();

  try {
    const dbHost = await inquirer.prompt({
      type: 'input',
      name: 'DB_HOST',
      message: 'Informe o host do banco de dados (default: localhost):',
      default: 'localhost',
    });

    const dbUser = await inquirer.prompt({
      type: 'input',
      name: 'DB_USER',
      message: 'Informe o usuário do banco de dados:',
      default: 'root'

    });

    const dbName = await inquirer.prompt({
      type: 'input',
      name: 'DB_NAME',
      message: 'Informe o nome do banco de dados:',
      default: 'meu_db'
    });

    const dbPassword = await inquirer.prompt({
      type: 'input',
      name: 'DB_PASSWORD',
      message: 'Informe a senha do banco de dados:',
      default: ''
    });

    const dbPort = await inquirer.prompt({
      type: 'input',
      name: 'DB_PORT',
      message: 'Informe a porta do banco de dados (default: 5432):',
      default: '5432',
    });

    const envContent = `
DB_HOST=${dbHost.DB_HOST}
DB_USER=${dbUser.DB_USER}
DB_NAME=${dbName.DB_NAME}
DB_PASSWORD=${dbPassword.DB_PASSWORD}
DB_PORT=${dbPort.DB_PORT}
`;

    await fs.writeFile('.env', envContent);

    spinner.succeed('.env configurado com sucesso!');
  } catch (error) {
    spinner.fail(`Erro ao configurar o .env: ${error.message}`);
  }
}

generateEnv();
