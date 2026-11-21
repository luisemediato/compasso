import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from '../../src/domain/routes.js';

test('o caminho / resolve para a página inicial', () => {
  assert.equal(resolveRoute('/'), 'home');
});

test('converte endereços em rotas internas e reconstrói o endereço original', async () => {
  const { routeFromPath, pathFromRoute } = await import('../../src/domain/routes.js');

  const casos = [
    ['/', 'home'],
    ['/painel', 'dashboard'],
    ['/contato', 'contact'],
    ['/joao-silva', 'artist/joao-silva'],
    ['/cadastro', 'register'],
  ];

  for (const [endereco, rota] of casos) {
    assert.equal(routeFromPath(endereco), rota, `ao abrir ${endereco}`);
    assert.equal(pathFromRoute(rota), endereco, `ao gerar o endereço de ${rota}`);
  }
});

test('volta para a home ao gerar o endereço de uma rota inválida', async () => {
  const { pathFromRoute } = await import('../../src/domain/routes.js');

  assert.equal(pathFromRoute('rota-inexistente'), '/');
  assert.equal(pathFromRoute('artist/'), '/');
});
