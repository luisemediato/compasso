# Arquitetura do Compasso

O músico edita perfil, trabalhos e agenda na área privada. A página `/previa` mostra como o rascunho ficará para o público. Em `/publicacao`, o músico decide quando atualizar o portfólio que os visitantes encontram em `/explorar` e no endereço `/<slug>`. [Rotas da aplicação](../src/domain/routes.js)

## Do formulário ao banco

Ao salvar um formulário, a interface envia os dados à API. O servidor identifica o músico pelo cookie de sessão e confere a revisão do rascunho. Se duas abas tentarem salvar a mesma revisão, a primeira gravação prevalece e a segunda recebe um conflito (HTTP 409). Assim, o músico pode recarregar o rascunho antes de editar novamente. [Cliente da API](../src/data/api.js) · [Sessões](../server/auth.js) · [Gravação no servidor](../server/api.js)

Em desenvolvimento, o servidor usa Node.js e SQLite em arquivo. Em produção, o Cloudflare Worker atende a interface e a API, e o Cloudflare D1 armazena os dados. Nos dois ambientes, a tabela `artists` guarda o rascunho no campo `draft` e a cópia pública no campo `publication`. [Esquema do banco](../db/schema.js) · [SQLite local](../server/local-db.js) · [Worker](../server/worker.js)

## O que o visitante vê

Considere um músico que marca um recital futuro como público e depois precisa mudar o local.

| Ação do músico | Resultado para quem visita o portfólio |
| --- | --- |
| Salva o recital antes da primeira publicação. | O portfólio ainda não aparece na busca e o endereço público retorna 404. |
| Publica o portfólio. | O recital aparece com o local anunciado. |
| Altera o local e salva o rascunho. | O visitante continua vendo o local anterior. O músico já vê o novo local na prévia. |
| Republica o portfólio. | O visitante passa a ver o novo local. |
| Retira a publicação. | O portfólio sai da busca e o endereço volta a retornar 404. O rascunho continua disponível para o músico. |

Somente apresentações marcadas como públicas entram na cópia publicada. A agenda do portfólio exibe as que acontecem a partir de hoje. [Regras de publicação](../src/domain/publication.js) · [Página do portfólio](../src/pages/portfolio.js)

## Onde essa regra é testada

- **Unidade.** Os testes alteram o rascunho depois de gerar uma publicação e conferem que a cópia preserva os dados originais. [Testes de publicação](../tests/unit/publication.test.js)
- **Integração.** As requisições passam pela API e usam SQLite em memória. A suíte verifica o conteúdo público após republicar ou retirar o portfólio e o conflito entre duas gravações da mesma revisão. [Publicação](../tests/integration/publication.test.js) · [Rascunho e concorrência](../tests/integration/draft.test.js)
- **Navegador.** O Playwright abre o painel do músico e o portfólio em um segundo contexto, sem sessão. O teste confere o que o visitante vê antes e depois de o músico republicar. [Fluxos de ponta a ponta](../tests/e2e/flows.spec.js)
