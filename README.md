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

Com o Node.js 24 atualizado (24.15.0 ou superior na linha 24, exigido pelo jsdom do lockfile), execute `npm ci` na raiz do repositório para instalar as dependências.

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
| `npm run test:e2e -- --workers=1` | Os 11 fluxos de navegador em sequência. |
| `npm run test:e2e:parallel` | Os mesmos 11 fluxos com quatro workers. |
| `npm run test:smoke -- https://URL-PUBLICA` | Verificação de leitura da aplicação publicada, sem criar contas ou mensagens. |

O GitHub Actions executa as verificações em Linux, Windows e macOS. A cobertura considera os arquivos JavaScript de `src/` e `server/`. No terminal, a coluna `% Lines` indica a porcentagem de linhas executadas pelos testes. Para consultar os resultados de uma versão, abra a [execução no GitHub Actions](https://github.com/luisemediato/compasso/actions/workflows/ci.yml) e o [relatório no Codecov](https://app.codecov.io/gh/luisemediato/compasso) referentes ao mesmo commit.

Antes do primeiro E2E, execute `npx playwright install chromium` (no Linux, use `npx playwright install --with-deps chromium`). O Playwright faz o build, inicia o servidor na porta **4183** e cria um SQLite **em memória**, separado de `.local/compasso.sqlite`. Deixe essa porta livre. Cada teste usa uma identidade própria; os testes de publicação abrem um segundo contexto sem sessão. Os 11 cenários seguem a lista do roteiro: cadastro/login, perfil, criar/editar/excluir apresentação, trabalho na prévia, caminhos da home, edição privada após publicar, retirada, acesso direto com republicação e contato.

O relatório fica em `playwright-report/index.html`; use `npx playwright show-report` para abri-lo. Em falhas há screenshot e trace em `test-results/`. O Actions executa os E2E em paralelo, com dois workers em cada sistema, e guarda os artifacts `playwright-ubuntu-latest`, `playwright-windows-latest` e `playwright-macos-latest`, inclusive quando um teste falha. O job `deploy` depende da aprovação de toda a matriz `unit`.

### Usar o sistema

Na home, visitantes seguem por **Explorar**; músicos usam **Cadastrar** ou **Entrar**. Após entrar, o painel oferece perfil, trabalhos, agenda, prévia e publicação. O e-mail de login e o nome completo não entram no portfólio. O contato público é opcional. O Instagram aceita usuário, `@usuario` ou link e pode ser apagado.

Salvar altera o rascunho. **Publicar/Republicar** atualiza a cópia visível pelo endereço `/<slug>`; **Retirar publicação** remove essa cópia e conserva o rascunho. Eventos novos são privados por padrão; eventos antigos sem visibilidade também continuam privados. Só eventos marcados como públicos entram na publicação.

Se outra aba salvar primeiro, a tela preserva os campos e oferece **Recarregar rascunho**, com confirmação de descarte. O painel também permite importar um rascunho legado deste navegador após confirmação; isso não altera a publicação existente. O rodapé abre **Fale com a equipe** e só confirma recebimento depois da resposta de gravação do servidor.

### Hospedagem e verificação pública

O Cloudflare Worker serve interface e API no mesmo endereço; o D1 mantém os dados. A configuração está em `wrangler.json`. O workflow publica somente em push na `main`, depois de unidade, integração, cobertura e E2E aprovados nos três sistemas. Antes de publicar, aplica as migrações pendentes no D1 remoto. Os secrets `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` ficam no GitHub Actions; `CODECOV_TOKEN` permite enviar a cobertura. Os valores dessas credenciais não fazem parte do repositório.

O job de produção registra a URL no resumo do run e executa o smoke contra ela. O script exige status 200 e conteúdo esperado da home, CSS, JavaScript, API pública e rota direta. O arquivo público `/version.json` registra o SHA; no Actions, o smoke exige que ele corresponda ao commit aprovado. Localmente, o build identifica a revisão como `local`.

Para repetir a verificação, execute `npm run test:smoke -- https://URL-REAL`. Para conferir um portfólio existente, passe seu caminho: `npm run test:smoke -- https://URL-REAL /slug-publicado`. A variável `COMPASSO_REVISION` permite exigir um SHA específico. O smoke não cria contas nem mensagens. `npm run deploy:check` só confere o pacote do Worker, sem publicar ou migrar o banco remoto.

### Evidências e vídeo

A suíte atual contém **85 unitários**, **76 integrações** e **11 cenários E2E**. A cobertura exige pelo menos **80% das linhas por arquivo** de `src/` e `server/`, incluindo módulos não executados. Os resultados e os artifacts dos três sistemas ficam no run do Actions; confira o SHA do run e o relatório correspondente no Codecov.

O [roteiro do vídeo](docs/roteiro-video.md) organiza uma apresentação de até 5 minutos com sistema, tecnologias, uso de IA e testes. A dupla ainda precisa gravar, publicar o vídeo no YouTube e enviar os cinco links no Moodle. O histórico pode ser conferido com `git rev-list --count --no-merges origin/main` após `git fetch origin`.

A Vercel não executa o binding `env.DB` do D1 como configuração nativa. O SQLite em arquivo usado em desenvolvimento também não persiste em Vercel Functions. Uma migração exigiria adaptar o entrypoint HTTP, conectar um banco remoto e revalidar transações, cookies e roteamento; publicar apenas `dist/public` não entrega cadastro nem persistência. Referências: [filesystem das Vercel Functions](https://vercel.com/docs/functions/runtimes#file-system-support) e [bindings D1 da Cloudflare](https://developers.cloudflare.com/d1/get-started/).
