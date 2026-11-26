# Compasso

## Sobre o sistema

O `Compasso` é um projeto da disciplina de Teste de Software para músicos que querem reunir seus trabalhos e sua agenda em um portfólio público. Na página inicial, **Descobrir músicos** abre a busca por nome, cidade ou instrumento. **Organizar meu espaço** leva o músico ao cadastro ou ao painel.

No painel, o músico edita o perfil, adiciona trabalhos e escolhe quais apresentações divulgar. Salvar atualiza o rascunho. Publicar ou republicar atualiza a página que o visitante vê. O músico também pode retirar o portfólio do ar ou exportar seus dados em JSON.

## Integrantes

- Luís Henrique Emediato
- Davi Balsamão

## Links da entrega

| Item | Link |
| --- | --- |
| Sistema em produção | [Abrir o Compasso](https://compasso.compasso-ufmg-2026.workers.dev) |
| Código-fonte | [Repositório no GitHub](https://github.com/luisemediato/compasso) |
| Build no GitHub Actions | [Execução aprovada da versão 0.3.0 (#117)](https://github.com/luisemediato/compasso/actions/runs/45784638486) · [Histórico de execuções](https://github.com/luisemediato/compasso/actions/workflows/ci.yml) |
| Cobertura de testes | [Relatório do Compasso no Codecov](https://app.codecov.io/gh/luisemediato/compasso) |
| Vídeo no YouTube | Aguardando publicação. [Roteiro da apresentação](docs/roteiro-video.md) |

## Tecnologias

A interface usa HTML, CSS e JavaScript. O esbuild prepara os arquivos da aplicação. Em desenvolvimento, o servidor roda com Node.js 24 e SQLite. A configuração de hospedagem usa Cloudflare Workers para servir a aplicação e Cloudflare D1 para armazenar os dados.

[Arquitetura de Compasso](docs/arquitetura.md)

## Uso de IA

ChatGPT e Codex foram usados como ferramentas de apoio ao planejamento, à elaboração de propostas de código e testes e à investigação de falhas. O desenvolvimento partiu de uma referência modular. As decisões sobre quais mudanças incorporar, sua revisão e a validação por testes ficaram sob responsabilidade humana.

## Execução local

Use Node.js da série 24, versão 24.15.0 ou superior. No terminal, clone o repositório e instale as dependências.

```bash
git clone https://github.com/luisemediato/compasso.git
cd compasso
```

Para abrir a aplicação, execute `npm run dev` e acesse <http://localhost:4173>. O servidor cria o banco em `.local/compasso.sqlite` na primeira execução. Para encerrar, pressione `Ctrl+C`. Também é possível gerar os arquivos com `npm run build` e servi-los com `npm start`.

## Execução dos testes

Execute os comandos na raiz do repositório, após `npm ci`. Antes do primeiro teste de navegador, instale o Chromium com `npx playwright install chromium`. No Linux ou WSL com Ubuntu, use `npx playwright install --with-deps chromium`. O Playwright inicia seu próprio servidor na porta `4183` e usa um banco SQLite em memória.

| Comando | O que executa |
| --- | --- |
| `npm test` | 88 testes unitários. |
| `npm run test:integration` | 99 testes de integração. |
| `npm run test:coverage` | Unidade e integração com cobertura. O c8 exige pelo menos 80% das linhas de cada arquivo JavaScript de `src/` e `server/` e gera `coverage/lcov.info`. |
| `npm run test:e2e -- --workers=1` | 12 cenários de ponta a ponta em Chromium, em sequência. |
| `npm run test:e2e:parallel` | Os mesmos cenários em paralelo, com quatro workers. |

O GitHub Actions executa as suítes em Linux, macOS e Windows. Consulte o guia para abrir os relatórios do Playwright ou conferir qual commit está em produção. [Testes no CI e deploy](docs/ci-cd.md)