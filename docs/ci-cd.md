# Testes no CI e deploy

## O que roda no GitHub Actions

A cada push ou pull request, o workflow instala as dependências com Node.js 24 e executa a mesma sequência em Ubuntu, macOS e Windows. Cada job roda os testes unitários, mede a cobertura de unidade e integração, gera o build e executa os cenários de navegador em Chromium com dois workers. O job do Ubuntu também envia o arquivo LCOV ao Codecov. [Workflow](../.github/workflows/ci.yml) · [Configuração da cobertura](../.c8rc.json)

## Onde encontrar os resultados

| Para conferir | Onde olhar |
| --- | --- |
| Cobertura de uma revisão | No Codecov, abra o commit pelo mesmo SHA que aparece na execução do Actions. Localmente, `npm run test:coverage` mostra a coluna `% Lines` por arquivo. [Codecov do Compasso](https://app.codecov.io/gh/luisemediato/compasso) |
| Um cenário de navegador que falhou | No resumo da execução, abra **Artifacts** e baixe o relatório do sistema afetado, por exemplo, `playwright-windows-latest`. O relatório do Playwright traz o passo que falhou. As capturas de tela e o trace ficam em `test-results/`. |
| Relatório E2E local | Depois de rodar os testes de navegador, execute `npx playwright show-report` para abrir `playwright-report/index.html`. [Configuração do Playwright](../playwright.config.js) |

## Como uma versão chega à produção

Em um push na `main`, o job **Publicar e verificar produção** aguarda a aprovação dos três sistemas. Em seguida, aplica as migrações pendentes ao D1, prepara o endereço `workers.dev`, publica o Worker e verifica a aplicação pela URL pública. O build grava o SHA do commit em `/version.json`. [Configuração do Worker](../wrangler.json) · [Migrações do banco](../drizzle) · [Revisão em produção](https://compasso.compasso-ufmg-2026.workers.dev/version.json)

O workflow lê `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` dos secrets do GitHub Actions. O envio da cobertura usa `CODECOV_TOKEN`. Para conferir localmente o pacote que o Wrangler publicaria, execute `npm run deploy:check` na raiz do projeto. Esse comando faz um build e um ensaio de deploy local.

## Repetir a verificação pública

Na raiz do projeto, execute o teste de leitura contra produção.

```bash
npm run test:smoke -- https://compasso.compasso-ufmg-2026.workers.dev
```

O teste consulta a home, o CSS, o JavaScript, a API de músicos e a rota `/explorar`. Para verificar o endereço de um músico, acrescente o caminho de um portfólio publicado como último argumento. No Actions, a variável `COMPASSO_REVISION` também exige que o SHA servido em `/version.json` corresponda ao commit do run. [Script de verificação](../scripts/smoke.js)
