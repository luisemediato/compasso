# Roteiro do vídeo de entrega

Duração sugerida: **4 minutos e 30 segundos**, dentro do limite de 5 minutos.
Gravar com a URL pública e os links de evidência do README disponíveis. Não mostrar
senhas, tokens, secrets nem dados pessoais de outras pessoas.

| Tempo | Mostrar | Fala sugerida |
| --- | --- | --- |
| 0:00–0:25 | Home pública e nomes dos integrantes | “Somos Davi Balsamão e Luís Henrique Emediato. O Compasso permite que músicos preparem um portfólio e escolham o que publicar para os visitantes.” |
| 0:25–0:55 | Explorar, demonstração identificada e área do músico | “O visitante encontra músicos por nome, cidade ou instrumento. O catálogo de demonstração é identificado. O músico entra na área privada para editar seus dados.” |
| 0:55–1:40 | Perfil, trabalho e agenda na conta de demonstração da dupla | “O e-mail de login não vira contato público automaticamente. O Instagram aceita usuário ou link. Na agenda, apresentações começam privadas; somente as marcadas como públicas entram no portfólio.” |
| 1:40–2:20 | Publicar, abrir em janela anônima, editar e republicar | “Salvar altera o rascunho. O visitante continua vendo a cópia anterior até republicar. Retirar a publicação remove a página pública sem apagar o rascunho.” |
| 2:20–2:50 | README e estrutura de pastas | “Usamos HTML, CSS e JavaScript, esbuild, Node.js e SQLite no desenvolvimento. Em produção, o Cloudflare Worker serve interface e API, e o D1 mantém os dados.” |
| 2:50–3:45 | Terminal, relatório Playwright, Actions e Codecov | “Unitários verificam regras e componentes. Integrações exercitam HTTP, banco e telas. Os 12 cenários de navegador usam contas independentes e também rodam em paralelo. A cobertura exige pelo menos 80% das linhas em cada arquivo de produção. O deploy só acontece depois de a matriz dos três sistemas passar.” |
| 3:45–4:10 | Seção Uso de IA no README | “ChatGPT e Codex apoiaram planejamento, propostas de implementação, testes e investigação de falhas. Partimos de uma referência modular, e a dupla revisou as alterações e decidiu o que incorporar.” |
| 4:10–4:30 | URL pública, commit e links finais | “A verificação pós-deploy confere a aplicação e o commit publicado. Os links do sistema, código, Actions, Codecov e deste vídeo estão reunidos para a avaliação.” |

## Preparação

1. Usar uma conta de apresentação da própria dupla, com dados fictícios identificados.
2. Deixar um trabalho e dois eventos preparados: um privado e outro público.
3. Abrir a URL pública em uma janela sem sessão para comparar o que o visitante vê.
4. Ter prontos os resultados de `npm test`, `npm run test:integration`,
   `npm run test:coverage` e `npm run test:e2e:parallel`. Mostrar o resultado real;
   não é necessário esperar todas as suítes durante a gravação.
5. Abrir o run verde e o relatório Codecov correspondentes ao commit entregue.
6. Após gravar, publicar no YouTube com acesso permitido ao avaliador e testar o
   link em janela anônima. A URL do vídeo só deve ser adicionada após a publicação.

## Entrega no Moodle

- Sistema em produção, abrindo sem login.
- Repositório GitHub.
- Execução verde do Actions referente à versão entregue.
- Relatório Codecov referente à versão entregue.
- Vídeo YouTube de até 5 minutos.

A gravação, a publicação no YouTube e o envio ao Moodle ainda precisam ser feitos
pela dupla. Este arquivo é um roteiro de gravação, não uma evidência de vídeo publicado.
