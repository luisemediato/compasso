cat > README.md <<'EOF'
# Compasso

Projeto da disciplina de Teste de Software. O objetivo do software é permitir que músicos
publiquem seus trabalhos e sua agenda em um portfólio que visitantes possam explorar.

## Integrantes

- Luís Henrique Emediato
- Davi Balsamão

## Como rodar os testes

Com o Node.js 24 instalado, execute na raiz do projeto:

```bash
npm ci
npm test
```
EOF

cat > .gitignore <<'EOF'
node_modules/
coverage/
dist/
EOF

git status --short