# DB Manager CLI

## Descrição

O DB Manager CLI é uma ferramenta de linha de comando (CLI) desenvolvida em Node.js para auxiliar na manipulação e gerenciamento de bancos de dados PostgreSQL. Com este utilitário, você pode realizar várias tarefas, como backup, extração de dados, conversão de formatos e muito mais.

## Estrutura de Pastas

O projeto possui a seguinte estrutura de pastas:

- SQL: Contém os arquivos SQL de entrada.
- utils/
  - fetchData: Funções relacionadas à extração de dados do banco.
  - logs: Funções para registros de logs.
  - saveFormats: Funções para salvar dados em diferentes formatos.

## Instalação

1. Clone o repositório para o seu sistema:

```bash
git clone https://github.com/thiilins/db-manager-cli.git
```

2. Navegue até o diretório do projeto:

```bash
cd db-manager-cli
```

3. Instale as dependências:

```bash
npm install
```

## Configuração do Ambiente

Antes de usar a CLI, configure as variáveis de ambiente no arquivo `.env`. Aqui está um exemplo do conteúdo do arquivo `.env`:

```env
DB_HOST=''
DB_USER=''
DB_NAME=''
DB_PASSWORD=''
DB_PORT='5432'
```

Preencha os valores apropriados para se conectar ao seu banco de dados PostgreSQL.

## Utilização

### Backup de Dados

Para realizar um backup de dados, execute o seguinte comando:

```bash
npm run backup-data
```

Você será solicitado a escolher o formato de saída (SQL ou JSON) e o tipo de backup (banco, schema ou tabela).

### Extração de Dados

Para extrair dados do banco, execute o seguinte comando:

```bash
npm run extract-data
```

Você será solicitado a escolher o formato de saída (SQL ou JSON) e o tipo de extração (banco, schema ou tabela).

### Conversão de Formatos

Você pode converter dados de um formato para outro usando os seguintes comandos:

- Para converter de SQL para JSON:

```bash
npm run sql-to-json
```

- Para converter de JSON para SQL:

```bash
npm run json-to-sql
```

### Inserção no Banco de Dados

Para inserir dados no banco de dados a partir de arquivos SQL, execute o seguinte comando:

```bash
npm run db-insert
```

### Configuração Personalizada

Você pode personalizar a configuração da CLI editando os scripts no arquivo `package.json`.

## Melhorias Implementadas

- A CLI agora solicita o tamanho do chunk apenas uma vez e o reutiliza para todos os arquivos inseridos no `db-insert`.
- Scripts adicionados ao `package.json` para automação de tarefas, incluindo configuração de variáveis de ambiente.

## Créditos

Este projeto foi desenvolvido por Thiago Lins e é distribuído sob a licença MIT.

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir problemas (issues) e enviar solicitações de pull (pull requests) para melhorar este projeto.

## Licença

Este projeto é licenciado sob a [Licença MIT](LICENSE).
