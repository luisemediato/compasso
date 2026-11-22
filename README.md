# Compasso

## Descrição

O `Compasso` é um projeto da disciplina de Teste de Software para músicos que querem reunir seus trabalhos e sua agenda em um portfólio público. Cada músico pode preparar um rascunho e escolher o que publicar. Os visitantes podem explorar os portfólios e consultar os eventos públicos.

## Integrantes

- Luís Henrique Emediato
- Davi Balsamão

## Tecnologias

A interface usa HTML, CSS e JavaScript. O esbuild prepara os arquivos da aplicação. Em desenvolvimento, o servidor roda com Node.js 24 e SQLite. A configuração de hospedagem usa Cloudflare Workers para servir a aplicação e Cloudflare D1 para armazenar os dados.

## Uso de IA

ChatGPT e Codex foram usados como ferramentas de apoio ao planejamento, à elaboração de propostas de código e testes e à investigação de falhas. O desenvolvimento partiu de uma referência modular. As decisões sobre quais mudanças incorporar, sua revisão e a validação por testes ficaram sob responsabilidade humana.

## Execução e testes

Para obter uma cópia do projeto, execute:

```bash
git clone https://github.com/luisemediato/compasso.git
cd compasso
```

Com o Node.js 24 instalado, execute `npm ci` na raiz do repositório para instalar as dependências.

### Executar a aplicação localmente

Execute `npm run dev` e abra http://localhost:4173 no navegador. Para encerrar o servidor, pressione `Ctrl+C`. Para servir um build já gerado, use `npm start`.

O comando `npm run build` gera os arquivos da aplicação em `dist/`. Na primeira execução, o servidor cria o banco SQLite em `.local/compasso.sqlite` e aplica a migração `drizzle/0000_compasso.sql`. Os dados ficam disponíveis nas próximas vezes que o servidor for iniciado.

### Rodar os testes

Execute os comandos na raiz do repositório. As suítes abaixo rodam no terminal e dispensam iniciar o servidor de desenvolvimento.

| Comando | O que executa |
| --- | --- |
| `npm test` | Testes unitários. |
| `npm run test:integration` | Testes de integração. |
| `npm run test:coverage` | As duas suítes com medição de cobertura. Gera `coverage/lcov.info`. |

O GitHub Actions executa as verificações em Linux, Windows e macOS. A cobertura considera os arquivos JavaScript de `src/` e `server/`. No terminal, a coluna `% Lines` indica a porcentagem de linhas executadas pelos testes. Para consultar os resultados de uma versão, abra a [execução no GitHub Actions](https://github.com/luisemediato/compasso/actions/workflows/ci.yml) e o [relatório no Codecov](https://app.codecov.io/gh/luisemediato/compasso) referentes ao mesmo commit.
