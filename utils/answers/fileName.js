const inquirer = require('inquirer');

async function askForFileName() {
  const { fileName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'fileName',
      message: 'Digite um nome para o arquivo (ou deixe em branco):',
      validate: (input) => {
        if (input.trim() === '') {
          return true; // Válido se em branco
        }
        return /^[a-zA-Z0-9_]+$/.test(input) || 'Nome de arquivo inválido (use apenas letras, números e underscores).';
      },
    },
  ]);

  return fileName || undefined;
}

module.exports = askForFileName;