const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../test/ensure-test-env');

// Regressão: upsertFailure() fazia um read-modify-write não atómico (SELECT em JS,
// depois UPDATE/INSERT separado). Dois pedidos concorrentes de login falhado para a
// mesma conta liam o mesmo failed_count antes de qualquer escrita, e ambos gravavam o
// mesmo valor — um lote inteiro de tentativas simultâneas contava como 1, permitindo
// contornar o limiar de bloqueio (LOGIN_MAX_FAILURES). Este arquivo testa que o
// controlo de concorrência optimista (UPDATE condicionado ao failed_count lido) força
// um pedido que perde a corrida a reler o estado e tentar de novo, em vez de sobrepor
// silenciosamente um valor desatualizado.

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

/**
 * Fake do Supabase com uma tabela em memória, suportando select/eq/insert/update
 * como usados por login-attempts.repository.js. `onUpdateAttempt` é chamado a cada
 * tentativa de UPDATE (antes de aplicar os filtros), para simular um escritor
 * concorrente que muda a linha entre a leitura e a escrita de outro pedido.
 */
function createFakeSupabase(rows, { onUpdateAttempt } = {}) {
  let autoId = 1;
  return {
    from(tableName) {
      assert.equal(tableName, 'auth_login_attempts');
      const filters = [];
      let mode = null;
      let payload = null;

      const matches = () => rows.filter((r) => filters.every(([f, v]) => r[f] === v));

      const builder = {
        select() {
          return builder;
        },
        insert(p) {
          mode = 'insert';
          payload = p;
          return builder;
        },
        update(p) {
          mode = 'update';
          payload = p;
          return builder;
        },
        eq(field, value) {
          filters.push([field, value]);
          return builder;
        },
        async maybeSingle() {
          if (mode === 'insert') {
            if (rows.some((r) => r.account_key === payload.account_key)) {
              return { data: null, error: { code: '23505', message: 'duplicate key' } };
            }
            const row = { id: `gen-${autoId++}`, ...payload };
            rows.push(row);
            return { data: row, error: null };
          }
          if (mode === 'update') {
            if (onUpdateAttempt) onUpdateAttempt(filters);
            const affected = matches();
            affected.forEach((r) => Object.assign(r, payload));
            return { data: affected[0] || null, error: null };
          }
          return { data: matches()[0] || null, error: null };
        },
        async single() {
          const result = await builder.maybeSingle();
          if (!result.data && !result.error) return { data: null, error: new Error('no rows') };
          return result;
        },
      };
      return builder;
    },
  };
}

function setup(rows, opts) {
  const fakeSb = createFakeSupabase(rows, opts);
  stubModule('../client', { getSupabaseAdmin: () => fakeSb });
  delete require.cache[require.resolve('./login-attempts.repository')];
  return require('./login-attempts.repository');
}

test('upsertFailure: escritor concorrente que altera failed_count entre a leitura e a escrita força nova leitura (sem colapsar num único incremento)', async () => {
  const now = new Date().toISOString();
  const rows = [{ id: 'row-1', account_key: 'firm:vitima@teglion.com', failed_count: 2, locked_until: null, last_attempt_at: now, last_ip: null }];

  let updateAttempts = 0;
  const repo = setup(rows, {
    onUpdateAttempt: (filters) => {
      updateAttempts += 1;
      const failedCountFilter = filters.find(([f]) => f === 'failed_count');
      // Na primeira tentativa, simula um pedido concorrente que já bateu o
      // failed_count de 2 para 3 antes deste UPDATE correr — o filtro
      // .eq('failed_count', 2) desta chamada deixa de bater com a linha.
      if (updateAttempts === 1 && failedCountFilter?.[1] === 2) {
        rows[0].failed_count = 3;
      }
    },
  });

  const result = await repo.upsertFailure('firm:vitima@teglion.com', {
    ip: '203.0.113.9',
    maxFailures: 5,
    lockoutMs: 900_000,
    windowMs: 900_000,
  });

  // Devia ter tentado a escrita duas vezes: a primeira perdeu a corrida (0 linhas
  // afetadas porque failed_count já não era 2), a segunda releu o estado fresco
  // (failed_count=3) e escreveu 4 — nunca sobrepôs com o valor lido originalmente (3).
  assert.equal(updateAttempts, 2, 'devia ter repetido a escrita após perder a corrida');
  assert.equal(result.failedCount, 4, 'devia incrementar a partir do estado fresco (3), não do lido originalmente (2->3)');
  assert.equal(rows[0].failed_count, 4);
});

test('upsertFailure: duas contas novas em corrida (colisão de INSERT) recuperam via retry, sem erro para o chamador', async () => {
  const rows = [];
  let insertAttempts = 0;
  const fakeSb = createFakeSupabase(rows);
  const originalFrom = fakeSb.from.bind(fakeSb);
  fakeSb.from = (table) => {
    const builder = originalFrom(table);
    const originalInsert = builder.insert.bind(builder);
    builder.insert = (payload) => {
      insertAttempts += 1;
      if (insertAttempts === 1) {
        // Simula outro pedido a criar a linha primeiro, entre a leitura (vazia)
        // deste pedido e a sua tentativa de INSERT.
        rows.push({ id: 'row-race', account_key: payload.account_key, failed_count: 1, locked_until: null, last_attempt_at: new Date().toISOString(), last_ip: null });
      }
      return originalInsert(payload);
    };
    return builder;
  };
  stubModule('../client', { getSupabaseAdmin: () => fakeSb });
  delete require.cache[require.resolve('./login-attempts.repository')];
  const repo = require('./login-attempts.repository');

  const result = await repo.upsertFailure('client:novo@teglion.com', {
    ip: '203.0.113.1',
    maxFailures: 5,
    lockoutMs: 900_000,
    windowMs: 900_000,
  });

  assert.equal(rows.length, 1, 'não devia criar uma segunda linha duplicada para a mesma conta');
  assert.equal(result.failedCount, 2, 'devia reler a linha criada pelo concorrente e incrementar a partir dela');
});

test('upsertFailure: sem concorrência, incrementa normalmente e bloqueia ao atingir o limiar', async () => {
  const rows = [];
  const repo = setup(rows);

  await repo.upsertFailure('firm:alvo@teglion.com', { ip: '10.0.0.1', maxFailures: 3, lockoutMs: 60_000, windowMs: 900_000 });
  await repo.upsertFailure('firm:alvo@teglion.com', { ip: '10.0.0.1', maxFailures: 3, lockoutMs: 60_000, windowMs: 900_000 });
  const third = await repo.upsertFailure('firm:alvo@teglion.com', { ip: '10.0.0.1', maxFailures: 3, lockoutMs: 60_000, windowMs: 900_000 });

  assert.equal(third.failedCount, 3);
  assert.ok(third.lockedUntil, 'devia bloquear ao atingir maxFailures');
});
