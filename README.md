cat > README.md <<'EOF'
# Compasso

Projeto da disciplina de Teste de Software. O objetivo é permitir que músicos
publiquem seus trabalhos e sua agenda em um portfólio que visitantes possam explorar.

## Integrantes

- Luís Henrique Emediato
- Davi Balsamão

## Executar localmente

Com o Node.js 24 instalado, execute na raiz do projeto:

```bash
npm ci
npm run dev
```

Abra http://localhost:4173 no navegador. Para encerrar o servidor, pressione `Ctrl+C`.

Para servir novamente um build já gerado, execute `npm start`.

## Como rodar os testes

Após instalar as dependências com `npm ci`, execute os testes unitários:

```bash
npm test
```

Para testar o handler HTTP:

```bash
node --test tests/integration/http.test.js
```
EOF