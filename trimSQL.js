const fs = require('fs');
const path = require('path');
const ora = require('ora');

// Define o caminho da pasta SQL de entrada e a pasta NEW_SQL de saída
const inputFolderPath = './SQL';
const outputFolderPath = './NEW_SQL';

// Garante que a pasta de saída exista; se não, a cria
try {
  if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath);
  }
} catch (error) {
  console.error(`Erro ao criar a pasta de saída ${outputFolderPath}: ${error}`);
  process.exit(1);
}

/**
 * Processa um arquivo SQL, aplicando trim nos valores de texto.
 * @param {string} filePath - Caminho do arquivo SQL de entrada.
 */
function processSQLFile(filePath) {
  const spinner = ora(`Processando ${filePath}`).start();

  try {
    // Lê o conteúdo do arquivo
    const fileContents = fs.readFileSync(filePath, 'utf8');

    // Aplica o trim nos valores de texto dentro do arquivo SQL
    const trimmedSQL = fileContents.replace(/'(.*?)'/g, (match, group) => `'${group.trim()}'`);

    // Obtém o nome do arquivo sem a extensão
    const fileNameWithoutExtension = path.basename(filePath, '.sql');

    // Define o caminho do arquivo de saída
    const outputPath = path.join(outputFolderPath, `${fileNameWithoutExtension}.sql`);

    // Escreve o SQL processado no arquivo de saída
    fs.writeFileSync(outputPath, trimmedSQL, 'utf8');
    spinner.succeed(`Arquivo ${outputPath} criado com sucesso.`);
  } catch (err) {
    spinner.fail(`Erro ao processar ${filePath}: ${err.message}`);
  }
}

// Lê todos os arquivos .sql na pasta de entrada
try {
  fs.readdir(inputFolderPath, (err, files) => {
    if (err) {
      console.error(`Erro ao ler a pasta ${inputFolderPath}: ${err}`);
      process.exit(1);
    }

    // Filtra os arquivos .sql
    const sqlFiles = files.filter((file) => file.endsWith('.sql'));

    // Processa cada arquivo SQL
    sqlFiles.forEach((file) => {
      const filePath = path.join(inputFolderPath, file);
      processSQLFile(filePath);
    });
  });
} catch (error) {
  console.error(`Erro ao ler a pasta de entrada ${inputFolderPath}: ${error}`);
  process.exit(1);
}
